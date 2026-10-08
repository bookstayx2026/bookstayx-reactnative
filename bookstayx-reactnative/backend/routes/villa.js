const express = require('express');
const router = express.Router();
const villaController = require('../controllers/villa/villaController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const adminOnly = [authMiddleware, requireRole('admin')];
const { validatePropertyId, validateUnitId, validateCalendarData, validateUnitData, validatePropertyUpdate } = require('../middleware/validation');
const { publicReadLimiter } = require('../middleware/rateLimiter');

router.get('/public/:slug', publicReadLimiter, villaController.getPublicVillaBySlug);

router.get('/:id', ...adminOnly, validatePropertyId, villaController.getVillaById);
router.put('/update/:id', ...adminOnly, validatePropertyId, validatePropertyUpdate, villaController.updateVilla);
router.put('/:id', ...adminOnly, validatePropertyId, validatePropertyUpdate, villaController.updateVilla);

router.get('/:id/calendar', publicReadLimiter, validatePropertyId, villaController.getVillaCalendarData);
router.put('/:id/calendar', ...adminOnly, validatePropertyId, validateCalendarData, villaController.updateVillaCalendarData);
router.post('/:id/calendar', ...adminOnly, validatePropertyId, validateCalendarData, villaController.updateVillaCalendarData);

router.get('/:propertyId/units', publicReadLimiter, villaController.getVillaUnits);
router.post('/:propertyId/units', ...adminOnly, validateUnitData, villaController.createVillaUnit);
router.put('/units/:unitId', ...adminOnly, validateUnitId, villaController.updateVillaUnit);
router.delete('/units/:unitId', ...adminOnly, validateUnitId, villaController.deleteVillaUnit);

router.get('/units/:unitId/calendar', ...adminOnly, validateUnitId, villaController.getVillaUnitCalendarData);
router.post('/units/:unitId/calendar', ...adminOnly, validateUnitId, validateCalendarData, villaController.updateVillaUnitCalendarData);

module.exports = router;
