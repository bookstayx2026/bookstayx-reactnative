const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query, pool } = require('../db');
const { env } = require('../src/config/env');
const { generateToken, JWT_SECRET } = require('../utils/jwt');
const { OtpService } = require('../services/otpService');
const { RefreshTokenRepository } = require('../repositories/refreshTokenRepository');
const { getDemoOwnerPropertyId, isDevelopmentLoginAllowed } = require('../src/config/demo-owner');

const cleanMobile = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
};

const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

const validateIndianMobile = (mobile) => {
  const digits = cleanMobile(mobile);
  if (digits.length !== 10 || !/^[6-9]\d{9}$/.test(digits)) {
    return null;
  }
  return digits;
};

const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    return 'Password is required.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain both letters and numbers.';
  }
  return null;
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
    const role = String(req.body.role || '');
    const isAllowed = isDevelopmentLoginAllowed({
      enabled: env.enableDevLogin,
      nodeEnv: env.nodeEnv,
      role,
    });
    if (!isAllowed) return res.status(404).json({ success: false, message: 'Development login is disabled.' });
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
      const demoPropertyId = getDemoOwnerPropertyId(req.body.category);
      if (!demoPropertyId) {
        return res.status(400).json({ success: false, message: 'Select a supported demo property category.' });
      }

      const result = await query(
        `
        SELECT o.id, o.property_id, o.property_name AS "propertyName", o.owner_name,
               o.owner_otp_number AS "ownerNumber"
        FROM owners o
        JOIN properties p ON p.property_id = o.property_id
        WHERE o.property_id = $1
          AND p.property_id = $1
          AND p.is_active = true
        LIMIT 1`,
        [demoPropertyId]
      );
      if (!result.rows.length) {
        return res.status(409).json({ success: false, message: 'The selected demo property is not available.' });
      }
      identity = { ...result.rows[0], demoMode: true };
      payload = { id: identity.id, mobile: identity.ownerNumber, demo: true, propertyId: demoPropertyId };
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

async function sendCustomerSignupOtp(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const mobile = validateIndianMobile(req.body.mobileNumber);

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    if (!mobile) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit Indian mobile number.' });
    }

    // Check duplicate email
    const emailCheck = await query('SELECT id FROM customers WHERE LOWER(email) = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists. Please log in.' });
    }

    // Check duplicate mobile
    const mobileCheck = await query('SELECT id FROM customers WHERE mobile = $1', [mobile]);
    if (mobileCheck.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this mobile number already exists. Please log in.' });
    }

    const result = await OtpService.sendOtp(mobile, 'customer_signup');
    if (!result.success) return res.status(result.status || 400).json(result);
    return res.json({
      success: true,
      message: result.message,
      demoMode: result.testMode || false,
      demoOtp: result.demoOtp || null,
      otpLimitLeft: result.otpLimitLeft ?? null,
    });
  } catch (error) {
    return next(error);
  }
}

async function verifyCustomerSignupPhone(req, res, next) {
  try {
    const mobile = validateIndianMobile(req.body.mobileNumber);
    const otp = String(req.body.otp || '').trim();

    if (!mobile) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit Indian mobile number.' });
    }
    if (!otp) {
      return res.status(400).json({ success: false, message: 'Please enter the verification code.' });
    }

    const result = await OtpService.verifyOtp(mobile, otp, 'customer_signup');
    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    const verificationToken = jwt.sign(
      { mobile, purpose: 'customer_phone_verified' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.json({
      success: true,
      message: 'Phone verified successfully.',
      verificationToken,
    });
  } catch (error) {
    return next(error);
  }
}

async function customerSignup(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const mobile = validateIndianMobile(req.body.mobileNumber);
    const fullName = String(req.body.fullName || '').trim();
    const password = String(req.body.password || '');
    const confirmPassword = String(req.body.confirmPassword || '');
    const verificationToken = String(req.body.verificationToken || '').trim();

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    if (!mobile) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit Indian mobile number.' });
    }
    if (!verificationToken) {
      return res.status(400).json({ success: false, message: 'Phone verification is required before creating an account.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(verificationToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Phone verification token has expired or is invalid. Please verify phone again.' });
    }

    if (decoded.purpose !== 'customer_phone_verified' || decoded.mobile !== mobile) {
      return res.status(401).json({ success: false, message: 'Phone verification token does not match this mobile number.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const emailCheck = await query('SELECT id FROM customers WHERE LOWER(email) = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists. Please log in.' });
    }

    const mobileCheck = await query('SELECT id FROM customers WHERE mobile = $1', [mobile]);
    if (mobileCheck.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this mobile number already exists. Please log in.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const customerResult = await query(
      `INSERT INTO customers (mobile, full_name, email, password_hash, last_login)
       VALUES ($1, COALESCE(NULLIF($2, ''), 'BookStayX Guest'), $3, $4, NOW())
       RETURNING id, full_name AS name, email, mobile`,
      [mobile, fullName || 'BookStayX Guest', email, passwordHash]
    );

    const identity = customerResult.rows[0];
    const session = await issueSession('customer', identity, { id: identity.id, mobile: identity.mobile });
    return res.status(201).json({ success: true, message: 'Account created successfully.', ...session });
  } catch (error) {
    return next(error);
  }
}

async function customerPasswordLogin(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const mobile = validateIndianMobile(req.body.mobileNumber);
    const password = String(req.body.password || '');

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    if (!mobile) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit Indian mobile number.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    const customerResult = await query(
      `SELECT id, full_name AS name, email, mobile, password_hash
       FROM customers
       WHERE LOWER(email) = $1 AND mobile = $2`,
      [email, mobile]
    );

    if (customerResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No account found matching this email and mobile number.',
      });
    }

    const customer = customerResult.rows[0];

    if (!customer.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'No password is set for this account. Please sign up or contact concierge.',
      });
    }

    const isMatch = await bcrypt.compare(password, customer.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. The password you entered is incorrect.',
      });
    }

    await query('UPDATE customers SET last_login = NOW(), updated_at = NOW() WHERE id = $1', [customer.id]);

    const identity = { id: customer.id, name: customer.name, email: customer.email, mobile: customer.mobile };
    const session = await issueSession('customer', identity, { id: customer.id, mobile: customer.mobile });
    return res.json({ success: true, message: 'Login successful.', ...session });
  } catch (error) {
    return next(error);
  }
}

/**
 * Execute atomic deletion of customer and associated personal data:
 * - Revokes active refresh tokens
 * - Deletes in-app notifications
 * - Disassociates bookings (retaining records with customer_id = NULL for statutory accounting/tax compliance)
 * - Deletes OTP verification records for their phone number
 * - Deletes customer row
 */
async function executeCustomerDeletion(customerId, mobile) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Invalidate active refresh tokens
    await client.query(
      "DELETE FROM refresh_tokens WHERE user_id = $1::text AND user_type = 'customer'",
      [customerId]
    );

    // 2. Delete customer notifications
    await client.query(
      "DELETE FROM notifications WHERE customer_id = $1",
      [customerId]
    );

    // 3. Retain financial, tax, and booking records for statutory compliance while disassociating customer
    await client.query(
      "UPDATE bookings SET customer_id = NULL WHERE customer_id = $1",
      [customerId]
    );

    // 4. Delete OTP verification history for this mobile
    if (mobile) {
      await client.query(
        "DELETE FROM otp_verifications WHERE mobile_number = $1",
        [mobile]
      );
    }

    // 5. Delete customer row
    const deleteRes = await client.query(
      "DELETE FROM customers WHERE id = $1 RETURNING id",
      [customerId]
    );

    await client.query('COMMIT');
    return deleteRes.rowCount > 0;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * In-app customer deletion (authenticated via JWT session).
 * Requires re-entering current password for security verification.
 */
async function deleteCustomerAccountInApp(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customer accounts can be deleted via this endpoint.',
      });
    }

    const customerId = req.user.id;
    const customerRes = await query('SELECT * FROM customers WHERE id = $1', [customerId]);
    if (customerRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Account not found or already deleted.',
      });
    }

    const customer = customerRes.rows[0];

    // Identity verification
    if (customer.password_hash) {
      const password = req.body?.password;
      if (!password || typeof password !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Please enter your password to confirm account deletion.',
        });
      }
      const isMatch = await bcrypt.compare(password, customer.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password. Verification failed.',
        });
      }
    } else if (req.body?.verificationToken) {
      try {
        const decoded = jwt.verify(req.body.verificationToken, JWT_SECRET);
        if (decoded.purpose !== 'customer_deletion_verified' || decoded.mobile !== customer.mobile) {
          return res.status(401).json({ success: false, message: 'Invalid verification token.' });
        }
      } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired verification token.' });
      }
    } else if (req.body?.confirmText !== 'DELETE') {
      return res.status(400).json({
        success: false,
        message: 'Please confirm account deletion.',
      });
    }

    await executeCustomerDeletion(customerId, customer.mobile);

    return res.json({
      success: true,
      message: 'Your BookStayX account and associated personal data have been permanently deleted.',
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Public web account deletion request (accessible without logging in).
 * Requires ownership verification via password or phone OTP.
 */
async function deleteCustomerAccountPublicRequest(req, res, next) {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : null;
    const mobile = validateIndianMobile(req.body?.mobileNumber);
    const password = typeof req.body?.password === 'string' ? req.body.password : null;
    const verificationToken = typeof req.body?.verificationToken === 'string' ? req.body.verificationToken : null;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit Indian mobile number.',
      });
    }

    let customer = null;

    // Method 1: Password Verification
    if (password) {
      if (!email || !isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address along with your password.',
        });
      }

      const custRes = await query(
        'SELECT * FROM customers WHERE LOWER(email) = $1 AND mobile = $2',
        [email, mobile]
      );

      if (custRes.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No matching account found with the provided email and mobile number.',
        });
      }

      customer = custRes.rows[0];

      if (!customer.password_hash) {
        return res.status(400).json({
          success: false,
          message: 'No password is set on this account. Please verify using phone OTP.',
        });
      }

      const isMatch = await bcrypt.compare(password, customer.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password. Verification failed.',
        });
      }
    }
    // Method 2: Phone OTP Verification
    else if (verificationToken) {
      try {
        const decoded = jwt.verify(verificationToken, JWT_SECRET);
        if (decoded.purpose !== 'customer_deletion_verified' || decoded.mobile !== mobile) {
          return res.status(401).json({
            success: false,
            message: 'Invalid verification token for this mobile number.',
          });
        }
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: 'Verification token has expired or is invalid. Please request a new code.',
        });
      }

      const custRes = await query('SELECT * FROM customers WHERE mobile = $1', [mobile]);
      if (custRes.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No registered customer account found with this mobile number.',
        });
      }

      customer = custRes.rows[0];
    } else {
      return res.status(400).json({
        success: false,
        message: 'Account ownership verification required. Please provide your password or verify via phone OTP.',
      });
    }

    await executeCustomerDeletion(customer.id, customer.mobile);

    return res.json({
      success: true,
      message: 'Your BookStayX account and associated personal data have been permanently deleted.',
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Send OTP for customer account deletion
 */
async function sendCustomerDeletionOtp(req, res, next) {
  try {
    const mobile = validateIndianMobile(req.body?.mobileNumber);
    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit Indian mobile number.',
      });
    }

    const custCheck = await query('SELECT id FROM customers WHERE mobile = $1', [mobile]);
    if (custCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No registered customer account found with this mobile number.',
      });
    }

    const result = await OtpService.sendOtp(mobile, 'customer_deletion');
    if (!result.success) return res.status(result.status || 400).json(result);

    return res.json({
      success: true,
      message: result.message,
      demoMode: result.testMode || false,
      demoOtp: result.demoOtp || null,
      otpLimitLeft: result.otpLimitLeft ?? null,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Verify OTP for customer account deletion
 */
async function verifyCustomerDeletionOtp(req, res, next) {
  try {
    const mobile = validateIndianMobile(req.body?.mobileNumber);
    const otp = String(req.body?.otp || '').trim();

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit Indian mobile number.',
      });
    }
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Please enter the verification code.',
      });
    }

    const result = await OtpService.verifyOtp(mobile, otp, 'customer_deletion');
    if (!result.success) {
      return res.status(result.status || 401).json(result);
    }

    const verificationToken = jwt.sign(
      { mobile, purpose: 'customer_deletion_verified' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.json({
      success: true,
      message: 'Phone verified successfully for account deletion.',
      verificationToken,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  sendCustomerOtp,
  verifyCustomerOtp,
  sendCustomerSignupOtp,
  verifyCustomerSignupPhone,
  customerSignup,
  customerPasswordLogin,
  deleteCustomerAccountInApp,
  deleteCustomerAccountPublicRequest,
  sendCustomerDeletionOtp,
  verifyCustomerDeletionOtp,
  session,
  devLogin,
};
