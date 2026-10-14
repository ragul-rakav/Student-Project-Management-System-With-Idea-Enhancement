const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const dataStore = require('./dataStore');

const JWT_ACCESS_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_projecthub_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_jwt_key_projectpulse_2026';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

class AuthService {
  generateAccessToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        dept: user.dept
      },
      JWT_ACCESS_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        tokenVersion: Date.now()
      },
      JWT_REFRESH_SECRET,
      { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` }
    );
  }

  async storeRefreshToken(userId, rawRefreshToken) {
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    if (db.isPgConnected()) {
      try {
        await db.pool.query(
          `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
           VALUES ($1, $2, $3)`,
          [userId, tokenHash, expiresAt]
        );
      } catch (err) {
        console.warn('DB storeRefreshToken warning:', err.message);
      }
    }
  }

  async rotateRefreshToken(rawRefreshToken) {
    try {
      const decoded = jwt.verify(rawRefreshToken, JWT_REFRESH_SECRET);
      const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

      if (db.isPgConnected()) {
        const tokenRes = await db.pool.query(
          `SELECT * FROM refresh_tokens WHERE user_id = $1 AND token_hash = $2 AND revoked = FALSE AND expires_at > NOW()`,
          [decoded.id, tokenHash]
        );

        if (tokenRes.rows.length === 0) {
          throw new Error('Invalid or revoked refresh token');
        }

        // Revoke the old refresh token
        await db.pool.query(
          `UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1`,
          [tokenRes.rows[0].id]
        );
      }

      // Find user
      const user = dataStore.users.find(u => u.id === decoded.id) ||
        (db.isPgConnected() ? (await db.pool.query('SELECT * FROM users WHERE id = $1', [decoded.id])).rows[0] : null);

      if (!user) {
        throw new Error('User associated with token not found');
      }

      // Issue new access and refresh tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);
      await this.storeRefreshToken(user.id, newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user
      };
    } catch (err) {
      throw new Error(`Refresh token validation failed: ${err.message}`);
    }
  }

  async revokeRefreshToken(rawRefreshToken) {
    if (!rawRefreshToken) return;
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    if (db.isPgConnected()) {
      try {
        await db.pool.query(
          `UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1`,
          [tokenHash]
        );
      } catch (err) {
        console.warn('Revoke refresh token warning:', err.message);
      }
    }
  }
}

const authService = new AuthService();

module.exports = {
  AuthService,
  authService,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET
};
