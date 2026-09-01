const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { bookingLimiter } = require('../middleware/rateLimiter');

router.post('/initiate', bookingLimiter, bookingController.initiateBooking);
router.get('/owner-action', bookingController.handleOwnerAction);

// Webhooks — NEVER rate-limited (Meta / Paytm must always get through)
router.get('/webhook/whatsapp', bookingController.handleWhatsAppWebhook);
router.post('/webhook/whatsapp', bookingController.handleWhatsAppWebhook);

router.get('/ledger', bookingController.getLedgerEntries);
router.get('/ledger/monthly', bookingController.getMonthlyLedger);
router.post('/ledger', bookingController.addLedgerEntry);
router.put('/ledger/:id', bookingController.updateLedgerEntry);
router.delete('/ledger/:id', bookingController.deleteLedgerEntry);
router.get('/owner/ledger', bookingController.getOwnerLedger);
router.get('/owner/units', bookingController.getOwnerUnits);
router.get('/:bookingId', bookingController.getBooking);
router.put('/update-status', bookingController.updateBookingStatus);
router.post('/process-confirmed', bookingController.processConfirmedBooking);
router.post('/process-cancelled', bookingController.processCancelledBooking);
router.post('/no-show', bookingController.handleNoShow);
router.get('/cancel-preview/:booking_id', bookingController.getCancelPreview);
router.post('/admin-cancel', bookingController.handleAdminCancel);
router.post('/delete-booking', bookingController.handleDeleteBooking);

module.exports = router;
