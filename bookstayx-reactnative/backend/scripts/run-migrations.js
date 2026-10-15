// Standalone database migration runner for BookStayX
// Run manually or during release phases: npm run db:migrate
// Ensures migrations do NOT run inside serverless function request cycles.

const { pool } = require('../src/config/database');
const { runStartupMigrations } = require('../src/database/run-startup-migrations');

async function migrate() {
  console.log('[BookStayX] Connecting to database...');
  try {
    const test = await pool.query('SELECT current_database(), current_user');
    console.log(`[BookStayX] Connected to database "${test.rows[0].current_database}" as user "${test.rows[0].current_user}"`);
    console.log('[BookStayX] Running database migrations...');
    await runStartupMigrations();
    console.log('[BookStayX] All migrations verified and completed successfully.');
  } catch (error) {
    console.error('[BookStayX] Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
