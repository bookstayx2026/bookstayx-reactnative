const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { publicReadLimiter } = require('../middleware/rateLimiter');

// Public routes
router.get('/', publicReadLimiter, locationController.getLocations);
router.get('/popular', publicReadLimiter, locationController.getPopularLocations);
router.get('/:slug', publicReadLimiter, locationController.getLocationBySlug);

// Admin-protected routes
router.post('/', authMiddleware, requireRole('admin'), locationController.createLocation);
router.put('/:id', authMiddleware, requireRole('admin'), locationController.updateLocation);
router.delete('/:id', authMiddleware, requireRole('admin'), locationController.deleteLocation);

module.exports = router;
