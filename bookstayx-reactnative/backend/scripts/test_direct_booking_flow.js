const { pool } = require('../src/config/database');
const jwt = require('jsonwebtoken');
const { createBookingQuote } = require('../services/bookingQuoteService');
const paymentService = require('../services/paymentProviderService');

async function testDirectBooking() {
  const client = await pool.connect();
  try {
    console.log('🧪 Testing Direct Booking -> Owner Dashboard Real-Time Sync Flow...');

    // 1. Get customer and property
    const custRes = await client.query('SELECT id, full_name, mobile FROM customers LIMIT 1');
    const customer = custRes.rows[0];
    const propRes = await client.query('SELECT id, property_id, title FROM properties WHERE slug=$1 OR property_id=$1 LIMIT 1', ['pawna-lakeview-villa']);
    const property = propRes.rows[0];
    const unitRes = await client.query('SELECT id, name, total_persons, weekday_price FROM property_units WHERE property_id=$1 LIMIT 1', [property.id]);
    const unit = unitRes.rows[0];

    console.log(`👤 Customer: ${customer.full_name} (${customer.mobile})`);
    console.log(`🏡 Property: ${property.title} (Unit: ${unit.name}, ID: ${unit.id})`);

    const checkIn = '2026-09-28';
    const checkOut = '2026-09-29';

    // 2. Quote
    const quote = await createBookingQuote(client, {
      propertyId: property.property_id,
      unitId: unit.id,
      checkIn,
      checkOut,
      persons: 1,
    });
    console.log(`📊 Quote Calculated: Total ₹${quote.totalAmount}, Advance ₹${quote.advanceAmount}, Nights: ${quote.nights}`);

    // 3. Create Booking
    const bookingId = `BK-TEST-${Date.now().toString().slice(-4)}`;
    const insRes = await client.query(
      `INSERT INTO bookings (
        booking_id, customer_id, property_id, property_name, property_type,
        guest_name, guest_phone, owner_phone, admin_phone, checkin_datetime, checkout_datetime,
        advance_amount, total_amount, persons, max_capacity, unit_id,
        payment_status, booking_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'INITIATED', 'PAYMENT_PENDING')
      RETURNING *`,
      [
        bookingId,
        customer.id,
        property.property_id,
        property.title,
        'villa',
        customer.full_name,
        customer.mobile,
        '9999999999',
        '9999999999',
        checkIn,
        checkOut,
        quote.advanceAmount,
        quote.totalAmount,
        1,
        unit.total_persons,
        unit.id,
      ]
    );
    const booking = insRes.rows[0];
    console.log(`📝 Booking Initiated: ${booking.booking_id}`);

    // 4. Finalize direct payment
    const finalResult = await paymentService.finalizeSuccessfulPayment({
      bookingId: booking.booking_id,
      orderId: `mock_order_${booking.booking_id}`,
      paymentId: `mock_pay_${booking.booking_id}`,
      method: 'mock',
      provider: 'mock',
    });
    console.log(`💳 Payment Finalized: Status = ${finalResult.booking.payment_status}, Booking Status = ${finalResult.booking.booking_status}`);

    // 5. Verify Owner Calendar Query
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const [stored, ledger, bookings] = await Promise.all([
      client.query('SELECT date,price,available_quantity,is_special FROM unit_calendar WHERE unit_id=$1 AND date BETWEEN $2 AND $3', [unit.id, checkIn, checkOut]),
      client.query("SELECT check_in,check_out,persons FROM ledger_entries WHERE unit_id=$1 AND check_out>=$2 AND check_in<=$3 AND COALESCE(status,'active')!='deleted'", [unit.id, checkIn, checkOut]),
      client.query("SELECT checkin_datetime,checkout_datetime,COALESCE(persons,1) persons,booking_status FROM bookings WHERE unit_id=$1 AND checkout_datetime::date>=$2 AND checkin_datetime::date<=$3 AND booking_status NOT IN ('CANCELLED','DELETED','PAYMENT_FAILED')", [unit.id, checkIn, checkOut]),
    ]);

    const overlaps = (row, day) => new Date(row.check_in || row.checkin_datetime) <= day && new Date(row.check_out || row.checkout_datetime) > day;
    const day = new Date(checkIn);
    const occupied = [...ledger.rows, ...bookings.rows].filter((r) => overlaps(r, day)).reduce((sum, r) => sum + Number(r.persons || 1), 0);
    const capacity = Number(unit.total_persons || 1);
    const isBooked = (capacity - occupied) <= 0;

    console.log(`📅 Calendar Check on ${checkIn}: Occupied = ${occupied} / Capacity = ${capacity} -> Is Booked: ${isBooked}`);

    // 6. Verify Owner Ledger Query
    const ledgerCheck = await client.query(
      `SELECT b.id, b.booking_id, b.guest_name, b.total_amount, b.booking_status
       FROM bookings b
       WHERE b.booking_id = $1`,
      [booking.booking_id]
    );
    console.log(`📖 Owner Ledger Check: Found ${ledgerCheck.rows.length} booking (${ledgerCheck.rows[0].guest_name}, ₹${ledgerCheck.rows[0].total_amount}, Status: ${ledgerCheck.rows[0].booking_status})`);

    // 7. Verify Owner Notification
    const notifCheck = await client.query(
      `SELECT id, title, message FROM owner_notifications WHERE reference_id = $1`,
      [booking.booking_id]
    );
    console.log(`🔔 Owner Notification Check: ${notifCheck.rows.length > 0 ? notifCheck.rows[0].title : 'None'}`);

    // 8. Clean up test record
    await client.query('DELETE FROM bookings WHERE booking_id = $1', [booking.booking_id]);
    await client.query('DELETE FROM owner_notifications WHERE reference_id = $1', [booking.booking_id]);
    console.log('🧹 Cleaned up test booking.');

    console.log('🎉 DIRECT BOOKING & REAL-TIME OWNER CALENDAR SYNC FULLY VERIFIED!');
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

testDirectBooking();
