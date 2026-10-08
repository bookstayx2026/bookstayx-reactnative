const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const razorpayPaymentController = require('../controllers/razorpayPaymentController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const adminOnly = [authMiddleware, requireRole('admin')];
const customerOnly = [authMiddleware, requireRole('customer', 'owner', 'admin')];
const { pool } = require('../db');
const { paymentLimiter } = require('../middleware/rateLimiter');

router.post('/initiate', paymentLimiter, ...customerOnly, razorpayPaymentController.initiate);
router.post('/razorpay/initiate', paymentLimiter, ...customerOnly, razorpayPaymentController.initiate);
router.get('/razorpay/checkout', razorpayPaymentController.checkout);
router.post('/razorpay/verify-browser', razorpayPaymentController.verifyBrowser);
router.post('/razorpay/mock-confirm', paymentLimiter, ...customerOnly, razorpayPaymentController.mockConfirm);
// Razorpay webhooks are signature-verified and intentionally not rate-limited.
router.post('/razorpay/webhook', razorpayPaymentController.webhook);
router.post('/withdrawal/webhook', paymentController.payoutWebhook);
router.post('/razorpayx/webhook', paymentController.payoutWebhook);

router.get('/verify/:booking_id', paymentLimiter, razorpayPaymentController.verifyStatus);
router.post('/verify/:booking_id', paymentLimiter, razorpayPaymentController.verifyStatus);
router.post('/refund/initiate', ...adminOnly, razorpayPaymentController.refund);
router.post('/refund/deny', ...adminOnly, paymentController.denyRefund);
router.get('/refund/requests', ...adminOnly, paymentController.getRefundRequests);
router.get('/requests/history', ...adminOnly, paymentController.getRequestHistory);
router.get('/withdrawal/requests', ...adminOnly, paymentController.getWithdrawalRequests);
router.post('/withdrawal/process', ...adminOnly, paymentController.processWithdrawal);
router.post('/withdrawal/reject', ...adminOnly, paymentController.rejectWithdrawal);
router.get('/refund/status/:booking_id', ...adminOnly, razorpayPaymentController.refundStatus);
router.get('/withdrawal/status/:id', ...adminOnly, paymentController.checkWithdrawalStatus);
router.get('/bookings', ...adminOnly, paymentController.getAllBookings);
router.get('/transactions', ...adminOnly, paymentController.getAllTransactions);
router.post('/commissions/distribute', ...adminOnly, paymentController.triggerCommissions);

router.get('/revenue-summary', ...adminOnly, async (req, res) => {
  try {
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);

    if (!month || !year || month < 1 || month > 12 || year < 2000 || year > 2100) {
      return res.status(400).json({ success: false, message: 'Valid month (1-12) and year are required' });
    }

    const grossResult = await pool.query(
      `SELECT COALESCE(SUM(advance_amount), 0) AS total
       FROM bookings
       WHERE payment_status = 'SUCCESS'
         AND EXTRACT(MONTH FROM created_at) = $1
         AND EXTRACT(YEAR FROM created_at) = $2`,
      [month, year]
    );

    const refundResult = await pool.query(
      `SELECT COALESCE(SUM(refund_amount), 0) AS total
       FROM bookings
       WHERE payment_status = 'SUCCESS'
         AND refund_status = 'REFUND_INITIATED'`
    );

    const withdrawPendingResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM referral_transactions
       WHERE type = 'withdrawal'
         AND status IN ('pending', 'processing')`
    );

    const referralResult = await pool.query(
      `SELECT COALESCE(
         (SELECT COALESCE(SUM(amount), 0) FROM referral_transactions WHERE type = 'earning'    AND status = 'available') -
         (SELECT COALESCE(SUM(amount), 0) FROM referral_transactions WHERE type = 'withdrawal' AND status = 'completed'),
         0
       ) AS total`
    );

    const inProcessResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM referral_transactions
       WHERE type = 'earning'
         AND status = 'in_process'`
    );

    const grossRevenue = Math.round(parseFloat(grossResult.rows[0].total));
    const refundPending = Math.round(parseFloat(refundResult.rows[0].total));
    const referralPayable = Math.round(parseFloat(referralResult.rows[0].total));
    const inProcessReferral = Math.round(parseFloat(inProcessResult.rows[0].total));
    const withdrawPending = Math.round(parseFloat(withdrawPendingResult.rows[0].total));

    return res.json({
      success: true,
      month,
      year,
      grossRevenue,
      refundPending,
      referralPayable,
      inProcessReferral,
      withdrawPending,
    });
  } catch (err) {
    console.error('[Revenue Summary] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to compute revenue summary' });
  }
});

module.exports = router;
