const { pool, query } = require('../../db');
const { ticketIdCandidate } = require('../../utils/ticketId');
const { isBinaryProperty, isInventoryProperty, getPropertyCategoryLabel, getAccommodationUnitLabel } = require('../utils/categoryMode');

const number = (value, fallback = 0) => {
  const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};
const list = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) return parsed; } catch {}
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
};
const iso = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

async function ownerScope(ownerId, client = { query }) {
  const result = await client.query(
    `SELECT o.id AS owner_id, o.property_id, o.property_name, o.property_type,
            o.owner_name, o.owner_otp_number, o.owner_whatsapp_number,
            p.id AS property_db_id, p.slug, p.title, p.description, p.category,
            p.location, p.capacity, p.max_capacity, p.check_in_time, p.check_out_time, p.amenities,
            p.activities, p.highlights, p.policies, p.schedule,
            (SELECT COALESCE(json_agg(pi.image_url ORDER BY pi.display_order), '[]'::json)
             FROM property_images pi WHERE pi.property_id = p.id) AS images
     FROM owners o
     JOIN properties p ON p.property_id = o.property_id
     WHERE o.id = $1`,
    [ownerId]
  );
  return result.rows[0] || null;
}

const formatScope = (scope) => ({
  owner: {
    id: scope.owner_id,
    name: scope.owner_name,
    mobile: scope.owner_otp_number,
    whatsapp: scope.owner_whatsapp_number,
  },
  property: {
    id: scope.property_id,
    databaseId: scope.property_db_id,
    slug: scope.slug,
    title: scope.title,
    category: scope.category,
    location: scope.location,
    capacity: number(scope.capacity, 4),
    maxCapacity: number(scope.max_capacity, number(scope.capacity, 4)),
    description: scope.description,
    checkInTime: scope.check_in_time,
    checkOutTime: scope.check_out_time,
    amenities: list(scope.amenities),
    activities: list(scope.activities),
    highlights: list(scope.highlights),
    policies: list(scope.policies),
    schedule: list(scope.schedule),
    images: list(scope.images),
  },
});

async function unitForOwner(ownerId, unitId, client = { query }) {
  const scope = await ownerScope(ownerId, client);
  if (!scope) return { scope: null, unit: null };
  const result = await client.query(
    `SELECT * FROM property_units WHERE id = $1 AND property_id = $2`,
    [unitId, scope.property_db_id]
  );
  return { scope, unit: result.rows[0] || null };
}

async function dashboard(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    if (!scope) return res.status(404).json({ success: false, message: 'Owner property is not linked.' });
    const units = await query(
      `SELECT id, name, available_persons, total_persons, amenities, images,
              weekday_price, weekend_price, special_price, special_dates,
              description, check_in_time, check_out_time, highlights,
              activities, policies, schedule, location, title,
              has_food, meal_plan, veg_price, non_veg_price, kitchen_facility,
              extra_guest_price, security_deposit, bedrooms, bathrooms,
              bed_config, pet_friendly, smoking_allowed,
              total_inventory, accommodation_type
       FROM property_units WHERE property_id = $1 ORDER BY id`,
      [scope.property_db_id]
    );
    const propertyTotalCapacity = units.rows.reduce(
      (sum, u) => sum + (number(u.total_inventory, 1) * number(u.total_persons, 1)),
      0
    ) || number(scope.max_capacity, number(scope.capacity, 4));

    const formatted = formatScope(scope);
    formatted.property.totalCapacity = propertyTotalCapacity;
    formatted.property.maxCapacity = propertyTotalCapacity;
    formatted.property.capacity = propertyTotalCapacity;

    return res.json({
      success: true,
      ...formatted,
      units: units.rows.map((unit) => ({
        ...unit,
        amenities: list(unit.amenities),
        images: list(unit.images),
        highlights: list(unit.highlights),
        activities: list(unit.activities),
        policies: list(unit.policies),
        schedule: list(unit.schedule),
        special_dates: list(unit.special_dates),
        has_food: unit.has_food ?? true,
        meal_plan: unit.meal_plan || 'All Meals Package (AP)',
        veg_price: unit.veg_price || '800',
        non_veg_price: unit.non_veg_price || '1200',
        kitchen_facility: unit.kitchen_facility || '',
        total_inventory: Number(unit.total_inventory || 1),
        category_total_capacity: Number(unit.total_inventory || 1) * Number(unit.total_persons || 1),
        accommodation_type: unit.accommodation_type || (scope.category === 'camping_cottages' ? 'Tent' : scope.category === 'resort' || scope.category === 'homestay' ? 'Room' : 'Villa'),
      })),
    });
  } catch (error) { return next(error); }
}

async function createUnit(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    if (!scope) return res.status(404).json({ success: false, message: 'Owner property is not linked.' });
    const name = String(req.body.name || '').trim();
    const capacity = Math.max(1, number(req.body.total_persons, number(req.body.available_persons, 1)));
    const totalInventory = Math.max(1, number(req.body.total_inventory, 1));
    const accommodationType = String(req.body.accommodation_type || (scope.category === 'camping_cottages' ? 'Tent' : scope.category === 'resort' || scope.category === 'homestay' ? 'Room' : 'Villa')).trim();
    const weekday = Math.max(0, number(req.body.weekday_price));
    const weekend = Math.max(0, number(req.body.weekend_price, weekday));
    if (!name || !weekday) return res.status(400).json({ success: false, message: 'Unit name and weekday price are required.' });
    const hasFood = req.body.has_food !== undefined ? Boolean(req.body.has_food) : true;
    const result = await query(
      `INSERT INTO property_units (property_id, name, available_persons, total_persons,
        weekday_price, weekend_price, special_price, description, amenities, images,
        check_in_time, check_out_time, location, title,
        has_food, meal_plan, veg_price, non_veg_price, kitchen_facility,
        extra_guest_price, security_deposit, bedrooms, bathrooms,
        bed_config, pet_friendly, smoking_allowed, total_inventory, accommodation_type)
       VALUES ($1,$2,$3,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$2,
               $13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26) RETURNING *`,
      [
        scope.property_db_id, name, capacity, String(weekday), String(weekend),
        req.body.special_price ? String(number(req.body.special_price)) : null,
        String(req.body.description || ''),
        JSON.stringify(req.body.amenities || []),
        JSON.stringify(req.body.images || []),
        req.body.check_in_time || scope.check_in_time,
        req.body.check_out_time || scope.check_out_time,
        req.body.location || scope.location,
        hasFood,
        req.body.meal_plan || 'All Meals Package (AP)',
        String(req.body.veg_price ?? '800'),
        String(req.body.non_veg_price ?? '1200'),
        String(req.body.kitchen_facility || ''),
        String(req.body.extra_guest_price ?? '1000'),
        String(req.body.security_deposit ?? '5000'),
        number(req.body.bedrooms, 3),
        number(req.body.bathrooms, 3),
        String(req.body.bed_config || ''),
        req.body.pet_friendly !== undefined ? Boolean(req.body.pet_friendly) : true,
        Boolean(req.body.smoking_allowed),
        totalInventory,
        accommodationType,
      ]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { return next(error); }
}

async function updateUnit(req, res, next) {
  try {
    const { unit } = await unitForOwner(req.user.id, req.params.unitId);
    if (!unit) return res.status(404).json({ success: false, message: 'Unit not found.' });
    const name = String(req.body.name ?? unit.name).trim();
    const capacity = Math.max(1, number(req.body.total_persons, unit.total_persons));
    const totalInventory = Math.max(1, number(req.body.total_inventory, unit.total_inventory || 1));
    const accommodationType = String(req.body.accommodation_type || unit.accommodation_type || 'Tent').trim();
    const hasFood = req.body.has_food !== undefined ? Boolean(req.body.has_food) : (unit.has_food ?? true);
    const result = await query(
      `UPDATE property_units SET name=$1, available_persons=$2, total_persons=$2,
       weekday_price=$3, weekend_price=$4, special_price=$5, description=$6,
       amenities=$7, images=$8, check_in_time=$9, check_out_time=$10,
       location=$11, title=$1,
       has_food=$12, meal_plan=$13, veg_price=$14, non_veg_price=$15, kitchen_facility=$16,
       extra_guest_price=$17, security_deposit=$18, bedrooms=$19, bathrooms=$20,
       bed_config=$21, pet_friendly=$22, smoking_allowed=$23,
       total_inventory=$24, accommodation_type=$25,
       updated_at=NOW() WHERE id=$26 RETURNING *`,
      [
        name, capacity,
        String(number(req.body.weekday_price, number(unit.weekday_price))),
        String(number(req.body.weekend_price, number(unit.weekend_price))),
        req.body.special_price == null ? unit.special_price : String(number(req.body.special_price)),
        String(req.body.description ?? unit.description ?? ''),
        JSON.stringify(req.body.amenities ?? list(unit.amenities)),
        JSON.stringify(req.body.images ?? list(unit.images)),
        req.body.check_in_time ?? unit.check_in_time,
        req.body.check_out_time ?? unit.check_out_time,
        req.body.location ?? unit.location,
        hasFood,
        req.body.meal_plan ?? unit.meal_plan ?? 'All Meals Package (AP)',
        String(req.body.veg_price ?? unit.veg_price ?? '800'),
        String(req.body.non_veg_price ?? unit.non_veg_price ?? '1200'),
        String(req.body.kitchen_facility ?? unit.kitchen_facility ?? ''),
        String(req.body.extra_guest_price ?? unit.extra_guest_price ?? '1000'),
        String(req.body.security_deposit ?? unit.security_deposit ?? '5000'),
        number(req.body.bedrooms, number(unit.bedrooms, 3)),
        number(req.body.bathrooms, number(unit.bathrooms, 3)),
        String(req.body.bed_config ?? unit.bed_config ?? ''),
        req.body.pet_friendly !== undefined ? Boolean(req.body.pet_friendly) : (unit.pet_friendly ?? true),
        req.body.smoking_allowed !== undefined ? Boolean(req.body.smoking_allowed) : Boolean(unit.smoking_allowed),
        totalInventory,
        accommodationType,
        unit.id,
      ]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) { return next(error); }
}

async function deleteUnit(req, res, next) {
  try {
    const { unit } = await unitForOwner(req.user.id, req.params.unitId);
    if (!unit) return res.status(404).json({ success: false, message: 'Unit not found.' });
    const inUse = await query(
      `SELECT EXISTS(SELECT 1 FROM bookings WHERE unit_id=$1 AND booking_status NOT IN ('CANCELLED','DELETED'))
       OR EXISTS(SELECT 1 FROM ledger_entries WHERE unit_id=$1 AND COALESCE(status,'active')!='deleted') AS used`,
      [unit.id]
    );
    if (inUse.rows[0].used) return res.status(409).json({ success: false, message: 'This unit has active bookings or ledger entries and cannot be deleted.' });
    await query('DELETE FROM property_units WHERE id=$1', [unit.id]);
    return res.json({ success: true });
  } catch (error) { return next(error); }
}

async function calendar(req, res, next) {
  try {
    const { scope, unit } = await unitForOwner(req.user.id, req.query.unitId);
    if (!unit) return res.status(404).json({ success: false, message: 'Unit not found.' });
    const isVilla = isBinaryProperty(scope?.category || scope?.property_type);
    const excludeBookingId = req.query.excludeBookingId ? String(req.query.excludeBookingId).trim() : null;
    const start = req.query.start ? new Date(req.query.start) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = req.query.end ? new Date(req.query.end) : new Date(start);
    if (!req.query.end) end.setDate(end.getDate() + 89);
    const [stored, ledger, bookings, ownerReqs] = await Promise.all([
      query('SELECT date,price,available_quantity,is_special FROM unit_calendar WHERE unit_id=$1 AND date BETWEEN $2 AND $3', [unit.id, iso(start), iso(end)]),
      query("SELECT check_in::text,check_out::text,COALESCE(unit_quantity, 1) AS unit_quantity,persons FROM ledger_entries WHERE unit_id=$1 AND check_out>=$2 AND check_in<=$3 AND COALESCE(status,'active')!='deleted' AND (booking_id IS NULL OR booking_id = '')", [unit.id, iso(start), iso(end)]),
      query(
        `SELECT TO_CHAR(b.checkin_datetime, 'YYYY-MM-DD') AS check_in,
                TO_CHAR(b.checkout_datetime, 'YYYY-MM-DD') AS check_out,
                COALESCE(bi.unit_quantity, 1) AS unit_quantity,
                COALESCE(bi.persons, 1) AS persons,
                b.booking_status
         FROM booking_items bi
         JOIN bookings b ON b.id = bi.booking_id
         WHERE bi.unit_id = $1
           AND b.checkout_datetime::date >= $2
           AND b.checkin_datetime::date <= $3
           AND b.booking_status NOT IN ('CANCELLED','CANCELLED_BY_OWNER','OWNER_CANCELLED','REJECTED','DELETED','PAYMENT_FAILED')
           AND ($7::text IS NULL OR (b.booking_id != $7 AND b.id::text != $7))
         UNION ALL
         SELECT TO_CHAR(b.checkin_datetime, 'YYYY-MM-DD') AS check_in,
                TO_CHAR(b.checkout_datetime, 'YYYY-MM-DD') AS check_out,
                COALESCE(b.unit_quantity, 1) AS unit_quantity,
                COALESCE(b.persons, 1) AS persons,
                b.booking_status
         FROM bookings b
         WHERE (b.unit_id = $1 OR ($8 = true AND (b.unit_id IS NULL OR b.unit_id = 0) AND (b.property_id = $4 OR b.property_id = $5 OR b.property_id = $6)))
           AND b.checkout_datetime::date >= $2
           AND b.checkin_datetime::date <= $3
           AND b.booking_status NOT IN ('CANCELLED','CANCELLED_BY_OWNER','OWNER_CANCELLED','REJECTED','DELETED','PAYMENT_FAILED')
           AND ($7::text IS NULL OR (b.booking_id != $7 AND b.id::text != $7))
           AND NOT EXISTS (SELECT 1 FROM booking_items bi WHERE bi.booking_id = b.id)`,
        [unit.id, iso(start), iso(end), scope.property_id, String(scope.property_db_id), scope.slug, excludeBookingId, isVilla]
      ),
      query(
        `SELECT TO_CHAR(check_in, 'YYYY-MM-DD') AS check_in,
                TO_CHAR(check_out, 'YYYY-MM-DD') AS check_out,
                COALESCE(unit_quantity, 1) AS unit_quantity,
                COALESCE(guests_count, 1) AS persons,
                status
         FROM owner_booking_requests
         WHERE (villa_unit_id = $1 OR ($6 = true AND villa_unit_id IS NULL))
           AND (property_id = $4 OR owner_id = $5)
           AND check_out >= $2 AND check_in <= $3
           AND status NOT IN ('Rejected','Cancelled','Deleted')
           AND ($7::text IS NULL OR (request_code != $7 AND id::text != $7))`,
        [unit.id, iso(start), iso(end), scope.property_db_id, scope.owner_id, isVilla, excludeBookingId]
      ).catch(() => ({ rows: [] }))
    ]);
    const storedMap = new Map(stored.rows.map((row) => [iso(row.date), row]));
    const overlaps = (row, dayStr) => {
      const inDate = String(row.check_in).slice(0, 10);
      const outDate = String(row.check_out).slice(0, 10);
      return dayStr >= inDate && (outDate > inDate ? dayStr < outDate : dayStr === inDate);
    };
    const days = [];
    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
      const date = iso(day);
      const configured = storedMap.get(date);
      const activeBookings = [...ledger.rows, ...bookings.rows, ...(ownerReqs?.rows || [])].filter((row) => overlaps(row, date));

      const hardBookings = activeBookings.filter((row) => {
        const s = String(row.booking_status || row.status || '').toUpperCase();
        return ['CONFIRMED', 'OWNER_CONFIRMED', 'TICKET_GENERATED', 'ACCEPTED', 'ACTIVE', 'PAID'].includes(s)
          || row.source === 'offline' || (!row.booking_status && !row.status);
      });

      const softBookings = activeBookings.filter((row) => {
        const s = String(row.booking_status || row.status || '').toUpperCase();
        return ['PENDING', 'PENDING_OWNER_CONFIRMATION', 'BOOKING_REQUEST_SENT_TO_OWNER', 'PAYMENT_PENDING'].includes(s);
      });

      const hardOccupied = hardBookings.reduce((sum, row) => sum + number(row.unit_quantity, 1), 0);
      const softOccupied = softBookings.reduce((sum, row) => sum + number(row.unit_quantity, 1), 0);
      const capacity = number(unit.total_inventory, 1);
      const unitCapacityPerRoom = number(unit.total_persons, 1);
      const totalSeatsCapacity = capacity * unitCapacityPerRoom;

      let configuredCapacity = capacity;
      if (configured?.available_quantity !== undefined && configured?.available_quantity !== null) {
        configuredCapacity = Number(configured.available_quantity);
      }

      let hardAvailable = Math.max(0, configuredCapacity - hardOccupied);
      let softAvailable = Math.max(0, hardAvailable - softOccupied);

      const hardOccupiedPersons = hardBookings.reduce((sum, row) => sum + number(row.persons, number(row.unit_quantity, 1) * unitCapacityPerRoom), 0);
      const manuallyBlockedUnits = Math.max(0, capacity - configuredCapacity);
      const blockedSeatsCapacity = manuallyBlockedUnits * unitCapacityPerRoom;

      const bookedSeats = isVilla
        ? (hardOccupied > 0 || configuredCapacity === 0 ? totalSeatsCapacity : 0)
        : Math.min(totalSeatsCapacity, Math.max(hardOccupiedPersons + blockedSeatsCapacity, (capacity - hardAvailable) * unitCapacityPerRoom));
      const availableSeats = Math.max(0, totalSeatsCapacity - bookedSeats);

      let isBooked = false;
      let isPending = false;
      let available = hardAvailable;

      if (isVilla) {
        if (hardOccupied > 0 || configuredCapacity === 0) {
          isBooked = true;
          available = 0;
        } else if (softOccupied > 0) {
          isPending = true;
          available = 0;
        } else {
          available = 1;
        }
      } else {
        if (hardAvailable <= 0) {
          isBooked = true;
          available = 0;
        } else if (softOccupied > 0) {
          isPending = true;
          available = hardAvailable;
        }
      }

      const isLimited = !isBooked && !isPending && hardAvailable < capacity && !isVilla;
      const status = isBooked ? 'booked' : isPending ? 'pending' : isLimited ? 'limited' : 'available';
      const weekend = day.getDay() === 0 || day.getDay() === 6;

      days.push({
        date,
        status,
        is_booked: isBooked,
        is_pending: isPending,
        price: number(configured?.price, number(weekend ? unit.weekend_price : unit.weekday_price)),
        available_quantity: available,
        soft_available_quantity: softAvailable,
        configured_available_quantity: configuredCapacity,
        total_capacity: capacity,
        booked_quantity: hardOccupied,
        booked_seats: bookedSeats,
        total_seats: totalSeatsCapacity,
        available_seats: availableSeats,
        is_special: Boolean(configured?.is_special),
      });
    }
    return res.json({ success: true, data: days });
  } catch (error) { return next(error); }
}

async function updateRates(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { unit } = await unitForOwner(req.user.id, req.params.unitId, client);
    if (!unit) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, message: 'Unit not found.' }); }
    const weekday = Math.max(0, number(req.body.weekday_price, number(unit.weekday_price)));
    const weekend = Math.max(0, number(req.body.weekend_price, number(unit.weekend_price)));
    await client.query('UPDATE property_units SET weekday_price=$1,weekend_price=$2,special_price=$3,special_dates=$4,updated_at=NOW() WHERE id=$5', [String(weekday), String(weekend), req.body.special_price ? String(number(req.body.special_price)) : unit.special_price, JSON.stringify(req.body.special_dates || []), unit.id]);
    for (const special of req.body.special_dates || []) {
      if (!iso(special.date) || !number(special.price)) continue;
      await client.query(`INSERT INTO unit_calendar(unit_id,date,price,available_quantity,is_special,is_weekend) VALUES($1,$2,$3,$4,true,false) ON CONFLICT(unit_id,date) DO UPDATE SET price=EXCLUDED.price,is_special=true`, [unit.id, iso(special.date), number(special.price), unit.total_inventory || 1]);
    }
    await client.query('COMMIT');
    return res.json({ success: true });
  } catch (error) { await client.query('ROLLBACK'); return next(error); } finally { client.release(); }
}

async function updateDay(req, res, next) {
  try {
    const { scope, unit } = await unitForOwner(req.user.id, req.params.unitId);
    if (!unit) return res.status(404).json({ success: false, message: 'Unit not found.' });
    const date = iso(req.params.date);
    if (!date) return res.status(400).json({ success: false, message: 'Invalid date.' });

    // Handle Reset to Default Inventory
    if (req.body.reset_to_default) {
      await query(
        `DELETE FROM unit_calendar WHERE unit_id = $1 AND date = $2`,
        [unit.id, date]
      );
      return res.json({ success: true, message: 'Reset to default inventory' });
    }

    const totalInventory = number(unit.total_inventory, 1);
    const booked = req.body.status === 'booked';
    let targetAvailable = booked ? 0 : totalInventory;

    if (req.body.available_quantity !== undefined && req.body.available_quantity !== null) {
      targetAvailable = Math.max(0, Math.min(totalInventory, number(req.body.available_quantity)));
    }

    if (targetAvailable > 0 && (req.body.force || req.body.releaseBookings)) {
      // Clean up / soft-delete any offline ledger entries on this date so it's truly freed if requested
      await query(
        `UPDATE ledger_entries SET status='deleted'
         WHERE unit_id=$1 AND check_in<=$2 AND check_out>$2 AND COALESCE(status,'active')!='deleted'`,
        [unit.id, date]
      );
      if (isBinaryProperty(scope.category)) {
        await query(
          `UPDATE bookings SET booking_status='CANCELLED'
           WHERE (unit_id=$1 OR property_id=$3 OR property_id=$4 OR property_id=$5)
             AND (checkin_datetime AT TIME ZONE 'Asia/Kolkata')::date<=$2
             AND (checkout_datetime AT TIME ZONE 'Asia/Kolkata')::date>$2
             AND booking_status NOT IN ('CANCELLED','CANCELLED_BY_OWNER','OWNER_CANCELLED','REJECTED','DELETED')`,
          [unit.id, date, scope.property_id, String(scope.property_db_id), scope.slug]
        );
      } else {
        await query(
          `UPDATE bookings SET booking_status='CANCELLED'
           WHERE (unit_id=$1 OR EXISTS (SELECT 1 FROM booking_items bi WHERE bi.booking_id = bookings.id AND bi.unit_id = $1))
             AND (checkin_datetime AT TIME ZONE 'Asia/Kolkata')::date<=$2
             AND (checkout_datetime AT TIME ZONE 'Asia/Kolkata')::date>$2
             AND booking_status NOT IN ('CANCELLED','CANCELLED_BY_OWNER','OWNER_CANCELLED','REJECTED','DELETED')`,
          [unit.id, date]
        );
      }
    }

    const price = req.body.price !== undefined && req.body.price !== null
      ? number(req.body.price)
      : number(unit.weekday_price);

    await query(
      `INSERT INTO unit_calendar(unit_id, date, price, available_quantity, is_special, is_weekend) 
       VALUES($1, $2, $3, $4, false, $5) 
       ON CONFLICT(unit_id, date) 
       DO UPDATE SET price = COALESCE(NULLIF(EXCLUDED.price, 0), unit_calendar.price),
                     available_quantity = EXCLUDED.available_quantity`,
      [
        unit.id,
        date,
        price,
        targetAvailable,
        [0, 6].includes(new Date(`${date}T12:00:00`).getDay()),
      ]
    );
    return res.json({ success: true, available_quantity: targetAvailable });
  } catch (error) { return next(error); }
}

async function ledger(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    if (!scope) return res.status(404).json({ success: false, message: 'Owner property is not linked.' });
    const year = Math.max(2000, number(req.query.year, new Date().getFullYear()));
    const month = Math.min(12, Math.max(1, number(req.query.month, new Date().getMonth() + 1)));
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = iso(new Date(year, month, 0));
    const unitFilter = req.query.unitId && req.query.unitId !== 'all' ? number(req.query.unitId) : null;
    const result = await query(
      `SELECT le.id, le.customer_name, le.persons, le.check_in::text, le.check_out::text,
              le.payment_mode, le.amount, le.amount AS total_amount, NULL::numeric AS advance_amount,
              le.unit_id, pu.name AS unit_name, 'offline' AS source,
              le.status AS booking_status, le.note, NULL::text AS booking_id, NULL::text AS guest_phone,
              NULL::text AS stored_ticket_id,
              le.veg_count AS veg_guest_count,
              le.non_veg_count AS nonveg_guest_count,
              le.male_count AS male_guest_count,
              le.female_count AS female_guest_count,
              COALESCE(pu.check_in_time, '2:00 PM') AS check_in_time,
              COALESCE(pu.check_out_time, '11:00 AM') AS check_out_time,
              le.created_at,
              '[]'::json AS items
       FROM ledger_entries le LEFT JOIN property_units pu ON pu.id=le.unit_id
       WHERE (le.property_id=$1 OR le.property_id=$2 OR pu.property_id=$3)
         AND COALESCE(le.status,'active')!='deleted'
         AND le.check_in<=$4 AND le.check_out>=$5
         AND ($6::int IS NULL OR le.unit_id=$6)
       UNION ALL
       SELECT b.id, b.guest_name AS customer_name, COALESCE(b.persons,1) AS persons,
              TO_CHAR(b.checkin_datetime, 'YYYY-MM-DD') AS check_in,
              TO_CHAR(b.checkout_datetime, 'YYYY-MM-DD') AS check_out,
              b.payment_method AS payment_mode, COALESCE(b.total_amount,0) AS amount,
              COALESCE(b.total_amount,0) AS total_amount, COALESCE(b.advance_amount,0) AS advance_amount,
              COALESCE(b.unit_id, $3) AS unit_id,
              COALESCE(
                (
                  SELECT string_agg(pu_item.name || ' (' || bi.unit_quantity || ')', ', ')
                  FROM booking_items bi
                  JOIN property_units pu_item ON pu_item.id = bi.unit_id
                  WHERE bi.booking_id = b.id
                ),
                pu.name,
                CASE WHEN p.category = 'villa' THEN 'Main Villa' ELSE 'Main Stay' END
              ) AS unit_name,
              'website' AS source, b.booking_status AS booking_status,
              NULL::text AS note, b.booking_id, b.guest_phone,
              b.ticket_id AS stored_ticket_id,
              b.veg_guest_count,
              b.nonveg_guest_count,
              b.male_guest_count,
              b.female_guest_count,
              COALESCE(pu.check_in_time, p.check_in_time, '2:00 PM') AS check_in_time,
              COALESCE(pu.check_out_time, p.check_out_time, '11:00 AM') AS check_out_time,
              b.created_at,
              COALESCE((
                SELECT json_agg(json_build_object(
                  'unitId', bi.unit_id,
                  'unitName', pu_item.name,
                  'accommodationType', pu_item.accommodation_type,
                  'persons', bi.persons,
                  'unitQuantity', bi.unit_quantity,
                  'subtotal', bi.subtotal
                ))
                FROM booking_items bi
                JOIN property_units pu_item ON pu_item.id = bi.unit_id
                WHERE bi.booking_id = b.id
              ), '[]'::json) AS items
       FROM bookings b 
       LEFT JOIN property_units pu ON pu.id=b.unit_id
       LEFT JOIN properties p ON (p.property_id=b.property_id OR p.id::text=b.property_id OR p.slug=b.property_id)
       WHERE (b.property_id=$1 OR b.property_id=$2 OR b.property_id=$7)
         AND b.checkin_datetime::date<=$4
         AND b.checkout_datetime::date>=$5
         AND b.booking_status NOT IN ('DELETED')
         AND ($6::int IS NULL OR b.unit_id=$6 OR (b.unit_id IS NULL AND $3=$6) OR EXISTS(SELECT 1 FROM booking_items WHERE booking_id=b.id AND unit_id=$6))
       UNION ALL
       SELECT obr.id, obr.guest_name AS customer_name, COALESCE(obr.guests_count,1) AS persons,
              TO_CHAR(obr.check_in, 'YYYY-MM-DD') AS check_in,
              TO_CHAR(obr.check_out, 'YYYY-MM-DD') AS check_out,
              'offline' AS payment_mode, COALESCE(obr.total_amount,0) AS amount,
              COALESCE(obr.total_amount,0) AS total_amount, COALESCE(obr.advance_amount,0) AS advance_amount,
              COALESCE(obr.villa_unit_id, $3) AS unit_id, COALESCE(obr.villa_unit_name, $9) AS unit_name,
              obr.request_source AS source, obr.status AS booking_status,
              obr.notes AS note, obr.request_code AS booking_id, obr.guest_phone,
              NULL::text AS stored_ticket_id,
              obr.veg_count AS veg_guest_count,
              obr.non_veg_count AS nonveg_guest_count,
              obr.male_count AS male_guest_count,
              obr.female_count AS female_guest_count,
              '2:00 PM' AS check_in_time,
              '11:00 AM' AS check_out_time,
              obr.created_at,
              '[]'::json AS items
       FROM owner_booking_requests obr
       WHERE (obr.property_id=$3 OR obr.owner_id=$8)
         AND obr.check_in<=$4
         AND obr.check_out>=$5
         AND obr.status NOT IN ('Deleted')
         AND ($6::int IS NULL OR obr.villa_unit_id=$6 OR (obr.villa_unit_id IS NULL AND $3=$6))
       ORDER BY check_in DESC`,
      [scope.property_id, String(scope.property_db_id), scope.property_db_id, end, start, unitFilter, scope.slug, scope.owner_id, (scope.category === 'villa' ? 'Main Villa' : 'Main Stay')]
    );
    return res.json({
      success: true,
      data: result.rows.map(({ stored_ticket_id, ...entry }) => ({
        ...entry,
        ticket_id: stored_ticket_id || (entry.source === 'website' && entry.booking_id
          ? ticketIdCandidate(entry.booking_id) : null),
      })),
    });
  } catch (error) { return next(error); }
}

async function createLedger(req, res, next) {
  try {
    const { scope, unit } = await unitForOwner(req.user.id, req.body.unit_id);
    if (!scope || !unit) return res.status(404).json({ success: false, message: 'Unit not found.' });
    const checkIn = iso(req.body.check_in); const checkOut = iso(req.body.check_out);
    const persons = Math.max(1, number(req.body.persons, 1));
    const maxCategoryCapacity = isBinaryProperty(scope.category)
      ? number(unit.total_persons, 1)
      : number(unit.total_inventory, 1) * number(unit.total_persons, 1);
    if (persons > maxCategoryCapacity) {
      return res.status(400).json({
        success: false,
        message: `Guest count exceeds maximum capacity for this accommodation type (max ${maxCategoryCapacity} guests).`
      });
    }
    const conflict = await query(`SELECT EXISTS(SELECT 1 FROM ledger_entries WHERE unit_id=$1 AND check_in<$3 AND check_out>$2 AND COALESCE(status,'active')!='deleted') OR EXISTS(SELECT 1 FROM bookings WHERE unit_id=$1 AND checkin_datetime::date<$3 AND checkout_datetime::date>$2 AND booking_status NOT IN ('CANCELLED','CANCELLED_BY_OWNER','OWNER_CANCELLED','REJECTED','DELETED','PAYMENT_FAILED')) AS used`, [unit.id, checkIn, checkOut]);
    if (conflict.rows[0].used && scope.category === 'villa') return res.status(409).json({ success: false, message: 'The unit is already booked for these dates.' });
    const result = await query(`INSERT INTO ledger_entries(property_id,unit_id,customer_name,persons,check_in,check_out,payment_mode,amount,note,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'active') RETURNING *`, [scope.property_id, unit.id, String(req.body.customer_name).trim(), persons, checkIn, checkOut, req.body.payment_mode === 'online' ? 'online' : 'offline', number(req.body.amount), String(req.body.note || '')]);
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { return next(error); }
}

async function updateLedger(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    const existing = scope ? await query(`SELECT le.* FROM ledger_entries le LEFT JOIN property_units pu ON pu.id=le.unit_id WHERE le.id=$1 AND pu.property_id=$2 AND le.booking_id IS NULL`, [req.params.entryId, scope.property_db_id]) : { rows: [] };
    if (!existing.rows.length) return res.status(404).json({ success: false, message: 'Offline ledger entry not found.' });
    const old = existing.rows[0]; const checkIn = iso(req.body.check_in || old.check_in); const checkOut = iso(req.body.check_out || old.check_out);
    const result = await query(`UPDATE ledger_entries SET customer_name=$1,persons=$2,check_in=$3,check_out=$4,payment_mode=$5,amount=$6,note=$7 WHERE id=$8 RETURNING *`, [String(req.body.customer_name ?? old.customer_name).trim(), Math.max(1,number(req.body.persons,old.persons)), checkIn, checkOut, req.body.payment_mode ?? old.payment_mode, number(req.body.amount,old.amount), String(req.body.note ?? old.note ?? ''), old.id]);
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) { return next(error); }
}

async function deleteLedger(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    const result = scope ? await query(`UPDATE ledger_entries le SET status='deleted' FROM property_units pu WHERE le.id=$1 AND le.unit_id=pu.id AND pu.property_id=$2 AND le.booking_id IS NULL RETURNING le.id`, [req.params.entryId, scope.property_db_id]) : { rows: [] };
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Offline ledger entry not found.' });
    return res.json({ success: true });
  } catch (error) { return next(error); }
}

async function updateProfile(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); const scope = await ownerScope(req.user.id, client);
    if (!scope) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, message: 'Owner property is not linked.' }); }
    await client.query('UPDATE owners SET owner_name=$1,owner_whatsapp_number=$2 WHERE id=$3', [String(req.body.ownerName ?? scope.owner_name).trim(), String(req.body.whatsapp ?? scope.owner_whatsapp_number ?? '').replace(/\D/g,''), scope.owner_id]);
    await client.query(`UPDATE properties SET title=$1,description=$2,location=$3,check_in_time=$4,check_out_time=$5,amenities=$6,activities=$7,highlights=$8,policies=$9,schedule=$10,updated_at=NOW() WHERE id=$11`, [String(req.body.title ?? scope.title).trim(), String(req.body.description ?? scope.description), String(req.body.location ?? scope.location), req.body.checkInTime ?? scope.check_in_time, req.body.checkOutTime ?? scope.check_out_time, JSON.stringify(req.body.amenities ?? list(scope.amenities)), JSON.stringify(req.body.activities ?? list(scope.activities)), JSON.stringify(req.body.highlights ?? list(scope.highlights)), JSON.stringify(req.body.policies ?? list(scope.policies)), JSON.stringify(req.body.schedule ?? list(scope.schedule)), scope.property_db_id]);
    if (Array.isArray(req.body.images)) {
      await client.query('DELETE FROM property_images WHERE property_id=$1', [scope.property_db_id]);
      for (let index = 0; index < req.body.images.length; index += 1) {
        const imageUrl = String(req.body.images[index] || '').trim();
        if (imageUrl) await client.query('INSERT INTO property_images(property_id,image_url,display_order) VALUES($1,$2,$3)', [scope.property_db_id, imageUrl, index]);
      }
    }
    await client.query('UPDATE owners SET property_name=$1 WHERE id=$2', [String(req.body.title ?? scope.title).trim(), scope.owner_id]);
    await client.query('COMMIT'); return res.json({ success: true });
  } catch (error) { await client.query('ROLLBACK'); return next(error); } finally { client.release(); }
}

async function getExpenses(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    if (!scope) return res.status(404).json({ success: false, message: 'Owner property is not linked.' });
    const result = await query(
      `SELECT id, expense_code, date, category, amount, villa_unit_id, villa_unit_name, paid_to, payment_method, description, created_at
       FROM owner_expenses
       WHERE property_id = $1 OR owner_id = $2
       ORDER BY date DESC, id DESC`,
      [scope.property_db_id, scope.owner_id]
    );
    return res.json({
      success: true,
      data: result.rows.map((row) => ({
        id: row.expense_code || `EXP-${row.id}`,
        dbId: row.id,
        date: iso(row.date) || row.date,
        category: row.category,
        amount: Number(row.amount),
        villaUnitId: row.villa_unit_id,
        villaUnitName: row.villa_unit_name,
        paidTo: row.paid_to,
        paymentMethod: row.payment_method,
        description: row.description,
        createdAt: row.created_at,
      })),
    });
  } catch (error) { return next(error); }
}

async function createExpense(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    if (!scope) return res.status(404).json({ success: false, message: 'Owner property is not linked.' });
    const { date, category, amount, villaUnitId, villaUnitName, paidTo, paymentMethod, description, id: customCode } = req.body;
    const cleanDate = iso(date) || iso(new Date());
    const cleanAmount = Math.max(0, number(amount));
    if (!category || !cleanAmount) return res.status(400).json({ success: false, message: 'Category and amount are required.' });

    const result = await query(
      `INSERT INTO owner_expenses (property_id, owner_id, expense_code, date, category, amount, villa_unit_id, villa_unit_name, paid_to, payment_method, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        scope.property_db_id,
        scope.owner_id,
        customCode || `EXP-${Date.now().toString().slice(-4)}`,
        cleanDate,
        category,
        cleanAmount,
        villaUnitId ? number(villaUnitId) : null,
        villaUnitName || null,
        paidTo || null,
        paymentMethod || 'Cash',
        description || '',
      ]
    );
    const row = result.rows[0];
    return res.status(201).json({
      success: true,
      data: {
        id: row.expense_code || `EXP-${row.id}`,
        dbId: row.id,
        date: iso(row.date) || row.date,
        category: row.category,
        amount: Number(row.amount),
        villaUnitId: row.villa_unit_id,
        villaUnitName: row.villa_unit_name,
        paidTo: row.paid_to,
        paymentMethod: row.payment_method,
        description: row.description,
        createdAt: row.created_at,
      },
    });
  } catch (error) { return next(error); }
}

async function deleteExpense(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    if (!scope) return res.status(404).json({ success: false, message: 'Owner property is not linked.' });
    const target = req.params.id;
    const isNum = /^\d+$/.test(target);
    await query(
      `DELETE FROM owner_expenses
       WHERE (property_id = $1 OR owner_id = $2)
       AND (id = $3 OR expense_code = $4)`,
      [scope.property_db_id, scope.owner_id, isNum ? Number(target) : -1, target]
    );
    return res.json({ success: true });
  } catch (error) { return next(error); }
}

// ==================== STAFF & HOUSEKEEPING ====================

async function getStaff(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    if (!scope) return res.status(404).json({ success: false, message: 'Owner property is not linked.' });
    const result = await query(
      `SELECT id, staff_code, name, role, mobile, assigned_villa, is_active, monthly_salary, joining_date, created_at
       FROM owner_staff
       WHERE property_id = $1 OR owner_id = $2
       ORDER BY id ASC`,
      [scope.property_db_id, scope.owner_id]
    );
    return res.json({
      success: true,
      data: result.rows.map((row) => ({
        id: row.staff_code || `STF-${row.id}`,
        dbId: row.id,
        name: row.name,
        role: row.role,
        mobile: row.mobile,
        assignedVilla: row.assigned_villa,
        isActive: row.is_active,
        monthlySalary: Number(row.monthly_salary),
        joiningDate: iso(row.joining_date) || row.joining_date,
      })),
    });
  } catch (error) { return next(error); }
}

async function saveStaff(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    if (!scope) return res.status(404).json({ success: false, message: 'Owner property is not linked.' });
    const { id, name, role, mobile, assignedVilla, isActive, monthlySalary, joiningDate } = req.body;
    if (!name || !role) return res.status(400).json({ success: false, message: 'Name and role are required.' });

    let row;
    const isNum = id && /^\d+$/.test(String(id));
    if (id) {
      const existing = await query(
        `SELECT id FROM owner_staff WHERE (property_id = $1 OR owner_id = $2) AND (id = $3 OR staff_code = $4)`,
        [scope.property_db_id, scope.owner_id, isNum ? Number(id) : -1, String(id)]
      );
      if (existing.rows.length > 0) {
        const updateRes = await query(
          `UPDATE owner_staff
           SET name = $1, role = $2, mobile = $3, assigned_villa = $4, is_active = $5, monthly_salary = $6, joining_date = $7, updated_at = NOW()
           WHERE id = $8
           RETURNING *`,
          [name, role, mobile || '', assignedVilla || '', isActive !== false, number(monthlySalary), iso(joiningDate) || null, existing.rows[0].id]
        );
        row = updateRes.rows[0];
      }
    }

    if (!row) {
      const insertRes = await query(
        `INSERT INTO owner_staff (property_id, owner_id, staff_code, name, role, mobile, assigned_villa, is_active, monthly_salary, joining_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          scope.property_db_id,
          scope.owner_id,
          id || `STF-${Date.now().toString().slice(-4)}`,
          name,
          role,
          mobile || '',
          assignedVilla || '',
          isActive !== false,
          number(monthlySalary),
          iso(joiningDate) || null,
        ]
      );
      row = insertRes.rows[0];
    }

    return res.json({
      success: true,
      data: {
        id: row.staff_code || `STF-${row.id}`,
        dbId: row.id,
        name: row.name,
        role: row.role,
        mobile: row.mobile,
        assignedVilla: row.assigned_villa,
        isActive: row.is_active,
        monthlySalary: Number(row.monthly_salary),
        joiningDate: iso(row.joining_date) || row.joining_date,
      },
    });
  } catch (error) { return next(error); }
}

async function deleteStaff(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    if (!scope) return res.status(404).json({ success: false, message: 'Owner property is not linked.' });
    const target = req.params.id;
    const isNum = /^\d+$/.test(target);
    await query(
      `DELETE FROM owner_staff WHERE (property_id = $1 OR owner_id = $2) AND (id = $3 OR staff_code = $4)`,
      [scope.property_db_id, scope.owner_id, isNum ? Number(target) : -1, target]
    );
    return res.json({ success: true });
  } catch (error) { return next(error); }
}

async function getStaffAttendance(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    if (!scope) return res.status(404).json({ success: false, message: 'Owner property is not linked.' });
    const result = await query(
      `SELECT a.id, a.staff_id, COALESCE(s.staff_code, a.staff_code, a.staff_id::text) AS staff_code_ref, a.date, a.status, a.notes
       FROM owner_staff_attendance a
       JOIN owner_staff s ON s.id = a.staff_id
       WHERE a.property_id = $1 OR s.owner_id = $2
       ORDER BY a.date DESC`,
      [scope.property_db_id, scope.owner_id]
    );
    return res.json({
      success: true,
      data: result.rows.map((r) => ({
        date: iso(r.date) || r.date,
        staffId: r.staff_code_ref,
        status: r.status,
        notes: r.notes,
      })),
    });
  } catch (error) { return next(error); }
}

async function markStaffAttendance(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    if (!scope) return res.status(404).json({ success: false, message: 'Owner property is not linked.' });
    const { date, staffId, status, notes } = req.body;
    if (!date || !staffId || !status) return res.status(400).json({ success: false, message: 'Date, staffId and status are required.' });

    const isNum = /^\d+$/.test(String(staffId));
    const staffRes = await query(
      `SELECT id, staff_code FROM owner_staff WHERE (property_id = $1 OR owner_id = $2) AND (id = $3 OR staff_code = $4)`,
      [scope.property_db_id, scope.owner_id, isNum ? Number(staffId) : -1, String(staffId)]
    );
    if (staffRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Staff member not found.' });

    const staffDbId = staffRes.rows[0].id;
    const staffCode = staffRes.rows[0].staff_code || `STF-${staffDbId}`;
    const cleanDate = iso(date);

    await query(
      `INSERT INTO owner_staff_attendance (property_id, staff_id, staff_code, date, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (staff_id, date)
       DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes`,
      [scope.property_db_id, staffDbId, staffCode, cleanDate, status, notes || '']
    );
    return res.json({ success: true });
  } catch (error) { return next(error); }
}

async function getStaffPayments(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    if (!scope) return res.status(404).json({ success: false, message: 'Owner property is not linked.' });
    const result = await query(
      `SELECT p.id, p.payment_code, p.staff_id, COALESCE(s.staff_code, p.staff_code, p.staff_id::text) AS staff_code_ref,
              p.period, p.expected_pay, p.amount_paid, p.pending_amount, p.payment_date, p.payment_status, p.notes, p.created_at
       FROM owner_staff_payments p
       LEFT JOIN owner_staff s ON s.id = p.staff_id
       WHERE p.property_id = $1
       ORDER BY p.id DESC`,
      [scope.property_db_id]
    );
    return res.json({
      success: true,
      data: result.rows.map((r) => ({
        id: r.payment_code || `PAY-${r.id}`,
        dbId: r.id,
        staffId: r.staff_code_ref,
        period: r.period,
        expectedPay: Number(r.expected_pay),
        amountPaid: Number(r.amount_paid),
        pendingAmount: Number(r.pending_amount),
        paymentDate: iso(r.payment_date) || r.payment_date,
        paymentStatus: r.payment_status,
        notes: r.notes,
      })),
    });
  } catch (error) { return next(error); }
}

async function saveStaffPayment(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    if (!scope) return res.status(404).json({ success: false, message: 'Owner property is not linked.' });
    const { id, staffId, period, expectedPay, amountPaid, pendingAmount, paymentDate, paymentStatus, notes } = req.body;
    if (!staffId || !period) return res.status(400).json({ success: false, message: 'Staff ID and period are required.' });

    const isNum = /^\d+$/.test(String(staffId));
    const staffRes = await query(
      `SELECT id, staff_code FROM owner_staff WHERE (property_id = $1 OR owner_id = $2) AND (id = $3 OR staff_code = $4)`,
      [scope.property_db_id, scope.owner_id, isNum ? Number(staffId) : -1, String(staffId)]
    );
    const staffDbId = staffRes.rows.length > 0 ? staffRes.rows[0].id : null;
    const staffCode = staffRes.rows.length > 0 ? staffRes.rows[0].staff_code : String(staffId);

    const paymentCode = id || `PAY-${Date.now().toString().slice(-4)}`;
    const result = await query(
      `INSERT INTO owner_staff_payments (payment_code, property_id, staff_id, staff_code, period, expected_pay, amount_paid, pending_amount, payment_date, payment_status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        paymentCode,
        scope.property_db_id,
        staffDbId,
        staffCode,
        period,
        number(expectedPay),
        number(amountPaid),
        number(pendingAmount),
        iso(paymentDate) || null,
        paymentStatus || 'Pending',
        notes || '',
      ]
    );
    const r = result.rows[0];
    return res.json({
      success: true,
      data: {
        id: r.payment_code || `PAY-${r.id}`,
        dbId: r.id,
        staffId: staffCode,
        period: r.period,
        expectedPay: Number(r.expected_pay),
        amountPaid: Number(r.amount_paid),
        pendingAmount: Number(r.pending_amount),
        paymentDate: iso(r.payment_date) || r.payment_date,
        paymentStatus: r.payment_status,
        notes: r.notes,
      },
    });
  } catch (error) { return next(error); }
}

// ==================== BOOKING REQUESTS / ENQUIRIES ====================

async function getBookingRequests(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    if (!scope) return res.status(404).json({ success: false, message: 'Owner property is not linked.' });
    const result = await query(
      `SELECT id, request_code, guest_name, guest_phone, guest_email, villa_unit_id, villa_unit_name,
              check_in, check_out, nights, guests_count, total_amount, advance_amount, request_source, status, notes, created_at, stored_ticket_id,
              veg_guest_count, nonveg_guest_count, male_guest_count, female_guest_count, check_in_time, check_out_time, items
       FROM (
          SELECT obr.id::text AS id, obr.request_code, obr.guest_name, obr.guest_phone, obr.guest_email,
                 obr.villa_unit_id, obr.villa_unit_name,
                 obr.check_in::text AS check_in, obr.check_out::text AS check_out,
                 obr.nights, obr.guests_count, obr.total_amount, obr.advance_amount,
                 obr.request_source, obr.status, obr.notes, obr.created_at,
                 NULL::text AS stored_ticket_id,
                 obr.veg_count AS veg_guest_count,
                 obr.non_veg_count AS nonveg_guest_count,
                 obr.male_count AS male_guest_count,
                 obr.female_count AS female_guest_count,
                 '2:00 PM' AS check_in_time,
                 '11:00 AM' AS check_out_time,
                 '[]'::json AS items
          FROM owner_booking_requests obr
          WHERE obr.property_id = $1 OR obr.owner_id = $2
          UNION ALL
          SELECT b.booking_id AS id, b.booking_id AS request_code, b.guest_name, b.guest_phone,
                 NULL::text AS guest_email, COALESCE(b.unit_id, $1) AS villa_unit_id,
                 COALESCE(
                   (
                     SELECT string_agg(pu_item.name || ' (' || bi.unit_quantity || ')', ', ')
                     FROM booking_items bi
                     JOIN property_units pu_item ON pu_item.id = bi.unit_id
                     WHERE bi.booking_id = b.id
                   ),
                   pu.name,
                   CASE WHEN p.category = 'villa' THEN 'Main Villa' ELSE 'Main Stay' END
                 ) AS villa_unit_name,
                 TO_CHAR(b.checkin_datetime, 'YYYY-MM-DD') AS check_in,
                 TO_CHAR(b.checkout_datetime, 'YYYY-MM-DD') AS check_out,
                 GREATEST(1, (b.checkout_datetime::date - b.checkin_datetime::date)) AS nights,
                 COALESCE(b.persons, 1) AS guests_count,
                 COALESCE(b.total_amount, 0) AS total_amount,
                 COALESCE(b.advance_amount, 0) AS advance_amount,
                 'Website' AS request_source,
                 CASE 
                   WHEN b.booking_status IN ('CONFIRMED', 'OWNER_CONFIRMED', 'TICKET_GENERATED') THEN 'Accepted'
                   WHEN b.booking_status IN ('CANCELLED', 'CANCELLED_BY_OWNER', 'OWNER_CANCELLED', 'REJECTED') THEN 'Rejected'
                   WHEN b.booking_status = 'OFFLINE' THEN 'Offline'
                   ELSE 'Pending'
                 END AS status,
                 NULL::text AS notes,
                 b.created_at, b.ticket_id AS stored_ticket_id,
                 b.veg_guest_count,
                 b.nonveg_guest_count,
                 b.male_guest_count,
                 b.female_guest_count,
                 COALESCE(pu.check_in_time, p.check_in_time, '2:00 PM') AS check_in_time,
                 COALESCE(pu.check_out_time, p.check_out_time, '11:00 AM') AS check_out_time,
                 COALESCE((
                   SELECT json_agg(json_build_object(
                     'unitId', bi.unit_id,
                     'unitName', pu_item.name,
                     'accommodationType', pu_item.accommodation_type,
                     'persons', bi.persons,
                     'unitQuantity', bi.unit_quantity,
                     'subtotal', bi.subtotal
                   ))
                   FROM booking_items bi
                   JOIN property_units pu_item ON pu_item.id = bi.unit_id
                   WHERE bi.booking_id = b.id
                 ), '[]'::json) AS items
          FROM bookings b
          LEFT JOIN property_units pu ON pu.id = b.unit_id
          LEFT JOIN properties p ON (p.property_id = $3 OR p.id::text = $1::text OR p.slug = $4)
          WHERE (b.property_id = $3 OR b.property_id = $1::text OR b.property_id = $4)
            AND b.booking_status NOT IN ('DELETED')
       ) combined
       ORDER BY created_at DESC, id DESC`,
      [scope.property_db_id, scope.owner_id, scope.property_id, scope.slug]
    );
    return res.json({
      success: true,
      data: result.rows.map((r) => ({
        id: r.request_code || `REQ-${r.id}`,
        ticketId: r.stored_ticket_id || (String(r.request_code || '').startsWith('PHC-')
          ? ticketIdCandidate(r.request_code) : null),
        dbId: r.id,
        guestName: r.guest_name,
        guestPhone: r.guest_phone,
        guestEmail: r.guest_email,
        villaUnitId: r.villa_unit_id,
        villaUnitName: r.villa_unit_name || 'All Units',
        checkIn: iso(r.check_in) || r.check_in,
        checkOut: iso(r.check_out) || r.check_out,
        nights: Number(r.nights) || 1,
        guestsCount: Number(r.guests_count) || 2,
        totalAmount: Number(r.total_amount) || 0,
        advanceAmount: Number(r.advance_amount) || 0,
        requestSource: r.request_source || 'Website',
        requestDate: r.created_at,
        status: r.status || 'Pending',
        notes: r.notes,
        vegGuestCount: r.veg_guest_count !== null && r.veg_guest_count !== undefined ? Number(r.veg_guest_count) : null,
        nonVegGuestCount: r.nonveg_guest_count !== null && r.nonveg_guest_count !== undefined ? Number(r.nonveg_guest_count) : null,
        maleGuestCount: r.male_guest_count !== null && r.male_guest_count !== undefined ? Number(r.male_guest_count) : null,
        femaleGuestCount: r.female_guest_count !== null && r.female_guest_count !== undefined ? Number(r.female_guest_count) : null,
        checkInTime: r.check_in_time || '2:00 PM',
        checkOutTime: r.check_out_time || '11:00 AM',
        items: r.items || [],
      })),
    });
  } catch (error) { return next(error); }
}

async function saveBookingRequest(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    if (!scope) return res.status(404).json({ success: false, message: 'Owner property is not linked.' });
    const { id, guestName, guestPhone, guestEmail, villaUnitId, villaUnitName, checkIn, checkOut, nights, guestsCount, totalAmount, advanceAmount, requestSource, status, notes } = req.body;
    if (!guestName || !guestPhone || !checkIn || !checkOut) {
      return res.status(400).json({ success: false, message: 'Guest name, phone, check-in, and check-out are required.' });
    }

    const requestCode = id || `REQ-${Date.now().toString().slice(-4)}`;
    const result = await query(
      `INSERT INTO owner_booking_requests (
        property_id, owner_id, request_code, guest_name, guest_phone, guest_email,
        villa_unit_id, villa_unit_name, check_in, check_out, nights, guests_count,
        total_amount, advance_amount, request_source, status, notes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        scope.property_db_id,
        scope.owner_id,
        requestCode,
        guestName,
        guestPhone,
        guestEmail || null,
        villaUnitId ? number(villaUnitId) : null,
        villaUnitName || null,
        iso(checkIn),
        iso(checkOut),
        number(nights, 1),
        number(guestsCount, 2),
        number(totalAmount, 0),
        number(advanceAmount, 0),
        requestSource || 'Website',
        status || 'Pending',
        notes || '',
      ]
    );
    const r = result.rows[0];
    return res.status(201).json({
      success: true,
      data: {
        id: r.request_code || `REQ-${r.id}`,
        dbId: r.id,
        guestName: r.guest_name,
        guestPhone: r.guest_phone,
        guestEmail: r.guest_email,
        villaUnitId: r.villa_unit_id,
        villaUnitName: r.villa_unit_name,
        checkIn: iso(r.check_in) || r.check_in,
        checkOut: iso(r.check_out) || r.check_out,
        nights: Number(r.nights),
        guestsCount: Number(r.guests_count),
        totalAmount: Number(r.total_amount),
        advanceAmount: Number(r.advance_amount),
        requestSource: r.request_source,
        requestDate: r.created_at,
        status: r.status,
        notes: r.notes,
      },
    });
  } catch (error) { return next(error); }
}

async function getUnitAvailableOnDates(unitId, startDate, endDate, excludeBookingId, client = { query }) {
  const uRes = await client.query(
    `SELECT pu.id, pu.name, pu.property_id, COALESCE(pu.total_inventory, pu.total_persons, 1) AS total_inventory,
            p.category, p.id AS property_db_id, p.property_id AS property_code, p.slug
     FROM property_units pu
     JOIN properties p ON pu.property_id = p.id
     WHERE pu.id = $1`,
    [unitId]
  );
  if (!uRes.rows.length) return null;
  const unit = uRes.rows[0];
  const isVilla = isBinaryProperty(unit.category);
  const capacity = Number(unit.total_inventory) || 1;

  const [storedRes, ledgerRes, bookingsRes] = await Promise.all([
    client.query(
      `SELECT date::text, available_quantity FROM unit_calendar WHERE unit_id = $1 AND date >= $2 AND date < $3`,
      [unit.id, startDate, endDate]
    ),
    client.query(
      `SELECT check_in::text, check_out::text, COALESCE(unit_quantity, 1) AS unit_quantity
       FROM ledger_entries
       WHERE unit_id = $1 AND check_out > $2 AND check_in < $3
         AND COALESCE(status, 'active') != 'deleted'
         AND (booking_id IS NULL OR booking_id = '')`,
      [unit.id, startDate, endDate]
    ),
    client.query(
      `SELECT TO_CHAR(b.checkin_datetime, 'YYYY-MM-DD') AS check_in,
              TO_CHAR(b.checkout_datetime, 'YYYY-MM-DD') AS check_out,
              COALESCE(bi.unit_quantity, 1) AS unit_quantity,
              b.booking_status
       FROM booking_items bi
       JOIN bookings b ON b.id = bi.booking_id
       WHERE bi.unit_id = $1
         AND b.checkout_datetime::date > $2 AND b.checkin_datetime::date < $3
         AND b.booking_status IN ('CONFIRMED', 'OWNER_CONFIRMED', 'TICKET_GENERATED', 'ACCEPTED', 'ACTIVE', 'PAID')
         AND ($4::text IS NULL OR (b.booking_id != $4 AND b.id::text != $4))
       UNION ALL
       SELECT TO_CHAR(b.checkin_datetime, 'YYYY-MM-DD') AS check_in,
              TO_CHAR(b.checkout_datetime, 'YYYY-MM-DD') AS check_out,
              COALESCE(b.unit_quantity, 1) AS unit_quantity,
              b.booking_status
       FROM bookings b
       WHERE (b.unit_id = $1 OR ($5 = true AND (b.unit_id IS NULL OR b.unit_id = 0) AND (b.property_id = $6 OR b.property_id = $7::text OR b.property_id = $8)))
         AND b.checkout_datetime::date > $2 AND b.checkin_datetime::date < $3
         AND b.booking_status IN ('CONFIRMED', 'OWNER_CONFIRMED', 'TICKET_GENERATED', 'ACCEPTED', 'ACTIVE', 'PAID')
         AND ($4::text IS NULL OR (b.booking_id != $4 AND b.id::text != $4))
         AND NOT EXISTS (SELECT 1 FROM booking_items bi WHERE bi.booking_id = b.id)`,
      [unit.id, startDate, endDate, excludeBookingId, isVilla, unit.property_code, String(unit.property_db_id), unit.slug]
    )
  ]);

  const storedMap = new Map(storedRes.rows.map(r => [r.date.slice(0, 10), Number(r.available_quantity)]));
  const overlaps = (row, dayStr) => {
    const inDate = String(row.check_in).slice(0, 10);
    const outDate = String(row.check_out).slice(0, 10);
    return dayStr >= inDate && dayStr < outDate;
  };

  const results = [];
  const dStart = new Date(startDate);
  const dEnd = new Date(endDate);
  for (let d = new Date(dStart); d < dEnd; d.setDate(d.getDate() + 1)) {
    const dStr = iso(d);
    const configured = storedMap.get(dStr);
    const active = [...ledgerRes.rows, ...bookingsRes.rows].filter(r => overlaps(r, dStr));
    const hardOccupied = active.reduce((sum, r) => sum + number(r.unit_quantity, 1), 0);
    const configuredCapacity = configured !== undefined && configured !== null ? configured : capacity;
    const hardAvailable = Math.max(0, configuredCapacity - hardOccupied);
    results.push({
      date: dStr,
      capacity,
      hardOccupied,
      hardAvailable: isVilla ? (hardOccupied > 0 || configuredCapacity === 0 ? 0 : 1) : hardAvailable,
      unitName: unit.name,
      isVilla
    });
  }
  return results;
}

async function updateBookingRequestStatus(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    if (!scope) return res.status(404).json({ success: false, message: 'Owner property is not linked.' });
    const target = req.params.id;
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status is required.' });

    const isNum = /^\d+$/.test(target);
    const isVilla = isBinaryProperty(scope?.category || scope?.property_type);

    // 1. Try finding in owner_booking_requests
    const reqResult = await query(
      `SELECT * FROM owner_booking_requests
       WHERE (property_id = $1 OR owner_id = $2)
       AND (id = $3 OR request_code = $4)`,
      [scope.property_db_id, scope.owner_id, isNum ? Number(target) : -1, target]
    );

    if (reqResult.rows.length > 0) {
      const r = reqResult.rows[0];
      const checkInDate = iso(r.check_in);
      const checkOutDate = iso(r.check_out);

      // Pre-acceptance availability validation
      if (status === 'Accepted' && checkInDate && checkOutDate) {
        if (r.villa_unit_id) {
          const avail = await getUnitAvailableOnDates(r.villa_unit_id, checkInDate, checkOutDate, r.request_code || String(r.id));
          if (avail) {
            for (const d of avail) {
              if (d.hardAvailable < 1) {
                const msg = d.isVilla
                  ? `Villa is already booked on requested dates (${d.date})`
                  : `${d.unitName || 'Accommodation'} has only ${d.hardAvailable} unit(s) available on ${d.date} (1 requested)`;
                return res.status(409).json({ success: false, message: `Conflict: ${msg}.` });
              }
            }
          }
        }
      }

      await query(
        `UPDATE owner_booking_requests
         SET status = $1, updated_at = NOW()
         WHERE id = $2`,
        [status, r.id]
      );

      // Only block unit_calendar for binary properties (Villa)
      if (isVilla && checkInDate && checkOutDate) {
        const targetUnitId = r.villa_unit_id || scope.property_db_id;
        const dStart = new Date(checkInDate);
        const dEnd = new Date(checkOutDate);
        if (status === 'Accepted') {
          for (let d = new Date(dStart); d < dEnd; d.setDate(d.getDate() + 1)) {
            const dStr = iso(d);
            await query(
              `INSERT INTO unit_calendar(unit_id, date, price, available_quantity, is_special, is_weekend)
               VALUES($1, $2, $3, 0, false, $4)
               ON CONFLICT(unit_id, date)
               DO UPDATE SET available_quantity = 0`,
              [targetUnitId, dStr, number(scope?.weekday_price, 6999), [0, 6].includes(d.getDay())]
            ).catch(() => undefined);
          }
        } else if (['Rejected', 'Cancelled'].includes(status)) {
          for (let d = new Date(dStart); d < dEnd; d.setDate(d.getDate() + 1)) {
            const dStr = iso(d);
            await query(
              `DELETE FROM unit_calendar WHERE unit_id = $1 AND date = $2 AND available_quantity = 0`,
              [targetUnitId, dStr]
            ).catch(() => undefined);
          }
        }
      }

      return res.json({
        success: true,
        data: {
          id: r.request_code || `REQ-${r.id}`,
          dbId: r.id,
          guestName: r.guest_name,
          guestPhone: r.guest_phone,
          guestEmail: r.guest_email,
          villaUnitId: r.villa_unit_id,
          villaUnitName: r.villa_unit_name,
          checkIn: iso(r.check_in) || r.check_in,
          checkOut: iso(r.check_out) || r.check_out,
          nights: Number(r.nights),
          guestsCount: Number(r.guests_count),
          totalAmount: Number(r.total_amount),
          advanceAmount: Number(r.advance_amount),
          requestSource: r.request_source,
          requestDate: r.created_at,
          status: status,
          notes: r.notes,
          category: scope.category,
        },
      });
    }

    // 2. If not found in owner_booking_requests, check bookings table (e.g. PHC-... booking)
    const bookingStatusMap = {
      Accepted: 'CONFIRMED',
      Rejected: 'CANCELLED_BY_OWNER',
      Cancelled: 'CANCELLED',
      Pending: 'PENDING_OWNER_CONFIRMATION',
      Offline: 'CONFIRMED',
    };
    const mappedBookingStatus = bookingStatusMap[status] || status;

    const bCheck = await query(
      `SELECT * FROM bookings
       WHERE (property_id = $1 OR property_id = $2 OR property_id = $3)
       AND (booking_id = $4 OR id = $5)`,
      [scope.property_id, String(scope.property_db_id), scope.slug, target, isNum ? Number(target) : -1]
    );

    if (bCheck.rows.length > 0) {
      const b = bCheck.rows[0];
      const checkInDate = iso(b.checkin_datetime);
      const checkOutDate = iso(b.checkout_datetime);

      // Fetch items for multi-accommodation bookings
      const itemsRes = await query(
        `SELECT bi.*, pu.name as unit_name, pu.accommodation_type
         FROM booking_items bi
         JOIN property_units pu ON pu.id = bi.unit_id
         WHERE bi.booking_id = $1`,
        [b.id]
      );

      // Pre-acceptance availability validation
      if (mappedBookingStatus === 'CONFIRMED' && checkInDate && checkOutDate) {
        if (itemsRes.rows.length > 0) {
          for (const item of itemsRes.rows) {
            const avail = await getUnitAvailableOnDates(item.unit_id, checkInDate, checkOutDate, b.booking_id || String(b.id));
            if (avail) {
              for (const d of avail) {
                const needed = Number(item.unit_quantity) || 1;
                if (d.hardAvailable < needed) {
                  return res.status(409).json({
                    success: false,
                    message: `Conflict: ${item.unit_name || 'Accommodation'} has only ${d.hardAvailable} unit(s) available on ${d.date} (${needed} requested).`
                  });
                }
              }
            }
          }
        } else if (b.unit_id) {
          const avail = await getUnitAvailableOnDates(b.unit_id, checkInDate, checkOutDate, b.booking_id || String(b.id));
          if (avail) {
            for (const d of avail) {
              const needed = Number(b.unit_quantity) || 1;
              if (d.hardAvailable < needed) {
                const msg = d.isVilla
                  ? `Villa is already booked on requested dates (${d.date})`
                  : `${d.unitName || 'Accommodation'} has only ${d.hardAvailable} unit(s) available on ${d.date} (${needed} requested)`;
                return res.status(409).json({ success: false, message: `Conflict: ${msg}.` });
              }
            }
          }
        }
      }

      const bResult = await query(
        `UPDATE bookings
         SET booking_status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [mappedBookingStatus, b.id]
      );

      const updatedB = bResult.rows[0];

      // Only block unit_calendar for binary properties (Villa)
      if (isVilla && checkInDate && checkOutDate) {
        const targetUnitId = b.unit_id || scope.property_db_id;
        const dStart = new Date(checkInDate);
        const dEnd = new Date(checkOutDate);
        if (mappedBookingStatus === 'CONFIRMED') {
          for (let d = new Date(dStart); d < dEnd; d.setDate(d.getDate() + 1)) {
            const dStr = iso(d);
            await query(
              `INSERT INTO unit_calendar(unit_id, date, price, available_quantity, is_special, is_weekend)
               VALUES($1, $2, $3, 0, false, $4)
               ON CONFLICT(unit_id, date)
               DO UPDATE SET available_quantity = 0`,
              [targetUnitId, dStr, number(scope?.weekday_price, 6999), [0, 6].includes(d.getDay())]
            ).catch(() => undefined);
          }
        } else if (['CANCELLED_BY_OWNER', 'CANCELLED', 'REJECTED'].includes(mappedBookingStatus)) {
          for (let d = new Date(dStart); d < dEnd; d.setDate(d.getDate() + 1)) {
            const dStr = iso(d);
            await query(
              `DELETE FROM unit_calendar WHERE unit_id = $1 AND date = $2 AND available_quantity = 0`,
              [targetUnitId, dStr]
            ).catch(() => undefined);
          }
        }
      }

      return res.json({
        success: true,
        data: {
          id: updatedB.booking_id,
          dbId: updatedB.id,
          guestName: updatedB.guest_name,
          guestPhone: updatedB.guest_phone,
          guestEmail: null,
          villaUnitId: updatedB.unit_id,
          villaUnitName: itemsRes.rows.length > 0
            ? itemsRes.rows.map(item => `${item.unit_name} (${item.unit_quantity})`).join(', ')
            : (isVilla ? 'Main Villa' : 'Main Stay'),
          checkIn: iso(updatedB.checkin_datetime) || updatedB.checkin_datetime,
          checkOut: iso(updatedB.checkout_datetime) || updatedB.checkout_datetime,
          nights: Number(updatedB.nights) || 1,
          guestsCount: Number(updatedB.persons) || 1,
          totalAmount: Number(updatedB.total_amount) || 0,
          advanceAmount: Number(updatedB.advance_amount) || 0,
          requestSource: 'Website',
          requestDate: updatedB.created_at,
          status: status,
          notes: '',
          category: scope.category,
          items: itemsRes.rows.map(item => ({
            unitId: item.unit_id,
            unitName: item.unit_name,
            accommodationType: item.accommodation_type,
            persons: Number(item.persons) || 1,
            unitQuantity: Number(item.unit_quantity) || 1,
            subtotal: Number(item.subtotal) || 0,
          })),
        },
      });
    }

    return res.status(404).json({ success: false, message: 'Booking request not found.' });
  } catch (error) { return next(error); }
}

// ==================== NOTIFICATIONS & SETTINGS ====================

async function getNotifications(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    if (!scope) return res.status(404).json({ success: false, message: 'Owner property is not linked.' });
    const result = await query(
      `SELECT id, notification_code, type, title, message, is_read, reference_id, created_at
       FROM owner_notifications
       WHERE owner_id = $1 OR property_id = $2
       ORDER BY created_at DESC
       LIMIT 50`,
      [scope.owner_id, scope.property_db_id]
    );
    return res.json({
      success: true,
      data: result.rows.map((n) => ({
        id: n.notification_code || `ONOT-${n.id}`,
        dbId: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.is_read,
        referenceId: n.reference_id,
        timestamp: n.created_at,
      })),
    });
  } catch (error) { return next(error); }
}

async function markNotificationRead(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    if (!scope) return res.status(404).json({ success: false, message: 'Owner property is not linked.' });
    const target = req.params.id;
    const isNum = /^\d+$/.test(target);
    await query(
      `UPDATE owner_notifications
       SET is_read = true
       WHERE (owner_id = $1 OR property_id = $2)
       AND (id = $3 OR notification_code = $4)`,
      [scope.owner_id, scope.property_db_id, isNum ? Number(target) : -1, target]
    );
    return res.json({ success: true });
  } catch (error) { return next(error); }
}

async function markAllNotificationsRead(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    if (!scope) return res.status(404).json({ success: false, message: 'Owner property is not linked.' });
    await query(
      `UPDATE owner_notifications SET is_read = true WHERE owner_id = $1 OR property_id = $2`,
      [scope.owner_id, scope.property_db_id]
    );
    return res.json({ success: true });
  } catch (error) { return next(error); }
}

async function getSettings(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    if (!scope) return res.status(404).json({ success: false, message: 'Owner property is not linked.' });
    const result = await query(
      `SELECT * FROM owner_settings WHERE owner_id = $1`,
      [scope.owner_id]
    );
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          ownerDisplayName: scope.owner_name,
          businessName: scope.title,
          primaryMobile: scope.owner_otp_number,
          whatsappNumber: scope.owner_whatsapp_number || scope.owner_otp_number,
          email: '',
          emergencyContact: '',
          autoAcceptRequests: false,
          smsAlertsEnabled: true,
          whatsappAlertsEnabled: true,
          checkInNoticeHours: 24,
        },
      });
    }
    const s = result.rows[0];
    return res.json({
      success: true,
      data: {
        ownerDisplayName: s.owner_display_name || scope.owner_name,
        businessName: s.business_name || scope.title,
        primaryMobile: s.primary_mobile || scope.owner_otp_number,
        whatsappNumber: s.whatsapp_number || scope.owner_whatsapp_number || scope.owner_otp_number,
        email: s.email || '',
        emergencyContact: s.emergency_contact || '',
        autoAcceptRequests: !!s.auto_accept_requests,
        smsAlertsEnabled: s.sms_alerts_enabled !== false,
        whatsappAlertsEnabled: s.whatsapp_alerts_enabled !== false,
        checkInNoticeHours: Number(s.check_in_notice_hours) || 24,
      },
    });
  } catch (error) { return next(error); }
}

async function updateSettings(req, res, next) {
  try {
    const scope = await ownerScope(req.user.id);
    if (!scope) return res.status(404).json({ success: false, message: 'Owner property is not linked.' });
    const { ownerDisplayName, businessName, primaryMobile, whatsappNumber, email, emergencyContact, autoAcceptRequests, smsAlertsEnabled, whatsappAlertsEnabled, checkInNoticeHours } = req.body;

    const result = await query(
      `INSERT INTO owner_settings (
        owner_id, property_id, owner_display_name, business_name, primary_mobile,
        whatsapp_number, email, emergency_contact, auto_accept_requests,
        sms_alerts_enabled, whatsapp_alerts_enabled, check_in_notice_hours, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       ON CONFLICT (owner_id)
       DO UPDATE SET
        owner_display_name = EXCLUDED.owner_display_name,
        business_name = EXCLUDED.business_name,
        primary_mobile = EXCLUDED.primary_mobile,
        whatsapp_number = EXCLUDED.whatsapp_number,
        email = EXCLUDED.email,
        emergency_contact = EXCLUDED.emergency_contact,
        auto_accept_requests = EXCLUDED.auto_accept_requests,
        sms_alerts_enabled = EXCLUDED.sms_alerts_enabled,
        whatsapp_alerts_enabled = EXCLUDED.whatsapp_alerts_enabled,
        check_in_notice_hours = EXCLUDED.check_in_notice_hours,
        updated_at = NOW()
       RETURNING *`,
      [
        scope.owner_id,
        scope.property_db_id,
        ownerDisplayName || scope.owner_name,
        businessName || scope.title,
        primaryMobile || scope.owner_otp_number,
        whatsappNumber || scope.owner_whatsapp_number || scope.owner_otp_number,
        email || '',
        emergencyContact || '',
        !!autoAcceptRequests,
        smsAlertsEnabled !== false,
        whatsappAlertsEnabled !== false,
        number(checkInNoticeHours, 24),
      ]
    );
    const s = result.rows[0];
    return res.json({
      success: true,
      data: {
        ownerDisplayName: s.owner_display_name,
        businessName: s.business_name,
        primaryMobile: s.primary_mobile,
        whatsappNumber: s.whatsapp_number,
        email: s.email,
        emergencyContact: s.emergency_contact,
        autoAcceptRequests: s.auto_accept_requests,
        smsAlertsEnabled: s.sms_alerts_enabled,
        whatsappAlertsEnabled: s.whatsapp_alerts_enabled,
        checkInNoticeHours: s.check_in_notice_hours,
      },
    });
  } catch (error) { return next(error); }
}

module.exports = {
  dashboard,
  createUnit,
  updateUnit,
  deleteUnit,
  calendar,
  updateRates,
  updateDay,
  ledger,
  createLedger,
  updateLedger,
  deleteLedger,
  updateProfile,
  getExpenses,
  createExpense,
  deleteExpense,
  getStaff,
  saveStaff,
  deleteStaff,
  getStaffAttendance,
  markStaffAttendance,
  getStaffPayments,
  saveStaffPayment,
  getBookingRequests,
  saveBookingRequest,
  updateBookingRequestStatus,
  getUnitAvailableOnDates,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getSettings,
  updateSettings,
};
