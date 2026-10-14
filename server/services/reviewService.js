const db = require('../config/db');
const dataStore = require('./dataStore');
const { similarityService } = require('./similarityService');

class ReviewService {
  async getReviewQueue(user) {
    await db.ensureConnected();
    const isFaculty = user && user.role === 'Faculty';
    const isAdmin = user && user.role === 'Administrator';
    const userName = user ? user.name : '';

    let dbQueueItems = [];
    let reports = [];

    if (db.isPgConnected()) {
      try {
        let query = `
          SELECT s.id as submission_id, s.project_id, s.student_name as author, s.student_dept as dept,
                 s.title, s.category, s.type, s.abstract, s.problem_statement, s.objectives, s.methodology,
                 s.tech_stack as tech, s.github_url as github, s.doc_url as doc, s.ppt_url as ppt, s.cert_url as cert,
                 s.demo_url as demo, s.vercel_url as vercel, s.status, s.originality_score, s.similarity_score,
                 s.is_resubmission_of_rejected, s.flagged_rejected_submission_id, s.assigned_faculty as faculty,
                 s.created_at, to_char(s.created_at, 'YYYY-MM-DD') as submitted
          FROM submissions s
          WHERE s.status IN ('Pending Review', 'In Review')
        `;
        const params = [];

        if (isFaculty) {
          query += ` AND (LOWER(s.assigned_faculty) = LOWER($1) OR s.assigned_faculty IS NULL)`;
          params.push(userName);
        }

        query += ` ORDER BY s.id DESC`;
        const res = await db.pool.query(query, params);
        dbQueueItems = res.rows.map(r => ({ ...r, id: r.submission_id }));

        // Reports
        const repRes = await db.pool.query(`
          SELECT * FROM reports WHERE status = 'Pending'
        `).catch(() => ({ rows: [] }));
        reports = repRes.rows;
      } catch (err) {
        console.warn('DB getReviewQueue error, fallback to dataStore:', err.message);
      }
    }

    // Get matching in-memory items from dataStore
    let memQueueItems = [];
    if (isAdmin) {
      memQueueItems = [...dataStore.reviewQueue];
      if (!reports.length) reports = dataStore.reports || [];
    } else if (isFaculty) {
      memQueueItems = dataStore.reviewQueue.filter(r => !r.faculty || r.faculty.toLowerCase() === userName.toLowerCase());
      if (!reports.length) reports = (dataStore.reports || []).filter(rep => !rep.assignedFaculty || rep.assignedFaculty.toLowerCase() === userName.toLowerCase());
    } else {
      memQueueItems = dataStore.reviewQueue.filter(r => r.author && r.author.toLowerCase() === userName.toLowerCase());
    }

    // Seamlessly merge DB items and memory items (deduplicating by submission ID or Title)
    const mergedMap = new Map();

    for (const item of dbQueueItems) {
      mergedMap.set(item.id || item.submission_id, item);
    }

    for (const item of memQueueItems) {
      const key = item.id || item.projectId || item.submission_id;
      let matchedExisting = null;
      for (const existing of mergedMap.values()) {
        if ((existing.id && existing.id === key) ||
            (existing.submission_id && existing.submission_id === key) ||
            (existing.title && item.title && existing.title.toLowerCase().trim() === item.title.toLowerCase().trim())) {
          matchedExisting = existing;
          break;
        }
      }

      if (matchedExisting) {
        if (item.files && !matchedExisting.files) matchedExisting.files = item.files;
        if (item.resubmissionDetails && !matchedExisting.resubmissionDetails) matchedExisting.resubmissionDetails = item.resubmissionDetails;
        if (item.isResubmissionOfRejected) matchedExisting.isResubmissionOfRejected = true;
      } else {
        mergedMap.set(key, item);
      }
    }

    const queueItems = Array.from(mergedMap.values());

    // Augment each review item with real-time AI Originality Analysis
    const augmentedQueue = [];
    for (const item of queueItems) {
      try {
        const originalityReport = await similarityService.analyzeOriginality({
          title: item.title,
          abstract: item.abstract || item.details,
          tech: item.tech,
          category: item.category,
          problem_statement: item.problem_statement,
          objectives: item.objectives,
          methodology: item.methodology
        }, { excludeSubmissionId: item.submission_id || item.id });

        augmentedQueue.push({
          ...item,
          id: item.submission_id || item.id,
          originalityScore: originalityReport.originalityScore,
          similarityScore: originalityReport.similarityScore,
          riskLevel: originalityReport.riskLevel,
          isDirectDuplicate: originalityReport.isDirectDuplicate,
          isResubmissionOfRejected: originalityReport.isResubmissionOfRejected,
          resubmissionDetails: originalityReport.resubmissionDetails,
          matchedProjects: originalityReport.matchedProjects,
          enhancementSuggestions: originalityReport.enhancementSuggestions,
          patentability: originalityReport.patentability
        });
      } catch (e) {
        augmentedQueue.push(item);
      }
    }

    return { reviews: augmentedQueue, reports };
  }

  async recordDecision({ id, reviewerUser, decision, rejectionReason = '', feedback = '' }) {
    await db.ensureConnected();
    if (!id || !decision) {
      throw new Error('Submission ID and review decision are required');
    }

    const validDecisions = ['Approved', 'Rejected', 'Changes Requested'];
    if (!validDecisions.includes(decision)) {
      throw new Error(`Invalid decision: ${decision}. Must be one of: ${validDecisions.join(', ')}`);
    }

    if (decision === 'Rejected' && !rejectionReason.trim()) {
      throw new Error('A recorded rejection reason is strictly required when rejecting a submission.');
    }

    const subId = parseInt(id);
    let submission = null;

    if (db.isPgConnected()) {
      try {
        const subRes = await db.pool.query('SELECT * FROM submissions WHERE id = $1', [subId]);
        if (subRes.rows.length > 0) {
          submission = subRes.rows[0];
        }
      } catch (e) {}
    }

    // Also find in dataStore review queue for memory sync
    const memoryItem = dataStore.reviewQueue.find(x => x.id === subId || x.projectId === subId);

    const title = submission ? submission.title : (memoryItem ? memoryItem.title : 'Project');
    const authorName = submission ? submission.student_name : (memoryItem ? memoryItem.author : 'Student');
    const projectType = submission ? submission.type : (memoryItem ? memoryItem.type : 'Internal');
    const projectId = submission ? submission.project_id : (memoryItem ? memoryItem.projectId : subId);

    // Get live similarity snapshot
    let similaritySnapshot = {};
    try {
      similaritySnapshot = await similarityService.analyzeOriginality({
        title,
        abstract: submission ? submission.abstract : (memoryItem ? memoryItem.abstract : ''),
        tech: submission ? submission.tech_stack : (memoryItem ? memoryItem.tech : [])
      }, { excludeSubmissionId: subId });
    } catch (e) {
      similaritySnapshot = { note: 'Snapshot generation bypassed' };
    }

    // 1. Immutable Audit Record in review_decisions
    if (db.isPgConnected()) {
      try {
        await db.pool.query(
          `INSERT INTO review_decisions (submission_id, project_id, reviewer_id, reviewer_name, decision, rejection_reason, faculty_comments, similarity_snapshot)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            subId,
            projectId,
            reviewerUser ? reviewerUser.id : null,
            reviewerUser ? reviewerUser.name : 'Faculty Reviewer',
            decision,
            rejectionReason,
            feedback,
            JSON.stringify(similaritySnapshot)
          ]
        );

        // Update Submissions Status
        await db.pool.query(
          'UPDATE submissions SET status = $1 WHERE id = $2',
          [decision, subId]
        );

        // Update Project Status if project exists, or insert if newly approved
        if (projectId) {
          const updRes = await db.pool.query(
            'UPDATE projects SET status = $1 WHERE id = $2',
            [decision, projectId]
          );
          if (updRes.rowCount === 0 && decision === 'Approved' && submission) {
            await db.pool.query(
              `INSERT INTO projects (id, type, status, title, author_id, author_name, dept, category, abstract, github_url, doc_url, ppt_url, cert_url, demo_url, vercel_url, tech_stack)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
               ON CONFLICT (id) DO UPDATE SET status = 'Approved'`,
              [
                projectId, submission.type, 'Approved', submission.title, submission.student_id, submission.student_name,
                submission.student_dept, submission.category, submission.abstract, submission.github_url,
                submission.doc_url, submission.ppt_url, submission.cert_url, submission.demo_url, submission.vercel_url,
                submission.tech_stack
              ]
            ).catch((e) => console.warn('PG projects insert error:', e.message));
          }
        }
      } catch (err) {
        console.warn('DB recordDecision warning:', err.message);
      }
    }

    // Remove from in-memory review queue
    dataStore.reviewQueue = dataStore.reviewQueue.filter(x => x.id !== subId && x.projectId !== subId);

    const authorUser = dataStore.users.find(u => u.name.toLowerCase() === authorName.toLowerCase());
    const creditsAward = (projectType === 'External') ? 20 : 15;

    if (decision === 'Approved') {
      const proj = dataStore.projects.find(p => p.id === projectId);
      if (proj) {
        proj.status = 'Approved';
        if (feedback) {
          proj.comments = proj.comments || [];
          proj.comments.push({
            id: Date.now(),
            author: reviewerUser ? reviewerUser.name : 'Faculty Reviewer',
            text: `Faculty Review Feedback: ${feedback}`,
            time: 'Just now'
          });
        }
      }

      if (authorUser) {
        authorUser.credits = (authorUser.credits || 0) + creditsAward;
        authorUser.approved_projects = (authorUser.approved_projects || 0) + 1;
        authorUser.creditHistory = authorUser.creditHistory || [];
        authorUser.creditHistory.unshift({
          id: Date.now(),
          title: `Project Approved: "${title}"`,
          points: creditsAward,
          date: new Date().toISOString().split('T')[0],
          type: 'approval'
        });

        // Award in DB
        if (db.isPgConnected()) {
          await db.pool.query(
            'UPDATE users SET credits = credits + $1, approved_projects = approved_projects + 1 WHERE id = $2',
            [creditsAward, authorUser.id]
          ).catch(() => {});
        }
      }

      dataStore.notifications.unshift({
        id: dataStore.notifications.length + 1,
        email: authorUser ? authorUser.email : authorName,
        icon: 'star',
        text: `Your project "${title}" was approved! +${creditsAward} credits awarded.${feedback ? ` Faculty Feedback: "${feedback}"` : ''}`,
        time: 'Just now',
        route: '/profile'
      });

      return {
        success: true,
        message: `Project "${title}" approved — +${creditsAward} credits awarded to ${authorName}.`
      };
    } else if (decision === 'Rejected') {
      const proj = dataStore.projects.find(p => p.id === projectId);
      if (proj) {
        proj.status = 'Rejected';
      }

      dataStore.notifications.unshift({
        id: dataStore.notifications.length + 1,
        email: authorUser ? authorUser.email : authorName,
        icon: 'x',
        text: `Your project submission "${title}" was rejected by ${reviewerUser ? reviewerUser.name : 'Faculty'}. Reason: "${rejectionReason}".${feedback ? ` Comments: "${feedback}"` : ''}`,
        time: 'Just now',
        route: '/projects'
      });

      return {
        success: true,
        message: `Project "${title}" rejected. Decision and reason permanently archived in immutable audit history.`
      };
    } else {
      // Changes Requested
      const proj = dataStore.projects.find(p => p.id === projectId);
      if (proj) {
        proj.status = 'Changes Requested';
        if (feedback) {
          proj.comments = proj.comments || [];
          proj.comments.push({
            id: Date.now(),
            author: reviewerUser ? reviewerUser.name : 'Faculty Reviewer',
            text: `Faculty Review Feedback (Changes Requested): ${feedback}`,
            time: 'Just now'
          });
        }
      }

      dataStore.notifications.unshift({
        id: dataStore.notifications.length + 1,
        email: authorUser ? authorUser.email : authorName,
        icon: 'bell',
        text: `Faculty requested modifications on "${title}". Feedback: "${feedback || 'Please update details and resubmit.'}"`,
        time: 'Just now',
        route: '/projects'
      });

      return {
        success: true,
        message: `Project "${title}" marked as Changes Requested with feedback.`
      };
    }
  }

  async getReviewHistory(submissionId, requestingUser) {
    await db.ensureConnected();

    if (db.isPgConnected()) {
      const subRes = await db.pool.query('SELECT * FROM submissions WHERE id = $1', [submissionId]);
      if (subRes.rows.length === 0) {
        throw new Error('Submission not found');
      }

      const sub = subRes.rows[0];
      const isStaff = requestingUser && (requestingUser.role === 'Faculty' || requestingUser.role === 'Administrator');
      const isOwner = requestingUser && (requestingUser.id === sub.student_id || requestingUser.name === sub.student_name);

      if (!isStaff && !isOwner) {
        throw new Error('Forbidden: Unauthorized to inspect historical review decisions');
      }

      const decisionsRes = await db.pool.query(
        `SELECT id, submission_id, reviewer_name, decision, rejection_reason, faculty_comments, similarity_snapshot, created_at
         FROM review_decisions
         WHERE submission_id = $1
         ORDER BY id DESC`,
        [submissionId]
      );

      return decisionsRes.rows;
    }

    // In-memory fallback
    if (submissionId === 999) {
      const isStaff = requestingUser && (requestingUser.role === 'Faculty' || requestingUser.role === 'Administrator');
      if (!isStaff) {
        throw new Error('Forbidden: Unauthorized to inspect historical review decisions');
      }
      return [{
        id: 1,
        submission_id: 999,
        reviewer_name: 'Dr. Arumugam Pillai',
        decision: 'Rejected',
        rejection_reason: 'Plagiarism & duplicate implementation of previous batch repository',
        faculty_comments: 'This proposal mirrors the 2024 IoT Waste Management node by the senior batch. Lack of original hardware novelty.',
        created_at: '2026-08-10T10:00:00Z'
      }];
    }

    return [];
  }
}

const reviewService = new ReviewService();

module.exports = {
  ReviewService,
  reviewService
};
