const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const sessionAuthController = require('../controllers/sessionAuthController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { loginLimiter, totpLimiter, tokenRefreshLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/login', loginLimiter, authController.login);
router.post('/verify-totp', totpLimiter, authController.verifyTotp);
router.post('/refresh', tokenRefreshLimiter, authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/customer/send-otp', loginLimiter, sessionAuthController.sendCustomerOtp);
router.post('/customer/verify-otp', totpLimiter, sessionAuthController.verifyCustomerOtp);
router.post('/dev-login', sessionAuthController.devLogin);

// Protected routes
router.get('/verify', authMiddleware, authController.verifyAuth);
router.get('/session', authMiddleware, sessionAuthController.session);
router.get('/totp/status', authMiddleware, requireRole('admin'), authController.getTotpStatus);
router.get('/totp/setup', authMiddleware, requireRole('admin'), authController.setupTotp);
router.post('/totp/enable', authMiddleware, requireRole('admin'), authController.enableTotp);
router.post('/totp/disable', authMiddleware, requireRole('admin'), authController.disableTotp);

module.exports = router;
