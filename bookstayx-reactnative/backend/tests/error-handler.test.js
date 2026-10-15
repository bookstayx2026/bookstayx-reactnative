const assert = require('node:assert/strict');
const test = require('node:test');
const {
  isDatabaseError,
  categorizeError,
  sanitizeErrorMessage,
  errorMiddleware,
  createError,
  errorCodes,
} = require('../middleware/errorHandler');

test('sanitizeErrorMessage strips passwords from connection strings and preserves safe text', () => {
  const rawUrl = 'postgresql://postgres.myproject:SuperSecretPassword123@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';
  const sanitized = sanitizeErrorMessage(rawUrl);
  assert.ok(!sanitized.includes('SuperSecretPassword123'));
  assert.ok(sanitized.includes('postgres.myproject'));
  assert.ok(sanitized.includes('***'));

  assert.equal(sanitizeErrorMessage('Normal error message'), 'Normal error message');
  assert.equal(sanitizeErrorMessage(''), '');
  assert.equal(sanitizeErrorMessage(null), '');
});

test('isDatabaseError correctly detects database connection, auth, and query failures', () => {
  // PostgreSQL 5-char codes
  assert.equal(isDatabaseError({ code: '28P01' }), true); // invalid password / tenant
  assert.equal(isDatabaseError({ code: '08006' }), true); // connection failure
  assert.equal(isDatabaseError({ code: '3D000' }), true); // database does not exist
  assert.equal(isDatabaseError({ code: '57P01' }), true); // admin shutdown

  // Node network error codes
  assert.equal(isDatabaseError({ code: 'ECONNREFUSED' }), true);
  assert.equal(isDatabaseError({ code: 'ENOTFOUND' }), true);
  assert.equal(isDatabaseError({ code: 'ETIMEDOUT' }), true);

  // DatabaseError object
  assert.equal(isDatabaseError({ name: 'DatabaseError', message: 'relation does not exist' }), true);

  // Error messages with DB keywords
  assert.equal(isDatabaseError(new Error('password authentication failed for user "postgres"')), true);
  assert.equal(isDatabaseError(new Error('Tenant or user not found: postgres.PROJECT_REF')), true);
  assert.equal(isDatabaseError(new Error('Connection terminated unexpectedly')), true);

  // Non-database errors must return false
  assert.equal(isDatabaseError(new Error('Invalid email format')), false);
  assert.equal(isDatabaseError({ status: 400, code: 'MISSING_REQUIRED_FIELD' }), false);
  assert.equal(isDatabaseError({ status: 401, code: 'UNAUTHORIZED' }), false);
  assert.equal(isDatabaseError(null), false);
});

test('categorizeError categorizes errors into clear high-level buckets', () => {
  assert.equal(categorizeError({ status: 401, code: 'UNAUTHORIZED' }), 'AUTHENTICATION');
  assert.equal(categorizeError({ status: 403, code: 'FORBIDDEN' }), 'AUTHORIZATION');
  assert.equal(categorizeError({ status: 403, code: 'CORS_ORIGIN_DENIED' }), 'AUTHORIZATION');
  assert.equal(categorizeError({ status: 404, code: 'PROPERTY_NOT_FOUND' }), 'NOT_FOUND');
  assert.equal(categorizeError({ status: 400, code: 'INVALID_PRICE' }), 'VALIDATION');
  assert.equal(categorizeError({ status: 429, code: 'RATE_LIMIT_EXCEEDED' }), 'RATE_LIMIT');
  assert.equal(categorizeError({ code: '28P01' }), 'DATABASE');
  assert.equal(categorizeError(new Error('Unexpected runtime exception')), 'INTERNAL_SERVER_ERROR');
});

test('errorMiddleware converts unhandled database errors to 503 DATABASE_UNAVAILABLE response', () => {
  let capturedStatus = null;
  let capturedBody = null;

  const mockReq = {
    method: 'POST',
    path: '/api/auth/customer/login',
    requestId: 'test-req-1234',
  };

  const mockRes = {
    status(code) {
      capturedStatus = code;
      return this;
    },
    json(body) {
      capturedBody = body;
      return this;
    },
  };

  const dbError = new Error('password authentication failed for user "postgres.PROJECT_REF"');
  dbError.code = '28P01';

  errorMiddleware(dbError, mockReq, mockRes, () => {});

  assert.equal(capturedStatus, 503);
  assert.equal(capturedBody.success, false);
  assert.equal(capturedBody.error.code, 'DATABASE_UNAVAILABLE');
  assert.equal(capturedBody.error.category, 'DATABASE');
  assert.ok(capturedBody.error.message.includes('unavailable'));
  assert.equal(capturedBody.error.requestId, 'test-req-1234');
});

test('errorMiddleware handles operational AppErrors with original status and details', () => {
  let capturedStatus = null;
  let capturedBody = null;

  const mockReq = {
    method: 'POST',
    path: '/api/auth/login',
    requestId: 'test-req-5678',
  };

  const mockRes = {
    status(code) {
      capturedStatus = code;
      return this;
    },
    json(body) {
      capturedBody = body;
      return this;
    },
  };

  const appErr = createError(errorCodes.UNAUTHORIZED, { reason: 'Token expired' });
  errorMiddleware(appErr, mockReq, mockRes, () => {});

  assert.equal(capturedStatus, 401);
  assert.equal(capturedBody.success, false);
  assert.equal(capturedBody.error.code, 'UNAUTHORIZED');
  assert.equal(capturedBody.error.category, 'AUTHENTICATION');
  assert.equal(capturedBody.error.details.reason, 'Token expired');
});
