const dataStore = require('../services/dataStore');
const db = require('../config/db');
const { similarityService } = require('../services/similarityService');

function checkProjectAccess(p, currentUser) {
  if (!currentUser) return true;
  if (currentUser.role !== 'Student') return true;
  if (p.author === currentUser.name) return true;
  if (p.collaborators && p.collaborators.includes(currentUser.name)) return true;

  if ((currentUser.approved_projects || 0) < 3) return false;

  let req = 0;
  if (p.type === 'Idea') req = dataStore.accessTiers[1].min;
  if (p.type === 'Internal') req = dataStore.accessTiers[2].min;
  if (p.type === 'External') req = dataStore.accessTiers[3].min;

  return (currentUser.credits || 0) >= req;
}

exports.getProjects = (req, res) => {
  try {
    let { filter, domain, accessLevel, search, sort, page = 1, limit = 50 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const currentUser = req.user ? dataStore.users.find(u => u.email.toLowerCase() === req.user.email.toLowerCase()) : null;

    let list = dataStore.projects.filter(p => {
      // Include approved projects, published ideas, OR pending custom domain verification projects
      if (p.type !== 'Idea' && p.status !== 'Approved' && p.status !== 'Domain Verification Pending') return false;
      
      // Type Filter
      if (filter && filter !== 'all' && p.type.toLowerCase() !== filter.toLowerCase()) return false;
      
      // Domain Filter
      if (domain && domain !== 'all') {
        if (domain === 'Other') {
          if (!p.category.toLowerCase().startsWith('other') && p.status !== 'Domain Verification Pending') return false;
        } else if (p.category.toLowerCase() !== domain.toLowerCase()) {
          return false;
        }
      }

      // Access Level Filter (Unlocked vs Locked)
      if (accessLevel && accessLevel !== 'all' && currentUser && currentUser.role === 'Student') {
        const hasAccess = checkProjectAccess(p, currentUser);
        if (accessLevel === 'unlocked' && !hasAccess) return false;
        if (accessLevel === 'locked' && hasAccess) return false;
      }

      // Search Filter
      if (search) {
        const q = search.toLowerCase();
        const techStr = p.tech ? p.tech.join(' ').toLowerCase() : '';
        const hay = `${p.title} ${p.author} ${p.dept} ${p.category} ${techStr}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sortFns = {
      latest: (a, b) => b.id - a.id,
      popular: (a, b) => {
        const clonesA = a.clonesCount || a.clones || 0;
        const clonesB = b.clonesCount || b.clones || 0;
        const scoreA = (a.views * 1.0) + (a.likes * 4.0) + ((a.commentsCount || (a.comments ? a.comments.length : 0)) * 6.0) + (clonesA * 8.0);
        const scoreB = (b.views * 1.0) + (b.likes * 4.0) + ((b.commentsCount || (b.comments ? b.comments.length : 0)) * 6.0) + (clonesB * 8.0);
        return scoreB - scoreA;
      },
      views: (a, b) => b.views - a.views,
      credits: (a, b) => {
        const uA = dataStore.users.find(u => u.name === a.author);
        const uB = dataStore.users.find(u => u.name === b.author);
        return (uB ? uB.credits : 0) - (uA ? uA.credits : 0);
      }
    };

    list.sort(sortFns[sort] || sortFns.popular);

    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginatedList = list.slice(startIndex, startIndex + limit).map(p => {
      // Redact real faculty name for Students to maintain blind review privacy
      const sanitized = { ...p };
      if (currentUser && currentUser.role === 'Student') {
        sanitized.assignedFaculty = 'Assigned: Faculty Reviewer (Blind Evaluation)';
      }
      return sanitized;
    });

    return res.json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      projects: paginatedList
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProjectById = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const project = dataStore.projects.find(p => p.id === id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    project.views += 1;
    const currentUser = req.user ? dataStore.users.find(u => u.email.toLowerCase() === req.user.email.toLowerCase()) : null;
    const sanitized = { ...project };
    if (currentUser && currentUser.role === 'Student') {
      sanitized.assignedFaculty = 'Assigned: Faculty Reviewer (Blind Evaluation)';
    }
    return res.json({ success: true, project: sanitized });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

function normalizeUrl(str) {
  if (!str || !str.trim()) return '';
  let val = str.trim();
  if (!val.startsWith('http://') && !val.startsWith('https://')) {
    val = 'https://' + val.replace(/^\/+/, '');
  }
  return val;
}

exports.submitProject = async (req, res) => {
  try {
    const { title, category, customDomainName, tech, abstract, github, doc, ppt, cert, demo, vercel, type, problemStatement, objectives, methodology } = req.body;
    const user = dataStore.users.find(u => u.email.toLowerCase() === req.user.email.toLowerCase());

    if (!title || !category || !tech || !abstract || !type) {
      return res.status(400).json({ success: false, message: 'Title, domain category, tech stack, abstract, and project type are required' });
    }

    const normGithub = normalizeUrl(github);
    const normDoc = normalizeUrl(doc);
    const normPpt = normalizeUrl(ppt);
    const normCert = normalizeUrl(cert);
    const normDemo = normalizeUrl(demo);
    const normVercel = normalizeUrl(vercel);

    const techArray = Array.isArray(tech) ? tech : tech.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const newId = dataStore.getNextProjectId();

    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      uploadedFiles = req.files.map(f => ({
        fileName: f.originalname,
        filePath: f.path.replace(/\\/g, '/'),
        fileType: f.mimetype
      }));
    }

    const isCustomDomain = (category === 'Other');
    const finalCategory = isCustomDomain ? `Other (${customDomainName || 'Custom Domain'})` : category;

    // AI SIMILARITY & ORIGINALITY ANALYSIS
    let originalityReport = {
      originalityScore: 100.0,
      similarityScore: 0.0,
      riskLevel: 'Low',
      isDirectDuplicate: false,
      isResubmissionOfRejected: false,
      resubmissionDetails: null,
      matchedProjects: []
    };

    try {
      originalityReport = await similarityService.analyzeOriginality({
        title,
        category: finalCategory,
        tech: techArray,
        abstract,
        problem_statement: problemStatement || '',
        objectives: objectives || '',
        methodology: methodology || ''
      });
    } catch (simErr) {
      console.warn('Similarity analysis warning:', simErr.message);
    }

    // BUSINESS RULE: PREVENT DUPLICATE OR CRITICALLY LOW ORIGINALITY SUBMISSIONS (< 20%)
    if (originalityReport.isDirectDuplicate || originalityReport.originalityScore < 20.0) {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        similarityScore: originalityReport.similarityScore,
        originalityScore: originalityReport.originalityScore,
        message: `Duplicate submission blocked: Originality score is critically low (${originalityReport.originalityScore}% original, ${originalityReport.similarityScore}% similarity). Submissions with originality below 20% cannot be submitted according to academic integrity policy. Please use the AI Idea Enhancement recommendations to differentiate your project.`,
        matchedProjects: originalityReport.matchedProjects,
        enhancementSuggestions: originalityReport.enhancementSuggestions
      });
    }

    // AUTOMATED TESTING-PHASE FACULTY ASSIGNMENT STRICTLY TO 3 TEST FACULTY
    const assignedFaculty = dataStore.assignRandomFacultyForDomain(finalCategory);

    // If custom domain, record admin domain request while keeping faculty review mapped
    if (isCustomDomain) {
      dataStore.domainRequests.unshift({
        id: dataStore.getNextDomainRequestId(),
        projectId: newId,
        projectTitle: title,
        studentName: user ? user.name : 'Student',
        proposedDomain: customDomainName || 'Custom Domain',
        description: abstract,
        status: 'Pending',
        submittedAt: 'Just now'
      });

      dataStore.notifications.unshift({
        id: dataStore.notifications.length + 1,
        email: 'Administrator',
        icon: 'bell',
        text: `New custom domain request "${customDomainName}" submitted by ${user ? user.name : 'Student'} for project "${title}"`,
        time: 'Just now',
        route: '/admin?tab=domains',
        read: false
      });
    }

    const newProj = {
      id: newId,
      type,
      status: 'In Review',
      title,
      author: user ? user.name : 'Student',
      dept: user ? user.dept : 'Computer Science',
      category: finalCategory,
      likes: 0,
      commentsCount: 0,
      views: 0,
      clones: 0,
      liked: false,
      abstract,
      problemStatement: problemStatement || '',
      objectives: objectives || '',
      methodology: methodology || '',
      github: normGithub,
      doc: normDoc,
      ppt: normPpt,
      cert: normCert,
      demo: normDemo,
      vercel: normVercel,
      tech: techArray,
      collaborators: [],
      assignedFaculty,
      comments: [],
      enhancements: [],
      files: uploadedFiles,
      originalityScore: originalityReport.originalityScore,
      similarityScore: originalityReport.similarityScore,
      isResubmissionOfRejected: originalityReport.isResubmissionOfRejected,
      resubmissionDetails: originalityReport.resubmissionDetails
    };

    dataStore.projects.unshift(newProj);

    // Populate Review Queue for Faculty Evaluation
    dataStore.reviewQueue.unshift({
      id: newId,
      projectId: newId,
      title,
      author: user ? user.name : 'Student',
      dept: user ? user.dept : 'Computer Science',
      category: finalCategory,
      submitted: 'Just now',
      type,
      faculty: assignedFaculty,
      isEnhancement: false,
      abstract,
      problem_statement: problemStatement || '',
      objectives: objectives || '',
      methodology: methodology || '',
      github: normGithub,
      doc: normDoc,
      ppt: normPpt,
      cert: normCert,
      demo: normDemo,
      vercel: normVercel,
      tech: techArray,
      files: uploadedFiles,
      originalityScore: originalityReport.originalityScore,
      similarityScore: originalityReport.similarityScore,
      isResubmissionOfRejected: originalityReport.isResubmissionOfRejected,
      resubmissionDetails: originalityReport.resubmissionDetails,
      matchedProjects: originalityReport.matchedProjects
    });

    // For External projects, also register guide request
    if (type === 'External') {
      dataStore.guideRequests.unshift({
        id: newId,
        projectId: newId,
        student: user ? user.name : 'Student',
        project: title,
        faculty: assignedFaculty,
        category: finalCategory,
        requested: 'Just now'
      });
    }

    // Notify Assigned Faculty Reviewer
    dataStore.notifications.unshift({
      id: dataStore.notifications.length + 1,
      email: assignedFaculty,
      icon: 'bell',
      text: `New ${type} Project assigned for review: "${title}" by ${user ? user.name : 'Student'}${originalityReport.isResubmissionOfRejected ? ' [Flagged Resubmission of Rejected Project]' : ''}`,
      time: 'Just now',
      route: '/reviews',
      read: false
    });

    // Synchronize into PostgreSQL
    if (db.isPgConnected()) {
      try {
        await db.pool.query(
          `INSERT INTO submissions (id, project_id, student_id, student_name, student_dept, title, category, type, abstract, problem_statement, objectives, methodology, tech_stack, github_url, doc_url, ppt_url, cert_url, demo_url, vercel_url, status, originality_score, similarity_score, is_resubmission_of_rejected, flagged_rejected_submission_id, assigned_faculty)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             category = EXCLUDED.category,
             abstract = EXCLUDED.abstract,
             assigned_faculty = EXCLUDED.assigned_faculty,
             status = EXCLUDED.status,
             originality_score = EXCLUDED.originality_score,
             similarity_score = EXCLUDED.similarity_score`,
          [
            newId, newId, user ? user.id : 1, user ? user.name : 'Student', user ? user.dept : 'Computer Science',
            title, finalCategory, type, abstract, problemStatement || '', objectives || '', methodology || '',
            techArray, normGithub, normDoc, normPpt, normCert, normDemo, normVercel,
            'Pending Review', originalityReport.originalityScore, originalityReport.similarityScore,
            originalityReport.isResubmissionOfRejected,
            originalityReport.resubmissionDetails ? originalityReport.resubmissionDetails.priorSubmissionId : null,
            assignedFaculty
          ]
        );

        if (originalityReport.isResubmissionOfRejected && originalityReport.resubmissionDetails) {
          const rd = originalityReport.resubmissionDetails;
          await db.pool.query(
            `INSERT INTO rejected_resubmission_flags (current_submission_id, prior_rejected_submission_id, similarity_score, matched_sections, original_rejecting_faculty, original_rejection_date, original_rejection_reason, original_faculty_comments)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT DO NOTHING`,
            [
              newId, rd.priorSubmissionId, rd.similarityScore, JSON.stringify(rd.matchedSections),
              rd.originalRejectingFaculty, rd.originalRejectionDate, rd.originalRejectionReason, rd.originalFacultyComments
            ]
          ).catch(() => {});
        }
      } catch (dbErr) {
        console.warn('DB submission insert warning:', dbErr.message);
      }
    }

    const clientProject = (user && user.role === 'Student')
      ? { ...newProj, assignedFaculty: 'Assigned: Faculty Reviewer (Blind Evaluation)' }
      : newProj;

    return res.status(201).json({
      success: true,
      message: `Project submitted — assigned to ${assignedFaculty} for evaluation`,
      project: clientProject,
      originalityReport
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


exports.publishIdea = (req, res) => {
  try {
    const { title, category, tech, description } = req.body;
    const user = dataStore.users.find(u => u.email.toLowerCase() === req.user.email.toLowerCase());

    if (!title || !category || !tech || !description) {
      return res.status(400).json({ success: false, message: 'Title, category, tech stack, and description are required' });
    }

    const techArray = Array.isArray(tech) ? tech : tech.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const newId = dataStore.getNextProjectId();

    const newIdea = {
      id: newId,
      type: 'Idea',
      status: null,
      title,
      author: user.name,
      dept: user.dept,
      category,
      likes: 0,
      commentsCount: 0,
      views: 0,
      liked: false,
      abstract: description,
      description,
      tech: techArray,
      collaborators: [],
      comments: [],
      enhancements: []
    };

    dataStore.projects.unshift(newIdea);

    // Award +5 credits for idea publishing
    user.credits = (user.credits || 0) + 5;

    dataStore.notifications.unshift({
      id: dataStore.notifications.length + 1,
      email: user.email,
      icon: 'award',
      text: `Published Idea "${title}". +5 credits earned.`,
      time: 'Just now',
      route: '/profile',
      read: false
    });

    return res.status(201).json({
      success: true,
      message: 'Idea published — +5 credits earned',
      project: newIdea
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleLike = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const p = dataStore.projects.find(x => x.id === id);
    if (!p) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    p.liked = !p.liked;
    const oldLikes = p.likes;
    p.likes += p.liked ? 1 : -1;

    // Check credit reward: Every 10 likes = 1 credit for author
    const authorUser = dataStore.users.find(u => u.name === p.author);
    if (authorUser) {
      const oldLikeCredits = Math.floor(oldLikes / 10);
      const newLikeCredits = Math.floor(p.likes / 10);
      const diff = newLikeCredits - oldLikeCredits;
      if (diff !== 0) {
        authorUser.credits = (authorUser.credits || 0) + diff;
        if (diff > 0) {
          dataStore.notifications.unshift({
            id: dataStore.notifications.length + 1,
            email: authorUser.email,
            icon: 'award',
            text: `Your project "${p.title}" crossed ${newLikeCredits * 10} likes! +1 credit points awarded.`,
            time: 'Just now',
            route: '/profile',
            read: false
          });
        }
      }
    }

    return res.json({ success: true, likes: p.likes, liked: p.liked });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.postComment = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { text } = req.body;
    const user = dataStore.users.find(u => u.email.toLowerCase() === req.user.email.toLowerCase());

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text cannot be empty' });
    }

    const p = dataStore.projects.find(x => x.id === id);
    if (!p) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    p.comments = p.comments || [];
    const newComment = {
      id: p.comments.length + 1,
      author: user.name,
      text: text.trim(),
      time: 'Just now'
    };

    p.comments.push(newComment);
    p.commentsCount = p.comments.length;

    if (p.author !== user.name) {
      const authorUser = dataStore.users.find(u => u.name === p.author);
      if (authorUser) {
        dataStore.notifications.unshift({
          id: dataStore.notifications.length + 1,
          email: authorUser.email,
          icon: 'chat',
          text: `${user.name} commented on your project "${p.title}"`,
          time: 'Just now',
          route: '/projects',
          read: false
        });
      }
    }

    return res.status(201).json({ success: true, comment: newComment, commentsCount: p.commentsCount });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.reportProject = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { category, reason } = req.body;
    const p = dataStore.projects.find(x => x.id === id);
    if (!p) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const user = dataStore.users.find(u => u.email.toLowerCase() === req.user.email.toLowerCase());
    const assignedFaculty = dataStore.assignRandomFacultyForDomain(p.category);

    const reportObj = {
      id: dataStore.getNextReportId(),
      projectId: p.id,
      projectTitle: p.title,
      reporter: user ? user.name : 'User',
      reporterEmail: user ? user.email : '',
      category: category || 'General Violation',
      reason: reason || 'Inappropriate or non-compliant content',
      status: 'Pending',
      assignedFaculty,
      createdAt: 'Just now'
    };

    if (!dataStore.reports) dataStore.reports = [];
    dataStore.reports.unshift(reportObj);

    dataStore.notifications.unshift({
      id: dataStore.notifications.length + 1,
      email: assignedFaculty,
      icon: 'bell',
      text: `Report assigned for review: "${p.title}" reported by ${user ? user.name : 'User'}: ${category || 'Violation'}`,
      time: 'Just now',
      route: '/reviews?tab=reports',
      read: false
    });

    dataStore.notifications.unshift({
      id: dataStore.notifications.length + 1,
      email: 'Administrator',
      icon: 'bell',
      text: `Report on "${p.title}" assigned to ${assignedFaculty}`,
      time: 'Just now',
      route: '/admin?tab=reports',
      read: false
    });

    return res.json({ success: true, message: `Report filed — assigned to ${assignedFaculty} for faculty investigation` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteProject = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const index = dataStore.projects.findIndex(x => x.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const deleted = dataStore.projects.splice(index, 1)[0];
    dataStore.reviewQueue = dataStore.reviewQueue.filter(r => r.id !== id);
    if (dataStore.reports) {
      dataStore.reports = dataStore.reports.filter(rep => rep.projectId !== id);
    }

    return res.json({ success: true, message: `Project "${deleted.title}" removed successfully` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.cloneProject = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const p = dataStore.projects.find(x => x.id === id);
    if (!p) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    p.clones = (p.clones || 0) + 1;
    p.clonesCount = (p.clonesCount || 0) + 1;

    return res.json({
      success: true,
      message: 'Clone recorded',
      clones: p.clones
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
