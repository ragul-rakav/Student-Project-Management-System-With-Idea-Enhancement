const { reviewService } = require('../services/reviewService');
const dataStore = require('../services/dataStore');

exports.getReviews = async (req, res) => {
  try {
    const queueData = await reviewService.getReviewQueue(req.user);
    return res.json({
      success: true,
      reviews: queueData.reviews,
      reports: queueData.reports
    });
  } catch (err) {
    console.error('getReviews error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.reviewAction = async (req, res) => {
  try {
    const { id, approve, decision, rejectionReason, feedback } = req.body;
    const subId = parseInt(id);

    // Check if this is an enhancement review item
    const enhancementItem = dataStore.reviewQueue.find(x => x.id === subId && x.isEnhancement);

    if (enhancementItem) {
      dataStore.reviewQueue = dataStore.reviewQueue.filter(x => x.id !== subId);
      const proj = dataStore.projects.find(p => p.id === enhancementItem.projectId);
      const authorUser = dataStore.users.find(u => u.name === enhancementItem.author);

      if (approve) {
        if (proj) {
          proj.enhancements = proj.enhancements || [];
          proj.enhancements.push({
            title: enhancementItem.enhancementTitle,
            details: enhancementItem.details + (feedback ? ` | Faculty Note: ${feedback}` : ''),
            author: enhancementItem.author
          });

          const ownerUser = dataStore.users.find(u => u.name === proj.author);
          if (ownerUser) {
            ownerUser.credits = (ownerUser.credits || 0) + 10;
            ownerUser.creditHistory = ownerUser.creditHistory || [];
            ownerUser.creditHistory.unshift({
              id: Date.now(),
              title: `Project Enhanced: "${proj.title}" by ${enhancementItem.author}`,
              points: 10,
              date: new Date().toISOString().split('T')[0],
              type: 'enhancement'
            });
            dataStore.notifications.unshift({
              id: dataStore.notifications.length + 1,
              email: ownerUser.email,
              icon: 'award',
              text: `Your project "${proj.title}" was enhanced by ${enhancementItem.author}. +10 credits awarded.${feedback ? ` Faculty Note: "${feedback}"` : ''}`,
              time: 'Just now'
            });
          }
        }

        if (authorUser) {
          authorUser.credits = (authorUser.credits || 0) + 10;
          authorUser.creditHistory = authorUser.creditHistory || [];
          authorUser.creditHistory.unshift({
            id: Date.now() + 1,
            title: `Approved Enhancement on "${proj ? proj.title : 'Project'}"`,
            points: 10,
            date: new Date().toISOString().split('T')[0],
            type: 'enhancement'
          });
          dataStore.notifications.unshift({
            id: dataStore.notifications.length + 1,
            email: authorUser.email,
            icon: 'award',
            text: `Your enhancement was approved. +10 credits awarded.${feedback ? ` Faculty Note: "${feedback}"` : ''}`,
            time: 'Just now'
          });
        }
        return res.json({ success: true, message: 'Enhancement approved! +10 credits awarded' });
      } else {
        if (authorUser) {
          dataStore.notifications.unshift({
            id: dataStore.notifications.length + 1,
            email: authorUser.email,
            icon: 'x',
            text: `Your enhancement was rejected.${feedback ? ` Feedback: "${feedback}"` : ''}`,
            time: 'Just now'
          });
        }
        return res.json({ success: true, message: 'Enhancement rejected' });
      }
    }

    // Standard Project Submission Decision
    // Map approve boolean or explicit decision string
    let finalDecision = decision;
    if (!finalDecision) {
      finalDecision = approve ? 'Approved' : 'Changes Requested';
    }

    const result = await reviewService.recordDecision({
      id: subId,
      reviewerUser: req.user,
      decision: finalDecision,
      rejectionReason: rejectionReason || (finalDecision === 'Rejected' ? 'Academic standards or originality conflict' : ''),
      feedback: feedback || ''
    });

    return res.json(result);
  } catch (err) {
    console.error('reviewAction error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.getReviewHistory = async (req, res) => {
  try {
    const submissionId = parseInt(req.params.submissionId);
    const history = await reviewService.getReviewHistory(submissionId, req.user);
    return res.json({ success: true, history });
  } catch (err) {
    const status = err.message.includes('Forbidden') ? 403 : 404;
    return res.status(status).json({ success: false, message: err.message });
  }
};
