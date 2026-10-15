const { Pool } = require('pg');
const { env } = require('./env');

/**
 * Trims whitespace and removes wrapping quotes from connection strings.
 * Preserves the exact user, password, and parameters without destructive rewrites.
 */
const normalizeDatabaseUrl = (input) => {
  if (!input || typeof input !== 'string') return input;
  return input.trim().replace(/^['"`]+|['"`]+$/g, '');
};

const pool = new Pool({
  connectionString: normalizeDatabaseUrl(env.databaseUrl),
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : false,
  max: env.databasePoolMax,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (error) => {
  const safeMsg = error.message ? error.message.replace(/(:\/\/[^:]+):([^@]+)@/g, '$1:***@') : '';
  console.error('[DATABASE POOL ERROR]', error.code || '', safeMsg);
});

const query = (text, params) => pool.query(text, params);
const getClient = () => pool.connect();

module.exports = { pool, query, getClient, normalizeDatabaseUrl };
