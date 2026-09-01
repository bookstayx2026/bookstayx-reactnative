const { pool } = require("./db");

const run = async () => {
  console.log("[migrate-otp] Starting OTP schema migration...");

  await pool.query(`
    ALTER TABLE otp_verifications
      ALTER COLUMN otp_code TYPE VARCHAR(64)
  `);
  console.log("[migrate-otp] otp_code column expanded to VARCHAR(64) for SHA-256 hashes.");

  await pool.query(`
    DELETE FROM otp_verifications
  `);
  console.log("[migrate-otp] Cleared stale OTP rows (old plaintext/MSG91 placeholder values).");

  console.log("[migrate-otp] Migration complete.");
  await pool.end();
};

run().catch((err) => {
  console.error("[migrate-otp] Migration failed:", err.message);
  process.exit(1);
});
