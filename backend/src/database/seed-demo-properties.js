const { pool } = require('../config/database');

async function seedDemoProperties() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Update check constraint on properties table
    await client.query('ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_category_check');
    await client.query(`ALTER TABLE properties ADD CONSTRAINT properties_category_check
      CHECK (category IN ('villa', 'camping_cottages', 'campings_cottages', 'camping', 'resort', 'hotel', 'homestay'))`);

    const demoData = [
      {
        category: 'camping_cottages',
        property: {
          property_id: 'BSX-CAMP01',
          slug: 'pawna-lake-camping-cottages',
          title: 'Pawna Lake Camping & Cottages',
          category: 'camping_cottages',
          location: 'Pawna Lake, Lonavala',
          location_slug: 'pawna-lake',
          price: 2500,
          weekday_price: '2500',
          weekend_price: '3200',
          price_note: 'per night',
          capacity: 18,
          max_capacity: 18,
          rating: 4.8,
          description: 'Scenic lakeside glamping & luxury cottages at Pawna Lake with lake view tents, bonfires, barbecues, and outdoor activities.',
          check_in_time: '03:00 PM onwards',
          check_out_time: '11:00 AM',
          amenities: JSON.stringify(['Lake View', 'Bonfire Nights', 'Barbecue Setup', 'Kayaking', 'Power Backup', 'Parking', 'Free Breakfast', 'Clean Washrooms']),
          activities: JSON.stringify(['Kayaking', 'Bonfire Nights', 'Barbecue Setup', 'Star Gazing', 'Nature Walks']),
          highlights: JSON.stringify(['Lakeside Tents & Cottages', 'Lake View Sunsets', 'Live Barbecue & Music']),
          policies: JSON.stringify(['Check-in 3:00 PM', 'Check-out 11:00 AM', 'Valid Govt ID mandatory', 'Quiet hours after 11 PM']),
          schedule: JSON.stringify(['4:00 PM Welcome Snacks & Tea', '7:30 PM Barbecue & Music', '9.00 PM Unlimited Dinner', '10:30 PM Bonfire', '8:30 AM Morning Breakfast & Kayaking']),
          has_food: true,
        },
        owner: {
          property_id: 'BSX-CAMP01',
          property_name: 'Pawna Lake Camping & Cottages',
          property_type: 'camping_cottages',
          owner_name: 'Pawna Camp Host',
          owner_otp_number: '9999999994',
          owner_whatsapp_number: '9999999994',
        },
        units: [
          { name: 'Premium Tent', total_inventory: 10, accommodation_type: 'Tent', available_persons: 2, total_persons: 2, weekday_price: '2500', weekend_price: '3200', has_food: true, meal_plan: 'Breakfast & Dinner', veg_price: '600', non_veg_price: '900', bedrooms: 1, bathrooms: 1, bed_config: '1 Queen Mattress' },
          { name: 'Lake View Cottage', total_inventory: 4, accommodation_type: 'Cottage', available_persons: 4, total_persons: 4, weekday_price: '4500', weekend_price: '5500', has_food: true, meal_plan: 'All Meals Package (AP)', veg_price: '800', non_veg_price: '1200', bedrooms: 1, bathrooms: 1, bed_config: '1 King Bed, 1 Sofa Bed' },
          { name: 'Family Cottage', total_inventory: 3, accommodation_type: 'Cottage', available_persons: 6, total_persons: 6, weekday_price: '6000', weekend_price: '7000', has_food: true, meal_plan: 'All Meals Package (AP)', veg_price: '750', non_veg_price: '1100', bedrooms: 1, bathrooms: 1, bed_config: '3 Queen Mattresses' },
        ],
        staff: [
          { name: 'Ramesh Patil', role: 'Camp Supervisor', mobile: '9822110001', monthly_salary: '22000' },
          { name: 'Sanjay Shinde', role: 'Activity Lead & Cook', mobile: '9822110002', monthly_salary: '18000' },
        ],
        expenses: [
          { category: 'Provisions & Food', amount: 14500, description: 'Fresh vegetables, chicken and BBQ charcoal' },
          { category: 'Utilities & Bonfire Wood', amount: 4800, description: 'Dry seasoned wood logs & solar lighting batteries' },
        ],
      },
      {
        category: 'resort',
        property: {
          property_id: 'BSX-RESORT01',
          slug: 'emerald-valley-resort',
          title: 'Emerald Valley Resort',
          category: 'resort',
          location: 'Lonavala Hills',
          location_slug: 'lonavala',
          price: 6000,
          weekday_price: '6000',
          weekend_price: '7500',
          price_note: 'per night',
          capacity: 25,
          max_capacity: 25,
          rating: 4.9,
          description: 'Nestled in the lush hills of Lonavala, Emerald Valley Resort offers luxury suites, swimming pool, multicuisine restaurant, banquet hall, and mountain views.',
          check_in_time: '02:00 PM onwards',
          check_out_time: '11:00 AM',
          amenities: JSON.stringify(['Swimming Pool', 'Multicuisine Restaurant', 'Wi-Fi', 'AC', 'Room Service', 'Parking', 'Spa & Wellness', 'Kids Play Area']),
          activities: JSON.stringify(['Poolside Dining', 'Indoor Games', 'Live Music', 'Trekking', 'Spa Therapies']),
          highlights: JSON.stringify(['Infinity Pool Overlooking Valley', 'Multi-Cuisine Fine Dining', 'Private Balconies in All Rooms']),
          policies: JSON.stringify(['Check-in 2:00 PM', 'Check-out 11:00 AM', 'Govt ID required for all guests', 'Swimming attire mandatory']),
          schedule: JSON.stringify(['7:30 AM – 10:30 AM Buffet Breakfast', '1:00 PM – 3:30 PM Lunch', '4:30 PM High Tea', '8:00 PM – 11:00 PM Live Grill Dinner']),
          has_food: true,
        },
        owner: {
          property_id: 'BSX-RESORT01',
          property_name: 'Emerald Valley Resort',
          property_type: 'resort',
          owner_name: 'Emerald Resort Manager',
          owner_otp_number: '9999999995',
          owner_whatsapp_number: '9999999995',
        },
        units: [
          { name: 'Deluxe Room', total_inventory: 10, accommodation_type: 'Room', available_persons: 2, total_persons: 2, weekday_price: '6000', weekend_price: '7500', has_food: true, meal_plan: 'Continental Plan (CP - Breakfast Included)', veg_price: '800', non_veg_price: '1200', bedrooms: 1, bathrooms: 1, bed_config: '1 King Bed' },
          { name: 'Premium Room', total_inventory: 5, accommodation_type: 'Room', available_persons: 3, total_persons: 3, weekday_price: '8000', weekend_price: '9500', has_food: true, meal_plan: 'Modified American Plan (MAP - Breakfast + Dinner)', veg_price: '850', non_veg_price: '1300', bedrooms: 1, bathrooms: 1, bed_config: '1 King Bed, 1 Daybed' },
          { name: 'Pool View Suite', total_inventory: 4, accommodation_type: 'Suite', available_persons: 4, total_persons: 4, weekday_price: '11000', weekend_price: '13500', has_food: true, meal_plan: 'All Meals Package (AP)', veg_price: '1000', non_veg_price: '1500', bedrooms: 1, bathrooms: 1, bed_config: '1 King Bed, 1 Queen Sofa Bed' },
          { name: 'Family Suite', total_inventory: 3, accommodation_type: 'Suite', available_persons: 6, total_persons: 6, weekday_price: '14000', weekend_price: '17000', has_food: true, meal_plan: 'Modified American Plan (MAP - Breakfast + Dinner)', veg_price: '900', non_veg_price: '1400', bedrooms: 2, bathrooms: 2, bed_config: '2 King Beds, 1 Sofa Cum Bed' },
        ],
        staff: [
          { name: 'Vikram Deshmukh', role: 'General Manager', mobile: '9833001122', monthly_salary: '45000' },
          { name: 'Sunita Sharma', role: 'Front Desk Lead', mobile: '9833001123', monthly_salary: '28000' },
          { name: 'Chef Anand Roy', role: 'Executive Chef', mobile: '9833001124', monthly_salary: '38000' },
        ],
        expenses: [
          { category: 'F&B Restaurant Supplier', amount: 32000, description: 'Dairy, fresh produce, bakery and meat' },
          { category: 'Pool Maintenance & Spa', amount: 8500, description: 'Pool filtration chemicals and essential oils' },
        ],
      },
      {
        category: 'homestay',
        property: {
          property_id: 'BSX-HOMESTAY01',
          slug: 'hillview-homestay',
          title: 'Hillview Homestay',
          category: 'homestay',
          location: 'Khandala Hills',
          location_slug: 'khandala',
          price: 3000,
          weekday_price: '3000',
          weekend_price: '3800',
          price_note: 'per night',
          capacity: 10,
          max_capacity: 10,
          rating: 4.7,
          description: 'A warm and cozy heritage homestay perched on the slopes of Khandala. Enjoy home-cooked Konkani cuisine, private balconies, and personalized hospitality.',
          check_in_time: '01:00 PM onwards',
          check_out_time: '11:00 AM',
          amenities: JSON.stringify(['Home Cooked Meals', 'Wi-Fi', 'Garden & Terrace', 'Parking', 'Kitchen Access', 'Pet Friendly', 'Power Backup']),
          activities: JSON.stringify(['Nature Walks', 'Bird Watching', 'Cookery Workshops', 'Campfire', 'Board Games']),
          highlights: JSON.stringify(['Authentic Home Cooked Meals', 'Mountain Breeze Garden', 'Warm Local Hospitality']),
          policies: JSON.stringify(['Check-in 1:00 PM', 'Check-out 11:00 AM', 'Govt ID required', 'Pets welcome with prior notice']),
          schedule: JSON.stringify(['8:30 AM Homemade Breakfast', '1:30 PM Traditional Konkani Lunch', '5:00 PM Masala Chai & Poha', '8:30 PM Home Dinner']),
          has_food: true,
        },
        owner: {
          property_id: 'BSX-HOMESTAY01',
          property_name: 'Hillview Homestay',
          property_type: 'homestay',
          owner_name: 'Hillview Homestay Host',
          owner_otp_number: '9999999996',
          owner_whatsapp_number: '9999999996',
        },
        units: [
          { name: 'Standard Room', total_inventory: 3, accommodation_type: 'Room', available_persons: 2, total_persons: 2, weekday_price: '3000', weekend_price: '3800', has_food: true, meal_plan: 'Breakfast Included', veg_price: '500', non_veg_price: '750', bedrooms: 1, bathrooms: 1, bed_config: '1 Queen Bed' },
          { name: 'Valley View Room', total_inventory: 2, accommodation_type: 'Room', available_persons: 3, total_persons: 3, weekday_price: '4200', weekend_price: '5200', has_food: true, meal_plan: 'All Meals Package (AP)', veg_price: '650', non_veg_price: '950', bedrooms: 1, bathrooms: 1, bed_config: '1 King Bed, 1 Single Bed' },
          { name: 'Family Room', total_inventory: 2, accommodation_type: 'Room', available_persons: 5, total_persons: 5, weekday_price: '6500', weekend_price: '8000', has_food: true, meal_plan: 'All Meals Package (AP)', veg_price: '700', non_veg_price: '1050', bedrooms: 2, bathrooms: 1, bed_config: '2 Double Beds, 1 Single Bed' },
        ],
        staff: [
          { name: 'Kavita Joshi', role: 'Host & Head Chef', mobile: '9820099881', monthly_salary: '25000' },
          { name: 'Mahesh Joshi', role: 'Property Manager', mobile: '9820099882', monthly_salary: '25000' },
        ],
        expenses: [
          { category: 'Groceries & Milk', amount: 8200, description: 'Organic spices, rice, flour, milk & tea leaves' },
          { category: 'Garden & Housekeeping', amount: 3500, description: 'Organic compost and room sanitizers' },
        ],
      },
    ];

    for (const item of demoData) {
      const prop = item.property;
      const propResult = await client.query(
        `INSERT INTO properties (
          property_id, slug, title, category, location, location_slug,
          price, weekday_price, weekend_price, price_note, capacity, max_capacity, rating,
          description, check_in_time, check_out_time, amenities,
          activities, highlights, policies, schedule, has_food, is_active
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,true)
        ON CONFLICT (property_id) DO UPDATE SET
          slug = EXCLUDED.slug,
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          location = EXCLUDED.location,
          location_slug = EXCLUDED.location_slug,
          price = EXCLUDED.price,
          weekday_price = EXCLUDED.weekday_price,
          weekend_price = EXCLUDED.weekend_price,
          price_note = EXCLUDED.price_note,
          capacity = EXCLUDED.capacity,
          max_capacity = EXCLUDED.max_capacity,
          description = EXCLUDED.description,
          check_in_time = EXCLUDED.check_in_time,
          check_out_time = EXCLUDED.check_out_time,
          amenities = EXCLUDED.amenities,
          activities = EXCLUDED.activities,
          highlights = EXCLUDED.highlights,
          policies = EXCLUDED.policies,
          schedule = EXCLUDED.schedule,
          has_food = EXCLUDED.has_food,
          is_active = true
        RETURNING id`,
        [
          prop.property_id, prop.slug, prop.title, prop.category, prop.location, prop.location_slug,
          prop.price, prop.weekday_price, prop.weekend_price, prop.price_note, prop.capacity,
          prop.max_capacity, prop.rating, prop.description, prop.check_in_time, prop.check_out_time,
          prop.amenities, prop.activities, prop.highlights, prop.policies, prop.schedule, prop.has_food
        ]
      );
      const propertyDbId = propResult.rows[0].id;

      const own = item.owner;
      const ownResult = await client.query(
        `INSERT INTO owners (property_id, property_name, property_type, owner_name, owner_otp_number, owner_whatsapp_number)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (property_id) DO UPDATE SET
           property_name = EXCLUDED.property_name,
           property_type = EXCLUDED.property_type,
           owner_name = EXCLUDED.owner_name,
           owner_otp_number = EXCLUDED.owner_otp_number,
           owner_whatsapp_number = EXCLUDED.owner_whatsapp_number
         RETURNING id`,
        [own.property_id, own.property_name, own.property_type, own.owner_name, own.owner_otp_number, own.owner_whatsapp_number]
      );
      const ownerId = ownResult.rows[0].id;

      const validUnitIds = [];
      for (const u of item.units) {
        const existingUnit = await client.query(
          'SELECT id FROM property_units WHERE property_id = $1 AND name = $2',
          [propertyDbId, u.name]
        );
        let unitId;
        if (existingUnit.rows.length) {
          unitId = existingUnit.rows[0].id;
          await client.query(
            `UPDATE property_units SET
              available_persons = $1, total_persons = $1, weekday_price = $2,
              weekend_price = $3, has_food = $4, meal_plan = $5,
              veg_price = $6, non_veg_price = $7, bedrooms = $8,
              bathrooms = $9, bed_config = $10, location = $11, title = $12,
              total_inventory = $13, accommodation_type = $14
             WHERE id = $15`,
            [
              u.total_persons, u.weekday_price, u.weekend_price,
              u.has_food, u.meal_plan, u.veg_price, u.non_veg_price,
              u.bedrooms, u.bathrooms, u.bed_config, prop.location, u.name,
              u.total_inventory || 1, u.accommodation_type || 'Tent',
              unitId
            ]
          );
        } else {
          const insUnit = await client.query(
            `INSERT INTO property_units (
              property_id, name, available_persons, total_persons,
              weekday_price, weekend_price, has_food, meal_plan,
              veg_price, non_veg_price, bedrooms, bathrooms,
              bed_config, location, title, total_inventory, accommodation_type
            ) VALUES ($1,$2,$3,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$2,$14,$15)
            RETURNING id`,
            [
              propertyDbId, u.name, u.available_persons, u.weekday_price,
              u.weekend_price, u.has_food, u.meal_plan, u.veg_price,
              u.non_veg_price, u.bedrooms, u.bathrooms, u.bed_config,
              prop.location, u.total_inventory || 1, u.accommodation_type || 'Tent'
            ]
          );
          unitId = insUnit.rows[0].id;
        }
        validUnitIds.push(unitId);

        const checkLedger = await client.query(
          'SELECT id FROM ledger_entries WHERE unit_id = $1 LIMIT 1',
          [unitId]
        );
        if (!checkLedger.rows.length && u === item.units[0]) {
          await client.query(
            `INSERT INTO ledger_entries (
              property_id, unit_id, customer_name, check_in, check_out,
              amount, persons, payment_mode, status, note,
              veg_count, non_veg_count, male_count, female_count, unit_quantity
            ) VALUES ($1, $2, 'Aakash Mehta', CURRENT_DATE + 2, CURRENT_DATE + 4,
                      $3, 2, 'online', 'confirmed', 'Direct website booking - Paid Advance',
                      2, 0, 1, 1, 1)`,
            [String(prop.property_id), unitId, Number(u.weekday_price) * 2]
          );
        }
      }

      // Reassign any orphan ledger entries/bookings for this property to the first valid unit, then cleanup orphan units
      if (validUnitIds.length > 0) {
        const firstUnitId = validUnitIds[0];
        await client.query(
          `UPDATE ledger_entries SET unit_id = $1
           WHERE property_id = $2 AND unit_id NOT IN (${validUnitIds.join(',')})`,
          [firstUnitId, String(prop.property_id)]
        );
        await client.query(
          `UPDATE bookings SET unit_id = $1
           WHERE (property_id = $2 OR property_id = $3) AND unit_id NOT IN (${validUnitIds.join(',')})`,
          [firstUnitId, String(prop.property_id), prop.slug]
        );
        await client.query(
          `DELETE FROM property_units
           WHERE property_id = $1 AND id NOT IN (${validUnitIds.join(',')})`,
          [propertyDbId]
        );
      }

      for (const st of item.staff) {
        const checkStaff = await client.query(
          'SELECT id FROM owner_staff WHERE owner_id = $1 AND name = $2',
          [ownerId, st.name]
        );
        if (!checkStaff.rows.length) {
          await client.query(
            `INSERT INTO owner_staff (owner_id, property_id, name, role, mobile, monthly_salary, is_active, joining_date)
             VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_DATE - 90)`,
            [ownerId, propertyDbId, st.name, st.role, st.mobile, st.monthly_salary]
          );
        }
      }

      for (const exp of item.expenses) {
        const checkExp = await client.query(
          'SELECT id FROM owner_expenses WHERE owner_id = $1 AND description = $2',
          [ownerId, exp.description]
        );
        if (!checkExp.rows.length) {
          await client.query(
            `INSERT INTO owner_expenses (owner_id, property_id, category, amount, description, date, payment_method)
             VALUES ($1, $2, $3, $4, $5, CURRENT_DATE - 3, 'UPI')`,
            [ownerId, propertyDbId, exp.category, exp.amount, exp.description]
          );
        }
      }
    }

    await client.query('COMMIT');
    console.log('Demo properties and owners seeded successfully!');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed seeding demo properties:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

seedDemoProperties();
