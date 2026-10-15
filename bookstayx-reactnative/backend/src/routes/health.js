const express = require('express');
const { pool } = require('../config/database');
const { sanitizeErrorMessage } = require('../../middleware/errorHandler');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'bookstayx-api',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

router.get('/database', async (req, res) => {
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
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
