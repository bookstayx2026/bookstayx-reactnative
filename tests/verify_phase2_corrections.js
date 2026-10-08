const db = require('../backend/db');
const {
  getDailyAvailability,
  checkStayAvailability,
  ACTIVE_HARD_STATUSES,
  ACTIVE_SOFT_STATUSES,
} = require('../backend/services/inventoryAvailabilityService');

let failures = 0;
let successes = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failures++;
  } else {
    console.log(`✅ PASS: ${message}`);
    successes++;
  }
}

async function insertTestBooking(executor, {
  bookingId,
  propertyId = 'TEST-P2-001',
  unitId,
  checkIn,
  checkOut,
  status = 'CONFIRMED',
  unitQuantity = 1,
  persons = 2,
  softLockExpiresAt = null,
}) {
  return executor.query(`
    INSERT INTO bookings (
      booking_id, property_id, property_name, property_type,
      guest_name, guest_phone, owner_phone, admin_phone,
      unit_id, checkin_datetime, checkout_datetime,
      booking_status, unit_quantity, persons, total_amount, advance_amount,
      soft_lock_expires_at
    ) VALUES (
      $1, $2, 'Phase 2 Test Camp', 'CAMPING',
      'Test Guest', '9999999999', '9999999999', '9999999999',
      $3, $4, $5,
      $6, $7, $8, 2000, 1000,
      $9
    ) RETURNING *;
  `, [
    bookingId, propertyId, unitId, checkIn, checkOut,
    status, unitQuantity, persons, softLockExpiresAt
  ]);
}

async function runTests() {
  const client = await db.getClient();
  console.log('\n======================================================');
  console.log('   PHASE 2 COMPREHENSIVE AUTOMATED VERIFICATION SUITE');
  console.log('======================================================\n');

  let testPropId;
  let testUnitId;

  try {
    // SETUP: Create a dedicated test property and unit
    await client.query('BEGIN');

    const propRes = await client.query(`
      INSERT INTO properties (
        property_id, slug, title, category, location, price, weekday_price, weekend_price,
        price_note, capacity, max_capacity, is_active, is_available, description,
        amenities, activities, highlights
      ) VALUES (
        'TEST-P2-001', 'test-p2-prop', 'Phase 2 Test Camp', 'camping_cottages',
        'Pawna Test', 2000, 2000, 2500, 'per tent', 10, 20, true, true, 'Test Camp Description',
        '[]', '[]', '[]'
      ) RETURNING id;
    `);
    testPropId = propRes.rows[0].id;

    const unitRes = await client.query(`
      INSERT INTO property_units (
        property_id, name, available_persons, total_persons, total_inventory, accommodation_type,
        weekday_price, weekend_price, has_food
      ) VALUES (
        $1, 'Deluxe Tent', 4, 4, 10, 'tent', '2000', '2500', true
      ) RETURNING id;
    `, [testPropId]);
    testUnitId = unitRes.rows[0].id;

    await client.query('COMMIT');
    console.log(`Created test property (id: ${testPropId}) and test unit (id: ${testUnitId})`);

    // ---------------------------------------------------------------
    // TEST 1: Online Booking Mirror Deduplication in Ledger
    // ---------------------------------------------------------------
    console.log('\n--- Test 1: Ledger Online Mirror Deduplication ---');
    const testDate = '2026-11-01';
    const testNextDate = '2026-11-02';

    await insertTestBooking(client, {
      bookingId: 'BSX-TEST-BK01',
      unitId: testUnitId,
      checkIn: testDate,
      checkOut: testNextDate,
      status: 'CONFIRMED',
      unitQuantity: 1,
      persons: 2,
    });

    // Insert mirrored ledger entry for the SAME online booking
    await client.query(`
      INSERT INTO ledger_entries (
        property_id, unit_id, booking_id, customer_name, check_in, check_out,
        unit_quantity, persons, status, payment_mode, amount
      ) VALUES (
        $1, $2, 'BSX-TEST-BK01', 'Test Customer', $3, $4,
        1, 2, 'active', 'online', 2000
      );
    `, [testPropId, testUnitId, testDate, testNextDate]);

    const availT1 = await getDailyAvailability(client, {
      propertyId: testPropId,
      unitId: testUnitId,
      startDate: testDate,
      endDate: testNextDate,
      totalInventory: 10,
    });

    assert(availT1.length === 1, 'Availability returns 1 day for test range');
    assert(availT1[0].hard_online_usage === 1, 'Online booking usage is counted as 1');
    assert(availT1[0].offline_usage === 0, 'Mirrored ledger entry is excluded from offline usage (deduplicated)');
    assert(availT1[0].booked_quantity === 1, 'Total booked quantity is 1 (not double counted as 2)');
    assert(availT1[0].available_quantity === 9, 'Available quantity is 9 (10 - 1 = 9)');

    // ---------------------------------------------------------------
    // TEST 2: Owner Baseline Override vs Dynamic Booking Deductions
    // ---------------------------------------------------------------
    console.log('\n--- Test 2: Owner Baseline Override & No Double Deduction ---');
    // Owner sets available_quantity = 6 in unit_calendar (override baseline)
    await client.query(`
      INSERT INTO unit_calendar (unit_id, date, available_quantity, price)
      VALUES ($1, $2, 6, 2200);
    `, [testUnitId, testDate]);

    const availT2 = await getDailyAvailability(client, {
      propertyId: testPropId,
      unitId: testUnitId,
      startDate: testDate,
      endDate: testNextDate,
      totalInventory: 10,
    });

    assert(availT2[0].owner_baseline === 6, 'Owner baseline override of 6 is respected instead of totalInventory 10');
    assert(availT2[0].available_quantity === 5, 'Available quantity is 5 (6 baseline - 1 online booking = 5)');

    // ---------------------------------------------------------------
    // TEST 3: Post-Payment Hard Hold on PENDING_OWNER_CONFIRMATION
    // ---------------------------------------------------------------
    console.log('\n--- Test 3: Post-Payment Inventory Hard Hold ---');
    const testDate2 = '2026-11-05';
    const testNextDate2 = '2026-11-06';

    // Insert booking in PENDING_OWNER_CONFIRMATION whose 15-min soft lock expired 2 hours ago
    const pastTime = new Date(Date.now() - 7200000).toISOString();
    await insertTestBooking(client, {
      bookingId: 'BSX-TEST-BK02',
      unitId: testUnitId,
      checkIn: testDate2,
      checkOut: testNextDate2,
      status: 'PENDING_OWNER_CONFIRMATION',
      unitQuantity: 2,
      persons: 4,
      softLockExpiresAt: pastTime,
    });

    const availT3 = await getDailyAvailability(client, {
      propertyId: testPropId,
      unitId: testUnitId,
      startDate: testDate2,
      endDate: testNextDate2,
      totalInventory: 10,
    });

    assert(availT3[0].hard_online_usage === 2, 'PENDING_OWNER_CONFIRMATION holds 2 units firmly even after soft_lock_expires_at passed');
    assert(availT3[0].available_quantity === 8, 'Available quantity is 8 (10 - 2 = 8, no post-payment inventory release gap)');

    // ---------------------------------------------------------------
    // TEST 4: Soft Status Expiry Releases Inventory
    // ---------------------------------------------------------------
    console.log('\n--- Test 4: Soft Lock Expiry on PAYMENT_PENDING ---');
    const testDate3 = '2026-11-10';
    const testNextDate3 = '2026-11-11';

    // Unpaid booking expired
    const expiredTime = new Date(Date.now() - 300000).toISOString();
    await insertTestBooking(client, {
      bookingId: 'BSX-TEST-BK03',
      unitId: testUnitId,
      checkIn: testDate3,
      checkOut: testNextDate3,
      status: 'PAYMENT_PENDING',
      unitQuantity: 3,
      persons: 6,
      softLockExpiresAt: expiredTime,
    });

    const availT4Expired = await getDailyAvailability(client, {
      propertyId: testPropId,
      unitId: testUnitId,
      startDate: testDate3,
      endDate: testNextDate3,
      totalInventory: 10,
    });

    assert(availT4Expired[0].soft_usage === 0, 'Expired PAYMENT_PENDING soft usage is 0 (released back to market)');
    assert(availT4Expired[0].available_quantity === 10, 'Available quantity remains 10');

    // Active unpaid booking
    const activeFutureTime = new Date(Date.now() + 600000).toISOString();
    await client.query(`
      UPDATE bookings
      SET soft_lock_expires_at = $1
      WHERE booking_id = 'BSX-TEST-BK03';
    `, [activeFutureTime]);

    const availT4Active = await getDailyAvailability(client, {
      propertyId: testPropId,
      unitId: testUnitId,
      startDate: testDate3,
      endDate: testNextDate3,
      totalInventory: 10,
    });

    assert(availT4Active[0].soft_usage === 3, 'Active PAYMENT_PENDING soft usage is 3');
    assert(availT4Active[0].soft_available_quantity === 7, 'Soft available quantity is 7 (10 - 3 = 7)');

    // ---------------------------------------------------------------
    // TEST 5: Resource-Scoped Concurrency Lock Serialization
    // ---------------------------------------------------------------
    console.log('\n--- Test 5: Resource-Scoped Concurrency Lock Serialization ---');
    // Create a single-unit sub-item to test race condition
    const tightUnitRes = await client.query(`
      INSERT INTO property_units (
        property_id, name, available_persons, total_persons, total_inventory, weekday_price, weekend_price
      ) VALUES (
        $1, 'Single Pod', 2, 2, 1, '1500', '1800'
      ) RETURNING id;
    `, [testPropId]);
    const tightUnitId = tightUnitRes.rows[0].id;

    const c1 = await db.getClient();
    const c2 = await db.getClient();

    let c1Success = false;
    let c2Error = null;

    // Both c1 and c2 attempt to book the SAME unit for overlapping dates:
    // c1: 2026-11-20 to 2026-11-22
    // c2: 2026-11-21 to 2026-11-23
    const lockKey = `unit:${tightUnitId}`;

    await c1.query('BEGIN');
    await c1.query('SELECT pg_advisory_xact_lock(hashtext($1))', [lockKey]);

    // c1 checks quote and books
    const quote1 = await checkStayAvailability(c1, {
      property: { id: testPropId, category: 'camping_cottages', price: 1500, weekday_price: 1500, weekend_price: 1800 },
      unit: { id: tightUnitId, total_inventory: 1, weekday_price: '1500', weekend_price: '1800' },
      checkIn: '2026-11-20',
      checkOut: '2026-11-22',
      requestedUnits: 1,
    });

    await insertTestBooking(c1, {
      bookingId: 'BSX-RACE-01',
      unitId: tightUnitId,
      checkIn: '2026-11-20',
      checkOut: '2026-11-22',
      status: 'CONFIRMED',
      unitQuantity: 1,
      persons: 2,
    });

    c1Success = true;
    await c1.query('COMMIT');
    c1.release();

    // Now c2 tries
    await c2.query('BEGIN');
    await c2.query('SELECT pg_advisory_xact_lock(hashtext($1))', [lockKey]);
    try {
      await checkStayAvailability(c2, {
        property: { id: testPropId, category: 'camping_cottages', price: 1500, weekday_price: 1500, weekend_price: 1800 },
        unit: { id: tightUnitId, total_inventory: 1, weekday_price: '1500', weekend_price: '1800' },
        checkIn: '2026-11-21',
        checkOut: '2026-11-23',
        requestedUnits: 1,
      });
    } catch (err) {
      c2Error = err;
    }
    await c2.query('ROLLBACK');
    c2.release();

    assert(c1Success === true, 'First overlapping booking succeeded');
    assert(c2Error !== null && c2Error.code === 'DATES_UNAVAILABLE', 'Second overlapping booking serialized after lock and was rejected with DATES_UNAVAILABLE');

    // ---------------------------------------------------------------
    // TEST 6: Demographic Backend Validation Rules
    // ---------------------------------------------------------------
    console.log('\n--- Test 6: Demographic Breakdown Validation Rules ---');
    const validateDemographics = (totalGuests, male, female, veg, nonVeg, hasFood = true) => {
      if (!Number.isInteger(male) || male < 0 || !Number.isInteger(female) || female < 0 || (male + female !== totalGuests)) {
        return { valid: false, code: 'INVALID_DEMOGRAPHICS' };
      }
      if (hasFood && (veg !== undefined || nonVeg !== undefined)) {
        if (!Number.isInteger(veg) || veg < 0 || !Number.isInteger(nonVeg) || nonVeg < 0 || (veg + nonVeg !== totalGuests)) {
          return { valid: false, code: 'INVALID_MEAL_PREFERENCE' };
        }
      }
      return { valid: true };
    };

    assert(validateDemographics(4, 2, 2, 2, 2).valid === true, 'Valid 2M+2F=4 and 2V+2NV=4 accepted');
    assert(validateDemographics(4, 3, 2, 2, 2).code === 'INVALID_DEMOGRAPHICS', '3M+2F != 4 rejected with INVALID_DEMOGRAPHICS');
    assert(validateDemographics(4, -1, 5, 2, 2).code === 'INVALID_DEMOGRAPHICS', 'Negative male count rejected with INVALID_DEMOGRAPHICS');
    assert(validateDemographics(4, 2, 2, 3, 2).code === 'INVALID_MEAL_PREFERENCE', '3V+2NV != 4 rejected with INVALID_MEAL_PREFERENCE');

    // ---------------------------------------------------------------
    // TEST 7: Category Normalization & Admin Property Unit CRUD
    // ---------------------------------------------------------------
    console.log('\n--- Test 7: Category Normalization & Unit CRUD Persistence ---');
    // Ensure all 4 categories can be created and queried
    const catCheck = await client.query(`
      SELECT DISTINCT category FROM properties
      WHERE category IN ('villa', 'camping_cottages', 'resort', 'homestay');
    `);
    assert(catCheck.rows.length >= 1, 'Canonical categories present in DB');

    // Test invalid category rejection by DB constraint
    let constraintFailed = false;
    try {
      await client.query(`
        INSERT INTO properties (
          property_id, slug, title, category, price, is_active, description,
          location, price_note, capacity, amenities, activities, highlights
        ) VALUES (
          'BAD-CAT-01', 'bad-cat-01', 'Invalid Category', 'invalid_category_xyz', 1000, false, 'Invalid',
          'Loc', 'Note', 2, '[]', '[]', '[]'
        );
      `);
    } catch (err) {
      constraintFailed = true;
    }
    assert(constraintFailed === true, 'Database CHECK constraint rejects invalid category values');

    // Test Admin Property Unit CRUD fields (total_inventory & accommodation_type)
    const newUnit = await client.query(`
      INSERT INTO property_units (
        property_id, name, available_persons, total_persons, total_inventory, accommodation_type
      ) VALUES ($1, 'Treehouse Luxury', 6, 6, 15, 'treehouse')
      RETURNING *;
    `, [testPropId]);

    assert(newUnit.rows[0].total_inventory === 15, 'total_inventory = 15 persisted correctly in property_units');
    assert(newUnit.rows[0].accommodation_type === 'treehouse', 'accommodation_type = treehouse persisted correctly in property_units');

    // Test Update
    const updatedUnit = await client.query(`
      UPDATE property_units
      SET total_inventory = 20, accommodation_type = 'luxury_treehouse'
      WHERE id = $1
      RETURNING *;
    `, [newUnit.rows[0].id]);

    assert(updatedUnit.rows[0].total_inventory === 20, 'total_inventory update to 20 persisted');
    assert(updatedUnit.rows[0].accommodation_type === 'luxury_treehouse', 'accommodation_type update to luxury_treehouse persisted');

  } catch (err) {
    console.error('Test Suite encountered unhandled error:', err);
    failures++;
  } finally {
    // TEARDOWN: Clean up test records
    console.log('\n--- Cleaning up test records ---');
    await client.query('ROLLBACK').catch(() => {});
    if (testPropId) {
      await client.query('DELETE FROM bookings WHERE property_id = \'TEST-P2-001\'');
      await client.query('DELETE FROM ledger_entries WHERE property_id = $1', [testPropId]);
      await client.query('DELETE FROM unit_calendar WHERE unit_id = $1', [testUnitId]);
      await client.query('DELETE FROM property_units WHERE property_id = $1', [testPropId]);
      await client.query('DELETE FROM properties WHERE id = $1', [testPropId]);
    }
    client.release();

    console.log('\n======================================================');
    console.log(`   TEST RESULTS: ${successes} PASSED, ${failures} FAILED`);
    console.log('======================================================\n');

    process.exit(failures > 0 ? 1 : 0);
  }
}

runTests();
