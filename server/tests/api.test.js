import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const { authService } = require('../services/authService');
const { similarityService } = require('../services/similarityService');

describe('ProjectPulse API Integration Endpoints', () => {
  let facultyToken;
  let studentToken;

  const cleanupTestRows = async () => {
    try {
      if (db.isPgConnected()) {
        await db.pool.query('DELETE FROM submissions WHERE id > 11 AND id != 999');
      }
    } catch (e) {}
  };

  beforeAll(async () => {
    await db.ensureConnected();
    await cleanupTestRows();
    await similarityService.initialize();

    facultyToken = authService.generateAccessToken({
      id: 13,
      name: 'Dr. Arumugam Pillai',
      email: 'arumugam@university.edu',
      role: 'Faculty',
      dept: 'Computer Science'
    });

    studentToken = authService.generateAccessToken({
      id: 1,
      name: 'Kavitha Sundaram',
      email: 'kavitha@university.edu',
      role: 'Student',
      dept: 'Computer Science'
    });
  });

  afterEach(async () => {
    await cleanupTestRows();
  });

  afterAll(async () => {
    await cleanupTestRows();
  });

  it('GET /api/health returns ok status and platform name', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.platform).toContain('ProjectPulse');
  });

  it('POST /api/similarity/check analyzes originality for draft text', async () => {
    const res = await request(app)
      .post('/api/similarity/check')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Deep Learning Eye Gaze Controller',
        category: 'Machine Learning',
        abstract: 'Assistive computer vision system allowing motor-impaired individuals to navigate interfaces via webcam gaze estimation.',
        tech: ['Python', 'OpenCV', 'PyTorch']
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.report).toBeDefined();
    expect(res.body.report.originalityScore).toBeGreaterThanOrEqual(0);
    expect(res.body.report.similarityScore).toBeDefined();
    expect(Array.isArray(res.body.report.matchedProjects)).toBe(true);
  });

  it('POST /api/projects blocks duplicate submissions (HTTP 409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'AI-Powered Attendance System',
        category: 'Machine Learning',
        type: 'Internal',
        abstract: 'An automated attendance management system using facial recognition to track student presence in classes. Built using Python, OpenCV, and Flask.',
        tech: 'Python, OpenCV, Flask'
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.isDuplicate).toBe(true);
    expect(res.body.message).toContain('Duplicate submission blocked');
  });

  it('GET /api/reviews returns review queue with originality score to authorized faculty', async () => {
    const res = await request(app)
      .get('/api/reviews')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.reviews)).toBe(true);
    if (res.body.reviews.length > 0) {
      const item = res.body.reviews[0];
      expect(item.originalityScore).toBeDefined();
      expect(item.similarityScore).toBeDefined();
      expect(item.riskLevel).toBeDefined();
    }
  });

  it('submits a Web Development project and strictly maps it to Dr. Senthamizhan V', async () => {
    const ts = Date.now();
    const uniqueTitle = `Real-Time Interactive Code Canvas ${ts}`;
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: uniqueTitle,
        category: 'Web Development',
        type: 'Internal',
        abstract: `A novel distributed WebSocket canvas for real-time peer code pairing with abstract syntax tree highlighting and live execution ${ts}.`,
        tech: 'React, Node.js, WebSockets, Monaco Editor'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Generate token for Dr. Senthamizhan V
    const senthamizhanToken = authService.generateAccessToken({
      id: 14,
      name: 'Dr. Senthamizhan V',
      email: 'senthamizhan@university.edu',
      role: 'Faculty',
      dept: 'Computer Science'
    });

    const reviewsRes = await request(app)
      .get('/api/reviews')
      .set('Authorization', `Bearer ${senthamizhanToken}`);

    expect(reviewsRes.status).toBe(200);
    const found = reviewsRes.body.reviews.find(r => r.title === uniqueTitle);
    expect(found).toBeDefined();
    expect(found.faculty).toBe('Dr. Senthamizhan V');
  }, 15000);

  it('submits an External Mobile Development project and strictly maps it to Dr. Thenmozhi K', async () => {
    const ts = Date.now();
    const uniqueTitle = `Campus Transit BLE Beacon App ${ts}`;
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: uniqueTitle,
        category: 'Mobile Development',
        type: 'External',
        abstract: `A low-energy bluetooth mobile tracking app for shuttle arrival telemetry and passenger density notification across transit nodes ${ts}.`,
        tech: 'Flutter, BLE, Dart, Firebase'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Generate token for Dr. Thenmozhi K
    const thenmozhiToken = authService.generateAccessToken({
      id: 15,
      name: 'Dr. Thenmozhi K',
      email: 'thenmozhi@university.edu',
      role: 'Faculty',
      dept: 'Information Technology'
    });

    const reviewsRes = await request(app)
      .get('/api/reviews')
      .set('Authorization', `Bearer ${thenmozhiToken}`);

    expect(reviewsRes.status).toBe(200);
    const found = reviewsRes.body.reviews.find(r => r.title.includes('Campus Transit BLE'));
    expect(found).toBeDefined();
    expect(found.faculty).toBe('Dr. Thenmozhi K');

    // Confirm / Approve the project
    const actionRes = await request(app)
      .post('/api/reviews/action')
      .set('Authorization', `Bearer ${thenmozhiToken}`)
      .send({
        id: found.id,
        decision: 'Approved',
        feedback: 'Excellent telemetry architecture and clean code.'
      });

    expect(actionRes.status).toBe(200);
    expect(actionRes.body.success).toBe(true);
    expect(actionRes.body.message).toContain('approved');
  }, 15000);
});

