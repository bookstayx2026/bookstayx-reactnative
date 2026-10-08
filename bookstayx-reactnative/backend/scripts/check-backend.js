const app = require('../app');
const { pool } = require('../src/config/database');
const { isCorsOriginAllowed } = require('../src/config/cors');

async function checkBackend() {
  try {
    const database = await pool.query('SELECT 1 AS ok');
    if (database.rows[0]?.ok !== 1) {
      throw new Error('Unexpected database response');
    }

    if (typeof app !== 'function') {
      throw new Error('Express application did not initialize');
    }

    const developmentEnvironment = {
      nodeEnv: 'development',
      corsOrigins: ['https://configured.example'],
    };
    const productionEnvironment = {
      nodeEnv: 'production',
      corsOrigins: ['https://configured.example'],
    };

    if (
      !isCorsOriginAllowed('http://localhost:8082', developmentEnvironment) ||
      !isCorsOriginAllowed('http://192.168.1.10:8084', developmentEnvironment) ||
      isCorsOriginAllowed('https://untrusted.example', developmentEnvironment) ||
      isCorsOriginAllowed('http://localhost:8082', productionEnvironment) ||
      !isCorsOriginAllowed('https://configured.example', productionEnvironment)
    ) {
      throw new Error('CORS origin policy check failed');
    }

    console.log('Backend foundation check passed.');
  } finally {
    await pool.end();
  }
}

checkBackend().catch((error) => {
  console.error('Backend foundation check failed:', error.message);
  process.exit(1);
});
