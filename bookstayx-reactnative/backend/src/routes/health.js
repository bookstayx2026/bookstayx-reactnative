const express = require('express');
const { pool } = require('../config/database');
const { env } = require('../config/env');
const { sanitizeErrorMessage } = require('../../middleware/errorHandler');

const router = express.Router();

function getSafeDatabaseDiagnostics() {
  try {
    const rawUrl = env.databaseUrl || '';
    if (!rawUrl) {
      return {
        configured: false,
        error: 'DATABASE_URL is not set in environment variables',
      };
    }

    const cleanUrl = rawUrl.trim().replace(/^['"`]+|['"`]+$/g, '');
    const parsed = new URL(cleanUrl);

    return {
      configured: true,
      protocol: parsed.protocol,
      host: parsed.hostname,
      port: parsed.port || '5432',
      database: parsed.pathname.replace(/^\//, ''),
      username: parsed.username,
      usernameFormat: parsed.username.includes('.') ? 'tenant_prefixed' : 'bare_user',
      isPoolerHost: parsed.hostname.includes('pooler.supabase.com'),
      expectedUsernameFormat: parsed.hostname.includes('pooler.supabase.com')
        ? 'postgres.[project-ref]'
        : 'postgres',
      hasPassword: Boolean(parsed.password),
      passwordLength: parsed.password ? parsed.password.length : 0,
      ssl: env.databaseSsl,
    };
  } catch (err) {
    return {
      configured: Boolean(env.databaseUrl),
      parseError: 'Unable to parse DATABASE_URL as a valid URL',
      rawLength: env.databaseUrl ? env.databaseUrl.length : 0,
    };
  }
}

router.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'bookstayx-api',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

router.get('/database', async (req, res) => {
  const diagnostics = getSafeDatabaseDiagnostics();

  try {
    const result = await pool.query(
      `SELECT
         current_database() AS database,
         current_user AS role,
         COUNT(*) FILTER (WHERE table_schema = 'public')::int AS public_tables
       FROM information_schema.tables`
    );

    return res.json({
      success: true,
      service: 'bookstayx-api',
      status: 'healthy',
      database: result.rows[0],
      diagnostics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const safeMsg = sanitizeErrorMessage(error.message);
    console.error(
      `[DIAGNOSTIC] GET /api/health/database -> status: 503, category: DATABASE, code: ${error.code || 'UNKNOWN'}, message: ${safeMsg}`
    );
    return res.status(503).json({
      success: false,
      service: 'bookstayx-api',
      status: 'unhealthy',
      error: {
        code: error.code || 'DATABASE_UNAVAILABLE',
        category: 'DATABASE',
        name: error.name || 'Error',
        message: safeMsg || 'Database connection could not be established',
      },
      diagnostics,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
