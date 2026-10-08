const app = require('./app');
const { env } = require('./src/config/env');
const { pool } = require('./src/config/database');
const { runStartupMigrations } = require('./src/database/run-startup-migrations');

let server;

async function startBackgroundJobs() {
  if (!env.enableBackgroundJobs) {
    console.log('[Jobs] Background jobs disabled.');
    return;
  }

  const { startExpiredOtpCleanup } = require('./services/otpService');
  const { distributeCheckoutCommissions } = require('./services/commissionService');
  const { RefreshTokenRepository } = require('./repositories/refreshTokenRepository');

  startExpiredOtpCleanup();
  setInterval(async () => {
    try {
      await RefreshTokenRepository.deleteExpired();
    } catch (error) {
      console.error('[Jobs] Refresh-token cleanup failed:', error.message);
    }
  }, 6 * 60 * 60 * 1000).unref();

  setInterval(async () => {
    try {
      await distributeCheckoutCommissions();
    } catch (error) {
      console.error('[Jobs] Commission distribution failed:', error.message);
    }
  }, 30 * 60 * 1000).unref();
}

async function startServer() {
  await pool.query('SELECT 1');
  await runStartupMigrations();
  await startBackgroundJobs();

  server = app.listen(env.port, '0.0.0.0', () => {
    console.log(`[BookStayX API] Listening on http://0.0.0.0:${env.port}`);
    console.log(`[BookStayX API] Environment: ${env.nodeEnv}`);
  });

  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
}

async function shutdown(signal) {
  console.log(`[BookStayX API] ${signal} received. Shutting down.`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await pool.end();
  process.exit(0);
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

startServer().catch(async (error) => {
  console.error('[BookStayX API] Startup failed:', error);
  await pool.end().catch(() => undefined);
  process.exit(1);
});
