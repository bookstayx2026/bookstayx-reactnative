const { pool } = require('../src/config/database');

const catalogue = [
  { slug: 'pawna-lakeview-villa', propertyId: 'BSX-V001', title: 'Pawna Lakeview Villa', category: 'villa', location: 'Pawna Lake, Lonavala', rating: 4.8, price: 6999, capacity: 8, top: true, description: 'A private lake-view villa with a pool, spacious bedrooms and peaceful Pawna surroundings.', amenities: ['Wi-Fi', 'Private Pool', 'Kitchen', 'Parking', 'Power Backup'], activities: ['Kayaking', 'Bonfire', 'Nature Walks'], highlights: ['4 Bedrooms', 'Lake View', 'Private Pool'], image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=85' },
  { slug: 'pawna-lakeside-domes', propertyId: 'BSX-C001', title: 'Lakeside Domes', category: 'campings_cottages', location: 'Pawna Lake, Lonavala', rating: 4.9, price: 4999, capacity: 4, description: 'Premium lakeside domes with bonfire evenings, scenic views and private washrooms.', amenities: ['Private Washroom', 'Bonfire', 'Food Included', 'Lake Access'], activities: ['Stargazing', 'Kayaking', 'Bonfire'], highlights: ['2 Domes', 'Lake View', 'Bonfire'], image: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1400&q=85' },
  { slug: 'valley-view-cottage', propertyId: 'BSX-C002', title: 'Valley View Cottage', category: 'campings_cottages', location: 'Lonavala Hills', rating: 4.7, price: 5499, capacity: 4, description: 'A quiet hillside cottage overlooking the Lonavala valley.', amenities: ['Wi-Fi', 'AC', 'Kitchen', 'Parking'], activities: ['Hiking', 'Photography'], highlights: ['2 Bedrooms', 'Mountain View'], image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=85' },
  { slug: 'private-pool-villa', propertyId: 'BSX-V002', title: 'Private Pool Villa', category: 'villa', location: 'Lonavala', rating: 4.9, price: 12999, capacity: 10, top: true, description: 'A spacious five-bedroom Lonavala villa with a private pool and BBQ deck.', amenities: ['Wi-Fi', 'Private Pool', 'BBQ', 'Kitchen', 'Parking'], activities: ['Swimming', 'BBQ', 'Indoor Games'], highlights: ['5 Bedrooms', 'Private Pool', 'BBQ'], image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=85' },
  { slug: 'seaside-serenity-villa', propertyId: 'BSX-V003', title: 'Seaside Serenity Villa', category: 'villa', location: 'Alibagh Coast', rating: 4.8, price: 15000, capacity: 8, top: true, description: 'An exclusive beachfront Alibagh villa with direct beach access and an infinity pool.', amenities: ['Wi-Fi', 'Infinity Pool', 'Beach Access', 'Kitchen'], activities: ['Beach Walks', 'Cycling', 'Swimming'], highlights: ['4 Guests', '2 Bedrooms', 'Pool'], image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1400&q=85' },
  { slug: 'kashid-beach-cottage', propertyId: 'BSX-C003', title: 'Kashid Beach Cottage', category: 'campings_cottages', location: 'Kashid Beach', rating: 4.6, price: 8500, capacity: 6, description: 'A relaxed cottage close to Kashid Beach with airy rooms and sea views.', amenities: ['AC', 'Sea View', 'Parking', 'Breakfast'], activities: ['Beach Walks', 'Water Sports'], highlights: ['2-6 Guests', 'Sea View'], image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85' },
  { slug: 'diveagar-palm-retreat', propertyId: 'BSX-H001', title: 'Diveagar Palm Retreat', category: 'hotel', location: 'Diveagar Beach', rating: 4.7, price: 11000, capacity: 6, top: true, description: 'A palm-lined boutique stay with beach access and spacious family rooms.', amenities: ['Wi-Fi', 'AC', 'Breakfast', 'Beach Access'], activities: ['Beach Walks', 'Cycling'], highlights: ['6 Guests', '3 Bedrooms', 'Beach Access'], image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1400&q=85' },
  { slug: 'pawna-riverside-camp', propertyId: 'BSX-T001', title: 'Riverside Camp Stays', category: 'camping', location: 'Pawna Lake, Lonavala', rating: 4.5, price: 3499, capacity: 12, description: 'Comfortable riverside tents with meals, music and a shared bonfire.', amenities: ['Food Included', 'Bonfire', 'Lake View', 'Parking'], activities: ['Bonfire', 'Music', 'Outdoor Games'], highlights: ['Shared Camp', 'Bonfire', 'Lake View'], image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1400&q=85' },
  { slug: 'lonavala-cliffside-suite', propertyId: 'BSX-H002', title: 'Cliffside Suite Hotel', category: 'hotel', location: 'Lonavala Hills', rating: 4.6, price: 9499, capacity: 2, description: 'A boutique cliffside suite with mountain views and breakfast included.', amenities: ['Wi-Fi', 'AC', 'Breakfast', 'Mountain View'], activities: ['Hiking', 'Sightseeing'], highlights: ['King Bed', 'Mountain View', 'Breakfast'], image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=85' },
  { slug: 'murud-fort-villa', propertyId: 'BSX-V004', title: 'Fort View Heritage Villa', category: 'villa', location: 'Murud, Raigad', rating: 4.8, price: 14500, capacity: 8, top: true, description: 'A heritage-inspired villa overlooking Murud with sea views and a private pool.', amenities: ['Wi-Fi', 'Private Pool', 'Sea View', 'Kitchen'], activities: ['Fort Tour', 'Beach Walks', 'Swimming'], highlights: ['3 Bedrooms', 'Sea View', 'Pool'], image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85' },
];

async function seedCatalogue() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of catalogue) {
      const propertyResult = await client.query(
        `INSERT INTO properties (
           title, slug, property_id, description, category, location, rating,
           price, weekday_price, weekend_price, price_note, capacity, max_capacity,
           check_in_time, check_out_time, is_top_selling, is_active, is_available,
           amenities, activities, highlights, policies, schedule
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7,
           $8, $8, $9, 'per night', $10, $10,
           '2:00 PM', '11:00 AM', $11, true, true,
           $12, $13, $14, $15, $16
         )
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           property_id = EXCLUDED.property_id,
           description = EXCLUDED.description,
           category = EXCLUDED.category,
           location = EXCLUDED.location,
           rating = EXCLUDED.rating,
           price = EXCLUDED.price,
           weekday_price = EXCLUDED.weekday_price,
           weekend_price = EXCLUDED.weekend_price,
           capacity = EXCLUDED.capacity,
           max_capacity = EXCLUDED.max_capacity,
           is_top_selling = EXCLUDED.is_top_selling,
           is_active = true,
           is_available = true,
           amenities = EXCLUDED.amenities,
           activities = EXCLUDED.activities,
           highlights = EXCLUDED.highlights,
           policies = EXCLUDED.policies,
           schedule = EXCLUDED.schedule,
           updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [
          item.title, item.slug, item.propertyId, item.description, item.category,
          item.location, item.rating, String(item.price), String(Math.round(item.price * 1.15)),
          item.capacity, Boolean(item.top), JSON.stringify(item.amenities),
          JSON.stringify(item.activities), JSON.stringify(item.highlights),
          JSON.stringify(['Valid government ID required', 'Quiet hours after 10 PM']),
          JSON.stringify(['Check-in 2:00 PM', 'Check-out 11:00 AM']),
        ]
      );
      const propertyId = propertyResult.rows[0].id;

      await client.query('DELETE FROM property_images WHERE property_id = $1', [propertyId]);
      await client.query(
        `INSERT INTO property_images (property_id, image_url, display_order)
         VALUES ($1, $2, 0)`,
        [propertyId, item.image]
      );

      const unitName = item.category === 'villa' ? `${item.title} Unit` : item.category === 'hotel' ? 'Deluxe Room' : 'Standard Stay';
      const existingUnit = await client.query(
        'SELECT id FROM property_units WHERE property_id = $1 ORDER BY id LIMIT 1',
        [propertyId]
      );
      const unitResult = existingUnit.rows.length
        ? await client.query(
            `UPDATE property_units SET
               name = $2, available_persons = $3, total_persons = $3,
               weekday_price = $4, weekend_price = $5, description = $6,
               amenities = $7, images = $8, location = $9, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 RETURNING id`,
            [existingUnit.rows[0].id, unitName, item.capacity, String(item.price), String(Math.round(item.price * 1.15)), item.description, JSON.stringify(item.amenities), JSON.stringify([item.image]), item.location]
          )
        : await client.query(
            `INSERT INTO property_units (
               property_id, name, available_persons, total_persons, weekday_price,
               weekend_price, description, amenities, images, location
             ) VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id`,
            [propertyId, unitName, item.capacity, String(item.price), String(Math.round(item.price * 1.15)), item.description, JSON.stringify(item.amenities), JSON.stringify([item.image]), item.location]
          );
      const unitId = unitResult.rows[0].id;

      await client.query(
        `INSERT INTO unit_calendar (unit_id, date, price, available_quantity, is_weekend, is_special)
         SELECT $1, day::date,
                CASE WHEN EXTRACT(DOW FROM day) IN (0, 6) THEN $3 ELSE $2 END,
                $4,
                EXTRACT(DOW FROM day) IN (0, 6),
                false
         FROM generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '89 days', INTERVAL '1 day') day
         ON CONFLICT (unit_id, date) DO UPDATE SET
           price = EXCLUDED.price,
           available_quantity = EXCLUDED.available_quantity,
           is_weekend = EXCLUDED.is_weekend`,
        [unitId, String(item.price), String(Math.round(item.price * 1.15)), item.capacity]
      );
    }

    await client.query('COMMIT');
    console.log(`Seeded ${catalogue.length} BookStayX catalogue properties.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedCatalogue().catch((error) => {
  console.error('Catalogue seed failed:', error.message);
  process.exit(1);
});
