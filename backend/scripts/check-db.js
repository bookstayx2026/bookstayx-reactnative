const { pool } = require('../src/config/database');

async function checkDatabase() {
  try {
    const result = await pool.query(
      `SELECT
         current_database() AS database,
         current_user AS role,
         COUNT(*) FILTER (WHERE table_schema = 'public')::int AS public_tables
       FROM information_schema.tables`
    );

    console.log('Supabase connection healthy:', result.rows[0]);
  } catch (error) {
    console.error('Supabase connection failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

checkDatabase();
