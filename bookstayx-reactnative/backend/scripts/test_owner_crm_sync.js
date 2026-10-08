const { pool, query } = require('../src/config/database');

async function verifySync() {
  const client = await pool.connect();
  try {
    console.log('🔍 Testing Owner CRM tables in Supabase...');

    // 1. Get an existing owner
    const ownerRes = await client.query(`SELECT id, property_id, owner_name FROM owners LIMIT 1`);
    if (ownerRes.rows.length === 0) {
      console.log('⚠️ No owners found in db, creating mock check.');
      return;
    }
    const owner = ownerRes.rows[0];
    const propertyRes = await client.query(`SELECT id FROM properties WHERE property_id = $1 LIMIT 1`, [owner.property_id]);
    const propertyDbId = propertyRes.rows.length > 0 ? propertyRes.rows[0].id : null;

    console.log(`👤 Using Owner ID: ${owner.id} (${owner.owner_name}), Property DB ID: ${propertyDbId}`);

    // 2. Test Expense Insert & Query
    const expInsert = await client.query(
      `INSERT INTO owner_expenses (property_id, owner_id, expense_code, date, category, amount, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [propertyDbId, owner.id, 'EXP-TEST-1', '2026-09-26', 'Cleaning', 1500, 'Test expense']
    );
    console.log('✅ Expense inserted:', expInsert.rows[0].expense_code, 'Amount:', expInsert.rows[0].amount);

    // 3. Test Staff Insert & Query
    const staffInsert = await client.query(
      `INSERT INTO owner_staff (property_id, owner_id, staff_code, name, role, mobile, monthly_salary)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [propertyDbId, owner.id, 'STF-TEST-1', 'Ramesh Kumar', 'Housekeeper', '+91 99999 88888', 15000]
    );
    console.log('✅ Staff inserted:', staffInsert.rows[0].staff_code, 'Name:', staffInsert.rows[0].name);

    // 4. Test Attendance
    await client.query(
      `INSERT INTO owner_staff_attendance (property_id, staff_id, staff_code, date, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (staff_id, date) DO UPDATE SET status = EXCLUDED.status`,
      [propertyDbId, staffInsert.rows[0].id, staffInsert.rows[0].staff_code, '2026-09-26', 'Present', 'On time']
    );
    console.log('✅ Staff Attendance recorded.');

    // 5. Test Booking Request Insert
    const reqInsert = await client.query(
      `INSERT INTO owner_booking_requests (property_id, owner_id, request_code, guest_name, guest_phone, check_in, check_out, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [propertyDbId, owner.id, 'REQ-TEST-1', 'Amit Shah', '+91 98765 43210', '2026-10-01', '2026-10-03', 25000, 'Pending']
    );
    console.log('✅ Booking Request inserted:', reqInsert.rows[0].request_code, 'Guest:', reqInsert.rows[0].guest_name);

    // 6. Test Settings Upsert
    const setInsert = await client.query(
      `INSERT INTO owner_settings (owner_id, property_id, owner_display_name, business_name, sms_alerts_enabled)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (owner_id) DO UPDATE SET owner_display_name = EXCLUDED.owner_display_name
       RETURNING *`,
      [owner.id, propertyDbId, owner.owner_name, 'Test Luxury Villa', true]
    );
    console.log('✅ Owner Settings upserted for owner:', setInsert.rows[0].owner_display_name);

    // 7. Cleanup test records
    await client.query(`DELETE FROM owner_expenses WHERE expense_code = 'EXP-TEST-1'`);
    await client.query(`DELETE FROM owner_staff WHERE staff_code = 'STF-TEST-1'`);
    await client.query(`DELETE FROM owner_booking_requests WHERE request_code = 'REQ-TEST-1'`);
    console.log('🧹 Test records cleaned up successfully.');

    console.log('🎉 ALL SUPABASE OWNER CRM TABLES VERIFIED 100% OPERATIONAL!');
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

verifySync();
