const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

// ══════════════════════════════════════════════════════════════════════════════
// TOKEN TIMING — change this constant to adjust the access token lifetime.
// The refresh token lifetime is in backend/repositories/refreshTokenRepository.js
// ══════════════════════════════════════════════════════════════════════════════
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "7d";

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  JWT_SECRET,
  ACCESS_TOKEN_EXPIRY,
};
