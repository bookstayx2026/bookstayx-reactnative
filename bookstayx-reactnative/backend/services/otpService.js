const crypto = require("crypto");
const axios = require("axios");
const OtpRepository = require("../repositories/otpRepository");
const ReferralRepository = require("../repositories/referralRepository");
const { pool } = require("../db");

// ── MSG91 config ──────────────────────────────────────────────────────────────
const MSG91_SMS_URL = "https://control.msg91.com/api/v5/flow/";
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;
const MSG91_OTP_VAR = process.env.MSG91_OTP_VAR || "otp";

// ── Security config ───────────────────────────────────────────────────────────
const IS_TEST_MODE = process.env.OTP_TEST_MODE === "true";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const TEST_OTP = "123456";

// HMAC-SHA256 secret — required in production, falls back in test/dev only
const OTP_HMAC_SECRET = process.env.OTP_HMAC_SECRET;
if (!OTP_HMAC_SECRET) {
  if (IS_PRODUCTION) {
    throw new Error(
      "[OTP] FATAL: OTP_HMAC_SECRET env var is not set. Cannot start in production without it.",
    );
  } else {
    console.warn(
      "[OTP] WARNING: OTP_HMAC_SECRET is not set — using insecure fallback. Set it before going to production.",
    );
  }
}
const HMAC_SECRET = OTP_HMAC_SECRET || "dev-fallback-hmac-secret-not-for-prod";

// ── Operational constants ─────────────────────────────────────────────────────
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_PER_HOUR = 4;
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000; // run cleanup every 30 minutes

if (!IS_TEST_MODE) {
  if (!MSG91_AUTH_KEY)
    console.warn(
      "[OTP] WARNING: MSG91_AUTH_KEY is not set — OTP sending will fail in production",
    );
  if (!MSG91_TEMPLATE_ID)
    console.warn(
      "[OTP] WARNING: MSG91_TEMPLATE_ID is not set — OTP sending will fail in production",
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function validateMobile(mobile) {
  if (!mobile) return null;
  const cleaned = mobile.replace(/\D/g, "");
  let number = cleaned;
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    number = cleaned.substring(2);
  }
  if (number.length !== 10) return null;
  return number;
}

function formatMobileForMsg91(mobile) {
  return `91${mobile}`;
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

/** HMAC-SHA256 of the OTP value. The plaintext OTP never touches the DB. */
function hashOtp(otp) {
  return crypto.createHmac("sha256", HMAC_SECRET).update(otp).digest("hex");
}

/** Constant-time comparison of two HMAC hex strings to prevent timing attacks. */
function compareHmac(provided, stored) {
  try {
    const a = Buffer.from(provided, "hex");
    const b = Buffer.from(stored, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function sendViaMSG91(mobile, otp) {
  const body = {
    template_id: MSG91_TEMPLATE_ID,
    short_url: "0",
    recipients: [
      {
        mobiles: formatMobileForMsg91(mobile),
        [MSG91_OTP_VAR]: otp,
      },
    ],
  };

  const response = await axios.post(MSG91_SMS_URL, body, {
    headers: {
      authkey: MSG91_AUTH_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    timeout: 10000,
  });

  return response.data;
}

// ── Core service ──────────────────────────────────────────────────────────────
const OtpService = {
  async sendOtp(mobile, purpose) {
    const cleanMobile = validateMobile(mobile);
    if (!cleanMobile) {
      return {
        success: false,
        status: 400,
        message:
          "Invalid mobile number. Please enter a valid 10-digit Indian mobile number.",
      };
    }

    if (
      !["owner_login", "customer_login", "referral_login", "referral_register"].includes(purpose)
    ) {
      return { success: false, status: 400, message: "Invalid request type." };
    }

    // ── DB presence checks (business logic, unchanged) ───────────────────────
    if (purpose === "owner_login") {
      const ownerCheck = await pool.query(
        "SELECT id FROM owners WHERE owner_otp_number = $1",
        [cleanMobile],
      );
      if (ownerCheck.rows.length === 0) {
        return {
          success: false,
          status: 404,
          message: "This number is not registered to any property.",
        };
      }
    } else if (purpose === "referral_login") {
      const user = await ReferralRepository.findByMobile(cleanMobile);
      if (!user) {
        return {
          success: false,
          status: 404,
          message: "This number is not registered as a referral user.",
        };
      }
      if (user.status === "blocked") {
        return {
          success: false,
          status: 403,
          message: "Account is blocked, Contact Admin for more Information.",
        };
      }
    } else if (purpose === "referral_register") {
      const existingUser = await ReferralRepository.findByMobile(cleanMobile);
      if (existingUser) {
        return {
          success: false,
          status: 400,
          message:
            "This mobile number is already registered. Please login instead.",
        };
      }
    }

    // ── Rate limit check ─────────────────────────────────────────────────────
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const count = await OtpRepository.getOtpCount(
      cleanMobile,
      purpose,
      oneHourAgo,
    );
    if (count >= RATE_LIMIT_PER_HOUR) {
      return {
        success: false,
        status: 429,
        message: "OTP limit reached. Please try again after some time.",
      };
    }

    const otp = generateOtp();
    const hashedOtp = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    const otpLimitLeft = Math.max(0, RATE_LIMIT_PER_HOUR - (count + 1));

    // ── Test mode: store record without SMS ──────────────────────────────────
    // (SMS is skipped deliberately; we still store the record so verifyOtp
    //  can enforce attempt limits even in test mode)
    if (IS_TEST_MODE) {
      await OtpRepository.invalidatePrevious(cleanMobile, purpose);
      await OtpRepository.createOtp(cleanMobile, hashedOtp, purpose, expiresAt);
      console.log(
        `[OTP] Test mode — record stored for ${cleanMobile} (purpose: ${purpose}). Use ${TEST_OTP} to verify.`,
      );
      return {
        success: true,
        message: "OTP sent successfully.",
        testMode: true,
        otpLimitLeft,
      };
    }

    // ── Production: send SMS FIRST, store record only on success ─────────────
    // This guarantees no orphaned OTP records for codes that were never delivered.
    try {
      const smsResponse = await sendViaMSG91(cleanMobile, otp);

      const smsOk =
        smsResponse &&
        (smsResponse.type === "success" || smsResponse.message === "success");

      if (!smsOk) {
        console.error(
          `[OTP] MSG91 returned unexpected response for ${cleanMobile} (purpose: ${purpose}):`,
          JSON.stringify(smsResponse),
        );
        return {
          success: false,
          status: 500,
          message: "Failed to send OTP. Please try again.",
        };
      }

      // SMS confirmed delivered — now invalidate previous and persist hashed OTP
      await OtpRepository.invalidatePrevious(cleanMobile, purpose);
      await OtpRepository.createOtp(cleanMobile, hashedOtp, purpose, expiresAt);

      console.log(
        `[OTP] SMS sent and record stored for ${cleanMobile} (purpose: ${purpose})`,
      );
      return {
        success: true,
        message: "OTP sent successfully.",
        otpLimitLeft,
      };
    } catch (err) {
      const msg91Error =
        err.response?.data?.message || err.message || "SMS service error";
      console.error(
        `[OTP] MSG91 SMS error for ${cleanMobile} (purpose: ${purpose}):`,
        msg91Error,
      );
      // SMS failed — no record is stored, so no orphan exists
      return {
        success: false,
        status: 500,
        message: `Failed to send OTP: ${msg91Error}`,
      };
    }
  },

  async verifyOtp(mobile, otp, purpose) {
    const cleanMobile = validateMobile(mobile);
    if (!cleanMobile) {
      return {
        success: false,
        status: 400,
        message: "Invalid mobile number.",
      };
    }

    if (!otp || typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      return {
        success: false,
        status: 400,
        message: "OTP must be a 6-digit number.",
      };
    }

    if (
      !["owner_login", "customer_login", "referral_login", "referral_register"].includes(purpose)
    ) {
      return { success: false, status: 400, message: "Invalid request type." };
    }

    // ── Test mode: accept hardcoded OTP without DB hash check ────────────────
    if (IS_TEST_MODE && otp === TEST_OTP) {
      // Clean up the record if one exists (maintains single-use guarantee)
      const record = await OtpRepository.getValidOtp(cleanMobile, purpose);
      if (record) await OtpRepository.deleteOtp(record.id);
      return { success: true, message: "OTP verified successfully." };
    }

    // ── Fetch the valid (non-expired) OTP record ─────────────────────────────
    const record = await OtpRepository.getValidOtp(cleanMobile, purpose);

    if (!record) {
      return {
        success: false,
        status: 401,
        message: "OTP expired or not requested. Please request a new OTP.",
      };
    }

    // ── Brute-force guard: check attempt count before hash comparison ─────────
    if (record.attempts >= MAX_ATTEMPTS) {
      await OtpRepository.deleteOtp(record.id);
      console.warn(
        `[OTP] Max attempts reached for ${cleanMobile} (purpose: ${purpose}). OTP invalidated.`,
      );
      return {
        success: false,
        status: 401,
        message: "Too many incorrect attempts. Please request a new OTP.",
      };
    }

    // ── Constant-time HMAC comparison ────────────────────────────────────────
    const providedHmac = hashOtp(otp);

    if (!compareHmac(providedHmac, record.otp_code)) {
      const newAttempts = await OtpRepository.incrementAttempts(record.id);
      if (newAttempts !== null && newAttempts >= MAX_ATTEMPTS) {
        await OtpRepository.deleteOtp(record.id);
        console.warn(
          `[OTP] Max attempts reached for ${cleanMobile} (purpose: ${purpose}). OTP invalidated.`,
        );
        return {
          success: false,
          status: 401,
          message: "Too many incorrect attempts. Please request a new OTP.",
        };
      }
      return { success: false, status: 401, message: "Invalid OTP." };
    }

    // ── Success: delete record immediately (single-use / anti-replay) ─────────
    await OtpRepository.deleteOtp(record.id);
    console.log(
      `[OTP] Verified successfully for ${cleanMobile} (purpose: ${purpose})`,
    );
    return { success: true, message: "OTP verified successfully." };
  },
};

// ── Expired OTP cleanup job ───────────────────────────────────────────────────
// Call once at server startup. Deletes expired rows every 30 minutes.
function startExpiredOtpCleanup() {
  const runCleanup = async () => {
    try {
      const deleted = await OtpRepository.deleteExpired();
      if (deleted > 0) {
        console.log(`[OTP] Cleanup: removed ${deleted} expired OTP record(s).`);
      }
    } catch (err) {
      console.error("[OTP] Cleanup error:", err.message);
    }
  };

  // Run immediately on startup, then on the interval
  runCleanup();
  setInterval(runCleanup, CLEANUP_INTERVAL_MS);
}

module.exports = { OtpService, startExpiredOtpCleanup };
