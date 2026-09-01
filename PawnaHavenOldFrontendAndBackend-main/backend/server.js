const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const villaRoutes = require('./routes/villa');
const campingRoutes = require('./routes/camping_Cottages');
const ownerRoutes = require('./routes/ownerRoutes');
const eticketRoutes = require('./routes/etickets');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const referralRoutes = require('./routes/referralRoutes');
const { pool } = require('./db');
const { errorMiddleware } = require('./middleware/errorHandler');
const { globalApiLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use('/attached_assets', express.static(path.join(__dirname, '../attached_assets')));

// Capture raw body for WhatsApp webhook signature verification (via verify callback — non-interfering)
app.use(express.json({
  limit: '50mb',
  verify: (req, res, buf) => {
    if (
      req.path &&
      (req.path.startsWith('/webhook') ||
        req.path.startsWith('/api/payments/withdrawal/webhook'))
    ) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '50mb', parameterLimit: 50000 }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Serve static files from React admin panel
const adminPath = path.join(__dirname, 'public/admin');
const frontendPath = path.join(__dirname, '../dist');

// Middleware to handle /admin trailing slash
app.use((req, res, next) => {
  if (req.path === '/admin') {
    return res.redirect(301, '/admin/');
  }
  next();
});

// Inject environment variables into the admin panel
app.get('/admin/config.js', (req, res) => {
  const config = {
    REACT_APP_CLOUDINARY_CLOUD_NAME: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
    REACT_APP_CLOUDINARY_UPLOAD_PRESET: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL || '/api'
  };
  res.header('Content-Type', 'application/javascript');
  res.send(`window._env_ = ${JSON.stringify(config)};`);
});

// Serve static files for admin
app.use('/admin', express.static(adminPath));

// Serve static files for main frontend
app.use(express.static(frontendPath));

// ── Sitemap ──────────────────────────────────────────────────────────────────
// Dynamic sitemap: includes homepage + every active property page.
// Cached in memory for 1 hour — safe for a single-process Node server.
let _sitemapCache = null;
let _sitemapBuiltAt = 0;
const SITEMAP_TTL_MS = 60 * 60 * 1000;
const SITE_BASE = 'https://pawnahavencamp.com';

app.get('/sitemap.xml', async (req, res) => {
  try {
    const now = Date.now();
    if (_sitemapCache && now - _sitemapBuiltAt < SITEMAP_TTL_MS) {
      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=3600');
      return res.send(_sitemapCache);
    }

    const today = new Date().toISOString().split('T')[0];
    const { rows } = await pool.query(
      `SELECT slug, updated_at FROM properties WHERE is_active = true ORDER BY updated_at DESC`
    );

    const urls = [
      `  <url><loc>${SITE_BASE}/</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>${today}</lastmod></url>`,
      ...rows.map((p) => {
        const lastmod = p.updated_at
          ? new Date(p.updated_at).toISOString().split('T')[0]
          : today;
        return `  <url><loc>${SITE_BASE}/property/${p.slug}</loc><changefreq>weekly</changefreq><priority>0.9</priority><lastmod>${lastmod}</lastmod></url>`;
      }),
    ];

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls,
      '</urlset>',
    ].join('\n');

    _sitemapCache = xml;
    _sitemapBuiltAt = now;

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    return res.send(xml);
  } catch (err) {
    console.error('[Sitemap] Error generating sitemap:', err.message);
    res.set('Content-Type', 'application/xml');
    return res.status(500).send(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>'
    );
  }
});

// Global API rate limiter — catches everything not covered by per-route limiters.
// Webhooks are automatically skipped inside globalApiLimiter (see rateLimiter.js).
app.use('/api', globalApiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/villa', villaRoutes);
app.use('/api/camping_Cottages', campingRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/etickets', eticketRoutes);
app.use('/api/referrals', referralRoutes);

const bookingController = require('./controllers/bookingController');
app.get('/webhook', bookingController.handleWhatsAppWebhook);
app.post('/webhook', bookingController.handleWhatsAppWebhook);

const { distributeCheckoutCommissions } = require('./services/commissionService');
const { startExpiredOtpCleanup } = require('./services/otpService');
startExpiredOtpCleanup();
const { RefreshTokenRepository } = require('./repositories/refreshTokenRepository');
setInterval(async () => {
  try {
    const n = await RefreshTokenRepository.deleteExpired();
    if (n > 0) console.log(`[RefreshToken] Cleaned up ${n} expired token(s).`);
  } catch (e) { console.error('[RefreshToken] Cleanup error:', e.message); }
}, 6 * 60 * 60 * 1000); // every 6 hours
const COMMISSION_INTERVAL_MS = 30 * 60 * 1000;
setTimeout(async () => {
  console.log('[Commission] Running initial checkout commission distribution...');
  try { await distributeCheckoutCommissions(); } catch (e) { console.error('[Commission] Initial run error:', e.message); }
  setInterval(async () => {
    try { await distributeCheckoutCommissions(); } catch (e) { console.error('[Commission] Scheduled run error:', e.message); }
  }, COMMISSION_INTERVAL_MS);
}, 10000);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'LoonCamp API is running',
    timestamp: new Date().toISOString(),
  });
});

// Admin SPA routing
app.get(/^\/admin.*/, (req, res) => {
  res.sendFile(path.join(adminPath, 'index.html'));
});

// Frontend SPA routing - MUST BE LAST
app.get(/^(?!\/api|\/admin).*/, (req, res) => {
  // Return index.html for all other routes to support client-side routing
  res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Frontend build not found. Please run npm run build.');
    }
  });
});

// 404 handler for API routes
app.use(/^\/api.*/, (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

// Error handling middleware (structured)
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  if (err.message && err.message.includes('File size too large')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'Image file size is too large (max 50MB). Please compress the image or use a smaller file.'
      }
    });
  }

  if (err.isOperational) {
    return res.status(err.status).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

// Startup migrations — safe to run on every restart (all use IF NOT EXISTS)
async function runStartupMigrations() {
  const client = await pool.connect();
  const migrations = [
    // ledger_entries
    `ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'`,
    `ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS booking_id VARCHAR(50)`,
    `ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS note TEXT`,
    // bookings
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS soft_lock_expires_at TIMESTAMP`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS referral_type TEXT`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ticket_token VARCHAR(100)`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS whatsapp_message_ids JSONB DEFAULT '{}'`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS commission_paid BOOLEAN DEFAULT false`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS commission_paid_at TIMESTAMP`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS utr_number VARCHAR(100)`,
    // referral_users
    `ALTER TABLE referral_users ADD COLUMN IF NOT EXISTS parent_referral_id INTEGER`,
    `ALTER TABLE referral_users ADD COLUMN IF NOT EXISTS owner_id INTEGER`,
    `ALTER TABLE referral_users ADD COLUMN IF NOT EXISTS visible_to_owner BOOLEAN DEFAULT true`,
    // referral_transactions
    `ALTER TABLE referral_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    // webhook_events table
    `CREATE TABLE IF NOT EXISTS webhook_events (
      id SERIAL PRIMARY KEY,
      event_type VARCHAR(100),
      payload JSONB,
      processed BOOLEAN DEFAULT false,
      booking_id VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    // daily booking request number
    `CREATE TABLE IF NOT EXISTS daily_booking_counters (
      counter_date DATE PRIMARY KEY,
      last_number  INTEGER NOT NULL DEFAULT 0
    )`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS daily_request_number INTEGER`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS request_date DATE`,
    `ALTER TABLE referral_users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP`,
    // TOTP 2FA for admins
    `ALTER TABLE admins ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255)`,
    `ALTER TABLE admins ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE admins ADD COLUMN IF NOT EXISTS totp_pending_secret VARCHAR(255)`,
    // Multi-UPI support for referral users
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
    // Owner session invalidation
    `ALTER TABLE owners ADD COLUMN IF NOT EXISTS session_invalidated_at TIMESTAMPTZ`,
    // Payment failure tracking
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_failure_reason VARCHAR(255)`,
    // Migrate existing saved_upi_id values into new table (idempotent)
    `INSERT INTO referral_upi_ids (referral_user_id, upi_id, is_default)
     SELECT id, saved_upi_id, true
     FROM referral_users
     WHERE saved_upi_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM referral_upi_ids WHERE referral_user_id = referral_users.id
     )`,
  ];

  let applied = 0;
  let failed = 0;
  try {
    for (const sql of migrations) {
      try {
        await client.query(sql);
        applied++;
      } catch (err) {
        console.error(`[Migration] FAILED: ${sql.slice(0, 60).trim()}... — ${err.message}`);
        failed++;
      }
    }
    console.log(`[Migration] Complete: ${applied} statements OK${failed ? `, ${failed} failed` : ''}`);
  } finally {
    client.release();
  }
}

// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
  await runStartupMigrations();
  console.log(`\n=================================`);
  console.log(`LoonCamp API Server`);
  console.log(`=================================`);
  console.log(`Cloudinary Config: { cloud_name: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Present' : 'Missing'}, api_key: ${process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing'}, api_secret: ${process.env.CLOUDINARY_API_SECRET ? 'Present' : 'Missing'} }`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
  console.log(`Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`=================================\n`);
});

// For Replit to handle proxying
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

module.exports = app;
