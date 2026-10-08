const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

// ─── Shared response handler ──────────────────────────────────────────────────
// Returns JSON consistent with the app's { success, message } error format.
const handler = (req, res, next, options) => {
  const retryAfter = Math.ceil(options.windowMs / 1000);
  res.status(429).json({
    success: false,
    message: options.message,
    retryAfter,
  });
};

// ─── Key generators ───────────────────────────────────────────────────────────
// OTP endpoints: key by IP + mobile so each phone number has its own counter
// even when many users share the same IP (office, hotel wifi, etc.).
// ipKeyGenerator handles IPv6 normalisation required by express-rate-limit v7+.
const otpKeyGenerator = (req) => {
  const mobile =
    (req.body && (req.body.mobileNumber || req.body.mobile_number || req.body.mobile)) || "";
  return `${ipKeyGenerator(req)}-${mobile}`;
};

// ─── 1. OTP Send — strictest (SMS cost + account lockout risk) ─────────────
// 4 requests per IP+mobile per hour. Complements the DB-level check in otpService.js.
const strictOtpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 4,
  keyGenerator: otpKeyGenerator,
  handler,
  message: "Too many OTP requests. Please wait 1 hour before trying again.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.OTP_TEST_MODE === "true",
});

// ─── 2. OTP Verify — prevent enumeration / brute-force ────────────────────
// 6 attempts per IP+mobile per 15 minutes
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  keyGenerator: otpKeyGenerator,
  handler,
  message: "Too many OTP verification attempts. Please wait 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.OTP_TEST_MODE === "true",
});

// ─── 3. Admin login — brute-force protection ─────────────────────────────
// 10 attempts per IP per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler,
  message: "Too many login attempts. Please wait 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── 4. TOTP verify — 1M combinations, keep it tight ─────────────────────
// 5 attempts per IP per 15 minutes
const totpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler,
  message: "Too many 2FA attempts. Please wait 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── 5. Token refresh — prevent refresh token abuse ─────────────────────
// 20 refreshes per IP per 15 minutes (generous for normal use)
const tokenRefreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  handler,
  message: "Too many token refresh requests. Please wait 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── 6. Booking initiate — prevent calendar soft-lock spam ───────────────
// 5 booking initiations per IP per minute
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  handler,
  message: "Too many booking requests. Please wait a moment before trying again.",
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── 7. Payment — prevent Paytm account flagging ─────────────────────────
// 10 requests per IP per 5 minutes
const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  handler,
  message: "Too many payment requests. Please wait 5 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── 8. Withdrawal — prevent referral payout spam ────────────────────────
// 3 withdrawal requests per IP per 5 minutes
const withdrawalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  handler,
  message: "Too many withdrawal requests. Please wait 5 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── 9. Public read — property pages & calendar ──────────────────────────
// 60 requests per IP per minute (handles normal browsing + quick refreshes)
const publicReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  handler,
  message: "Too many requests. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── 10. Global API fallback — catches all other /api routes ─────────────
// 300 requests per IP per minute — generous enough never to affect real users,
// but stops runaway scripts and bots.
//
// NOTE: If you switch to PM2 cluster mode (multiple CPU workers), replace the
// default in-memory store with a shared Redis store:
//   const RedisStore = require("rate-limit-redis");
//   const redis = require("ioredis");
//   const client = new redis(process.env.REDIS_URL);
//   store: new RedisStore({ sendCommand: (...args) => client.call(...args) })
const globalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  handler,
  message: "Too many requests. Please try again in a moment.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Never rate-limit webhooks — Paytm, Razorpay, and Meta must always get through
    const p = req.path;
    return (
      p.includes("/webhook") ||
      p.includes("/paytm/callback") ||
      p.includes("/refund/webhook") ||
      p.includes("/withdrawal/webhook") ||
      p === "/health"
    );
  },
});

module.exports = {
  strictOtpLimiter,
  otpVerifyLimiter,
  loginLimiter,
  totpLimiter,
  tokenRefreshLimiter,
  bookingLimiter,
  paymentLimiter,
  withdrawalLimiter,
  publicReadLimiter,
  globalApiLimiter,
};
