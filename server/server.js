const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const collabRoutes = require('./routes/collabRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const guideRoutes = require('./routes/guideRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');
const similarityRoutes = require('./routes/similarityRoutes');

const { similarityService } = require('./services/similarityService');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with Credentials for cookies
app.use(cors({
  origin: true,
  credentials: true
}));

// Body & Cookie Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const fs = require('fs');

// Static directory for uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static frontend assets if public folder exists
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'ProjectPulse AI Originality Platform',
    timestamp: new Date()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/collaboration', collabRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/similarity', similarityRoutes);

// Single Page Application (SPA) Fallback Route for Frontend
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  const indexHtmlPath = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    return res.sendFile(indexHtmlPath);
  }
  next();
});

// Error Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize Vector & AI Similarity Index
similarityService.initialize().catch(err => {
  console.warn('Startup similarityService init warning:', err.message);
});

if (process.env.NODE_ENV !== 'test' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`ProjectPulse Express Backend Server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
