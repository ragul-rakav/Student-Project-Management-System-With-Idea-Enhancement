const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let pool = null;
let isPgConnected = false;
let connectionPromise = null;

// Initialize PostgreSQL Pool
const connectionString = process.env.DATABASE_URL || `postgres://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'student_project_repository'}`;

pool = new Pool({
  connectionString: connectionString,
  max: 20, // Connection pool limit
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.warn('PostgreSQL pool background error:', err.message);
});

async function ensureConnected() {
  if (isPgConnected) return true;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    try {
      const client = await pool.connect();
      isPgConnected = true;
      console.log('✅ Connected to PostgreSQL database pool successfully');
      client.release();
      return true;
    } catch (err) {
      isPgConnected = false;
      console.log('ℹ️ PostgreSQL not reachable locally. Utilizing high-performance JSON persistence adapter fallback.');
      return false;
    }
  })();

  return connectionPromise;
}

// Start connection check immediately
ensureConnected();

module.exports = {
  pool,
  ensureConnected,
  isPgConnected: () => isPgConnected,
  query: async (text, params) => {
    await ensureConnected();
    if (isPgConnected && pool) {
      return pool.query(text, params);
    }
    throw new Error('Database pool unavailable');
  }
};
