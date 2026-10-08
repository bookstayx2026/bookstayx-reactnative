const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const publicCatalogueController = require('../src/controllers/public-catalogue');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const adminOnly = [authMiddleware, requireRole('admin')];

// Public routes
router.get('/public-list', publicCatalogueController.list);
router.get('/public/:slug/availability', publicCatalogueController.availability);
router.get('/public/:slug', publicCatalogueController.detail);

// Protected routes (require authentication)
router.get('/list', ...adminOnly, propertyController.getAllProperties);
router.get('/:id', ...adminOnly, propertyController.getPropertyById);
router.post('/create', ...adminOnly, propertyController.createProperty);
router.put('/update/:id', ...adminOnly, propertyController.updateProperty);
router.delete('/delete/:id', ...adminOnly, propertyController.deleteProperty);
router.patch('/toggle-status/:id', ...adminOnly, propertyController.togglePropertyStatus);

const { upload, processAndUpload, MAX_IMAGES_PER_ENTITY } = require('../utils/cloudinary');
const db = require('../db');

router.post('/upload-image', ...adminOnly, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large. Maximum 50 MB allowed for upload.' });
      }
      return res.status(400).json({ success: false, message: err.message || 'Upload error' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    console.log('Upload request received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`
    });

    const { property_id, unit_id } = req.body;
    if (property_id || unit_id) {
      let currentCount = 0;
      if (unit_id) {
        const unitResult = await db.query(
          `SELECT images FROM property_units WHERE id = $1`,
          [unit_id]
        );
        if (unitResult.rows.length > 0) {
          const images = unitResult.rows[0].images;
          const parsed = typeof images === 'string' ? JSON.parse(images || '[]') : (Array.isArray(images) ? images : []);
          currentCount = parsed.length;
        }
      } else if (property_id) {
        const imgResult = await db.query(
          `SELECT COUNT(*) as count FROM property_images WHERE property_id = $1`,
          [property_id]
        );
        currentCount = parseInt(imgResult.rows[0].count) || 0;
      }

      if (currentCount >= MAX_IMAGES_PER_ENTITY) {
        return res.status(400).json({
          success: false,
          message: `Maximum ${MAX_IMAGES_PER_ENTITY} images allowed. You already have ${currentCount}.`
        });
      }
    }

    const result = await processAndUpload(req.file);

    res.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'Upload failed' });
  }
});

// Category Settings (Admin)
router.get('/settings/categories', ...adminOnly, propertyController.getCategorySettings);
router.put('/settings/categories/:category', ...adminOnly, propertyController.updateCategorySettings);

// Unit Management Routes
router.get('/:propertyId/units', ...adminOnly, propertyController.getPropertyUnits);
router.post('/:propertyId/units', ...adminOnly, propertyController.createPropertyUnit);
router.put('/units/:unitId', ...adminOnly, propertyController.updatePropertyUnit);
router.delete('/units/:unitId', ...adminOnly, propertyController.deletePropertyUnit);
router.get('/units/:unitId/calendar', propertyController.getUnitCalendarData);
router.post('/units/:unitId/calendar', ...adminOnly, propertyController.updateUnitCalendarData);

// Calendar routes
router.get('/:id/calendar', propertyController.getCalendarData);
router.put('/:id/calendar', ...adminOnly, propertyController.updateCalendarData);

module.exports = router;
