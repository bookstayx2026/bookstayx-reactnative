const { Pool } = require('pg');
const { env } = require('./env');

const normalizeDatabaseUrl = (input) => {
  if (!input || typeof input !== 'string') return input;
  let url = input.trim().replace(/^['"`]+|['"`]+$/g, '');

  // 1. Fix literal brackets around password from Supabase template: [YOUR-PASSWORD] -> YOUR-PASSWORD
  url = url.replace(/(:\/\/[^:]+:)(?:\[)([^\]]+)(?:\])(@)/, '$1$2$3');

  // 2. Fix double-encoded percent signs in password (e.g. %2540 -> %40)
  url = url.replace(/(:\/\/[^:]+:)([^@]+)(@)/, (m, p1, pass, p3) => {
    return p1 + pass.replace(/%25([0-9a-fA-F]{2})/g, '%$1') + p3;
  });

  // 3. Fix missing Supabase project ref on pooler host (postgres -> postgres.fpufyiltalgtxbwvjjmo)
  if (url.includes('pooler.supabase.com') && url.includes('://postgres:')) {
    url = url.replace('://postgres:', '://postgres.fpufyiltalgtxbwvjjmo:');
  }

  return url;
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
