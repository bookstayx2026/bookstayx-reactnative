const fs = require('fs/promises');
const path = require('path');
const { pool } = require('../src/config/database');

async function initializeDatabase() {
  try {
    const schemaPath = path.resolve(__dirname, '../database/schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');

    await pool.query(schema);
    console.log('BookStayX database schema initialized successfully.');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

initializeDatabase();
