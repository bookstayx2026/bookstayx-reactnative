const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'bookstayx-api',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

router.get('/database', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         current_database() AS database,
         current_user AS role,
         COUNT(*) FILTER (WHERE table_schema = 'public')::int AS public_tables
       FROM information_schema.tables`
    );

    res.json({
      success: true,
      status: 'healthy',
      database: result.rows[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
