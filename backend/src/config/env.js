const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
});

const requiredVariables = ['DATABASE_URL', 'JWT_SECRET', 'OTP_HMAC_SECRET'];
const missingVariables = requiredVariables.filter((name) => !process.env[name]?.trim());

if (missingVariables.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVariables.join(', ')}`);
}

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parsePositiveInteger(process.env.PORT, 5001),
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl:
    process.env.DATABASE_SSL === 'true' || process.env.NODE_ENV === 'production',
  databasePoolMax: parsePositiveInteger(process.env.DATABASE_POOL_MAX, 10),
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  enableBackgroundJobs: process.env.ENABLE_BACKGROUND_JOBS === 'true',
  enableDevLogin:
    process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEV_LOGIN === 'true',
  paymentProvider: process.env.PAYMENT_PROVIDER === 'razorpay' ? 'razorpay' : 'mock',
  payoutProvider: process.env.PAYOUT_PROVIDER === 'razorpayx' ? 'razorpayx' : 'manual',
});

module.exports = { env };
