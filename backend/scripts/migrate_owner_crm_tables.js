const { pool } = require('../src/config/database');

const MIGRATION_SQL = `
-- 1. Owner Expenses
CREATE TABLE IF NOT EXISTS owner_expenses (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  owner_id INTEGER REFERENCES owners(id) ON DELETE CASCADE,
  expense_code VARCHAR(50),
  date DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  villa_unit_id INTEGER REFERENCES property_units(id) ON DELETE SET NULL,
  villa_unit_name VARCHAR(255),
  paid_to VARCHAR(255),
  payment_method VARCHAR(100),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_owner_expenses_property ON owner_expenses(property_id);
CREATE INDEX IF NOT EXISTS idx_owner_expenses_owner ON owner_expenses(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_expenses_date ON owner_expenses(date);

-- 2. Owner Staff
CREATE TABLE IF NOT EXISTS owner_staff (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  owner_id INTEGER REFERENCES owners(id) ON DELETE CASCADE,
  staff_code VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  mobile VARCHAR(50),
  assigned_villa VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  monthly_salary DECIMAL(10,2) DEFAULT 0,
  joining_date DATE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_owner_staff_property ON owner_staff(property_id);
CREATE INDEX IF NOT EXISTS idx_owner_staff_owner ON owner_staff(owner_id);

-- 3. Owner Staff Attendance
CREATE TABLE IF NOT EXISTS owner_staff_attendance (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  staff_id INTEGER REFERENCES owner_staff(id) ON DELETE CASCADE,
  staff_code VARCHAR(50),
  date DATE NOT NULL,
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_staff_attendance_date UNIQUE(staff_id, date)
);

CREATE INDEX IF NOT EXISTS idx_owner_staff_attendance_property ON owner_staff_attendance(property_id);
CREATE INDEX IF NOT EXISTS idx_owner_staff_attendance_date ON owner_staff_attendance(date);

-- 4. Owner Staff Payments
CREATE TABLE IF NOT EXISTS owner_staff_payments (
  id SERIAL PRIMARY KEY,
  payment_code VARCHAR(50),
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  staff_id INTEGER REFERENCES owner_staff(id) ON DELETE CASCADE,
  staff_code VARCHAR(50),
  period VARCHAR(100) NOT NULL,
  expected_pay DECIMAL(10,2) DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  pending_amount DECIMAL(10,2) DEFAULT 0,
  payment_date DATE,
  payment_status VARCHAR(50) DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_owner_staff_payments_property ON owner_staff_payments(property_id);

-- 5. Owner Booking Requests / Enquiries
CREATE TABLE IF NOT EXISTS owner_booking_requests (
  id SERIAL PRIMARY KEY,
  request_code VARCHAR(50),
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  owner_id INTEGER REFERENCES owners(id) ON DELETE CASCADE,
  guest_name VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(50) NOT NULL,
  guest_email VARCHAR(255),
  villa_unit_id INTEGER REFERENCES property_units(id) ON DELETE SET NULL,
  villa_unit_name VARCHAR(255),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER DEFAULT 1,
  guests_count INTEGER DEFAULT 2,
  total_amount DECIMAL(10,2) DEFAULT 0,
  advance_amount DECIMAL(10,2) DEFAULT 0,
  request_source VARCHAR(50) DEFAULT 'Website',
  status VARCHAR(50) DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_owner_booking_requests_property ON owner_booking_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_owner_booking_requests_status ON owner_booking_requests(status);

-- 6. Owner Notifications
CREATE TABLE IF NOT EXISTS owner_notifications (
  id SERIAL PRIMARY KEY,
  notification_code VARCHAR(50),
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  owner_id INTEGER REFERENCES owners(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  reference_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_owner_notifications_owner ON owner_notifications(owner_id);

-- 7. Owner Settings
CREATE TABLE IF NOT EXISTS owner_settings (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER UNIQUE REFERENCES owners(id) ON DELETE CASCADE,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  owner_display_name VARCHAR(255),
  business_name VARCHAR(255),
  primary_mobile VARCHAR(50),
  whatsapp_number VARCHAR(50),
  email VARCHAR(255),
  emergency_contact VARCHAR(50),
  auto_accept_requests BOOLEAN DEFAULT FALSE,
  sms_alerts_enabled BOOLEAN DEFAULT TRUE,
  whatsapp_alerts_enabled BOOLEAN DEFAULT TRUE,
  check_in_notice_hours INTEGER DEFAULT 24,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_owner_settings_owner ON owner_settings(owner_id);
`;

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting Owner CRM tables migration on Supabase PostgreSQL...');
    await client.query('BEGIN');
    await client.query(MIGRATION_SQL);
    await client.query('COMMIT');
    console.log('✅ Owner CRM tables migration successfully applied to Supabase!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
