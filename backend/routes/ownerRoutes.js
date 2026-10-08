const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
const { strictOtpLimiter, otpVerifyLimiter } = require('../middleware/rateLimiter');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const ownerDashboard = require('../src/controllers/owner-dashboard');
const { upload, processAndUpload } = require('../utils/cloudinary');

router.post('/register', ownerController.registerOwner);
router.post('/send-otp', strictOtpLimiter, ownerController.sendOTP);
router.post('/verify-otp', otpVerifyLimiter, ownerController.verifyOTP);
router.get('/verify-session', ownerController.verifySession);
router.get('/my-property/:propertyId', authMiddleware, requireRole('owner', 'admin'), ownerController.getOwnerProperty);
router.get('/dashboard', authMiddleware, requireRole('owner'), ownerDashboard.dashboard);
router.put('/dashboard/profile', authMiddleware, requireRole('owner'), ownerDashboard.updateProfile);
router.post('/dashboard/upload-image', authMiddleware, requireRole('owner'), upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image was selected.' });
    const result = await processAndUpload(req.file, { folder: `bookstayx/owners/${req.user.id}` });
    return res.status(201).json({ success: true, url: result.secure_url, public_id: result.public_id, width: result.width, height: result.height });
  } catch (error) { return next(error); }
});
router.post('/dashboard/units', authMiddleware, requireRole('owner'), ownerDashboard.createUnit);
router.put('/dashboard/units/:unitId', authMiddleware, requireRole('owner'), ownerDashboard.updateUnit);
router.delete('/dashboard/units/:unitId', authMiddleware, requireRole('owner'), ownerDashboard.deleteUnit);
router.get('/dashboard/calendar', authMiddleware, requireRole('owner'), ownerDashboard.calendar);
router.put('/dashboard/units/:unitId/rates', authMiddleware, requireRole('owner'), ownerDashboard.updateRates);
router.put('/dashboard/units/:unitId/calendar/:date', authMiddleware, requireRole('owner'), ownerDashboard.updateDay);
router.get('/dashboard/ledger', authMiddleware, requireRole('owner'), ownerDashboard.ledger);
router.post('/dashboard/ledger', authMiddleware, requireRole('owner'), ownerDashboard.createLedger);
router.put('/dashboard/ledger/:entryId', authMiddleware, requireRole('owner'), ownerDashboard.updateLedger);
router.delete('/dashboard/ledger/:entryId', authMiddleware, requireRole('owner'), ownerDashboard.deleteLedger);

// Owner Expenses
router.get('/dashboard/expenses', authMiddleware, requireRole('owner'), ownerDashboard.getExpenses);
router.post('/dashboard/expenses', authMiddleware, requireRole('owner'), ownerDashboard.createExpense);
router.delete('/dashboard/expenses/:id', authMiddleware, requireRole('owner'), ownerDashboard.deleteExpense);

// Owner Staff & Housekeeping
router.get('/dashboard/staff', authMiddleware, requireRole('owner'), ownerDashboard.getStaff);
router.post('/dashboard/staff', authMiddleware, requireRole('owner'), ownerDashboard.saveStaff);
router.put('/dashboard/staff/:id', authMiddleware, requireRole('owner'), ownerDashboard.saveStaff);
router.delete('/dashboard/staff/:id', authMiddleware, requireRole('owner'), ownerDashboard.deleteStaff);
router.get('/dashboard/staff-attendance', authMiddleware, requireRole('owner'), ownerDashboard.getStaffAttendance);
router.post('/dashboard/staff-attendance', authMiddleware, requireRole('owner'), ownerDashboard.markStaffAttendance);
router.get('/dashboard/staff-payments', authMiddleware, requireRole('owner'), ownerDashboard.getStaffPayments);
router.post('/dashboard/staff-payments', authMiddleware, requireRole('owner'), ownerDashboard.saveStaffPayment);

// Owner Booking Requests / Offline Enquiries
router.get('/dashboard/requests', authMiddleware, requireRole('owner'), ownerDashboard.getBookingRequests);
router.post('/dashboard/requests', authMiddleware, requireRole('owner'), ownerDashboard.saveBookingRequest);
router.put('/dashboard/requests/:id/status', authMiddleware, requireRole('owner'), ownerDashboard.updateBookingRequestStatus);

// Owner Notifications
router.get('/dashboard/notifications', authMiddleware, requireRole('owner'), ownerDashboard.getNotifications);
router.put('/dashboard/notifications/:id/read', authMiddleware, requireRole('owner'), ownerDashboard.markNotificationRead);
router.put('/dashboard/notifications/read-all', authMiddleware, requireRole('owner'), ownerDashboard.markAllNotificationsRead);

// Owner Settings
router.get('/dashboard/settings', authMiddleware, requireRole('owner'), ownerDashboard.getSettings);
router.put('/dashboard/settings', authMiddleware, requireRole('owner'), ownerDashboard.updateSettings);

module.exports = router;
