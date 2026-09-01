const express = require('express');
const router = express.Router();
const villaController = require('../controllers/villa/villaController');
const authMiddleware = require('../middleware/auth');
const { validatePropertyId, validateUnitId, validateCalendarData, validateUnitData, validatePropertyUpdate } = require('../middleware/validation');
const { publicReadLimiter } = require('../middleware/rateLimiter');

router.get('/public/:slug', publicReadLimiter, villaController.getPublicVillaBySlug);

router.get('/:id', authMiddleware, validatePropertyId, villaController.getVillaById);
router.put('/update/:id', authMiddleware, validatePropertyId, validatePropertyUpdate, villaController.updateVilla);
router.put('/:id', authMiddleware, validatePropertyId, validatePropertyUpdate, villaController.updateVilla);

router.get('/:id/calendar', publicReadLimiter, validatePropertyId, villaController.getVillaCalendarData);
router.put('/:id/calendar', authMiddleware, validatePropertyId, validateCalendarData, villaController.updateVillaCalendarData);
router.post('/:id/calendar', authMiddleware, validatePropertyId, validateCalendarData, villaController.updateVillaCalendarData);

router.get('/:propertyId/units', publicReadLimiter, villaController.getVillaUnits);
router.post('/:propertyId/units', authMiddleware, validateUnitData, villaController.createVillaUnit);
router.put('/units/:unitId', authMiddleware, validateUnitId, villaController.updateVillaUnit);
router.delete('/units/:unitId', authMiddleware, validateUnitId, villaController.deleteVillaUnit);

router.get('/units/:unitId/calendar', authMiddleware, validateUnitId, villaController.getVillaUnitCalendarData);
router.post('/units/:unitId/calendar', authMiddleware, validateUnitId, validateCalendarData, villaController.updateVillaUnitCalendarData);

module.exports = router;
