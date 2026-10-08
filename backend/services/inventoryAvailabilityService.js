const ACTIVE_HARD_STATUSES = [
  'TICKET_GENERATED',
  'CONFIRMED',
  'OWNER_CONFIRMED',
  'ACCEPTED',
  'PENDING_OWNER_CONFIRMATION',
  'BOOKING_REQUEST_SENT_TO_OWNER',
];

const ACTIVE_SOFT_STATUSES = ['PAYMENT_PENDING'];

class AvailabilityError extends Error {
  constructor(message, code = 'DATES_UNAVAILABLE', status = 409) {
    super(message);
    this.name = 'AvailabilityError';
    this.code = code;
    this.status = status;
  }
}

const dateOnly = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match?.[1]) return match[1];
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  if (match?.[1]) return match[1];
  return null;
};

const dateAtUtc = (value) => new Date(`${dateOnly(value)}T00:00:00.000Z`);

const addUtcDays = (date, days) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const money = (value, fallback = 0) => {
  if (value === null || value === undefined || String(value).trim() === '') return fallback;
  const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const overlaps = (entry, dayUtc) => {
  const checkIn = dateAtUtc(entry.check_in || entry.checkin_datetime);
  const checkOut = dateAtUtc(entry.check_out || entry.checkout_datetime);
  return checkIn <= dayUtc && checkOut > dayUtc;
};

/**
 * Computes date-wise availability for a unit or property across [startDate, endDate)
 */
async function getDailyAvailability(executor, {
  propertyId,
  propertyIdentifier = '',
  unitId = null,
  startDate,
  endDate,
  isVilla = false,
  totalInventory = 1,
  weekdayPrice = 0,
  weekendPrice = 0,
  basePrice = 0,
}) {
  const startUtc = dateAtUtc(startDate);
  const endUtc = dateAtUtc(endDate);
  const startStr = dateOnly(startDate);
  const endStr = dateOnly(endDate);

  const numDays = Math.max(0, Math.round((endUtc - startUtc) / 86_400_000));
  if (numDays <= 0) return [];

  const calendarResult = await (unitId
    ? executor.query(
        `SELECT date::text AS date, price, available_quantity, is_weekend, is_special
           FROM unit_calendar
          WHERE unit_id = $1 AND date >= $2 AND date < $3`,
        [unitId, startStr, endStr],
      )
    : executor.query(
        `SELECT date::text AS date, price, CASE WHEN is_booked THEN 0 ELSE $4 END AS available_quantity,
                EXTRACT(ISODOW FROM date) IN (6, 7) AS is_weekend, false AS is_special
           FROM availability_calendar
          WHERE property_id = $1 AND date >= $2::date AND date < $3::date`,
        [propertyId, startStr, endStr, totalInventory],
      ));

  const ledgerResult = await executor.query(
    `SELECT check_in::text AS check_in, check_out::text AS check_out,
            COALESCE(unit_quantity, 1) AS unit_quantity, persons
       FROM ledger_entries
      WHERE (unit_id = $1 OR ($1::int IS NULL AND (property_id::text = $2 OR property_id::text = $3)))
        AND check_out > $4 AND check_in < $5
        AND (status IS NULL OR status NOT IN ('cancelled', 'deleted'))
        AND (booking_id IS NULL OR booking_id = '')`,
    [unitId || null, String(propertyId), String(propertyIdentifier || ''), startStr, endStr],
  );

  const bookingsResult = await executor.query(
    `SELECT b.checkout_datetime::date::text AS checkout_datetime,
            b.checkin_datetime::date::text AS checkin_datetime,
            COALESCE(bi.unit_quantity, 1) AS unit_quantity,
            COALESCE(bi.persons, 1) AS persons,
            b.booking_status, b.soft_lock_expires_at
       FROM booking_items bi
       JOIN bookings b ON b.id = bi.booking_id
      WHERE (bi.unit_id = $1 OR ($1::int IS NULL AND (bi.property_id::text = $2 OR bi.property_id::text = $3)))
        AND b.checkout_datetime::date > $4 AND b.checkin_datetime::date < $5
        AND (
          b.booking_status = ANY($6::text[])
          OR (b.booking_status = ANY($7::text[]) AND b.soft_lock_expires_at > NOW())
        )
     UNION ALL
     SELECT b.checkout_datetime::date::text AS checkout_datetime,
            b.checkin_datetime::date::text AS checkin_datetime,
            COALESCE(b.unit_quantity, 1) AS unit_quantity,
            COALESCE(b.persons, 1) AS persons,
            b.booking_status, b.soft_lock_expires_at
       FROM bookings b
      WHERE (b.unit_id = $1 OR ($1::int IS NULL AND (b.property_id::text = $2 OR b.property_id::text = $3)))
        AND b.checkout_datetime::date > $4 AND b.checkin_datetime::date < $5
        AND (
          b.booking_status = ANY($6::text[])
          OR (b.booking_status = ANY($7::text[]) AND b.soft_lock_expires_at > NOW())
        )
        AND NOT EXISTS (SELECT 1 FROM booking_items bi WHERE bi.booking_id = b.id)`,
    [
      unitId || null,
      String(propertyId),
      String(propertyIdentifier || ''),
      startStr,
      endStr,
      ACTIVE_HARD_STATUSES,
      ACTIVE_SOFT_STATUSES,
    ],
  );

  const storedCalendar = new Map(
    calendarResult.rows.map((row) => [dateOnly(row.date), row]),
  );

  const days = [];

  for (let offset = 0; offset < numDays; offset += 1) {
    const dayUtc = addUtcDays(startUtc, offset);
    const dateStr = dayUtc.toISOString().slice(0, 10);
    const stored = storedCalendar.get(dateStr);

    const offlineUsage = ledgerResult.rows
      .filter((entry) => overlaps(entry, dayUtc))
      .reduce((sum, entry) => sum + Number(entry.unit_quantity || 1), 0);

    const hardOnlineUsage = bookingsResult.rows
      .filter((entry) => ACTIVE_HARD_STATUSES.includes(entry.booking_status) && overlaps(entry, dayUtc))
      .reduce((sum, entry) => sum + Number(entry.unit_quantity || 1), 0);

    const softUsage = bookingsResult.rows
      .filter((entry) => ACTIVE_SOFT_STATUSES.includes(entry.booking_status) && overlaps(entry, dayUtc))
      .reduce((sum, entry) => sum + Number(entry.unit_quantity || 1), 0);

    const ownerBaseline =
      stored?.available_quantity != null
        ? Number(stored.available_quantity)
        : totalInventory;

    let hardAvailable = 0;
    let softAvailable = 0;

    if (isVilla) {
      hardAvailable = offlineUsage + hardOnlineUsage > 0 ? 0 : 1;
      softAvailable = offlineUsage + hardOnlineUsage + softUsage > 0 ? 0 : 1;
    } else {
      hardAvailable = Math.max(0, ownerBaseline - offlineUsage - hardOnlineUsage);
      softAvailable = Math.max(0, hardAvailable - softUsage);
    }

    const isWeekend = stored?.is_weekend ?? [0, 6].includes(dayUtc.getUTCDay());
    const fallbackPrice = isWeekend
      ? money(weekendPrice, money(basePrice))
      : money(weekdayPrice, money(basePrice));
    const price = money(stored?.price, fallbackPrice);

    const isBooked = isVilla
      ? offlineUsage + hardOnlineUsage > 0 || hardAvailable <= 0
      : hardAvailable <= 0;
    const isPending = !isBooked && (softUsage > 0 || softAvailable === 0);

    let status = 'available';
    if (isBooked) {
      status = isVilla ? 'booked' : 'fully_booked';
    } else if (!isVilla && hardAvailable <= Math.max(1, Math.ceil(ownerBaseline * 0.3))) {
      status = 'limited';
    } else if (isPending) {
      status = 'pending';
    } else if (!isVilla && offlineUsage + hardOnlineUsage > 0) {
      status = 'partial';
    } else {
      status = 'available';
    }

    days.push({
      date: dateStr,
      price,
      status,
      is_booked: isBooked,
      is_pending: isPending,
      is_soft_locked: isPending,
      owner_baseline: ownerBaseline,
      total_inventory: totalInventory,
      total_capacity: totalInventory,
      booked_quantity: offlineUsage + hardOnlineUsage,
      offline_usage: offlineUsage,
      hard_online_usage: hardOnlineUsage,
      soft_usage: softUsage,
      available_quantity: hardAvailable,
      soft_available_quantity: softAvailable,
      is_weekend: Boolean(isWeekend),
      is_special: Boolean(stored?.is_special),
    });
  }

  return days;
}

/**
 * Checks stay availability across checkIn -> checkOut for a given property and unit
 */
async function checkStayAvailability(executor, {
  property,
  unit = null,
  checkIn,
  checkOut,
  requestedUnits = 1,
}) {
  const isVilla = property.category === 'villa';
  const totalInventory = isVilla ? 1 : Number(unit?.total_inventory || 1);
  const unitsNeeded = isVilla ? 1 : Math.max(1, Number(requestedUnits));

  const days = await getDailyAvailability(executor, {
    propertyId: property.id,
    propertyIdentifier: property.property_id || property.slug || '',
    unitId: unit?.id || null,
    startDate: checkIn,
    endDate: checkOut,
    isVilla,
    totalInventory,
    weekdayPrice: unit?.weekday_price || property.weekday_price,
    weekendPrice: unit?.weekend_price || property.weekend_price,
    basePrice: property.price,
  });

  let totalAmount = 0;
  const breakdown = [];

  for (const day of days) {
    const available = day.soft_available_quantity !== undefined ? day.soft_available_quantity : day.available_quantity;
    if (available < unitsNeeded) {
      throw new AvailabilityError(
        `${day.date} has only ${available} unit(s) available (${unitsNeeded} requested).`,
        'DATES_UNAVAILABLE',
        409,
      );
    }
    if (day.price <= 0) {
      throw new AvailabilityError(
        `No valid price is configured for ${day.date}.`,
        'PRICE_UNAVAILABLE',
        409,
      );
    }

    totalAmount += day.price * unitsNeeded;
    breakdown.push({
      date: day.date,
      price: day.price,
      isWeekend: day.is_weekend,
      isSpecial: day.is_special,
      remainingQuantity: available,
    });
  }

  return {
    nights: days.length,
    breakdown,
    totalAmount,
    advanceAmount: Math.round(totalAmount * 0.5),
    balanceAmount: totalAmount - Math.round(totalAmount * 0.5),
  };
}

module.exports = {
  ACTIVE_HARD_STATUSES,
  ACTIVE_SOFT_STATUSES,
  AvailabilityError,
  dateOnly,
  dateAtUtc,
  addUtcDays,
  money,
  overlaps,
  getDailyAvailability,
  checkStayAvailability,
};
