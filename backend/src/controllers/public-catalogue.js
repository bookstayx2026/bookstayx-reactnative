const { getDailyAvailability } = require('../../services/inventoryAvailabilityService');
const { query } = require('../config/database');

const propertySelection = `
  SELECT p.*,
    COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', pi.id,
          'image_url', pi.image_url,
          'display_order', pi.display_order
        ) ORDER BY pi.display_order
      )
      FROM property_images pi
      WHERE pi.property_id = p.id
    ), '[]'::json) AS images,
    COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', pu.id,
          'name', pu.name,
          'available_persons', pu.available_persons,
          'total_persons', pu.total_persons,
          'weekday_price', pu.weekday_price,
          'weekend_price', pu.weekend_price,
          'special_price', pu.special_price,
          'images', pu.images,
          'description', pu.description,
          'location', pu.location,
          'has_food', pu.has_food,
          'meal_plan', pu.meal_plan,
          'veg_price', pu.veg_price,
          'non_veg_price', pu.non_veg_price,
          'kitchen_facility', pu.kitchen_facility,
          'bedrooms', pu.bedrooms,
          'bathrooms', pu.bathrooms,
          'bed_config', pu.bed_config,
          'extra_guest_price', pu.extra_guest_price,
          'security_deposit', pu.security_deposit,
          'total_inventory', pu.total_inventory,
          'accommodation_type', pu.accommodation_type
        ) ORDER BY pu.id
      )
      FROM property_units pu
      WHERE pu.property_id = p.id
    ), '[]'::json) AS units,
    COALESCE((
      SELECT MIN(NULLIF(regexp_replace(pu.weekday_price, '[^0-9.]', '', 'g'), '')::numeric)
      FROM property_units pu
      WHERE pu.property_id = p.id
    ), NULLIF(regexp_replace(p.price, '[^0-9.]', '', 'g'), '')::numeric) AS starting_price
  FROM properties p`;

const parseList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const formatProperty = (property) => ({
  ...property,
  amenities: parseList(property.amenities),
  activities: parseList(property.activities),
  highlights: parseList(property.highlights),
  policies: parseList(property.policies),
  schedule: parseList(property.schedule),
  availability: parseList(property.availability),
  images: property.images || [],
  units: property.units || [],
  price: property.starting_price || property.price,
});

async function list(req, res, next) {
  try {
    const conditions = ['p.is_active = true'];
    const values = [];
    const add = (value) => {
      values.push(value);
      return `$${values.length}`;
    };

    if (req.query.location) {
      const locVal = String(req.query.location).toLowerCase().trim();
      const placeholder = add(`%${locVal.replace(/-/g, ' ')}%`);
      const slugPlaceholder = add(locVal);
      conditions.push(`(p.location_slug = ${slugPlaceholder} OR LOWER(p.location) LIKE ${placeholder})`);
    }
    if (req.query.location_slug) {
      conditions.push(`p.location_slug = ${add(String(req.query.location_slug).toLowerCase().trim())}`);
    }
    if (req.query.category) {
      conditions.push(`p.category = ${add(String(req.query.category))}`);
    }
    if (req.query.q) {
      const placeholder = add(`%${String(req.query.q).toLowerCase()}%`);
      conditions.push(`(LOWER(p.title) LIKE ${placeholder} OR LOWER(p.location) LIKE ${placeholder})`);
    }

    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 100;

    const [propertiesResult, settingsResult] = await Promise.all([
      query(
        `${propertySelection}
         WHERE ${conditions.join(' AND ')}
         ORDER BY p.is_available DESC, p.is_top_selling DESC, p.rating DESC, p.created_at DESC
         LIMIT ${limit}`,
        values
      ),
      query('SELECT * FROM category_settings ORDER BY category'),
    ]);

    const categorySettings = Object.fromEntries(
      settingsResult.rows.map((setting) => [
        setting.category,
        {
          is_closed: setting.is_closed,
          reason: setting.closed_reason,
          from: setting.closed_from,
          to: setting.closed_to,
        },
      ])
    );

    res.json({
      success: true,
      data: propertiesResult.rows.map(formatProperty),
      categorySettings,
    });
  } catch (error) {
    next(error);
  }
}

async function detail(req, res, next) {
  try {
    const result = await query(
      `${propertySelection} WHERE (p.slug = $1 OR p.id::text = $1) AND p.is_active = true`,
      [req.params.slug]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found' },
      });
    }

    return res.json({ success: true, data: formatProperty(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
}

const isoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

async function availability(req, res, next) {
  try {
    const propertyResult = await query(
      `SELECT id, slug, category, weekday_price, weekend_price, price, max_capacity
       FROM properties
       WHERE (slug = $1 OR id::text = $1) AND is_active = true`,
      [req.params.slug]
    );

    if (!propertyResult.rows.length) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found' },
      });
    }

    const property = propertyResult.rows[0];
    const unitsResult = await query(
      `SELECT id, name, total_persons, available_persons, weekday_price, weekend_price, special_price,
              total_inventory, accommodation_type
       FROM property_units
       WHERE property_id = $1
       ORDER BY id`,
      [property.id]
    );

    const requestedUnitId = Number(req.query.unitId);
    const unit = unitsResult.rows.find((item) => item.id === requestedUnitId) || unitsResult.rows[0] || null;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 90);
    const startDate = isoDate(start);
    const endDate = isoDate(end);

    const isVilla = property.category === 'villa';
    const totalInventory = isVilla ? 1 : Number(unit?.total_inventory || 1);

    const days = await getDailyAvailability(
      { query },
      {
        propertyId: property.id,
        propertyIdentifier: property.slug,
        unitId: unit?.id || null,
        startDate,
        endDate,
        isVilla,
        totalInventory,
        weekdayPrice: unit?.weekday_price || property.weekday_price,
        weekendPrice: unit?.weekend_price || property.weekend_price,
        basePrice: property.price,
      }
    );

    return res.json({
      success: true,
      data: days,
      meta: {
        property: { id: property.id, slug: property.slug, category: property.category },
        selectedUnit: unit,
        units: unitsResult.rows,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, detail, availability };
