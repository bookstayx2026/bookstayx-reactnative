const assert = require('node:assert/strict');
const test = require('node:test');
const http = require('node:http');
const app = require('../app');
const { pool } = require('../src/config/database');

test('Customer Full Auth Flow: Signup with demo OTP 0000 and Login with password', async (t) => {
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

  const testEmail = `testuser_${Date.now()}@bookstayx.test`;
  const testMobile = '98' + String(Date.now()).slice(-8);
  const testPassword = 'SecurePassword@123';

  // 1. Send OTP for signup
  const otpRes = await fetch(`${baseUrl}/api/auth/customer/signup/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, mobileNumber: testMobile }),
  });
  const otpData = await otpRes.json();

  assert.equal(otpRes.status, 200);
  assert.equal(otpData.success, true);
  assert.equal(otpData.demoMode, true);

  // 2. Reject incorrect OTP
  const badVerifyRes = await fetch(`${baseUrl}/api/auth/customer/signup/verify-phone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobileNumber: testMobile, otp: '1111' }),
  });
  assert.equal(badVerifyRes.status, 401);

  // 3. Verify with demo OTP 0000
  const verifyRes = await fetch(`${baseUrl}/api/auth/customer/signup/verify-phone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobileNumber: testMobile, otp: '0000' }),
  });
  const verifyData = await verifyRes.json();

  assert.equal(verifyRes.status, 200);
  assert.equal(verifyData.success, true);
  assert.ok(verifyData.verificationToken);
  const verificationToken = verifyData.verificationToken;

  // 4. Reject mismatched passwords during signup
  const badSignupRes = await fetch(`${baseUrl}/api/auth/customer/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      mobileNumber: testMobile,
      password: testPassword,
      confirmPassword: 'DifferentPassword@123',
      verificationToken,
      fullName: 'Test Customer',
    }),
  });
  assert.equal(badSignupRes.status, 400);

  // 5. Complete signup
  const signupRes = await fetch(`${baseUrl}/api/auth/customer/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      mobileNumber: testMobile,
      password: testPassword,
      confirmPassword: testPassword,
      verificationToken,
      fullName: 'Test Customer',
    }),
  });
  const signupData = await signupRes.json();

  assert.equal(signupRes.status, 201);
  assert.equal(signupData.success, true);
  assert.equal(signupData.role, 'customer');
  assert.ok(signupData.accessToken);
  assert.ok(signupData.refreshToken);

  // 6. Reject duplicate signup with same email
  const dupEmailRes = await fetch(`${baseUrl}/api/auth/customer/signup/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, mobileNumber: '9765432109' }),
  });
  assert.equal(dupEmailRes.status, 409);

  // 7. Reject duplicate signup with same mobile
  const dupMobileRes = await fetch(`${baseUrl}/api/auth/customer/signup/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'other@bookstayx.test', mobileNumber: testMobile }),
  });
  assert.equal(dupMobileRes.status, 409);

  // 8. Login with all 3 matching: email, mobile, password
  const loginRes = await fetch(`${baseUrl}/api/auth/customer/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      mobileNumber: testMobile,
      password: testPassword,
    }),
  });
  const loginData = await loginRes.json();

  assert.equal(loginRes.status, 200);
  assert.equal(loginData.success, true);
  assert.equal(loginData.role, 'customer');
  assert.ok(loginData.accessToken);
  assert.equal(loginData.identity.email, testEmail);

  // 9. Login fails if password is wrong
  const wrongPassRes = await fetch(`${baseUrl}/api/auth/customer/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      mobileNumber: testMobile,
      password: 'WrongPassword@123',
    }),
  });
  assert.equal(wrongPassRes.status, 401);

  // 10. Login fails if mobile does not match email
  const wrongMobileRes = await fetch(`${baseUrl}/api/auth/customer/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      mobileNumber: '9999999999',
      password: testPassword,
    }),
  });
  assert.equal(wrongMobileRes.status, 401);

  // Cleanup test user
  await pool.query('DELETE FROM customers WHERE email = $1', [testEmail]);
});