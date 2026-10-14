const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const similarityController = require('../controllers/similarityController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const similarityRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many similarity checks requested. Please wait a few minutes before trying again.' }
});

router.post('/check', authenticateToken, similarityRateLimiter, similarityController.checkOriginality);
router.post('/reindex', authenticateToken, authorizeRoles('Administrator'), similarityController.reindexProjects);

module.exports = router;
