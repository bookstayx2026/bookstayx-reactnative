const { query } = require('../db');
const { ticketIdCandidate } = require('../utils/ticketId');

// Create e-ticket
const createETicket = async (req, res) => {
  console.log('Received e-ticket creation request:', req.body);
  try {
    const { 
      ticket_id, 
      property_id, 
      guest_name, 
      check_in_date, 
      check_out_date, 
      paid_amount, 
      due_amount 
    } = req.body;

    if (!ticket_id || !property_id || !guest_name || !check_in_date || !check_out_date) {
      console.log('Missing fields:', { ticket_id, property_id, guest_name, check_in_date, check_out_date });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields for e-ticket.'
      });
    }

    console.log('Executing INSERT query for ticket:', ticket_id);
    const result = await query(
      `INSERT INTO etickets (
        ticket_id, property_id, guest_name, check_in_date, check_out_date, paid_amount, due_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [ticket_id, property_id, guest_name, check_in_date, check_out_date, paid_amount, due_amount]
    );
    console.log('INSERT query successful:', result.rows[0]?.id);

    // Fetch property name for WhatsApp message
    console.log('Fetching property name for ID:', property_id);
    const propResult = await query('SELECT title FROM properties WHERE id = $1', [property_id]);
    const propertyName = propResult.rows[0]?.title || 'Property';
    console.log('Property name fetched:', propertyName);

    // Simulate sending SMS/Text Message for testing
    console.log(`\n--- SMS SENT TO 8669505727 ---`);
    console.log(`LoonCamp E-Ticket for ${guest_name}: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/ticket/${ticket_id}`);
    console.log(`------------------------------\n`);

    return res.status(201).json({
      success: true,
      message: 'E-ticket created successfully.',
      data: {
        ...result.rows[0],
        property_name: propertyName
      }
    });
  } catch (error) {
    console.error('Create e-ticket error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create e-ticket.'
    });
  }
};

// Get e-ticket by ID
const getETicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const result = await query(
      `SELECT e.*, p.title as property_name, p.map_link 
       FROM etickets e 
       JOIN properties p ON e.property_id = p.id 
       WHERE e.ticket_id = $1`,
      [ticketId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'E-ticket not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get e-ticket error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch e-ticket.'
    });
  }
};

// Check if the request carries a valid admin JWT
function isAdminRequest(req) {
  try {
    const authHeader = req.headers['authorization'] || '';
    if (!authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.slice(7);
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret);
    return decoded && (decoded.role === 'admin' || decoded.email);
  } catch (_) {
    return false;
  }
}

// Get booking e-ticket (for the new booking flow)
// Supports both ?booking_id=... and ?token=... (secure tokenized URL)
const getBookingETicket = async (req, res) => {
  try {
    const bookingId = req.query.booking_id;
    const ticketToken = req.query.token;

    if (!bookingId && !ticketToken) {
      return res.status(400).json({ error: 'booking_id or token is required' });
    }

    let result;
    const bookingWithUnitSql = `
      SELECT b.*,
        p.slug AS property_slug,
        (SELECT pi.image_url FROM property_images pi
         WHERE pi.property_id = p.id ORDER BY pi.display_order, pi.id LIMIT 1) AS property_image,
        COALESCE(pu.check_in_time, p.check_in_time, '2:00 PM') AS check_in_time,
        COALESCE(pu.check_out_time, p.check_out_time, '11:00 AM') AS check_out_time,
        COALESCE(b.has_food, pu.has_food, p.has_food, true) AS has_food,
        COALESCE(pu.meal_plan, 'All Meals Package (AP)') AS meal_plan
      FROM bookings b
      LEFT JOIN property_units pu ON b.unit_id = pu.id
      LEFT JOIN properties p ON (p.property_id = b.property_id OR p.id::text = b.property_id OR p.slug = b.property_id)
    `;
    if (ticketToken) {
      result = await query(
        `${bookingWithUnitSql} WHERE b.ticket_token = $1`,
        [ticketToken]
      );
    } else {
      result = await query(
        `${bookingWithUnitSql} WHERE b.booking_id = $1`,
        [bookingId]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = result.rows[0];

    // Expiry check — admin users bypass this
    const now = new Date();
    const checkoutDate = new Date(booking.checkout_datetime);
    const isExpired = now > checkoutDate;
    const adminAccess = isAdminRequest(req);

    if (isExpired && !adminAccess) {
      return res.status(410).json({
        error: 'Booking expired',
        message: 'This booking has expired',
        booking_id: booking.booking_id,
        checkout_datetime: booking.checkout_datetime,
      });
    }

    // Payment in-flight: awaiting owner confirmation or being confirmed
    const pendingStatuses = [
      'PENDING_OWNER_CONFIRMATION',
      'BOOKING_REQUEST_SENT_TO_OWNER',
      'PAYMENT_SUCCESS',
      'OWNER_CONFIRMED',
    ];
    if (pendingStatuses.includes(booking.booking_status)) {
      const dueAmount = (booking.total_amount || 0) - booking.advance_amount;
      return res.status(200).json({
        booking_id: booking.booking_id,
        property_name: booking.property_name,
        guest_name: booking.guest_name,
        guest_phone: booking.guest_phone,
        advance_amount: booking.advance_amount,
        total_amount: booking.total_amount,
        due_amount: dueAmount,
        booking_status: booking.booking_status,
        payment_status: booking.payment_status,
        transaction_id: booking.transaction_id || null,
        payment_method: booking.payment_method || null,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
      });
    }

    // Payment failed or owner cancelled — return enough for UI display
    const softFailedStatuses = [
      'PAYMENT_FAILED',
      'CANCELLED_BY_OWNER',
      'CANCELLED_NO_REFUND',
      'FRAUD_DETECTED',
    ];
    if (softFailedStatuses.includes(booking.booking_status)) {
      return res.status(200).json({
        booking_id: booking.booking_id,
        property_name: booking.property_name,
        guest_name: booking.guest_name,
        advance_amount: booking.advance_amount,
        booking_status: booking.booking_status,
        payment_status: booking.payment_status,
        payment_failure_reason: booking.payment_failure_reason || null,
        transaction_id: booking.transaction_id || null,
        refund_status: booking.refund_status || null,
        created_at: booking.created_at,
      });
    }

    // Payment callback not yet received — still processing
    if (booking.booking_status === 'PAYMENT_PENDING') {
      return res.status(200).json({
        booking_id: booking.booking_id,
        property_name: booking.property_name,
        booking_status: booking.booking_status,
        payment_status: booking.payment_status,
        created_at: booking.created_at,
      });
    }

    if (booking.booking_status !== 'TICKET_GENERATED' &&
        booking.booking_status !== 'CONFIRMED') {
      return res.status(403).json({
        error: 'Ticket not available',
        message: 'E-ticket is not yet available for this booking',
        current_status: booking.booking_status,
      });
    }

    const dueAmount = (booking.total_amount || 0) - booking.advance_amount;

    const itemsRes = await query(
      `SELECT bi.*, COALESCE(pu.name, $2) AS unit_name, COALESCE(pu.accommodation_type, 'Stay') AS accommodation_type
         FROM booking_items bi
         LEFT JOIN property_units pu ON pu.id = bi.unit_id
        WHERE bi.booking_id = $1
        ORDER BY bi.id`,
      [booking.id, booking.property_name || 'Stay']
    );
    let items = itemsRes.rows.map((it) => ({
      id: it.id,
      unit_id: it.unit_id,
      unit_name: it.unit_name || booking.property_name || 'Stay',
      accommodation_type: it.accommodation_type || 'Stay',
      persons: Number(it.persons || booking.persons || 1),
      unit_quantity: Number(it.unit_quantity || booking.unit_quantity || 1),
      subtotal: Number(it.subtotal || 0),
    }));

    if (items.length === 0) {
      items = [{
        id: 0,
        unit_id: booking.unit_id || null,
        unit_name: booking.property_name || 'Stay',
        accommodation_type: booking.property_type || 'Stay',
        persons: Number(booking.persons || 1),
        unit_quantity: Number(booking.unit_quantity || 1),
        subtotal: Number(booking.total_amount || 0),
      }];
    }

    const ticketData = {
      booking_id: booking.booking_id,
      ticket_id: booking.ticket_id || ticketIdCandidate(booking.booking_id),
      property_name: booking.property_name,
      property_slug: booking.property_slug,
      property_image: booking.property_image,
      guest_name: booking.guest_name,
      guest_phone: booking.guest_phone,
      checkin_datetime: booking.checkin_datetime,
      checkout_datetime: booking.checkout_datetime,
      check_in_time: booking.check_in_time || '2:00 PM',
      check_out_time: booking.check_out_time || '11:00 AM',
      advance_amount: booking.advance_amount,
      due_amount: dueAmount,
      total_amount: booking.total_amount,
      owner_name: booking.owner_name,
      owner_phone: booking.owner_phone,
      map_link: booking.map_link,
      property_address: booking.property_address,
      persons: booking.persons,
      items,
      has_food: booking.has_food !== undefined && booking.has_food !== null ? Boolean(booking.has_food) : (Number(booking.veg_guest_count || 0) > 0 || Number(booking.nonveg_guest_count || 0) > 0),
      meal_plan: booking.meal_plan || null,
      veg_guest_count: booking.veg_guest_count !== null && booking.veg_guest_count !== undefined ? Number(booking.veg_guest_count) : (booking.has_food === false ? 0 : Number(booking.persons || 1)),
      nonveg_guest_count: booking.nonveg_guest_count !== null && booking.nonveg_guest_count !== undefined ? Number(booking.nonveg_guest_count) : 0,
      male_guest_count: booking.male_guest_count !== null && booking.male_guest_count !== undefined ? Number(booking.male_guest_count) : Number(booking.persons || 1),
      female_guest_count: booking.female_guest_count !== null && booking.female_guest_count !== undefined ? Number(booking.female_guest_count) : 0,
      booking_status: booking.booking_status,
      payment_status: booking.payment_status,
      transaction_id: booking.transaction_id,
      order_id: booking.order_id,
      created_at: booking.created_at,
    };

    return res.status(200).json(ticketData);
  } catch (error) {
    console.error('Error fetching booking e-ticket:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

module.exports = {
  createETicket,
  getETicketById,
  getBookingETicket
};
