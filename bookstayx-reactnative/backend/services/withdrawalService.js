const { query, getClient } = require('../db');
const { triggerRazorpayXPayout } = require('./razorpayService');
const { WhatsAppService } = require('../utils/whatsappService');

const WithdrawalService = {
  async requestWithdrawal(userId, amount, upiId) {
    const requestedAmount = Number(amount);
    if (!Number.isFinite(requestedAmount) || requestedAmount < 500) {
      throw new Error('Minimum withdrawal amount is ₹500');
    }
    const client = await getClient();
    let user;
    let txn;
    try {
      await client.query('BEGIN');
      const userResult = await client.query(
        'SELECT id, username, status, referral_otp_number FROM referral_users WHERE id = $1 FOR UPDATE',
        [userId]
      );
      user = userResult.rows[0];
      if (!user || user.status !== 'active') throw new Error('User is not active or not found');
      const saved = await client.query(
        `SELECT upi_id FROM referral_upi_ids
         WHERE referral_user_id = $1 AND upi_id = $2 AND is_invalid = false`,
        [userId, upiId]
      );
      if (!saved.rows.length) throw new Error('Choose a valid saved payout mobile number');
      const balanceResult = await client.query(
        `SELECT
           COALESCE(SUM(CASE WHEN type='earning' AND status='available' THEN amount ELSE 0 END),0) -
           COALESCE(SUM(CASE WHEN type='withdrawal' AND status IN ('pending','processing','completed') THEN amount ELSE 0 END),0)
           AS available_balance,
           COUNT(*) FILTER (WHERE type='withdrawal' AND status IN ('pending','processing')) AS in_flight
         FROM referral_transactions WHERE referral_user_id = $1`,
        [userId]
      );
      if (Number(balanceResult.rows[0].in_flight) > 0) throw new Error('A withdrawal request is already being processed');
      if (requestedAmount > Number(balanceResult.rows[0].available_balance)) throw new Error('Insufficient balance');
      const inserted = await client.query(
        `INSERT INTO referral_transactions
           (referral_user_id, amount, type, status, source, upi_id, updated_at)
         VALUES ($1, $2, 'withdrawal', 'pending', 'manual', $3, NOW()) RETURNING *`,
        [userId, requestedAmount, upiId]
      );
      txn = inserted.rows[0];
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // 6. Trigger RazorpayX payout immediately
    const payoutResult = await triggerRazorpayXPayout(
      txn.id,
      requestedAmount,
      upiId,
      user.username,
      user.referral_otp_number
    );

    const saveUpi = async () => {
      try {
        await query('UPDATE referral_users SET saved_upi_id = $1 WHERE id = $2', [upiId, userId]);
      } catch (_) {}
    };

    // Helper: IST timestamp string
    const istNow = () => new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).toUpperCase();

    // Helper: notify admin of new withdrawal request (fire-and-forget)
    const notifyAdmin = async (status) => {
      const adminPhone = process.env.ADMIN_PHONE;
      if (!adminPhone) return;
      try {
        // Count pending/processing withdrawals submitted today (IST day boundary)
        const todayCountRes = await query(
          `SELECT COUNT(*) AS cnt
           FROM referral_transactions
           WHERE type = 'withdrawal'
             AND status IN ('pending', 'processing')
             AND created_at >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date`,
        );
        const todayCount = parseInt(todayCountRes.rows[0]?.cnt || '1', 10);

        // Fetch beneficiary name for this UPI ID
        let beneficiaryName = 'N/A';
        try {
          const upiRes = await query(
            `SELECT beneficiary_name FROM referral_upi_ids
             WHERE referral_user_id = $1 AND upi_id = $2 LIMIT 1`,
            [user.id, upiId],
          );
          if (upiRes.rows.length > 0 && upiRes.rows[0].beneficiary_name) {
            beneficiaryName = upiRes.rows[0].beneficiary_name;
          }
        } catch (_) {}

        const whatsapp = new WhatsAppService();
        await whatsapp.sendTextMessage(
          adminPhone,
          `🔔 New Withdrawal Request (#${todayCount} today)\n\nPartner: ${user.username}\nAmount: ₹${requestedAmount.toLocaleString('en-IN')}\nUPI: ${upiId}\nBeneficiary: ${beneficiaryName}\nStatus: ${status === 'pending' ? 'Pending — manual payout needed' : 'Processing via RazorpayX'}\nRequested: ${istNow()}\n\nVisit Admin Dashboard → Requests Center to review and process this request.`
        );
      } catch (_) {}
    };

    if (payoutResult.success) {
      const finalStatus = payoutResult.mapped_status || 'processing';
      await Promise.all([
        query(
          'UPDATE referral_transactions SET status = $1, payout_id = $2, payout_status = $3, updated_at = NOW() WHERE id = $4',
          [finalStatus, payoutResult.payout_id, payoutResult.payout_status, txn.id]
        ),
        saveUpi(),
      ]);

      // Notify admin about new request
      await notifyAdmin(finalStatus);

      if (finalStatus === 'completed') {
        try {
          const whatsapp = new WhatsAppService();
          await whatsapp.sendTextMessage(
            user.referral_otp_number,
            `✅ Withdrawal Successful!\n\nHello ${user.username},\nYour withdrawal has been processed.\n\nAmount: ₹${requestedAmount.toLocaleString('en-IN')}\nUPI: ${upiId}\nPayout Ref: ${payoutResult.payout_id || 'N/A'}\nProcessed: ${istNow()}\n\nThe amount will be credited to your UPI account shortly.\nThank you for being a BookStayX partner!`
          );
        } catch (_) {}
      }

      return {
        ...txn,
        status: finalStatus,
        payout_id: payoutResult.payout_id,
        payout_status: payoutResult.payout_status,
        message: finalStatus === 'completed'
          ? 'Withdrawal processed successfully!'
          : 'Withdrawal initiated — payout is being processed by RazorpayX.',
      };
    } else if (payoutResult.skipped) {
      // RazorpayX not configured — keep as 'pending' for admin to process manually
      await Promise.all([
        query("UPDATE referral_transactions SET status = 'pending', updated_at = NOW() WHERE id = $1", [txn.id]),
        saveUpi(),
      ]);

      // Notify admin to process manually
      await notifyAdmin('pending');

      return {
        ...txn,
        status: 'pending',
        message: 'Withdrawal request submitted. It will be processed within 24 hours.',
      };
    } else {
      // Payout failed — mark as failed so user can retry
      await query(
        "UPDATE referral_transactions SET status = 'failed', payout_status = 'failed', updated_at = NOW() WHERE id = $1",
        [txn.id]
      );
      throw new Error(payoutResult.reason || 'Payout failed. Please try again or contact support.');
    }
  }
};

module.exports = WithdrawalService;
