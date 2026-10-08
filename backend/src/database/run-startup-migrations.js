const { pool } = require('../config/database');
const { assignTicketId } = require('../../utils/ticketId');

const migrations = [
  `ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_category_check`,
  `UPDATE properties SET category = 'camping_cottages' WHERE category IN ('campings_cottages', 'camping', 'campings')`,
  `UPDATE properties SET category = 'resort' WHERE category = 'hotel'`,
  `ALTER TABLE properties ADD CONSTRAINT properties_category_check
   CHECK (category IN ('villa', 'camping_cottages', 'resort', 'homestay'))`,
  `CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL DEFAULT 'BookStayX Guest',
    email VARCHAR(255),
    mobile VARCHAR(20) UNIQUE NOT NULL,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  )`,
  `ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_user_type_check`,
  `ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_user_type_check
   CHECK (user_type IN ('admin', 'owner', 'referral', 'customer'))`,
  `CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile)`,
  `ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'`,
  `ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS booking_id VARCHAR(50)`,
  `ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS note TEXT`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS soft_lock_expires_at TIMESTAMP`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS referral_type TEXT`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ticket_token VARCHAR(100)`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ticket_id VARCHAR(7)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_ticket_id ON bookings(ticket_id) WHERE ticket_id IS NOT NULL`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS whatsapp_message_ids JSONB DEFAULT '{}'`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS commission_paid BOOLEAN DEFAULT false`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS commission_paid_at TIMESTAMP`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS utr_number VARCHAR(100)`,
  `ALTER TABLE referral_users ADD COLUMN IF NOT EXISTS parent_referral_id INTEGER`,
  `ALTER TABLE referral_users ADD COLUMN IF NOT EXISTS owner_id INTEGER`,
  `ALTER TABLE referral_users ADD COLUMN IF NOT EXISTS visible_to_owner BOOLEAN DEFAULT true`,
  `ALTER TABLE referral_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
  `CREATE TABLE IF NOT EXISTS webhook_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100),
    payload JSONB,
    processed BOOLEAN DEFAULT false,
    booking_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS daily_booking_counters (
    counter_date DATE PRIMARY KEY,
    last_number INTEGER NOT NULL DEFAULT 0
  )`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS daily_request_number INTEGER`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS request_date DATE`,
  `ALTER TABLE referral_users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP`,
  `ALTER TABLE admins ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255)`,
  `ALTER TABLE admins ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE admins ADD COLUMN IF NOT EXISTS totp_pending_secret VARCHAR(255)`,
  `CREATE TABLE IF NOT EXISTS referral_upi_ids (
    id SERIAL PRIMARY KEY,
    referral_user_id INTEGER NOT NULL REFERENCES referral_users(id) ON DELETE CASCADE,
    upi_id VARCHAR(256) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_referral_upi_ids_user ON referral_upi_ids(referral_user_id)`,
  `ALTER TABLE referral_upi_ids ADD COLUMN IF NOT EXISTS is_invalid BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE referral_upi_ids ADD COLUMN IF NOT EXISTS beneficiary_name VARCHAR(256)`,
  `ALTER TABLE owners ADD COLUMN IF NOT EXISTS session_invalidated_at TIMESTAMPTZ`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_failure_reason VARCHAR(255)`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(30) DEFAULT 'mock'`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100)`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100)`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_razorpay_order_id
   ON bookings(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_razorpay_payment_id
   ON bookings(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL`,
  `CREATE TABLE IF NOT EXISTS payment_attempts (
    id BIGSERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    provider VARCHAR(30) NOT NULL,
    provider_order_id VARCHAR(100),
    provider_payment_id VARCHAR(100),
    amount_paise INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'created',
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_attempts_provider_order
   ON payment_attempts(provider, provider_order_id) WHERE provider_order_id IS NOT NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_attempts_provider_payment
   ON payment_attempts(provider, provider_payment_id) WHERE provider_payment_id IS NOT NULL`,
  `ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS provider VARCHAR(30)`,
  `ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS event_id VARCHAR(150)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_provider_event
   ON webhook_events(provider, event_id) WHERE event_id IS NOT NULL`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL`,
  `CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id)`,
  `ALTER TABLE customers ADD COLUMN IF NOT EXISTS expo_push_token TEXT`,
  `CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    district VARCHAR(255) NOT NULL,
    region VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Beach Destination',
    image_url TEXT,
    tagline TEXT,
    rating DECIMAL(2,1) DEFAULT 4.6,
    reviews_count VARCHAR(50) DEFAULT '1.2K Reviews',
    is_popular BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_locations_slug ON locations(slug)`,
  `CREATE INDEX IF NOT EXISTS idx_locations_region ON locations(region)`,
  `CREATE INDEX IF NOT EXISTS idx_locations_popular ON locations(is_popular, is_active)`,
  `ALTER TABLE properties ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL`,
  `ALTER TABLE properties ADD COLUMN IF NOT EXISTS location_slug VARCHAR(255)`,
  `CREATE INDEX IF NOT EXISTS idx_properties_location_slug ON properties(location_slug)`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'system',
    is_read BOOLEAN DEFAULT false,
    data_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_customer ON notifications(customer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(customer_id, is_read)`,
  `INSERT INTO referral_upi_ids (referral_user_id, upi_id, is_default)
   SELECT id, saved_upi_id, true
   FROM referral_users
   WHERE saved_upi_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM referral_upi_ids WHERE referral_user_id = referral_users.id
     )`,
  // Multi-locality Seeding (Coastal Kokan & Pune/Maval)
  `INSERT INTO locations (slug, name, district, region, category, rating, reviews_count, is_popular, display_order)
   VALUES
     ('pawna-lake', 'Pawna Lake', 'Maval Region', 'Pune District', 'Lake Destination', 4.8, '1.8K Reviews', true, 1),
     ('lonavala', 'Lonavala', 'Maval Region', 'Pune District', 'Hill Station', 4.7, '2.4K Reviews', true, 2),
     ('khandala', 'Khandala', 'Maval Region', 'Pune District', 'Hill Station', 4.5, '980 Reviews', false, 3),
     ('karjat', 'Karjat', 'Raigad District', 'Raigad', 'Nature Escape', 4.6, '1.1K Reviews', false, 4),
     ('alibagh', 'Alibaug Beach', 'Raigad District', 'Raigad', 'Beach Destination', 4.8, '2.9K Reviews', true, 5),
     ('kihim-beach', 'Kihim Beach', 'Raigad District', 'Raigad', 'Beach Destination', 4.6, '850 Reviews', false, 6),
     ('varsoli-beach', 'Varsoli Beach', 'Raigad District', 'Raigad', 'Beach Destination', 4.6, '720 Reviews', false, 7),
     ('nagaon-beach', 'Nagaon Beach', 'Raigad District', 'Raigad', 'Beach Destination', 4.7, '1.4K Reviews', false, 8),
     ('akshi-beach', 'Akshi Beach', 'Raigad District', 'Raigad', 'Beach Destination', 4.6, '640 Reviews', false, 9),
     ('kashid', 'Kashid Beach', 'Raigad District', 'Raigad', 'Beach Destination', 4.7, '1.6K Reviews', true, 10),
     ('murud', 'Murud Beach', 'Raigad District', 'Raigad', 'Beach Destination', 4.6, '1.2K Reviews', true, 11),
     ('diveagar', 'Diveagar Beach', 'Raigad District', 'Konkan', 'Beach Destination', 4.7, '1.5K Reviews', true, 12),
     ('shrivardhan-beach', 'Shrivardhan Beach', 'Raigad District', 'Raigad', 'Beach Destination', 4.6, '890 Reviews', false, 13),
     ('harihareshwar-beach', 'Harihareshwar Beach', 'Raigad District', 'Raigad', 'Beach Destination', 4.6, '780 Reviews', false, 14),
     ('velas-beach', 'Velas Beach', 'Ratnagiri District', 'Central Konkan', 'Beach Destination', 4.6, '520 Reviews', false, 15),
     ('kelshi-beach', 'Kelshi Beach', 'Ratnagiri District', 'Central Konkan', 'Beach Destination', 4.5, '410 Reviews', false, 16),
     ('anjarle-beach', 'Anjarle Beach', 'Ratnagiri District', 'Central Konkan', 'Beach Destination', 4.6, '610 Reviews', false, 17),
     ('karde-ladghar', 'Karde & Ladghar', 'Ratnagiri District', 'Central Konkan', 'Beach Destination', 4.6, '930 Reviews', false, 18),
     ('harnai-beach', 'Harnai Beach', 'Ratnagiri District', 'Central Konkan', 'Beach Destination', 4.5, '580 Reviews', false, 19),
     ('guhagar-beach', 'Guhagar Beach', 'Ratnagiri District', 'Central Konkan', 'Beach Destination', 4.6, '820 Reviews', false, 20),
     ('ganpatipule-beach', 'Ganpatipule Beach', 'Ratnagiri District', 'Central Konkan', 'Beach Destination', 4.8, '2.1K Reviews', true, 21),
     ('devgad-beach', 'Devgad Beach', 'Sindhudurg District', 'Southern Konkan', 'Beach Destination', 4.6, '670 Reviews', false, 22),
     ('kunkeshwar-beach', 'Kunkeshwar Beach', 'Sindhudurg District', 'Southern Konkan', 'Beach Destination', 4.7, '740 Reviews', false, 23),
     ('tarkarli', 'Tarkarli Beach', 'Sindhudurg District', 'Southern Konkan', 'Beach Destination', 4.8, '1.9K Reviews', true, 24),
     ('chivla-beach', 'Chivla Beach', 'Sindhudurg District', 'Southern Konkan', 'Beach Destination', 4.6, '530 Reviews', false, 25),
     ('bhogwe-beach', 'Bhogwe Beach', 'Sindhudurg District', 'Southern Konkan', 'Beach Destination', 4.6, '490 Reviews', false, 26),
     ('nivati-beach', 'Nivati Beach', 'Sindhudurg District', 'Southern Konkan', 'Beach Destination', 4.6, '420 Reviews', false, 27),
     ('vengurla', 'Vengurla Beach', 'Sindhudurg District', 'Southern Konkan', 'Beach Destination', 4.6, '650 Reviews', false, 28),
     ('redi-beach', 'Redi Beach', 'Sindhudurg District', 'Southern Konkan', 'Beach Destination', 4.6, '380 Reviews', false, 29)
   ON CONFLICT (slug) DO NOTHING`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS male_guest_count INTEGER`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS female_guest_count INTEGER`,
  `ALTER TABLE owner_booking_requests ADD COLUMN IF NOT EXISTS veg_count INTEGER`,
  `ALTER TABLE owner_booking_requests ADD COLUMN IF NOT EXISTS non_veg_count INTEGER`,
  `ALTER TABLE owner_booking_requests ADD COLUMN IF NOT EXISTS male_count INTEGER`,
  `ALTER TABLE owner_booking_requests ADD COLUMN IF NOT EXISTS female_count INTEGER`,
  `ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS veg_count INTEGER`,
  `ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS non_veg_count INTEGER`,
  `ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS male_count INTEGER`,
  `ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS female_count INTEGER`,
  `ALTER TABLE property_units ADD COLUMN IF NOT EXISTS has_food BOOLEAN DEFAULT true`,
  `ALTER TABLE property_units ADD COLUMN IF NOT EXISTS meal_plan VARCHAR(255) DEFAULT 'All Meals Package (AP)'`,
  `ALTER TABLE property_units ADD COLUMN IF NOT EXISTS veg_price VARCHAR(50) DEFAULT '800'`,
  `ALTER TABLE property_units ADD COLUMN IF NOT EXISTS non_veg_price VARCHAR(50) DEFAULT '1200'`,
  `ALTER TABLE property_units ADD COLUMN IF NOT EXISTS kitchen_facility TEXT`,
  `ALTER TABLE property_units ADD COLUMN IF NOT EXISTS extra_guest_price VARCHAR(50) DEFAULT '1000'`,
  `ALTER TABLE property_units ADD COLUMN IF NOT EXISTS security_deposit VARCHAR(50) DEFAULT '5000'`,
  `ALTER TABLE property_units ADD COLUMN IF NOT EXISTS bedrooms INTEGER DEFAULT 3`,
  `ALTER TABLE property_units ADD COLUMN IF NOT EXISTS bathrooms INTEGER DEFAULT 3`,
  `ALTER TABLE property_units ADD COLUMN IF NOT EXISTS bed_config TEXT`,
  `ALTER TABLE property_units ADD COLUMN IF NOT EXISTS pet_friendly BOOLEAN DEFAULT true`,
  `ALTER TABLE property_units ADD COLUMN IF NOT EXISTS smoking_allowed BOOLEAN DEFAULT false`,
  `ALTER TABLE property_units ADD COLUMN IF NOT EXISTS total_inventory INTEGER DEFAULT 1`,
  `ALTER TABLE property_units ADD COLUMN IF NOT EXISTS accommodation_type VARCHAR(50) DEFAULT 'Tent'`,
  `ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_food BOOLEAN DEFAULT true`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS has_food BOOLEAN DEFAULT true`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS unit_quantity INTEGER DEFAULT 1`,
  `ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS unit_quantity INTEGER DEFAULT 1`,
  `ALTER TABLE owner_booking_requests ADD COLUMN IF NOT EXISTS unit_quantity INTEGER DEFAULT 1`,
];

async function runStartupMigrations() {
  const client = await pool.connect();

  try {
    for (const statement of migrations) {
      await client.query(statement);
    }
    const missingTicketIds = await client.query(
      'SELECT id, booking_id FROM bookings WHERE ticket_id IS NULL ORDER BY id',
    );
    for (const booking of missingTicketIds.rows) {
      await client.query('BEGIN');
      try {
        await assignTicketId(client, booking.id, booking.booking_id);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    console.log(`[Database] ${migrations.length} startup migrations verified.`);
  } finally {
    client.release();
  }
}

module.exports = { runStartupMigrations };
