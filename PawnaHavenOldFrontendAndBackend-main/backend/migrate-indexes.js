/**
 * Migration: add missing indexes + drop redundant ones
 * Run from project root: node backend/migrate-indexes.js
 *
 * All statements are idempotent (IF NOT EXISTS / IF EXISTS).
 * Safe to run on a live database — CREATE INDEX CONCURRENTLY is not needed
 * at current data volumes, but each statement is non-blocking for reads.
 */
require("dotenv").config();
const { pool } = require("./db");

const steps = [
  // ── ledger_entries ──────────────────────────────────────────────────────────
  // Most critical: 25+ calendar queries filter on unit_id + date range
  {
    name: "ledger_entries(unit_id, check_in, check_out) composite",
    sql: `CREATE INDEX IF NOT EXISTS idx_ledger_unit_date_range
          ON ledger_entries (unit_id, check_in, check_out)`,
  },

  // ── bookings ────────────────────────────────────────────────────────────────
  // 17+ calendar queries filter on unit_id
  {
    name: "bookings(unit_id)",
    sql: `CREATE INDEX IF NOT EXISTS idx_bookings_unit_id
          ON bookings (unit_id)`,
  },
  // Every calendar page load checks soft_lock_expires_at
  {
    name: "bookings(unit_id, soft_lock_expires_at) composite",
    sql: `CREATE INDEX IF NOT EXISTS idx_bookings_unit_soft_lock
          ON bookings (unit_id, soft_lock_expires_at)`,
  },
  // Villa legacy fallback: WHERE b.property_id = ...
  {
    name: "bookings(property_id)",
    sql: `CREATE INDEX IF NOT EXISTS idx_bookings_property_id
          ON bookings (property_id)`,
  },
  // Date-range availability queries
  {
    name: "bookings(checkin_datetime, checkout_datetime) composite",
    sql: `CREATE INDEX IF NOT EXISTS idx_bookings_checkin_checkout
          ON bookings (checkin_datetime, checkout_datetime)`,
  },
  // Soft-lock + property_id combined lookup
  {
    name: "bookings(property_id, soft_lock_expires_at) composite",
    sql: `CREATE INDEX IF NOT EXISTS idx_bookings_property_soft_lock
          ON bookings (property_id, soft_lock_expires_at)`,
  },

  // ── referral_users ──────────────────────────────────────────────────────────
  // Owner login and B2B queries: WHERE referral_otp_number = $1 [AND referral_type = 'owner']
  {
    name: "referral_users(referral_otp_number)",
    sql: `CREATE INDEX IF NOT EXISTS idx_referral_users_otp_number
          ON referral_users (referral_otp_number)`,
  },
  // B2B hierarchy joins: WHERE parent_referral_id = $1
  {
    name: "referral_users(parent_referral_id)",
    sql: `CREATE INDEX IF NOT EXISTS idx_referral_users_parent_id
          ON referral_users (parent_referral_id)`,
  },
  // Public listing filter: WHERE is_active = true AND category = $1
  {
    name: "properties(is_active, category) composite",
    sql: `CREATE INDEX IF NOT EXISTS idx_properties_active_category
          ON properties (is_active, category)`,
  },

  // ── owners ──────────────────────────────────────────────────────────────────
  // Every owner login: WHERE owner_otp_number = $1
  {
    name: "owners(owner_otp_number)",
    sql: `CREATE INDEX IF NOT EXISTS idx_owners_otp_number
          ON owners (owner_otp_number)`,
  },

  // ── otp_verifications ───────────────────────────────────────────────────────
  // Upgrade standalone mobile_number index to composite covering expiry too
  {
    name: "otp_verifications(mobile_number, expires_at) composite",
    sql: `CREATE INDEX IF NOT EXISTS idx_otp_mobile_expires
          ON otp_verifications (mobile_number, expires_at)`,
  },
  // Cleanup job: DELETE WHERE expires_at <= NOW()
  {
    name: "otp_verifications(expires_at)",
    sql: `CREATE INDEX IF NOT EXISTS idx_otp_expires_at
          ON otp_verifications (expires_at)`,
  },

  // ── referral_transactions ───────────────────────────────────────────────────
  // Commission processing filters on status
  {
    name: "referral_transactions(status)",
    sql: `CREATE INDEX IF NOT EXISTS idx_referral_transactions_status
          ON referral_transactions (status)`,
  },
  // Withdrawal queries filter on type
  {
    name: "referral_transactions(type)",
    sql: `CREATE INDEX IF NOT EXISTS idx_referral_transactions_type
          ON referral_transactions (type)`,
  },

  // ── Drop redundant indexes ──────────────────────────────────────────────────
  // unit_calendar has UNIQUE(unit_id, date) which already creates a composite
  // index — the two standalone indexes below are pure overhead on inserts/updates
  {
    name: "DROP redundant idx_unit_calendar_unit_id",
    sql: `DROP INDEX IF EXISTS idx_unit_calendar_unit_id`,
  },
  {
    name: "DROP redundant idx_unit_calendar_date",
    sql: `DROP INDEX IF EXISTS idx_unit_calendar_date`,
  },
];

async function migrate() {
  const client = await pool.connect();
  try {
    let ok = 0;
    let fail = 0;
    for (const step of steps) {
      try {
        await client.query(step.sql);
        console.log(`  ✅  ${step.name}`);
        ok++;
      } catch (err) {
        console.error(`  ❌  ${step.name}: ${err.message}`);
        fail++;
      }
    }
    console.log(`\n[Migration] Done — ${ok} succeeded, ${fail} failed.`);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("[Migration] Fatal:", err.message);
  process.exit(1);
});
