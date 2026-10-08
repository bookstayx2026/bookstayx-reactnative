/**
 * Centralized Category & Booking Mode Helper
 *
 * Distinguishes between:
 * - 'binary' mode: Whole-property booking (Villa) where 1 booking blocks the full property for the date range.
 * - 'inventory' mode: Quantity-based inventory (Camping & Cottages, Resort, Homestay) where multiple
 *   accommodation types and physical units exist, and inventory decrements per booked unit type.
 */

function normalizeCategory(category) {
  const cat = String(category || '').trim().toLowerCase();
  if (cat.includes('villa')) return 'villa';
  if (cat.includes('camp') || cat.includes('cottage')) return 'camping_cottages';
  if (cat.includes('resort')) return 'resort';
  if (cat.includes('homestay') || cat.includes('home_stay')) return 'homestay';
  return cat;
}

function getBookingMode(category) {
  const norm = normalizeCategory(category);
  if (norm === 'villa') return 'binary';
  return 'inventory';
}

function isBinaryProperty(category) {
  return getBookingMode(category) === 'binary';
}

function isInventoryProperty(category) {
  return getBookingMode(category) === 'inventory';
}

function getPropertyCategoryLabel(category) {
  const norm = normalizeCategory(category);
  switch (norm) {
    case 'villa':
      return 'Villa';
    case 'resort':
      return 'Resort';
    case 'camping_cottages':
      return 'Camping & Cottages';
    case 'homestay':
      return 'Homestay';
    default:
      return 'Property';
  }
}

function getAccommodationUnitLabel(category) {
  const norm = normalizeCategory(category);
  switch (norm) {
    case 'villa':
      return 'Villa Unit';
    case 'resort':
      return 'Rooms & Suites';
    case 'camping_cottages':
      return 'Tents & Cottages';
    case 'homestay':
      return 'Rooms';
    default:
      return 'Accommodations';
  }
}

module.exports = {
  normalizeCategory,
  getBookingMode,
  isBinaryProperty,
  isInventoryProperty,
  getPropertyCategoryLabel,
  getAccommodationUnitLabel,
};
