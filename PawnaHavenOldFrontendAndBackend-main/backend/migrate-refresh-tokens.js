/**
 * Migration: create refresh_tokens table
 * Run from project root: node backend/migrate-refresh-tokens.js
 */
require("dotenv").config();
const { pool } = require("./db");

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id          SERIAL PRIMARY KEY,
        token_hash  VARCHAR(64) NOT NULL UNIQUE,
        user_id     VARCHAR(100) NOT NULL,
        user_type   VARCHAR(20)  NOT NULL CHECK (user_type IN ('admin', 'owner', 'referral')),
        expires_at  TIMESTAMP NOT NULL,
        created_at  TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash
        ON refresh_tokens (token_hash);

      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user
        ON refresh_tokens (user_id, user_type);
    `);
    console.log("[Migration] refresh_tokens table created (or already exists).");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("[Migration] Failed:", err.message);
  process.exit(1);
});
