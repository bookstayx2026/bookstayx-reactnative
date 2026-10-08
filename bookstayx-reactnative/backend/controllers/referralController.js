const ReferralService = require('../services/referralService');
const AdminService = require('../services/adminService');
const QRCode = require('qrcode');
const { query } = require('../db');

async function resolveOwnerReferral(ownerId) {
  const result = await query(
    `SELECT o.id, o.owner_name, o.owner_otp_number, o.property_id,
            p.id AS linked_property_id, p.slug AS linked_property_slug
     FROM owners o LEFT JOIN properties p ON p.property_id = o.property_id
     WHERE o.id = $1`, [ownerId]
  );
  if (!result.rows.length) throw new Error('Owner account was not found');
  const owner = result.rows[0];
  let referral = await query(
    `SELECT * FROM referral_users
     WHERE referral_type = 'owner'
       AND (owner_id = $1 OR property_id = $2 OR linked_property_id = $3)
       AND status NOT IN ('deleted', 'owner_deleted')
     ORDER BY id LIMIT 1`,
    [owner.id, owner.property_id, owner.linked_property_id]
  );
  if (!referral.rows.length) {
    const base = String(owner.property_id || `OWNER${owner.id}`).replace(/[^a-z0-9]/gi, '').toUpperCase();
    let code = `${base.slice(0, 12)}${owner.id}`;
    let suffix = 1;
    while ((await query('SELECT 1 FROM referral_users WHERE referral_code = $1', [code])).rows.length) {
      code = `${base.slice(0, 10)}${owner.id}${suffix++}`;
    }
    const appUrl = (process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || 'https://bookstayx.com').replace(/\/$/, '');
    referral = await query(
      `INSERT INTO referral_users
         (username, referral_otp_number, referral_code, referral_url, status, balance,
          referral_type, linked_property_id, linked_property_slug, property_id, owner_id)
       VALUES ($1, $2, $3, $4, 'active', 0, 'owner', $5, $6, $7, $8)
       RETURNING *`,
      [owner.owner_name || 'Property Owner', owner.owner_otp_number, code,
       `${appUrl}/property/${owner.linked_property_slug}?ref=${code}`,
       owner.linked_property_id, owner.linked_property_slug, owner.property_id, owner.id]
    );
  }
  return referral.rows[0];
}

const ReferralController = {
  async getTopEarners(req, res) {
    try {
      const { period } = req.query;
      const earners = await ReferralService.getTopEarners(period);
      res.json(earners);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async validateCode(req, res) {
    try {
      const { code } = req.params;
      if (!code) return res.status(400).json({ valid: false, error: 'Code is required' });
      const result = await query(
        "SELECT id, username, referral_code, referral_type, linked_property_id, linked_property_slug, parent_referral_id FROM referral_users WHERE referral_code = $1 AND status = 'active'",
        [code.toUpperCase()]
      );
      if (result.rows.length > 0) {
        const user = result.rows[0];
        let linkedPropertySlug = user.linked_property_slug || null;
        if (user.referral_type === 'owners_b2b' && user.parent_referral_id) {
          const parentRes = await query(
            'SELECT linked_property_slug FROM referral_users WHERE id = $1',
            [user.parent_referral_id]
          );
          linkedPropertySlug = parentRes.rows[0]?.linked_property_slug || null;
        }
        return res.json({ 
          valid: true, 
          referrer: user.username,
          referral_type: user.referral_type || 'public',
          linked_property_id: user.linked_property_id || null,
          linked_property_slug: linkedPropertySlug
        });
      }
      return res.json({ valid: false });
    } catch (error) {
      res.status(400).json({ valid: false, error: error.message });
    }
  },

  async getStats(req, res) {
    try {
      const stats = await ReferralService.getUserStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getTransactions(req, res) {
    try {
      const transactions = await ReferralService.getUserTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getShareInfo(req, res) {
    try {
      const shareInfo = await ReferralService.getShareInfo(req.user.id);
      res.json(shareInfo);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async ownerLookup(req, res) {
    try {
      const { mobile } = req.params;
      if (!mobile) return res.status(400).json({ error: 'Mobile number is required' });
      const result = await query(
        "SELECT id, username, referral_code, referral_type, linked_property_id, linked_property_slug, status FROM referral_users WHERE referral_otp_number = $1 AND referral_type = 'owner'",
        [mobile]
      );
      if (result.rows.length > 0) {
        return res.json({ found: true, data: result.rows[0] });
      }
      return res.json({ found: false });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getOwnerB2BList(req, res) {
    try {
      const ownerId = (await resolveOwnerReferral(req.user.id)).id;
      const b2bRes = await query(
        `SELECT b.id, b.username, b.referral_otp_number, b.referral_code, b.referral_url,
                o.username AS owner_name,
                p.title AS property_name
         FROM referral_users b
         JOIN referral_users o ON o.id = b.parent_referral_id
         LEFT JOIN properties p ON p.id = o.linked_property_id
         WHERE b.parent_referral_id = $1
           AND b.visible_to_owner = true
           AND b.referral_type = 'owners_b2b'
           AND b.status NOT IN ('owner_deleted', 'deleted')
         ORDER BY b.created_at DESC`,
        [ownerId]
      );
      const publicAppUrl = (process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || 'https://bookstayx.com').replace(/\/$/, '');
      const listWithQr = await Promise.all(
        b2bRes.rows.map(async (partner) => {
          const link = partner.referral_url || `${publicAppUrl}/?ref=${partner.referral_code}`;
          const qrDataUrl = await QRCode.toDataURL(link, {
            width: 400,
            margin: 2,
            color: { dark: "#000000", light: "#ffffff" },
          });
          return { ...partner, referral_qr: qrDataUrl };
        })
      );
      return res.json({ found: true, list: listWithQr });
    } catch (error) {
      res.status(400).json({ found: false, error: error.message });
    }
  },

  async hideOwnerB2B(req, res) {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ success: false, error: 'id is required' });
      const ownerId = (await resolveOwnerReferral(req.user.id)).id;
      const check = await query(
        "SELECT id FROM referral_users WHERE id = $1 AND parent_referral_id = $2 AND referral_type = 'owners_b2b'",
        [id, ownerId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ success: false, error: 'Not authorized to hide this record' });
      }
      await query('UPDATE referral_users SET visible_to_owner = false WHERE id = $1', [id]);
      return res.json({ success: true });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  async deleteOwnerB2B(req, res) {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ success: false, error: 'id is required' });
      const ownerId = (await resolveOwnerReferral(req.user.id)).id;
      const check = await query(
        "SELECT id FROM referral_users WHERE id = $1 AND parent_referral_id = $2 AND referral_type = 'owners_b2b'",
        [id, ownerId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this record' });
      }
      await query("UPDATE referral_users SET status = 'owner_deleted' WHERE id = $1", [id]);
      return res.json({ success: true });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  async createOwnerB2B(req, res) {
    try {
      const username = String(req.body.username || '').trim();
      const mobile = String(req.body.mobile || '').replace(/\D/g, '');
      const requestedCode = String(req.body.referral_code || '').replace(/[^a-z0-9]/gi, '').toUpperCase();
      if (username.length < 2 || !/^[6-9]\d{9}$/.test(mobile)) {
        return res.status(400).json({ success: false, error: 'Partner name and valid 10-digit mobile are required' });
      }
      const owner = await resolveOwnerReferral(req.user.id);
      const code = requestedCode || `${owner.referral_code.slice(0, 8)}${mobile.slice(-4)}`;
      const created = await AdminService.createAdminReferral(
        username, mobile, code, 'owners_b2b', owner.linked_property_id,
        owner.property_id, owner.id, owner.id
      );
      return res.status(201).json({ success: true, data: created });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async ownerLookupByProperty(req, res) {
    try {
      const { propertyId } = req.params;
      if (!propertyId) return res.status(400).json({ error: 'Property ID is required' });
      const propResult = await query(
        'SELECT id, property_id FROM properties WHERE property_id = $1 OR id::text = $1',
        [propertyId]
      );
      if (propResult.rows.length === 0) {
        return res.json({ found: false });
      }
      const prop = propResult.rows[0];
      const result = await query(
        "SELECT id, username, referral_code, referral_otp_number, referral_type, linked_property_id, linked_property_slug, status FROM referral_users WHERE (property_id = $1 OR linked_property_id = $2) AND referral_type = 'owner'",
        [prop.property_id, prop.id]
      );
      if (result.rows.length > 0) {
        return res.json({ found: true, data: result.rows[0] });
      }
      return res.json({ found: false });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getInProcess(req, res) {
    try {
      const userId = req.user.id;
      const [listRes, sumRes] = await Promise.all([
        query(
          `SELECT rt.id AS transaction_id, rt.amount AS referrer_commission,
                  b.booking_id, b.property_name, b.guest_name,
                  b.checkin_datetime, b.checkout_datetime
           FROM referral_transactions rt
           JOIN bookings b ON b.id = rt.booking_id
           WHERE rt.referral_user_id = $1
             AND rt.type = 'earning'
             AND rt.status = 'in_process'
           ORDER BY b.checkin_datetime ASC`,
          [userId]
        ),
        query(
          `SELECT COALESCE(SUM(rt.amount), 0) AS in_process_amount
           FROM referral_transactions rt
           WHERE rt.referral_user_id = $1
             AND rt.type = 'earning'
             AND rt.status = 'in_process'`,
          [userId]
        ),
      ]);
      return res.json({
        in_process: listRes.rows,
        in_process_amount: parseFloat(sumRes.rows[0].in_process_amount) || 0,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getReferralHistory(req, res) {
    try {
      const userId = req.user.id;

      const [availableRes, cancelledRes, noShowCompRes, withdrawalRes, cancel50Res, cancelFullRes] = await Promise.all([
        query(
          `SELECT rt.amount, rt.created_at AS date, rt.source,
                  b.property_name, b.guest_name
           FROM referral_transactions rt
           LEFT JOIN bookings b ON b.id = rt.booking_id
           WHERE rt.referral_user_id = $1
             AND rt.type = 'earning'
             AND rt.status = 'available'
             AND rt.source NOT IN ('no_show_compensation', 'cancellation_50_payout', 'cancellation_owner_compensation')
           ORDER BY rt.created_at DESC`,
          [userId]
        ),
        query(
          `SELECT rt.amount, COALESCE(rt.updated_at, rt.created_at) AS date,
                  b.property_name, b.guest_name, rt.status
           FROM referral_transactions rt
           LEFT JOIN bookings b ON b.id = rt.booking_id
           WHERE rt.referral_user_id = $1
             AND rt.type = 'earning'
             AND rt.status IN ('canceled', 'no_show_canceled')
           ORDER BY rt.created_at DESC`,
          [userId]
        ),
        query(
          `SELECT rt.amount, rt.created_at AS date
           FROM referral_transactions rt
           WHERE rt.referral_user_id = $1
             AND rt.type = 'earning'
             AND rt.status = 'available'
             AND rt.source = 'no_show_compensation'
           ORDER BY rt.created_at DESC`,
          [userId]
        ),
        query(
          `SELECT id, amount, upi_id, status, payout_id, created_at AS date
           FROM referral_transactions
           WHERE referral_user_id = $1
             AND type = 'withdrawal'
             AND status IN ('completed', 'rejected')
           ORDER BY created_at DESC`,
          [userId]
        ),
        query(
          `SELECT rt.amount, rt.created_at AS date, b.property_name, b.guest_name
           FROM referral_transactions rt
           LEFT JOIN bookings b ON b.id = rt.booking_id
           WHERE rt.referral_user_id = $1
             AND rt.type = 'earning'
             AND rt.status = 'available'
             AND rt.source = 'cancellation_50_payout'
           ORDER BY rt.created_at DESC`,
          [userId]
        ),
        query(
          `SELECT rt.amount, rt.created_at AS date, b.property_name, b.guest_name
           FROM referral_transactions rt
           LEFT JOIN bookings b ON b.id = rt.booking_id
           WHERE rt.referral_user_id = $1
             AND rt.type = 'earning'
             AND rt.status = 'available'
             AND rt.source = 'cancellation_owner_compensation'
           ORDER BY rt.created_at DESC`,
          [userId]
        ),
      ]);

      const history = [
        ...availableRes.rows.map(r => ({
          type: 'booking_success',
          property_name: r.property_name,
          guest_name: r.guest_name,
          amount: parseFloat(r.amount) || 0,
          date: r.date,
          message: 'Booking Completed',
        })),
        ...cancelledRes.rows.map(r => ({
          type: 'booking_cancelled',
          property_name: r.property_name,
          guest_name: r.guest_name,
          amount: parseFloat(r.amount) || 0,
          date: r.date,
          message: 'Booking Cancelled',
        })),
        ...noShowCompRes.rows.map(r => ({
          type: 'no_show_bonus',
          amount: parseFloat(r.amount) || 0,
          date: r.date,
          message: 'No-Show Compensation',
        })),
        ...withdrawalRes.rows.map(r => ({
          type: r.status === 'completed' ? 'withdrawal_paid' : 'withdrawal_rejected',
          amount: parseFloat(r.amount),
          date: r.date,
          message: r.status === 'completed' ? 'Withdrawal Paid' : 'Withdrawal Rejected',
          upi_id: r.upi_id,
          payout_id: r.payout_id || null,
        })),
        ...cancel50Res.rows.map(r => ({
          type: 'cancellation_payout',
          property_name: r.property_name,
          guest_name: r.guest_name,
          amount: parseFloat(r.amount) || 0,
          date: r.date,
          message: 'Booking Cancelled – 50% Payout',
        })),
        ...cancelFullRes.rows.map(r => ({
          type: 'cancellation_compensation',
          property_name: r.property_name,
          guest_name: r.guest_name,
          amount: parseFloat(r.amount) || 0,
          date: r.date,
          message: 'Booking Cancelled – Owner Compensation',
        })),
      ];

      history.sort((a, b) => new Date(b.date) - new Date(a.date));

      return res.json({ history });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = ReferralController;
