const express = require('express');
const router = express.Router();
const campingController = require('../controllers/camping/camping_CottagesController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const adminOnly = [authMiddleware, requireRole('admin')];
const { validatePropertyId, validateUnitId, validateCalendarData, validateUnitData, validatePropertyUpdate } = require('../middleware/validation');
const { publicReadLimiter } = require('../middleware/rateLimiter');

router.get('/public/:slug', publicReadLimiter, campingController.getPublicCampingBySlug);

router.get('/:id', ...adminOnly, validatePropertyId, campingController.getCampingById);
router.put('/update/:id', ...adminOnly, validatePropertyId, validatePropertyUpdate, campingController.updateCamping);
router.put('/:id', ...adminOnly, validatePropertyId, validatePropertyUpdate, campingController.updateCamping);

router.get('/:propertyId/units', publicReadLimiter, campingController.getPropertyUnits);
router.post('/:propertyId/units', ...adminOnly, validateUnitData, campingController.createPropertyUnit);
router.put('/units/:unitId', ...adminOnly, validateUnitId, campingController.updatePropertyUnit);
router.delete('/units/:unitId', ...adminOnly, validateUnitId, campingController.deletePropertyUnit);

router.get('/units/:unitId/calendar', publicReadLimiter, validateUnitId, campingController.getUnitCalendarData);
router.post('/units/:unitId/calendar', ...adminOnly, validateUnitId, validateCalendarData, campingController.updateUnitCalendarData);

module.exports = router;
