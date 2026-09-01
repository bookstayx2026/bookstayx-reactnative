const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
const { strictOtpLimiter, otpVerifyLimiter } = require('../middleware/rateLimiter');

router.post('/register', ownerController.registerOwner);
router.post('/send-otp', strictOtpLimiter, ownerController.sendOTP);
router.post('/verify-otp', otpVerifyLimiter, ownerController.verifyOTP);
router.get('/verify-session', ownerController.verifySession);
router.get('/my-property/:propertyId', ownerController.getOwnerProperty);

module.exports = router;
