const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, authorizeRoles('Faculty', 'Administrator'), reviewController.getReviews);
router.post('/action', authenticateToken, authorizeRoles('Faculty', 'Administrator'), reviewController.reviewAction);
router.get('/history/:submissionId', authenticateToken, reviewController.getReviewHistory);

module.exports = router;
