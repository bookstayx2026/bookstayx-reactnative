const assert = require('node:assert/strict');
const test = require('node:test');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OtpService } = require('../services/otpService');
const { JWT_SECRET } = require('../utils/jwt');
const { pool } = require('../db');

test.after(async () => {
  try {
    await pool.end();
  } catch (_) {}
});

test('OtpService accepts demo OTP 0000 for customer_signup in development', async () => {
  const mobile = '9876543210';
  const sendRes = await OtpService.sendOtp(mobile, 'customer_signup');
  assert.equal(sendRes.success, true);
  assert.equal(sendRes.testMode, true);
  assert.equal(sendRes.demoOtp, '0000');

  const verifyRes = await OtpService.verifyOtp(mobile, '0000', 'customer_signup');
  assert.equal(verifyRes.success, true);
});

test('OtpService rejects invalid OTP for customer_signup', async () => {
  const mobile = '9876543210';
  await OtpService.sendOtp(mobile, 'customer_signup');
  const verifyRes = await OtpService.verifyOtp(mobile, '9999', 'customer_signup');
  assert.equal(verifyRes.success, false);
});

test('Password hashing with bcrypt produces verifiable hash', async () => {
  const password = 'Password@123';
  const hash = await bcrypt.hash(password, 10);
  assert.notEqual(password, hash);
  assert.equal(await bcrypt.compare(password, hash), true);
  assert.equal(await bcrypt.compare('WrongPassword@123', hash), false);
});

test('Phone verification token signs and verifies correctly', () => {
  const mobile = '9876543210';
  const token = jwt.sign(
    { mobile, purpose: 'customer_phone_verified' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const decoded = jwt.verify(token, JWT_SECRET);
  assert.equal(decoded.mobile, mobile);
  assert.equal(decoded.purpose, 'customer_phone_verified');
});