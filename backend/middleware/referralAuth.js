const jwt = require("jsonwebtoken");
const { query } = require("../db");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[referralAuth] FATAL: JWT_SECRET env var is not set. Cannot start in production without it.",
    );
  } else {
    console.warn(
      "[referralAuth] WARNING: JWT_SECRET is not set — using insecure fallback. Set it before going to production.",
    );
  }
}
const SIGNING_SECRET = JWT_SECRET || "dev-fallback-jwt-secret-not-for-prod";

const authenticateReferralUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SIGNING_SECRET);

    // Short-lived OTP-verification tokens are only valid for register / login endpoints.
    if (
      decoded.purpose === "register" ||
      decoded.purpose === "login" ||
      decoded.purpose === "referral_login" ||
      decoded.purpose === "referral_register"
    ) {
      req.user = decoded;
      return next();
    }

    // Full session tokens: verify the user still exists and is not blocked.
    const result = await query(
      "SELECT id, username, referral_otp_number, status FROM referral_users WHERE id = $1",
      [decoded.userId],
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }
    if (user.status === "blocked") {
      return res.status(403).json({ error: "Forbidden: Account is blocked" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("[referralAuth] JWT error:", error.message);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

module.exports = authenticateReferralUser;
