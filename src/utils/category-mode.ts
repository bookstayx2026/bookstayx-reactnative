/**
 * Centralized Category & Booking Mode Helper (Frontend TypeScript)
 *
 * Distinguishes between:
 * - 'binary' mode: Whole-property booking (Villa) where 1 booking blocks the full property for the date range.
 * - 'inventory' mode: Quantity-based inventory (Camping & Cottages, Resort, Homestay) where multiple
 *   accommodation types and physical units exist, and inventory decrements per booked unit type.
 */

export type BookingMode = 'binary' | 'inventory';

export function normalizeCategory(category?: string | null): string {
  const cat = String(category || '').trim().toLowerCase();
  if (cat.includes('villa')) return 'villa';
  if (cat.includes('camp') || cat.includes('cottage')) return 'camping_cottages';
  if (cat.includes('resort')) return 'resort';
  if (cat.includes('homestay') || cat.includes('home_stay')) return 'homestay';
  return cat || 'villa';
}

export function getBookingMode(category?: string | null): BookingMode {
  const norm = normalizeCategory(category);
  if (norm === 'villa') return 'binary';
  return 'inventory';
}

export function isBinaryProperty(category?: string | null): boolean {
  return getBookingMode(category) === 'binary';
}

export function isInventoryProperty(category?: string | null): boolean {
  return getBookingMode(category) === 'inventory';
}

export function getPropertyCategoryLabel(category?: string | null): string {
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

export function getAccommodationUnitLabel(category?: string | null): string {
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
