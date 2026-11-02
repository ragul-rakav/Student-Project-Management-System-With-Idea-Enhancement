const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');
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

// Enable gzip/brotli response compression for faster API and asset transfer
app.use(compression());

// Configurable allowed origins for Vercel, localhost, and custom domains
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) 
  : [];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile, curl, Postman, health checks)
    if (!origin) return callback(null, true);

    // Allow local development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }

    // Allow configured CLIENT_URL
    if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL.replace(/\/+$/, '')) {
      return callback(null, true);
    }

    // Allow Vercel deployments (*.vercel.app)
    if (/^https:\/\/([a-zA-Z0-9_-]+)\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    // Allow explicit origins in ALLOWED_ORIGINS
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    // Dynamic origin fallback (supports withCredentials)
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body & Cookie Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const fs = require('fs');

// Static directory for uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static frontend assets: prioritize fresh client/dist build, fallback to server/public
const clientDistPath = path.join(__dirname, '../client/dist');
const publicFolder = path.join(__dirname, 'public');
const publicPath = (fs.existsSync(clientDistPath) && fs.existsSync(path.join(clientDistPath, 'index.html')))
  ? clientDistPath
  : (fs.existsSync(publicFolder) ? publicFolder : clientDistPath);

// 1-year immutable caching for hashed production Vite assets (bundle loads instantly from cache)
const assetsPath = path.join(publicPath, 'assets');
if (fs.existsSync(assetsPath)) {
  app.use('/assets', express.static(assetsPath, {
    maxAge: '1y',
    immutable: true
  }));
}

if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath, {
    etag: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    }
  }));
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
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
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
