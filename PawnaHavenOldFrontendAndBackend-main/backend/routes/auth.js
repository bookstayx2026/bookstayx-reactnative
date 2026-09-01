const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { loginLimiter, totpLimiter, tokenRefreshLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/login', loginLimiter, authController.login);
router.post('/verify-totp', totpLimiter, authController.verifyTotp);
router.post('/refresh', tokenRefreshLimiter, authController.refreshToken);
router.post('/logout', authController.logout);

// Protected routes
router.get('/verify', authMiddleware, authController.verifyAuth);
router.get('/totp/status', authMiddleware, authController.getTotpStatus);
router.get('/totp/setup', authMiddleware, authController.setupTotp);
router.post('/totp/enable', authMiddleware, authController.enableTotp);
router.post('/totp/disable', authMiddleware, authController.disableTotp);

module.exports = router;
