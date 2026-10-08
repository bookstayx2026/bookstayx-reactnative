const express = require('express');
const router = express.Router();
const OtpController = require('../controllers/otpController');
const ReferralController = require('../controllers/referralController');
const UserController = require('../controllers/userController');
const WithdrawalController = require('../controllers/withdrawalController');
const AdminController = require('../controllers/adminController');
const authenticateReferralUser = require('../middleware/referralAuth');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const adminOnly = [authMiddleware, requireRole('admin')];
const { strictOtpLimiter, otpVerifyLimiter, withdrawalLimiter } = require('../middleware/rateLimiter');

// Public endpoints
router.get('/top-earners', ReferralController.getTopEarners);
router.get('/validate/:code', ReferralController.validateCode);

// OTP endpoints
router.post('/request-otp', strictOtpLimiter, OtpController.requestOtp);
router.post('/verify-otp', otpVerifyLimiter, OtpController.verifyOtp);

// User endpoints (OTP Protected)
router.post('/register', authenticateReferralUser, UserController.register);
router.post('/login', authenticateReferralUser, UserController.login);

// Authenticated User endpoints
router.get('/dashboard', authenticateReferralUser, UserController.getDashboard);
router.get('/share', authenticateReferralUser, ReferralController.getShareInfo);
router.get('/in-process', authenticateReferralUser, ReferralController.getInProcess);
router.get('/history', authenticateReferralUser, ReferralController.getReferralHistory);
router.get('/pending-withdrawals', authenticateReferralUser, WithdrawalController.getPendingWithdrawals);
router.post('/withdraw', withdrawalLimiter, authenticateReferralUser, WithdrawalController.withdraw);
router.post('/validate-upi', authenticateReferralUser, WithdrawalController.validateUpi);
router.delete('/saved-upi', authenticateReferralUser, WithdrawalController.removeSavedUpi);

// Multi-UPI management
router.get('/upi-ids', authenticateReferralUser, WithdrawalController.listUpiIds);
router.post('/upi-ids', authenticateReferralUser, WithdrawalController.addUpiId);
router.put('/upi-ids/:id', authenticateReferralUser, WithdrawalController.editUpiId);
router.put('/upi-ids/:id/set-default', authenticateReferralUser, WithdrawalController.setDefaultUpiId);
router.delete('/upi-ids/:id', authenticateReferralUser, WithdrawalController.deleteUpiId);

// Legacy owner-referral helpers are retained for admin tooling only. Exposing
// these publicly allowed account enumeration and a property id could be used to
// mint a referral token without completing OTP verification.
router.get('/owner-lookup/:mobile', ...adminOnly, ReferralController.ownerLookup);
router.get('/owner-lookup-property/:propertyId', ...adminOnly, ReferralController.ownerLookupByProperty);
router.post('/owner-login', ...adminOnly, UserController.ownerSelfLogin);

// Owner scope is derived from the signed owner session, never request input.
const ownerOnly = [authMiddleware, requireRole('owner')];
router.get('/owner/b2b-list', ...ownerOnly, ReferralController.getOwnerB2BList);
router.post('/owner/b2b-create', ...ownerOnly, ReferralController.createOwnerB2B);
router.post('/owner/b2b-hide', ...ownerOnly, ReferralController.hideOwnerB2B);
router.post('/owner/b2b-delete', ...ownerOnly, ReferralController.deleteOwnerB2B);

// Admin endpoints (Session Protected)
router.get('/admin/all', ...adminOnly, AdminController.getAllReferrals);
router.post('/admin/update-status', ...adminOnly, AdminController.updateReferralStatus);
router.post('/admin/create', ...adminOnly, AdminController.createReferral);
router.post('/admin/delete', ...adminOnly, AdminController.deleteReferral);
router.post('/admin/login-as', ...adminOnly, AdminController.loginAsReferralUser);
router.get('/admin/owner-lookup/:propertyId', ...adminOnly, AdminController.lookupOwnerByPropertyId);
router.post('/admin/update-otp', ...adminOnly, AdminController.updateOwnerOtpNumber);
router.post('/admin/verify-owner-code', ...adminOnly, AdminController.verifyOwnerCode);
router.get('/admin/contacts', ...adminOnly, AdminController.getAllContacts);
router.post('/admin/hard-delete-contact', ...adminOnly, AdminController.hardDeleteContact);
router.get('/admin/guests', ...adminOnly, AdminController.getGuests);
router.post('/admin/hide-guest', ...adminOnly, AdminController.hideGuest);

module.exports = router;
