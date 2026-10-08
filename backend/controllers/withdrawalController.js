const WithdrawalService = require('../services/withdrawalService');
const { validateUpiVpa } = require('../services/razorpayService');
const { query } = require('../db');

const MOBILE_REGEX = /^[6-9]\d{9}$/;
const VPA_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z0-9.-]{2,64}$/;
const normalizePayoutAddress = (value) => {
  const trimmed = String(value || '').trim();
  const digits = trimmed.replace(/\D/g, '');
  return MOBILE_REGEX.test(digits) ? digits : trimmed.toLowerCase();
};

const WithdrawalController = {
  async validateUpi(req, res) {
    try {
      const { upi } = req.body;
      if (!upi) return res.status(400).json({ error: 'UPI ID is required' });
      const result = await validateUpiVpa(upi);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async removeSavedUpi(req, res) {
    try {
      await query(
        'UPDATE referral_users SET saved_upi_id = NULL WHERE id = $1',
        [req.user.id]
      );
      return res.json({ success: true, message: 'Saved UPI removed' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async getPendingWithdrawals(req, res) {
    try {
      const result = await query(
        `SELECT id, amount, upi_id, status, created_at
         FROM referral_transactions
         WHERE referral_user_id = $1
           AND type = 'withdrawal'
           AND status IN ('pending', 'processing')
         ORDER BY created_at DESC`,
        [req.user.id]
      );
      return res.json({ pending_withdrawals: result.rows });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async withdraw(req, res) {
    try {
      const { amount, upi } = req.body;
      if (!amount || !upi) {
        return res.status(400).json({ error: 'Amount and UPI ID are required' });
      }

      const result = await WithdrawalService.requestWithdrawal(req.user.id, parseFloat(amount), upi);
      res.json({
        success: true,
        message: result.message || 'Withdrawal initiated successfully',
        status: result.status,
        payout_id: result.payout_id || null,
        transaction: result
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // ── Multi-UPI management ──────────────────────────────────────────

  async listUpiIds(req, res) {
    try {
      const result = await query(
        `SELECT id, upi_id, beneficiary_name, is_default, is_invalid, created_at
         FROM referral_upi_ids
         WHERE referral_user_id = $1
         ORDER BY is_default DESC, created_at ASC`,
        [req.user.id]
      );
      return res.json({ upi_ids: result.rows });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async addUpiId(req, res) {
    try {
      const { upi_id, make_default, beneficiary_name } = req.body;
      if (!upi_id || !upi_id.trim()) {
        return res.status(400).json({ error: 'Mobile number is required' });
      }
      const upiTrimmed = normalizePayoutAddress(upi_id);
      if (!MOBILE_REGEX.test(upiTrimmed) && !VPA_REGEX.test(upiTrimmed)) {
        return res.status(400).json({ error: 'Enter a valid UPI ID or 10-digit payout mobile number' });
      }
      if (process.env.PAYOUT_PROVIDER === 'razorpayx' && !VPA_REGEX.test(upiTrimmed)) {
        return res.status(400).json({ error: 'RazorpayX direct payouts require a valid UPI ID such as name@bank' });
      }
      if (!beneficiary_name || !beneficiary_name.trim()) {
        return res.status(400).json({ error: 'Beneficiary name is required' });
      }
      const beneficiaryTrimmed = beneficiary_name.trim();

      const userId = req.user.id;

      // Count existing UPIs
      const countRes = await query(
        'SELECT COUNT(*) AS cnt FROM referral_upi_ids WHERE referral_user_id = $1',
        [userId]
      );
      const existingCount = parseInt(countRes.rows[0].cnt, 10);
      if (existingCount >= 3) {
        return res.status(400).json({ error: 'You can save a maximum of 3 payout mobile numbers' });
      }
      const shouldBeDefault = make_default || existingCount === 0;

      // If making default, clear old default first
      if (shouldBeDefault) {
        await query(
          'UPDATE referral_upi_ids SET is_default = false WHERE referral_user_id = $1',
          [userId]
        );
      }

      const insertRes = await query(
        `INSERT INTO referral_upi_ids (referral_user_id, upi_id, beneficiary_name, is_default)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [userId, upiTrimmed, beneficiaryTrimmed, shouldBeDefault]
      );

      // Keep referral_users.saved_upi_id in sync with default
      if (shouldBeDefault) {
        await query(
          'UPDATE referral_users SET saved_upi_id = $1 WHERE id = $2',
          [upiTrimmed, userId]
        );
      }

      return res.json({ success: true, upi: insertRes.rows[0] });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async editUpiId(req, res) {
    try {
      const { id } = req.params;
      const { upi_id, beneficiary_name } = req.body;
      if (!upi_id || !upi_id.trim()) {
        return res.status(400).json({ error: 'Mobile number is required' });
      }
      const upiTrimmed = normalizePayoutAddress(upi_id);
      if (!MOBILE_REGEX.test(upiTrimmed) && !VPA_REGEX.test(upiTrimmed)) {
        return res.status(400).json({ error: 'Enter a valid UPI ID or 10-digit payout mobile number' });
      }
      if (process.env.PAYOUT_PROVIDER === 'razorpayx' && !VPA_REGEX.test(upiTrimmed)) {
        return res.status(400).json({ error: 'RazorpayX direct payouts require a valid UPI ID such as name@bank' });
      }
      if (!beneficiary_name || !beneficiary_name.trim()) {
        return res.status(400).json({ error: 'Beneficiary name is required' });
      }
      const beneficiaryTrimmed = beneficiary_name.trim();

      const userId = req.user.id;
      const result = await query(
        `UPDATE referral_upi_ids SET upi_id = $1, beneficiary_name = $2, is_invalid = false
         WHERE id = $3 AND referral_user_id = $4
         RETURNING *`,
        [upiTrimmed, beneficiaryTrimmed, id, userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'UPI ID not found' });
      }

      // If this was the default, sync referral_users.saved_upi_id
      if (result.rows[0].is_default) {
        await query(
          'UPDATE referral_users SET saved_upi_id = $1 WHERE id = $2',
          [upiTrimmed, userId]
        );
      }

      return res.json({ success: true, upi: result.rows[0] });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async setDefaultUpiId(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify ownership
      const check = await query(
        'SELECT * FROM referral_upi_ids WHERE id = $1 AND referral_user_id = $2',
        [id, userId]
      );
      if (check.rows.length === 0) {
        return res.status(404).json({ error: 'UPI ID not found' });
      }

      // Clear all defaults, then set new one
      await query(
        'UPDATE referral_upi_ids SET is_default = false WHERE referral_user_id = $1',
        [userId]
      );
      await query(
        'UPDATE referral_upi_ids SET is_default = true WHERE id = $1',
        [id]
      );

      // Sync referral_users.saved_upi_id
      await query(
        'UPDATE referral_users SET saved_upi_id = $1 WHERE id = $2',
        [check.rows[0].upi_id, userId]
      );

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async deleteUpiId(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify ownership and get details
      const upiRes = await query(
        'SELECT * FROM referral_upi_ids WHERE id = $1 AND referral_user_id = $2',
        [id, userId]
      );
      if (upiRes.rows.length === 0) {
        return res.status(404).json({ error: 'UPI ID not found' });
      }
      const upi = upiRes.rows[0];

      // Guard: cannot delete if only one UPI
      const countRes = await query(
        'SELECT COUNT(*) AS cnt FROM referral_upi_ids WHERE referral_user_id = $1',
        [userId]
      );
      if (parseInt(countRes.rows[0].cnt, 10) <= 1) {
        return res.status(400).json({ error: 'Cannot delete your only saved UPI ID' });
      }

      // Guard: cannot delete if used in a pending withdrawal
      const pendingRes = await query(
        `SELECT id FROM referral_transactions
         WHERE referral_user_id = $1 AND type = 'withdrawal' AND status = 'pending' AND upi_id = $2`,
        [userId, upi.upi_id]
      );
      if (pendingRes.rows.length > 0) {
        return res.status(400).json({ error: 'Cannot delete a UPI ID with a pending withdrawal request' });
      }

      // Delete
      await query('DELETE FROM referral_upi_ids WHERE id = $1', [id]);

      // If deleted was default, promote the next oldest as default
      if (upi.is_default) {
        const nextRes = await query(
          `SELECT id, upi_id FROM referral_upi_ids
           WHERE referral_user_id = $1 ORDER BY created_at ASC LIMIT 1`,
          [userId]
        );
        if (nextRes.rows.length > 0) {
          const next = nextRes.rows[0];
          await query('UPDATE referral_upi_ids SET is_default = true WHERE id = $1', [next.id]);
          await query('UPDATE referral_users SET saved_upi_id = $1 WHERE id = $2', [next.upi_id, userId]);
        }
      }

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
};

module.exports = WithdrawalController;
