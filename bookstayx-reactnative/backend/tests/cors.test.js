const assert = require('node:assert/strict');
const test = require('node:test');
const { isCorsOriginAllowed, normalizeOrigin, isBookStayXDomain } = require('../src/config/cors');

test('normalizeOrigin helper handles URLs and trailing slashes correctly', () => {
  assert.equal(normalizeOrigin('https://bookstayx.com/'), 'https://bookstayx.com');
  assert.equal(normalizeOrigin('https://www.bookstayx.com///'), 'https://www.bookstayx.com');
  assert.equal(normalizeOrigin('http://localhost:8081/'), 'http://localhost:8081');
  assert.equal(normalizeOrigin(''), '');
  assert.equal(normalizeOrigin(null), '');
});

test('isBookStayXDomain correctly identifies BookStayX and Vercel domains', () => {
  assert.equal(isBookStayXDomain('bookstayx.com'), true);
  assert.equal(isBookStayXDomain('www.bookstayx.com'), true);
  assert.equal(isBookStayXDomain('preview.bookstayx.com'), true);
  assert.equal(isBookStayXDomain('bookstayx-reactnative.vercel.app'), true);
  assert.equal(isBookStayXDomain('any-deployment.vercel.app'), true);

  assert.equal(isBookStayXDomain('evil-bookstayx.com'), false);
  assert.equal(isBookStayXDomain('notbookstayx.com'), false);
  assert.equal(isBookStayXDomain('malicious-site.com'), false);
  assert.equal(isBookStayXDomain('localhost'), false);
});

test('isCorsOriginAllowed permits BookStayX domains in production over HTTPS', () => {
  const prodEnv = {
    nodeEnv: 'production',
    corsOrigins: [],
  };

  assert.equal(isCorsOriginAllowed('https://bookstayx.com', prodEnv), true);
  assert.equal(isCorsOriginAllowed('https://bookstayx.com/', prodEnv), true);
  assert.equal(isCorsOriginAllowed('https://www.bookstayx.com', prodEnv), true);
  assert.equal(isCorsOriginAllowed('https://www.bookstayx.com/', prodEnv), true);
  assert.equal(isCorsOriginAllowed('https://app.bookstayx.com', prodEnv), true);
  assert.equal(isCorsOriginAllowed('https://bookstayx-reactnative.vercel.app', prodEnv), true);
});

test('isCorsOriginAllowed enforces HTTPS for production domains', () => {
  const prodEnv = {
    nodeEnv: 'production',
    corsOrigins: [],
  };

  // Plain HTTP must be rejected in production
  assert.equal(isCorsOriginAllowed('http://bookstayx.com', prodEnv), false);
  assert.equal(isCorsOriginAllowed('http://www.bookstayx.com', prodEnv), false);
});

test('isCorsOriginAllowed rejects unauthorized origins in production', () => {
  const prodEnv = {
    nodeEnv: 'production',
    corsOrigins: ['https://partner.example.com'],
  };

  assert.equal(isCorsOriginAllowed('http://localhost:8081', prodEnv), false);
  assert.equal(isCorsOriginAllowed('http://127.0.0.1:5001', prodEnv), false);
  assert.equal(isCorsOriginAllowed('https://attacker.com', prodEnv), false);
  assert.equal(isCorsOriginAllowed('https://evil-bookstayx.com', prodEnv), false);

  // But explicitly configured origins are allowed
  assert.equal(isCorsOriginAllowed('https://partner.example.com', prodEnv), true);
  assert.equal(isCorsOriginAllowed('https://partner.example.com/', prodEnv), true);
});

test('isCorsOriginAllowed permits development hosts in development environment', () => {
  const devEnv = {
    nodeEnv: 'development',
    corsOrigins: [],
  };

  assert.equal(isCorsOriginAllowed('http://localhost:8081', devEnv), true);
  assert.equal(isCorsOriginAllowed('http://localhost:8082', devEnv), true);
  assert.equal(isCorsOriginAllowed('http://127.0.0.1:5001', devEnv), true);
  assert.equal(isCorsOriginAllowed('http://192.168.1.10:8081', devEnv), true);
  assert.equal(isCorsOriginAllowed('http://10.0.2.2:5001', devEnv), true);
  assert.equal(isCorsOriginAllowed('https://bookstayx.com', devEnv), true);

  // Untrusted public domain is rejected in dev unless in corsOrigins
  assert.equal(isCorsOriginAllowed('https://untrusted.com', devEnv), false);
});

test('isCorsOriginAllowed permits requests with no origin header (mobile, curl, server-to-server)', () => {
  assert.equal(isCorsOriginAllowed(undefined, { nodeEnv: 'production', corsOrigins: [] }), true);
  assert.equal(isCorsOriginAllowed(null, { nodeEnv: 'production', corsOrigins: [] }), true);
  assert.equal(isCorsOriginAllowed('', { nodeEnv: 'production', corsOrigins: [] }), true);
});
