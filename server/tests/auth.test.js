import { describe, it, expect } from 'vitest';
const { authService, JWT_ACCESS_SECRET } = require('../services/authService');
const jwt = require('jsonwebtoken');

describe('ProjectPulse Token and Authentication Service', () => {
  const dummyUser = {
    id: 1,
    name: 'Kavitha Sundaram',
    email: 'kavitha@university.edu',
    role: 'Student',
    dept: 'Computer Science'
  };

  it('generates a valid short-lived JWT access token', () => {
    const accessToken = authService.generateAccessToken(dummyUser);
    expect(typeof accessToken).toBe('string');

    const decoded = jwt.verify(accessToken, JWT_ACCESS_SECRET);
    expect(decoded.id).toBe(dummyUser.id);
    expect(decoded.email).toBe(dummyUser.email);
    expect(decoded.role).toBe(dummyUser.role);
  });

  it('generates and rotates refresh tokens securely', async () => {
    const rawRefreshToken = authService.generateRefreshToken(dummyUser);
    expect(typeof rawRefreshToken).toBe('string');

    await authService.storeRefreshToken(dummyUser.id, rawRefreshToken);

    const rotated = await authService.rotateRefreshToken(rawRefreshToken);
    expect(rotated.accessToken).toBeDefined();
    expect(rotated.refreshToken).toBeDefined();
    expect(rotated.refreshToken).not.toEqual(rawRefreshToken);
  });
});
