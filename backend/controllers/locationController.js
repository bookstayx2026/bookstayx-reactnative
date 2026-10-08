const { query } = require('../db');

/**
 * GET /api/locations
 * Query params: ?popular=true | ?region=... | ?district=...
 */
async function getLocations(req, res, next) {
  try {
    const { popular, region, district } = req.query;
    const conditions = ['l.is_active = true'];
    const params = [];

    if (popular === 'true') {
      conditions.push('l.is_popular = true');
    }
    if (region) {
      params.push(region);
      conditions.push(`l.region = $${params.length}`);
    }
    if (district) {
      params.push(district);
      conditions.push(`l.district = $${params.length}`);
    }

    const sql = `
      SELECT l.*,
             COUNT(p.id)::int AS property_count
        FROM locations l
        LEFT JOIN properties p
          ON (p.location_id = l.id OR p.location_slug = l.slug OR LOWER(p.location) LIKE '%' || LOWER(l.name) || '%')
         AND p.is_active = true
       WHERE ${conditions.join(' AND ')}
       GROUP BY l.id
       ORDER BY l.display_order ASC, l.name ASC
    `;

    const result = await query(sql, params);
    return res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/locations/popular
 */
async function getPopularLocations(req, res, next) {
  try {
    const sql = `
      SELECT l.*,
             COUNT(p.id)::int AS property_count
        FROM locations l
        LEFT JOIN properties p
          ON (p.location_id = l.id OR p.location_slug = l.slug OR LOWER(p.location) LIKE '%' || LOWER(l.name) || '%')
         AND p.is_active = true
       WHERE l.is_active = true AND l.is_popular = true
       GROUP BY l.id
       ORDER BY l.display_order ASC
       LIMIT 10
    `;
    const result = await query(sql);
    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/locations/:slug
 */
async function getLocationBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const locationRes = await query(
      `SELECT * FROM locations WHERE slug = $1 AND is_active = true`,
      [slug]
    );

    if (!locationRes.rows.length) {
      return res.status(404).json({
        success: false,
        message: `Location '${slug}' not found.`,
      });
    }

    const location = locationRes.rows[0];

    const propertiesRes = await query(
      `SELECT p.*,
              COALESCE((
                SELECT json_agg(json_build_object('image_url', pi.image_url, 'display_order', pi.display_order))
                  FROM property_images pi
                 WHERE pi.property_id = p.id
              ), '[]'::json) AS images,
              COALESCE((
                SELECT json_agg(row_to_json(pu))
                  FROM property_units pu
                 WHERE pu.property_id = p.id
              ), '[]'::json) AS units
         FROM properties p
        WHERE (p.location_id = $1 OR p.location_slug = $2 OR LOWER(p.location) LIKE '%' || LOWER($3) || '%')
          AND p.is_active = true
        ORDER BY p.is_top_selling DESC, p.rating DESC, p.created_at DESC`,
      [location.id, location.slug, location.name]
    );

    return res.json({
      success: true,
      location,
      properties: propertiesRes.rows,
      property_count: propertiesRes.rows.length,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/locations (Admin)
 */
async function createLocation(req, res, next) {
  try {
    const {
      name,
      slug,
      district,
      region,
      category,
      image_url,
      tagline,
      rating,
      reviews_count,
      is_popular,
      display_order,
    } = req.body;

    if (!name || !slug || !district || !region) {
      return res.status(400).json({
        success: false,
        message: 'name, slug, district, and region are required.',
      });
    }

    const normalizedSlug = String(slug).toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');

    const result = await query(
      `INSERT INTO locations
         (name, slug, district, region, category, image_url, tagline, rating, reviews_count, is_popular, display_order)
       VALUES ($1, $2, $3, $4, COALESCE($5, 'Beach Destination'), $6, $7, COALESCE($8, 4.6), COALESCE($9, '1.2K Reviews'), COALESCE($10, false), COALESCE($11, 0))
       RETURNING *`,
      [
        name,
        normalizedSlug,
        district,
        region,
        category,
        image_url,
        tagline,
        rating,
        reviews_count,
        is_popular,
        display_order,
      ]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PUT /api/locations/:id (Admin)
 */
async function updateLocation(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      district,
      region,
      category,
      image_url,
      tagline,
      rating,
      reviews_count,
      is_popular,
      display_order,
      is_active,
    } = req.body;

    const result = await query(
      `UPDATE locations
          SET name = COALESCE($1, name),
              slug = COALESCE($2, slug),
              district = COALESCE($3, district),
              region = COALESCE($4, region),
              category = COALESCE($5, category),
              image_url = COALESCE($6, image_url),
              tagline = COALESCE($7, tagline),
              rating = COALESCE($8, rating),
              reviews_count = COALESCE($9, reviews_count),
              is_popular = COALESCE($10, is_popular),
              display_order = COALESCE($11, display_order),
              is_active = COALESCE($12, is_active),
              updated_at = NOW()
        WHERE id = $13
        RETURNING *`,
      [
        name,
        slug,
        district,
        region,
        category,
        image_url,
        tagline,
        rating,
        reviews_count,
        is_popular,
        display_order,
        is_active,
        id,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Location not found.' });
    }

    return res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/locations/:id (Admin)
 */
async function deleteLocation(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE locations SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Location not found.' });
    }

    return res.json({
      success: true,
      message: 'Location deactivated successfully.',
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getLocations,
  getPopularLocations,
  getLocationBySlug,
  createLocation,
  updateLocation,
  deleteLocation,
};
