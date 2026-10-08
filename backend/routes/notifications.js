const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// All notification routes require authenticated user
router.use(authMiddleware, requireRole('customer', 'owner', 'admin'));

router.get('/', notificationController.getCustomerNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.post('/read-all', notificationController.markAllAsRead);
router.post('/device-token', notificationController.registerDeviceToken);

module.exports = router;
