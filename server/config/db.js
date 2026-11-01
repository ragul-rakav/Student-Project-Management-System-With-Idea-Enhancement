const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables in priority order: .env then .env.local
[
  path.join(__dirname, '../.env'),
  path.join(__dirname, '../../.env'),
  path.join(__dirname, '../.env.local'),
  path.join(__dirname, '../../.env.local')
].forEach((envPath) => {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
});

let pool = null;
let unpooledPool = null;
let isPgConnected = false;
let connectionPromise = null;

// Initialize PostgreSQL Connection Strings
const connectionString = process.env.DATABASE_URL || `postgres://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'student_project_repository'}`;
const unpooledConnectionString = process.env.DATABASE_URL_UNPOOLED || connectionString;

const isCloudPostgres = Boolean(
  connectionString && (
    connectionString.includes('neon.tech') ||
    connectionString.includes('sslmode=') ||
    connectionString.includes('railway') ||
    connectionString.includes('supabase') ||
    process.env.NODE_ENV === 'production'
  )
);

// Pooled configuration for web queries (PgBouncer pooler on Neon)
const poolConfig = {
  connectionString: connectionString,
  max: 20, // Connection pool limit
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

// Unpooled configuration for DDL / migrations / schema tasks
const unpooledConfig = {
  connectionString: unpooledConnectionString,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

// Enable SSL with self-signed certificate acceptance for Neon, Supabase & cloud DBs
if (isCloudPostgres) {
  poolConfig.ssl = { rejectUnauthorized: false };
  unpooledConfig.ssl = { rejectUnauthorized: false };
}

pool = new Pool(poolConfig);
unpooledPool = new Pool(unpooledConfig);

pool.on('error', (err) => {
  console.warn('PostgreSQL pool background error:', err.message);
});

unpooledPool.on('error', (err) => {
  console.warn('PostgreSQL unpooled pool background error:', err.message);
});

async function ensureConnected() {
  if (isPgConnected) return true;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    try {
      const client = await pool.connect();
      isPgConnected = true;
      console.log('✅ Connected to Neon PostgreSQL database pool successfully');
      client.release();
      return true;
    } catch (err) {
      isPgConnected = false;
      console.log('ℹ️ PostgreSQL not reachable. Utilizing high-performance JSON persistence adapter fallback. Error:', err.message);
      return false;
    }
  })();

  return connectionPromise;
}

// Start connection check immediately
ensureConnected();

module.exports = {
  pool,
  unpooledPool,
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
