const crypto = require('crypto');
const Razorpay = require('razorpay');
const { pool } = require('../db');
const { env } = require('../src/config/env');

const checkoutSecret = process.env.PAYMENT_CHECKOUT_SECRET || process.env.OTP_HMAC_SECRET || process.env.JWT_SECRET;
const safeEqual = (left, right) => {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

function razorpayClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay gateway credentials are not configured');
  }
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}

function assertProviderReady() {
  if (env.paymentProvider === 'razorpay') razorpayClient();
  if (env.nodeEnv === 'production' && env.paymentProvider === 'mock') {
    throw new Error('Mock payments are disabled in production');
  }
}

function signCheckoutToken(bookingId, orderId, expiresAt = Date.now() + 15 * 60 * 1000) {
  const payload = `${bookingId}.${orderId}.${expiresAt}`;
  const signature = crypto.createHmac('sha256', checkoutSecret).update(payload).digest('hex');
  return Buffer.from(`${payload}.${signature}`).toString('base64url');
}

function verifyCheckoutToken(token) {
  try {
    const encoded = String(token || '');
    const decodedBuffer = Buffer.from(encoded, 'base64url');
    if (!encoded || decodedBuffer.toString('base64url') !== encoded) return null;
    const decoded = decodedBuffer.toString('utf8');
    const parts = decoded.split('.');
    if (parts.length !== 4) return null;
    const [bookingId, orderId, expiresAt, signature] = parts;
    if (!bookingId || !orderId || !/^\d+$/.test(expiresAt) || !/^[a-f0-9]{64}$/.test(signature)) return null;
    const payload = `${bookingId}.${orderId}.${expiresAt}`;
    const expected = crypto.createHmac('sha256', checkoutSecret).update(payload).digest('hex');
    if (!safeEqual(signature, expected)) return null;
    if (Number(expiresAt) < Date.now()) return null;
    return { bookingId, orderId };
  } catch { return null; }
}

async function createOrder(booking) {
  assertProviderReady();
  const amountPaise = Math.round(Number(booking.advance_amount) * 100);
  if (!Number.isInteger(amountPaise) || amountPaise < 100) throw new Error('Invalid payment amount');
  if (env.paymentProvider === 'mock') {
    return { id: `mock_${booking.booking_id}_${Date.now()}`, amount: amountPaise, currency: 'INR', status: 'created', provider: 'mock' };
  }
  const order = await razorpayClient().orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: String(booking.booking_id).slice(0, 40),
    notes: { booking_id: booking.booking_id, property: String(booking.property_name || '').slice(0, 200) },
  });
  return { ...order, provider: 'razorpay' };
}

function verifyPaymentSignature(orderId, paymentId, signature) {
  if (!process.env.RAZORPAY_KEY_SECRET) return false;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqual(signature, expected);
}

function verifyWebhookSignature(rawBody, signature, secret = process.env.RAZORPAY_WEBHOOK_SECRET) {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqual(signature, expected);
}

function commissionFor(totalAmount, type, hasReferral) {
  if (!hasReferral) return { admin: totalAmount * .30, referrer: 0 };
  const rates = type === 'owner' ? [.05, .25] : ['b2b','owners_b2b'].includes(type) ? [.08, .22] : [.15, .15];
  return { admin: Math.round(totalAmount * rates[0] * 100) / 100, referrer: Math.round(totalAmount * rates[1] * 100) / 100 };
}

async function finalizeSuccessfulPayment({ bookingId, orderId, paymentId, signature = null, method = 'razorpay', provider = env.paymentProvider }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const locked = await client.query('SELECT * FROM bookings WHERE booking_id = $1 FOR UPDATE', [bookingId]);
    if (!locked.rows.length) throw new Error('Booking not found');
    const booking = locked.rows[0];
    if (booking.payment_status === 'SUCCESS') {
      await client.query('COMMIT');
      return { booking, alreadyPaid: true };
    }
    if (booking.razorpay_order_id && booking.razorpay_order_id !== orderId) throw new Error('Payment order does not match booking');
    const total = Number(booking.total_amount) || 0;
    const commission = commissionFor(total, String(booking.referral_type || '').toLowerCase(), Boolean(booking.referral_code));
    const ticketToken = booking.ticket_token || crypto.randomBytes(24).toString('hex');
    const actionToken = crypto.randomBytes(32).toString('hex');
    const nextStatus = 'PENDING_OWNER_CONFIRMATION';
    const updated = await client.query(
      `UPDATE bookings SET payment_status='SUCCESS', booking_status=$1,
         payment_provider=$2, razorpay_order_id=$3, razorpay_payment_id=$4, razorpay_signature=$5,
         order_id=$3, transaction_id=$4, payment_method=$6, webhook_processed=true,
         admin_commission=$7, referrer_commission=$8, commission_status='IN_PROCESS',
         ticket_token=$9, action_token=$10, action_token_used=false,
         action_token_expires_at=NOW()+INTERVAL '24 hours', soft_lock_expires_at=NULL,
         payment_failure_reason=NULL, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [nextStatus, provider, orderId, paymentId, signature, method, commission.admin, commission.referrer, ticketToken, actionToken, booking.id]
    );
    await client.query(
      `UPDATE payment_attempts SET status='captured', provider_payment_id=$1, updated_at=NOW()
       WHERE booking_id=$2 AND provider_order_id=$3`, [paymentId, booking.id, orderId]
    );
    if (booking.referral_code && commission.referrer > 0) {
      const referrer = await client.query(
        `SELECT id FROM referral_users WHERE referral_code=$1 AND status='active'`, [booking.referral_code]
      );
      if (referrer.rows.length) {
        await client.query(
          `INSERT INTO referral_transactions(referral_user_id,booking_id,amount,type,status,source,updated_at)
           VALUES($1,$2,$3,'earning','in_process','booking_confirm',NOW())
           ON CONFLICT DO NOTHING`, [referrer.rows[0].id, booking.id, commission.referrer]
        );
      }
    }

    try {
      const ownerQuery = await client.query(
        `SELECT o.id AS owner_id, p.id AS property_db_id
         FROM properties p
         LEFT JOIN owners o ON o.property_id = p.property_id
         WHERE p.property_id = $1 OR p.id::text = $1
         LIMIT 1`,
        [String(booking.property_id)]
      );
      if (ownerQuery.rows.length && ownerQuery.rows[0].owner_id) {
        await client.query(
          `INSERT INTO owner_notifications (property_id, owner_id, type, title, message, reference_id)
           VALUES ($1, $2, 'new_booking', $3, $4, $5)`,
          [
            ownerQuery.rows[0].property_db_id,
            ownerQuery.rows[0].owner_id,
            `Confirmed Booking #${booking.booking_id}`,
            `${booking.guest_name} confirmed booking for ${booking.property_name} (₹${Number(booking.total_amount).toLocaleString('en-IN')}).`,
            booking.booking_id,
          ]
        );
      }
    } catch (nErr) {
      console.warn("Owner notification insert skipped:", nErr.message);
    }

    await client.query('COMMIT');
    return { booking: updated.rows[0], alreadyPaid: false };
  } catch (error) {
    await client.query('ROLLBACK'); throw error;
  } finally { client.release(); }
}

async function markPaymentFailed(orderId, paymentId, reason) {
  await pool.query(
    `UPDATE bookings SET payment_status='FAILED', booking_status='PAYMENT_FAILED',
       razorpay_payment_id=COALESCE($2,razorpay_payment_id), payment_failure_reason=$3, updated_at=NOW()
     WHERE razorpay_order_id=$1 AND payment_status!='SUCCESS'`, [orderId, paymentId || null, String(reason || 'Payment failed').slice(0,255)]
  );
  await pool.query(
    `UPDATE payment_attempts SET status='failed', provider_payment_id=COALESCE($2,provider_payment_id),
       failure_reason=$3, updated_at=NOW() WHERE provider_order_id=$1`, [orderId, paymentId || null, String(reason || 'Payment failed').slice(0,500)]
  );
}

async function createRefund(booking, amountRupees) {
  const amount = Math.round(Number(amountRupees) * 100);
  if (env.paymentProvider === 'mock') {
    if (env.nodeEnv === 'production') throw new Error('Mock refunds are disabled in production');
    return { id: `mock_refund_${booking.booking_id}_${Date.now()}`, status: 'processed', amount };
  }
  if (!booking.razorpay_payment_id && !booking.transaction_id) throw new Error('Booking has no Razorpay payment ID');
  return razorpayClient().payments.refund(booking.razorpay_payment_id || booking.transaction_id, {
    amount, notes: { booking_id: booking.booking_id }, receipt: `refund_${booking.booking_id}`.slice(0,40),
  });
}

module.exports = { createOrder, createRefund, finalizeSuccessfulPayment, markPaymentFailed, signCheckoutToken, verifyCheckoutToken, verifyPaymentSignature, verifyWebhookSignature, commissionFor };
