const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { bookingLimiter } = require('../middleware/rateLimiter');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const adminOnly = [authMiddleware, requireRole('admin')];

router.post('/quote', bookingLimiter, bookingController.quoteBooking);
router.post('/initiate', bookingLimiter, authMiddleware, requireRole('customer', 'owner', 'admin'), bookingController.initiateBooking);
router.get('/owner-action', bookingController.handleOwnerAction);

// Webhooks — NEVER rate-limited (Meta / Paytm must always get through)
router.get('/webhook/whatsapp', bookingController.handleWhatsAppWebhook);
router.post('/webhook/whatsapp', bookingController.handleWhatsAppWebhook);

router.get('/ledger', ...adminOnly, bookingController.getLedgerEntries);
router.get('/ledger/monthly', ...adminOnly, bookingController.getMonthlyLedger);
router.post('/ledger', ...adminOnly, bookingController.addLedgerEntry);
router.put('/ledger/:id', ...adminOnly, bookingController.updateLedgerEntry);
router.delete('/ledger/:id', ...adminOnly, bookingController.deleteLedgerEntry);
router.get('/owner/ledger', ...adminOnly, bookingController.getOwnerLedger);
router.get('/owner/units', ...adminOnly, bookingController.getOwnerUnits);
router.get('/mine', authMiddleware, requireRole('customer', 'owner', 'admin'), bookingController.getCustomerBookings);
router.get('/:bookingId', authMiddleware, requireRole('customer', 'owner', 'admin'), bookingController.getBooking);
router.put('/update-status', ...adminOnly, bookingController.updateBookingStatus);
router.post('/process-confirmed', ...adminOnly, bookingController.processConfirmedBooking);
router.post('/process-cancelled', ...adminOnly, bookingController.processCancelledBooking);
router.post('/no-show', ...adminOnly, bookingController.handleNoShow);
router.get('/cancel-preview/:booking_id', ...adminOnly, bookingController.getCancelPreview);
router.post('/admin-cancel', ...adminOnly, bookingController.handleAdminCancel);
router.post('/delete-booking', ...adminOnly, bookingController.handleDeleteBooking);

module.exports = router;
