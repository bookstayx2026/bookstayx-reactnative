const axios = require('axios');
const jwt = require('jsonwebtoken');
const { pool } = require('../src/config/database');

async function testHttpEndpoint() {
  try {
    // 1. Get customer
    const client = await pool.connect();
    const custRes = await client.query("SELECT id, full_name, mobile, email FROM customers LIMIT 1");
    const customer = custRes.rows[0];
    client.release();

    const token = jwt.sign(
      { id: customer.id, role: 'customer', mobile: customer.mobile },
      process.env.JWT_SECRET || 'PP9iteN/ztme24ZcaXszjwPOZFyo3pc4nMk1UFv86f4lANaZ6rNFpWBd9WvF39nB',
      { expiresIn: '1h' }
    );

    const payload = {
      propertyId: 'pawna-lakeview-villa',
      unitId: 1,
      guestName: customer.full_name,
      checkIn: '2026-09-28',
      checkOut: '2026-09-29',
      persons: 1,
      vegGuestCount: 1,
      nonVegGuestCount: 0,
    };

    console.log('Sending payload to http://localhost:5001/api/bookings/initiate...');
    const res = await axios.post('http://localhost:5001/api/bookings/initiate', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response Status:', res.status);
    console.log('Response Data:', res.data);
  } catch (error) {
    if (error.response) {
      console.error('HTTP Error Status:', error.response.status);
      console.error('HTTP Error Data:', error.response.data);
    } else {
      console.error('Network Error:', error.message);
    }
  } finally {
    await pool.end();
  }
}

testHttpEndpoint();
