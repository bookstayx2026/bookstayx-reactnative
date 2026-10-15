const assert = require('node:assert/strict');
const test = require('node:test');
const http = require('node:http');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { pool } = require('../src/config/database');
const { generateToken, JWT_SECRET } = require('../utils/jwt');

test('Customer Account Deletion Test Suite', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    try {
      await pool.end();
    } catch (_) {}
  });

  // Helper to create a test customer
  const createTestCustomer = async (email, mobile, password = 'Password@123') => {
    const passwordHash = await bcrypt.hash(password, 10);
    const res = await pool.query(
      `INSERT INTO customers (full_name, email, mobile, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, mobile`,
      ['Test Deletion Guest', email, mobile, passwordHash]
    );
    return res.rows[0];
  };

  // ── 1. Unauthenticated in-app deletion attempt fails ──────────────────────
  await t.test('Unauthenticated in-app deletion attempt returns 401', async () => {
    const res = await fetch(`${baseUrl}/api/auth/customer/account`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'Password@123' }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  // ── 2. Failed password verification rejects deletion ──────────────────────
  await t.test('Deletion with incorrect password returns 401', async () => {
    const email = `fail_pass_${Date.now()}@bookstayx.test`;
    const mobile = '97' + String(Date.now()).slice(-8);
    const customer = await createTestCustomer(email, mobile, 'CorrectPass@123');

    const token = generateToken({ id: customer.id, role: 'customer', mobile: customer.mobile });

    const res = await fetch(`${baseUrl}/api/auth/customer/account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password: 'WrongPassword@123' }),
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /incorrect password/i);

    // Verify account still exists
    const check = await pool.query('SELECT id FROM customers WHERE id = $1', [customer.id]);
    assert.equal(check.rows.length, 1);

    // Clean up
    await pool.query('DELETE FROM customers WHERE id = $1', [customer.id]);
  });

  // ── 3. Role protection: Vendor/Owner cannot delete account via customer endpoint
  await t.test('Owner token cannot call customer deletion endpoint', async () => {
    const ownerToken = generateToken({ id: 1, role: 'owner', mobile: '9999999999' });
    const res = await fetch(`${baseUrl}/api/auth/customer/account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ password: 'AnyPassword@123' }),
    });

    assert.equal(res.status, 403);
  });

  // ── 4. Successful in-app customer deletion + retained bookings + session revoked
  await t.test('Successful customer deletion erases PII, deletes tokens, retains booking', async () => {
    const email = `delete_inapp_${Date.now()}@bookstayx.test`;
    const mobile = '96' + String(Date.now()).slice(-8);
    const password = 'SecretPassword@123';
    const customer = await createTestCustomer(email, mobile, password);

    const token = generateToken({ id: customer.id, role: 'customer', mobile: customer.mobile });

    // Seed a notification for this customer
    await pool.query(
      `INSERT INTO notifications (customer_id, title, message)
       VALUES ($1, 'Welcome', 'Welcome to BookStayX')`,
      [customer.id]
    );

    // Seed a refresh token for this customer
    await pool.query(
      `INSERT INTO refresh_tokens (token_hash, user_id, user_type, expires_at)
       VALUES ($1, $2, 'customer', NOW() + INTERVAL '2 days')`,
      ['dummyhash_' + Date.now(), String(customer.id)]
    );

    // Seed a booking linked to this customer
    const bookingRes = await pool.query(
      `INSERT INTO bookings (
         booking_id, customer_id, property_id, property_name, property_type,
         guest_name, guest_phone, owner_phone, admin_phone,
         checkin_datetime, checkout_datetime, advance_amount, total_amount
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW() + INTERVAL '1 day', $10, $11)
       RETURNING id, booking_id, customer_id, total_amount`,
      [
        'BK-DEL-' + Date.now(),
        customer.id,
        'prop-test-01',
        'Test Luxury Villa',
        'villa',
        'Test Deletion Guest',
        mobile,
        '9876543210',
        '9876543211',
        5000.0,
        15000.0,
      ]
    );
    const createdBooking = bookingRes.rows[0];
    assert.equal(createdBooking.customer_id, customer.id);

    // Perform In-App Deletion with correct password
    const deleteRes = await fetch(`${baseUrl}/api/auth/customer/account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });

    assert.equal(deleteRes.status, 200);
    const deleteData = await deleteRes.json();
    assert.equal(deleteData.success, true);
    assert.match(deleteData.message, /permanently deleted/i);

    // Verify 1: Customer row is erased
    const custCheck = await pool.query('SELECT id FROM customers WHERE id = $1', [customer.id]);
    assert.equal(custCheck.rows.length, 0);

    // Verify 2: Refresh tokens are revoked
    const tokenCheck = await pool.query(
      "SELECT id FROM refresh_tokens WHERE user_id = $1 AND user_type = 'customer'",
      [String(customer.id)]
    );
    assert.equal(tokenCheck.rows.length, 0);

    // Verify 3: Notifications are deleted
    const notifCheck = await pool.query('SELECT id FROM notifications WHERE customer_id = $1', [customer.id]);
    assert.equal(notifCheck.rows.length, 0);

    // Verify 4: Booking record is legally and financially retained for tax/audit with customer_id = NULL
    const bookingCheck = await pool.query('SELECT * FROM bookings WHERE id = $1', [createdBooking.id]);
    assert.equal(bookingCheck.rows.length, 1);
    assert.equal(bookingCheck.rows[0].customer_id, null);
    assert.equal(parseFloat(bookingCheck.rows[0].total_amount), 15000.0);

    // Verify 5: Duplicate deletion request returns 404
    const dupRes = await fetch(`${baseUrl}/api/auth/customer/account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });
    assert.equal(dupRes.status, 404);

    // Verify 6: Cannot log in anymore
    const loginRes = await fetch(`${baseUrl}/api/auth/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, mobileNumber: mobile, password }),
    });
    assert.equal(loginRes.status, 401);

    // Clean up test booking
    await pool.query('DELETE FROM bookings WHERE id = $1', [createdBooking.id]);
  });

  // ── 5. Public Web Account Deletion with Password ──────────────────────────
  await t.test('Public web deletion with valid email, mobile, and password', async () => {
    const email = `public_del_${Date.now()}@bookstayx.test`;
    const mobile = '95' + String(Date.now()).slice(-8);
    const password = 'PublicPassword@123';
    const customer = await createTestCustomer(email, mobile, password);

    // Request deletion via public endpoint
    const res = await fetch(`${baseUrl}/api/auth/customer/account-deletion-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        mobileNumber: mobile,
        password,
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);

    // Confirm deleted
    const check = await pool.query('SELECT id FROM customers WHERE id = $1', [customer.id]);
    assert.equal(check.rows.length, 0);
  });

  // ── 6. Public Web Account Deletion with Phone OTP ─────────────────────────
  await t.test('Public web deletion with phone OTP verification', async () => {
    const email = `public_otp_${Date.now()}@bookstayx.test`;
    const mobile = '94' + String(Date.now()).slice(-8);
    const customer = await createTestCustomer(email, mobile, 'DummyPassword@123');

    // 1. Send OTP for customer deletion
    const sendOtpRes = await fetch(`${baseUrl}/api/auth/customer/deletion/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber: mobile }),
    });
    assert.equal(sendOtpRes.status, 200);
    const sendOtpData = await sendOtpRes.json();
    assert.equal(sendOtpData.success, true);
    assert.equal(sendOtpData.demoMode, true);

    // 2. Verify with demo OTP 0000
    const verifyOtpRes = await fetch(`${baseUrl}/api/auth/customer/deletion/verify-phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber: mobile, otp: '0000' }),
    });
    assert.equal(verifyOtpRes.status, 200);
    const verifyOtpData = await verifyOtpRes.json();
    assert.equal(verifyOtpData.success, true);
    assert.ok(verifyOtpData.verificationToken);

    // 3. Submit deletion with token
    const deleteRes = await fetch(`${baseUrl}/api/auth/customer/account-deletion-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobileNumber: mobile,
        verificationToken: verifyOtpData.verificationToken,
      }),
    });
    assert.equal(deleteRes.status, 200);
    const deleteData = await deleteRes.json();
    assert.equal(deleteData.success, true);

    // Confirm deleted
    const check = await pool.query('SELECT id FROM customers WHERE id = $1', [customer.id]);
    assert.equal(check.rows.length, 0);
  });

  // ── 7. Verify Admin and Vendor accounts remain completely untouched ───────
  await t.test('Admin and Vendor records remain untouched and unaffected', async () => {
    // Check owners count
    const ownersCountBefore = await pool.query('SELECT COUNT(*) FROM owners');
    const propertiesCountBefore = await pool.query('SELECT COUNT(*) FROM properties');

    // Create and delete a dummy customer
    const email = `safeguard_${Date.now()}@bookstayx.test`;
    const mobile = '93' + String(Date.now()).slice(-8);
    const customer = await createTestCustomer(email, mobile, 'Safeguard@123');
    const token = generateToken({ id: customer.id, role: 'customer', mobile: customer.mobile });

    await fetch(`${baseUrl}/api/auth/customer/account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password: 'Safeguard@123' }),
    });

    const ownersCountAfter = await pool.query('SELECT COUNT(*) FROM owners');
    const propertiesCountAfter = await pool.query('SELECT COUNT(*) FROM properties');

    assert.equal(ownersCountBefore.rows[0].count, ownersCountAfter.rows[0].count);
    assert.equal(propertiesCountBefore.rows[0].count, propertiesCountAfter.rows[0].count);
  });
});
