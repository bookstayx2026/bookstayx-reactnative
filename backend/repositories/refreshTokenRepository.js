const crypto = require("crypto");
const { query } = require("../db");

// ══════════════════════════════════════════════════════════════════════════════
// TOKEN TIMING — change these constants to adjust expiry windows
const REFRESH_TOKEN_EXPIRY_DAYS = process.env.REFRESH_TOKEN_EXPIRY_DAYS ? Number(process.env.REFRESH_TOKEN_EXPIRY_DAYS) : 30; // refresh token validity in days

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

const RefreshTokenRepository = {
  /**
   * Persist a new refresh token (stored as SHA-256 hash).
   * rawToken is the plaintext value returned to the client — never stored.
   */
  async create(rawToken, userId, userType) {
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );
    await query(
      `INSERT INTO refresh_tokens (token_hash, user_id, user_type, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [tokenHash, String(userId), userType, expiresAt],
    );
    return expiresAt;
  },

  /**
   * Validate and atomically delete the token (single-use rotation).
   * Returns { user_id, user_type } on success, null if invalid/expired.
   */
  async findAndDelete(rawToken) {
    const tokenHash = hashToken(rawToken);
    const result = await query(
      `DELETE FROM refresh_tokens
       WHERE token_hash = $1 AND expires_at > NOW()
       RETURNING user_id, user_type`,
      [tokenHash],
    );
    return result.rows[0] || null;
  },

  /** Invalidate all refresh tokens for a specific user (e.g. on logout or password change). */
  async deleteAllForUser(userId, userType) {
    await query(
      `DELETE FROM refresh_tokens WHERE user_id = $1 AND user_type = $2`,
      [String(userId), userType],
    );
  },

  /** Invalidate a single token by its plaintext value (used on explicit logout). */
  async deleteByRawToken(rawToken) {
    const tokenHash = hashToken(rawToken);
    await query("DELETE FROM refresh_tokens WHERE token_hash = $1", [
      tokenHash,
    ]);
  },

  /** Remove all expired tokens. Called by the periodic cleanup job. */
  async deleteExpired() {
    const result = await query(
      "DELETE FROM refresh_tokens WHERE expires_at <= NOW()",
    );
    return result.rowCount ?? 0;
  },
};

module.exports = { RefreshTokenRepository, REFRESH_TOKEN_EXPIRY_DAYS };
