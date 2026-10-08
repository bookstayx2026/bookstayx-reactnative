const {
  ACTIVE_HARD_STATUSES,
  ACTIVE_SOFT_STATUSES,
  AvailabilityError,
  dateOnly,
  dateAtUtc,
  checkStayAvailability,
} = require('./inventoryAvailabilityService');

class BookingQuoteError extends Error {
  constructor(message, code = 'INVALID_BOOKING', status = 400) {
    super(message);
    this.name = 'BookingQuoteError';
    this.code = code;
    this.status = status;
  }
}

async function createBookingQuote(executor, input) {
  const checkInDate = dateOnly(input.checkIn || input.checkin_datetime);
  const checkOutDate = dateOnly(input.checkOut || input.checkout_datetime);
  const propertyIdentifier = String(input.propertyId || input.property_id || '').trim();

  if (!propertyIdentifier || !checkInDate || !checkOutDate) {
    throw new BookingQuoteError('Property, check-in and check-out are required.');
  }

  const checkIn = dateAtUtc(checkInDate);
  const checkOut = dateAtUtc(checkOutDate);
  const today = dateAtUtc(new Date().toISOString().slice(0, 10));
  const nights = Math.round((checkOut - checkIn) / 86_400_000);
  if (checkIn < today) throw new BookingQuoteError('Check-in cannot be in the past.', 'PAST_CHECK_IN');
  if (nights < 1 || nights > 30) {
    throw new BookingQuoteError('Stay must be between 1 and 30 nights.', 'INVALID_DATE_RANGE');
  }

  const propertyResult = await executor.query(
    `SELECT id, property_id, slug, title, category, location, price, weekday_price,
            weekend_price, capacity, max_capacity, owner_name,
            owner_whatsapp_number, contact, map_link, is_active, is_available
       FROM properties
      WHERE slug = $1 OR property_id = $1 OR id::text = $1
      LIMIT 1`,
    [propertyIdentifier],
  );
  if (!propertyResult.rows.length || !propertyResult.rows[0].is_active) {
    throw new BookingQuoteError('Property is not available.', 'PROPERTY_NOT_FOUND', 404);
  }
  const property = propertyResult.rows[0];
  if (!property.is_available) {
    throw new BookingQuoteError('Property is currently not accepting bookings.', 'PROPERTY_CLOSED', 409);
  }

  const unitsResult = await executor.query(
    `SELECT id, property_id, name, available_persons, total_persons,
            weekday_price, weekend_price, special_price, total_inventory, accommodation_type
       FROM property_units
      WHERE property_id = $1
      ORDER BY id`,
    [property.id],
  );
  const availableUnits = unitsResult.rows;
  const isVilla = property.category === 'villa';

  // Normalize incoming accommodation items
  let rawItems = [];
  if (Array.isArray(input.accommodationItems) && input.accommodationItems.length > 0) {
    rawItems = input.accommodationItems;
  } else if (Array.isArray(input.items) && input.items.length > 0) {
    rawItems = input.items;
  } else if (input.unitId || input.unit_id) {
    const unitId = Number(input.unitId || input.unit_id);
    const persons = Number.parseInt(input.persons || input.guests || input.guestCount || 1, 10);
    const unitQty = input.unitQuantity || input.unit_quantity ? Number(input.unitQuantity || input.unit_quantity) : undefined;
    rawItems = [{ unitId, persons, unitQuantity: unitQty }];
  } else if (isVilla || !availableUnits.length) {
    // Whole property / Villa booking
    const persons = Number.parseInt(input.persons || input.guests || input.guestCount || 1, 10);
    rawItems = [{ unitId: null, persons, unitQuantity: 1 }];
  } else {
    throw new BookingQuoteError('No accommodation types selected.', 'NO_ACCOMMODATION_SELECTED');
  }

  const itemsList = [];
  let totalAmount = 0;
  let totalPersons = 0;
  let totalRequiredUnits = 0;
  let totalCapacity = 0;
  const dailyDatePriceMap = new Map();

  for (const rawItem of rawItems) {
    const itemPersons = Number.parseInt(rawItem.persons || rawItem.guests || 0, 10);
    if (!Number.isInteger(itemPersons) || itemPersons < 1) {
      continue; // Skip items with 0 persons if sent
    }

    let unit = null;
    let capacityPerUnit = 1;
    let requiredUnits = 1;

    if (rawItem.unitId != null) {
      const uId = Number(rawItem.unitId);
      unit = availableUnits.find((u) => Number(u.id) === uId);
      if (!unit) {
        throw new BookingQuoteError(`Selected unit (ID: ${uId}) does not belong to this property.`, 'UNIT_NOT_FOUND', 404);
      }
      capacityPerUnit = Number(unit.total_persons || unit.available_persons || 2);
      // Authoritative derivation: requiredUnits = ceil(persons / capacityPerUnit)
      requiredUnits = Math.ceil(itemPersons / capacityPerUnit);
      if (rawItem.unitQuantity && Number(rawItem.unitQuantity) > requiredUnits) {
        // Customer requested extra units if explicit
        requiredUnits = Math.max(requiredUnits, Number(rawItem.unitQuantity));
      }
    } else {
      // Whole Villa / Property-level booking
      capacityPerUnit = Number(property.max_capacity || property.capacity || 10);
      requiredUnits = 1;
      if (itemPersons > capacityPerUnit) {
        throw new BookingQuoteError(`This property allows a maximum of ${capacityPerUnit} guests.`, 'CAPACITY_EXCEEDED', 409);
      }
    }

    let stayCalculation;
    try {
      stayCalculation = await checkStayAvailability(executor, {
        property,
        unit,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        requestedUnits: requiredUnits,
      });
    } catch (error) {
      if (error instanceof AvailabilityError) {
        throw new BookingQuoteError(error.message, error.code, error.status);
      }
      throw error;
    }

    totalAmount += stayCalculation.totalAmount;
    totalPersons += itemPersons;
    totalRequiredUnits += requiredUnits;
    totalCapacity += (requiredUnits * capacityPerUnit);

    for (const d of stayCalculation.breakdown) {
      const current = dailyDatePriceMap.get(d.date) || { price: 0, isWeekend: d.isWeekend, isSpecial: d.isSpecial, remainingQuantity: d.remainingQuantity };
      current.price += d.price * requiredUnits;
      dailyDatePriceMap.set(d.date, current);
    }

    itemsList.push({
      unitId: unit ? unit.id : null,
      unitName: unit ? unit.name : property.title,
      accommodationType: unit?.accommodation_type || (isVilla ? 'Villa' : 'Stay'),
      persons: itemPersons,
      capacityPerUnit,
      requiredUnits,
      nightlyRates: stayCalculation.breakdown,
      subtotal: stayCalculation.totalAmount,
    });
  }

  if (itemsList.length === 0) {
    throw new BookingQuoteError('At least 1 guest must be assigned to an accommodation type.', 'NO_GUESTS_ASSIGNED');
  }

  const consolidatedBreakdown = Array.from(dailyDatePriceMap.entries()).map(([date, data]) => ({
    date,
    price: data.price,
    isWeekend: data.isWeekend,
    isSpecial: data.isSpecial,
    remainingQuantity: data.remainingQuantity,
  }));

  const advanceAmount = Math.round(totalAmount * 0.5);
  const balanceAmount = totalAmount - advanceAmount;

  return {
    property: {
      id: property.id,
      propertyId: property.property_id || property.slug,
      slug: property.slug,
      name: property.title,
      type: isVilla ? 'VILLA' : 'CAMPING',
      category: property.category,
      location: property.location,
      ownerName: property.owner_name,
      ownerPhone: property.owner_whatsapp_number || property.contact,
      mapLink: property.map_link,
    },
    unit: itemsList[0].unitId ? { id: itemsList[0].unitId, name: itemsList[0].unitName } : null,
    items: itemsList,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    nights,
    persons: totalPersons,
    unitQuantity: totalRequiredUnits,
    maxCapacity: totalCapacity,
    nightlyBreakdown: consolidatedBreakdown,
    accommodationTotal: totalAmount,
    totalAmount,
    advanceAmount,
    balanceAmount,
    currency: 'INR',
  };
}

module.exports = {
  ACTIVE_HARD_STATUSES,
  ACTIVE_SOFT_STATUSES,
  BookingQuoteError,
  createBookingQuote,
};
