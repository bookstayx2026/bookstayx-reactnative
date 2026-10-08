const UserRepository = require('../repositories/userRepository');
const { generateToken } = require('../utils/jwt');
const { RefreshTokenRepository } = require('../repositories/refreshTokenRepository');
const crypto = require('crypto');

const UserService = {
  async register(username, mobileNumber, referralCode) {
    const existingUser = await UserRepository.findByUsername(username);
    if (existingUser) throw new Error('Username already taken');

    const existingMobile = await UserRepository.findByMobile(mobileNumber);
    if (existingMobile) throw new Error('Mobile number already registered');

    const existingCode = await UserRepository.findByReferralCode(referralCode);
    if (existingCode) throw new Error('Referral code already taken');

    return await UserRepository.create(username, mobileNumber, referralCode.toUpperCase());
  },

  async login(mobileNumber) {
    const user = await UserRepository.findByMobile(mobileNumber);
    if (!user) throw new Error('User not found');
    if (user.status === 'blocked') throw new Error('Account is blocked');

    await require('../db').query(
      'UPDATE referral_users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Short-lived access token (15 min by default, see backend/utils/jwt.js)
    const token = generateToken({ id: user.id, userId: user.id, username: user.username, role: 'referral' });

    // Long-lived refresh token (2 days by default, see backend/repositories/refreshTokenRepository.js)
    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    await RefreshTokenRepository.create(rawRefreshToken, user.id, 'referral');

    return { token, refreshToken: rawRefreshToken, user };
  },

  async getDashboard(userId) {
    const userResult = await require('../db').query(
      'SELECT username, referral_code, status, referral_type, linked_property_id, linked_property_slug, saved_upi_id FROM referral_users WHERE id = $1',
      [userId]
    );
    const userDetails = userResult.rows[0];

    if (!userDetails || userDetails.status === 'blocked') {
      throw new Error('Unauthorized or account blocked');
    }

    const WithdrawalRepository = require('../repositories/withdrawalRepository');
    const stats = await WithdrawalRepository.getDashboardStats(userId);

    const earnings = parseFloat(stats.total_earnings);
    const withdrawals = parseFloat(stats.total_withdrawals);
    const pending = parseFloat(stats.pending_withdrawals);

    const referralType = userDetails.referral_type || 'public';
    let commissionLabel = '15% of advance';
    if (referralType === 'owner') commissionLabel = '25% of advance';
    else if (referralType === 'b2b' || referralType === 'owners_b2b') commissionLabel = '22% of advance';

    return {
      username: userDetails.username,
      referral_code: userDetails.referral_code,
      referral_type: referralType,
      linked_property_id: userDetails.linked_property_id || null,
      linked_property_slug: userDetails.linked_property_slug || null,
      commission_label: commissionLabel,
      total_earnings: earnings,
      total_withdrawals: withdrawals,
      available_balance: Math.max(0, earnings - withdrawals - pending),
      pending_withdrawal_amount: pending,
      total_referrals: parseInt(stats.total_referrals),
      saved_upi_id: userDetails.saved_upi_id || null
    };
  }
};

module.exports = UserService;
