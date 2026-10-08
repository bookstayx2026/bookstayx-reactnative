const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { query } = require('../db');
const { env } = require('../src/config/env');
const { generateToken } = require('../utils/jwt');
const { OtpService } = require('../services/otpService');
const { RefreshTokenRepository } = require('../repositories/refreshTokenRepository');

const cleanMobile = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
};

const issueSession = async (role, identity, payload) => {
  const accessToken = generateToken({ ...payload, role });
  const refreshToken = crypto.randomBytes(32).toString('hex');
  await RefreshTokenRepository.create(refreshToken, identity.id, role);
  return { accessToken, refreshToken, identity, role };
};

async function sendCustomerOtp(req, res, next) {
  try {
    const mobile = cleanMobile(req.body.mobileNumber);
    const result = await OtpService.sendOtp(mobile, 'customer_login');
    if (!result.success) return res.status(result.status || 400).json(result);
    return res.json({ success: true, message: result.message, otpLimitLeft: result.otpLimitLeft ?? null });
  } catch (error) {
    return next(error);
  }
}

async function verifyCustomerOtp(req, res, next) {
  try {
    const mobile = cleanMobile(req.body.mobileNumber);
    const result = await OtpService.verifyOtp(mobile, String(req.body.otp || ''), 'customer_login');
    if (!result.success) return res.status(result.status || 401).json(result);

    const customerResult = await query(
      `INSERT INTO customers (mobile, full_name, email, last_login)
       VALUES ($1, COALESCE(NULLIF($2, ''), 'BookStayX Guest'), NULLIF($3, ''), NOW())
       ON CONFLICT (mobile) DO UPDATE SET
         full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), customers.full_name),
         email = COALESCE(EXCLUDED.email, customers.email),
         last_login = NOW(),
         updated_at = NOW()
       RETURNING id, full_name AS name, email, mobile`,
      [mobile, String(req.body.fullName || '').trim(), String(req.body.email || '').trim()]
    );
    const identity = customerResult.rows[0];
    const session = await issueSession('customer', identity, { id: identity.id, mobile: identity.mobile });
    return res.json({ success: true, ...session });
  } catch (error) {
    return next(error);
  }
}

async function session(req, res, next) {
  try {
    const { id, role } = req.user;
    let result;
    if (role === 'customer') {
      result = await query('SELECT id, full_name AS name, email, mobile FROM customers WHERE id = $1', [id]);
    } else if (role === 'owner') {
      result = await query(
        `SELECT id, property_id, property_name AS "propertyName", owner_name,
                owner_otp_number AS "ownerNumber"
         FROM owners WHERE id = $1`,
        [id]
      );
    } else if (role === 'admin') {
      result = await query('SELECT id, email FROM admins WHERE id = $1', [id]);
    } else if (role === 'referral') {
      result = await query('SELECT id, username AS email FROM referral_users WHERE id = $1 AND status != $2', [id, 'blocked']);
    } else {
      return res.status(401).json({ success: false, message: 'Unknown session role.' });
    }
    if (!result.rows.length) return res.status(401).json({ success: false, message: 'Session account no longer exists.' });
    return res.json({ success: true, role, identity: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

async function devLogin(req, res, next) {
  try {
    if (!env.enableDevLogin) return res.status(404).json({ success: false, message: 'Development login is disabled.' });
    const role = String(req.body.role || '');
    let identity;
    let payload;

    if (role === 'customer') {
      const result = await query(
        `INSERT INTO customers (mobile, full_name, email, last_login)
         VALUES ('9999999991', 'BookStayX Developer', 'developer@bookstayx.local', NOW())
         ON CONFLICT (mobile) DO UPDATE SET last_login = NOW(), updated_at = NOW()
         RETURNING id, full_name AS name, email, mobile`
      );
      identity = result.rows[0];
      payload = { id: identity.id, mobile: identity.mobile };
    } else if (role === 'owner') {
      const category = String(req.body.category || '').toLowerCase().trim();
      let querySql = `
        SELECT o.id, o.property_id, o.property_name AS "propertyName", o.owner_name,
               o.owner_otp_number AS "ownerNumber"
        FROM owners o
        LEFT JOIN properties p ON p.property_id = o.property_id
      `;
      if (category === 'camping_cottages' || category === 'campings_cottages' || category === 'camping') {
        querySql += ` WHERE p.category IN ('camping_cottages', 'campings_cottages', 'camping') OR o.property_type IN ('camping_cottages', 'campings_cottages', 'camping') OR o.property_id = 'BSX-CAMP01' ORDER BY o.id LIMIT 1`;
      } else if (category === 'resort' || category === 'hotel') {
        querySql += ` WHERE p.category IN ('resort', 'hotel') OR o.property_type IN ('resort', 'hotel') OR o.property_id = 'BSX-RESORT01' ORDER BY o.id LIMIT 1`;
      } else if (category === 'homestay') {
        querySql += ` WHERE p.category = 'homestay' OR o.property_type = 'homestay' OR o.property_id = 'BSX-HOMESTAY01' ORDER BY o.id LIMIT 1`;
      } else if (category === 'villa') {
        querySql += ` WHERE p.category = 'villa' OR o.property_type = 'villa' OR o.property_id = 'BSX-V001' ORDER BY o.id LIMIT 1`;
      } else {
        querySql += ` ORDER BY o.id LIMIT 1`;
      }

      let result = await query(querySql);
      if (!result.rows.length) {
        result = await query(
          `SELECT id, property_id, property_name AS "propertyName", owner_name,
                  owner_otp_number AS "ownerNumber"
           FROM owners ORDER BY id LIMIT 1`
        );
      }
      if (!result.rows.length) {
        result = await query(
          `INSERT INTO owners (property_id, property_name, property_type, owner_name, owner_otp_number, owner_whatsapp_number)
           SELECT property_id, title, category, 'BookStayX Developer', '9999999992', '9999999992'
           FROM properties WHERE property_id IS NOT NULL ORDER BY id LIMIT 1
           RETURNING id, property_id, property_name AS "propertyName", owner_name,
                     owner_otp_number AS "ownerNumber"`
        );
      }
      if (!result.rows.length) return res.status(409).json({ success: false, message: 'Seed the property catalogue before using owner development login.' });
      identity = result.rows[0];
      payload = { id: identity.id, mobile: identity.ownerNumber };
    } else if (role === 'admin') {
      let result = await query('SELECT id, email FROM admins ORDER BY id LIMIT 1');
      if (!result.rows.length) {
        const unusablePasswordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
        result = await query(
          `INSERT INTO admins (email, password_hash, totp_enabled)
           VALUES ('dev-admin@bookstayx.local', $1, false)
           RETURNING id, email`,
          [unusablePasswordHash]
        );
      }
      identity = result.rows[0];
      payload = { id: identity.id, email: identity.email };
    } else if (role === 'referral') {
      let result = await query(
        `SELECT id, username AS email, referral_code FROM referral_users
         WHERE status = 'active' ORDER BY id LIMIT 1`
      );
      if (!result.rows.length) {
        result = await query(
          `INSERT INTO referral_users
             (username, referral_otp_number, referral_code, referral_url, status, balance, referral_type)
           VALUES ('BookStayX Developer', '9999999993', 'DEVSTAY', '/?ref=DEVSTAY', 'active', 0, 'public')
           RETURNING id, username AS email, referral_code`
        );
      }
      identity = result.rows[0];
      payload = { id: identity.id, userId: identity.id, username: identity.email };
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported development role.' });
    }

    const issued = await issueSession(role, identity, payload);
    return res.json({ success: true, ...issued, developmentOnly: true });
  } catch (error) {
    return next(error);
  }
}

module.exports = { sendCustomerOtp, verifyCustomerOtp, session, devLogin };
