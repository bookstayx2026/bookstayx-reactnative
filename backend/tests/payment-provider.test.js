const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');

const payment = require('../services/paymentProviderService');

test('checkout token verifies and rejects tampering or expiry', () => {
  const valid = payment.signCheckoutToken('BSX-100', 'order_100', Date.now() + 60_000);
  assert.deepEqual(payment.verifyCheckoutToken(valid), { bookingId: 'BSX-100', orderId: 'order_100' });
  assert.equal(payment.verifyCheckoutToken(`${valid}x`), null);
  assert.equal(payment.verifyCheckoutToken(payment.signCheckoutToken('BSX-100', 'order_100', Date.now() - 1)), null);
});

test('Razorpay payment signature accepts only the correct payload', () => {
  const previous = process.env.RAZORPAY_KEY_SECRET;
  process.env.RAZORPAY_KEY_SECRET = 'test-payment-secret';
  const signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update('order_200|pay_200').digest('hex');
  assert.equal(payment.verifyPaymentSignature('order_200', 'pay_200', signature), true);
  assert.equal(payment.verifyPaymentSignature('order_200', 'pay_other', signature), false);
  if (previous === undefined) delete process.env.RAZORPAY_KEY_SECRET;
  else process.env.RAZORPAY_KEY_SECRET = previous;
});

test('Razorpay webhook signature is verified against the raw body', () => {
  const raw = Buffer.from('{"event":"payment.captured"}');
  const signature = crypto.createHmac('sha256', 'webhook-secret').update(raw).digest('hex');
  assert.equal(payment.verifyWebhookSignature(raw, signature, 'webhook-secret'), true);
  assert.equal(payment.verifyWebhookSignature(Buffer.from('{}'), signature, 'webhook-secret'), false);
});

test('commission rules match owner, B2B, public referral and direct bookings', () => {
  assert.deepEqual(payment.commissionFor(10_000, 'owner', true), { admin: 500, referrer: 2500 });
  assert.deepEqual(payment.commissionFor(10_000, 'b2b', true), { admin: 800, referrer: 2200 });
  assert.deepEqual(payment.commissionFor(10_000, 'public', true), { admin: 1500, referrer: 1500 });
  assert.deepEqual(payment.commissionFor(10_000, 'public', false), { admin: 3000, referrer: 0 });
});
