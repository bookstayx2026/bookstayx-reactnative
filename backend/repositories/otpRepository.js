const { query } = require("../db");

const OtpRepository = {
  async getOtpCount(mobile, purpose, since) {
    const text = `
      SELECT COUNT(*)
      FROM otp_verifications
      WHERE mobile_number = $1 AND purpose = $2 AND created_at >= $3
    `;
    const res = await query(text, [mobile, purpose, since]);
    return parseInt(res.rows[0].count, 10);
  },

  async invalidatePrevious(mobile, purpose) {
    const text = `
      DELETE FROM otp_verifications
      WHERE mobile_number = $1 AND purpose = $2
    `;
    return query(text, [mobile, purpose]);
  },

  async createOtp(mobile, hashedOtp, purpose, expiresAt) {
    const text = `
      INSERT INTO otp_verifications (mobile_number, otp_code, purpose, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    const res = await query(text, [mobile, hashedOtp, purpose, expiresAt]);
    return res.rows[0];
  },

  async getValidOtp(mobile, purpose) {
    const text = `
      SELECT * FROM otp_verifications
      WHERE mobile_number = $1
        AND purpose = $2
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const res = await query(text, [mobile, purpose]);
    return res.rows[0] || null;
  },

  async incrementAttempts(id) {
    const text =
      "UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = $1 RETURNING attempts";
    const res = await query(text, [id]);
    return res.rows[0]?.attempts ?? null;
  },

  async deleteOtp(id) {
    const text = "DELETE FROM otp_verifications WHERE id = $1";
    return query(text, [id]);
  },

  /** Remove all records whose expiry has passed. Returns count of deleted rows. */
  async deleteExpired() {
    const text = `
      DELETE FROM otp_verifications
      WHERE expires_at <= NOW()
    `;
    const res = await query(text);
    return res.rowCount ?? 0;
  },
};

module.exports = OtpRepository;
