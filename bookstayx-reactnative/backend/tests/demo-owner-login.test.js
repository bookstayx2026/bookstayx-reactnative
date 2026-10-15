const assert = require('node:assert/strict');
const test = require('node:test');
const {
  DEMO_OWNER_PROPERTY_IDS,
  getDemoOwnerPropertyId,
  isDevelopmentLoginAllowed,
  normalizeDemoOwnerCategory,
} = require('../src/config/demo-owner');

test('demo owner categories resolve only to isolated allowlisted properties', () => {
  assert.deepEqual(DEMO_OWNER_PROPERTY_IDS, {
    villa: 'BSX-V001',
    camping_cottages: 'BSX-CAMP01',
    resort: 'BSX-RESORT01',
    homestay: 'BSX-HOMESTAY01',
  });
  assert.equal(getDemoOwnerPropertyId('villa'), 'BSX-V001');
  assert.equal(getDemoOwnerPropertyId('camping'), 'BSX-CAMP01');
  assert.equal(getDemoOwnerPropertyId('hotel'), 'BSX-RESORT01');
  assert.equal(getDemoOwnerPropertyId('homestay'), 'BSX-HOMESTAY01');
});

test('unknown or missing categories never fall back to a real owner', () => {
  assert.equal(normalizeDemoOwnerCategory('unknown'), null);
  assert.equal(getDemoOwnerPropertyId('unknown'), null);
  assert.equal(getDemoOwnerPropertyId(''), null);
  assert.equal(getDemoOwnerPropertyId(undefined), null);
});

test('production development login is restricted to the owner demo role', () => {
  const allowed = (role) => isDevelopmentLoginAllowed({ enabled: true, nodeEnv: 'production', role });
  assert.equal(allowed('owner'), true);
  assert.equal(allowed('customer'), false);
  assert.equal(allowed('admin'), false);
  assert.equal(allowed('referral'), false);
  assert.equal(isDevelopmentLoginAllowed({ enabled: false, nodeEnv: 'production', role: 'owner' }), false);
});

test('non-production development login behavior remains available for existing local flows', () => {
  assert.equal(isDevelopmentLoginAllowed({ enabled: true, nodeEnv: 'development', role: 'owner' }), true);
  assert.equal(isDevelopmentLoginAllowed({ enabled: true, nodeEnv: 'development', role: 'customer' }), true);
  assert.equal(isDevelopmentLoginAllowed({ enabled: true, nodeEnv: 'test', role: 'admin' }), true);
});
