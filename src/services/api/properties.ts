import {
  properties as bundledProperties,
  type Property,
  type PropertyCategory,
  type PropertyTier,
  type PropertyUnit,
} from "@/data/discovery";
import { getCategoryConfig, normalizeCategoryKey } from "@/config/property-categories";
import { apiRequest } from "./client";
import { isApiConfigured } from "./config";

type LegacyImage = { image_url?: unknown };
type LegacyUnit = Record<string, unknown>;
type LegacyProperty = Record<string, unknown> & { images?: LegacyImage[]; units?: LegacyUnit[] };
type PublicListResponse = { success: boolean; data?: LegacyProperty[]; categorySettings?: Record<string, unknown> };
export type PropertyCatalogue = { data: Property[]; source: "remote" | "bundled"; categorySettings: Record<string, unknown>; warning?: string };

const text = (value: unknown, fallback = "") => typeof value === "string" && value.trim() ? value.trim() : fallback;
const numeric = (value: unknown, fallback: number) => {
  const n = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};
const list = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean);
  } catch {}
  return value.split(",").map((item) => item.trim()).filter(Boolean);
};
const locationSlug = (value: unknown, fallback: string) => {
  const location = String(value || "").toLowerCase();
  if (location.includes("pawna")) return "pawna-lake";
  if (location.includes("lonavala")) return "lonavala";
  if (location.includes("alib")) return "alibagh";
  if (location.includes("kashid")) return "kashid";
  if (location.includes("diveagar")) return "diveagar";
  if (location.includes("murud")) return "murud";
  return fallback;
};
const imageUrls = (remote: LegacyProperty): string[] => Array.isArray(remote.images)
  ? remote.images.map((image) => text(image?.image_url)).filter(Boolean)
  : [];
const normalizeUnit = (unit: LegacyUnit, fallbackPrice: number): PropertyUnit => ({
  id: numeric(unit.id, 0),
  name: text(unit.name, "Stay unit"),
  availablePersons: numeric(unit.available_persons, numeric(unit.total_persons, 1)),
  totalPersons: numeric(unit.total_persons, numeric(unit.available_persons, 1)),
  weekdayPrice: numeric(unit.weekday_price, fallbackPrice),
  weekendPrice: numeric(unit.weekend_price, numeric(unit.weekday_price, fallbackPrice)),
  specialPrice: numeric(unit.special_price, 0) || undefined,
  description: text(unit.description) || undefined,
  images: list(unit.images),
  hasFood: unit.has_food !== undefined ? Boolean(unit.has_food) : true,
  mealPlan: text(unit.meal_plan) || undefined,
  vegPrice: numeric(unit.veg_price, 800),
  nonVegPrice: numeric(unit.non_veg_price, 1200),
  kitchenFacility: text(unit.kitchen_facility) || undefined,
  bedrooms: numeric(unit.bedrooms, 1),
  bathrooms: numeric(unit.bathrooms, 1),
  bedConfig: text(unit.bed_config) || undefined,
  extraGuestPrice: numeric(unit.extra_guest_price, 0),
  securityDeposit: numeric(unit.security_deposit, 0),
  totalInventory: numeric(unit.total_inventory, 1),
  availableInventory: numeric(unit.available_inventory, numeric(unit.total_inventory, 1)),
  accommodationType: text(unit.accommodation_type, "Unit"),
});

function normalize(remote: LegacyProperty, index: number): Property {
  const remoteSlug = text(remote.slug, text(remote.id, `property-${index + 1}`));
  const fallback = bundledProperties.find((item) => item.id === remoteSlug) ?? bundledProperties[index % bundledProperties.length]!;
  const gallery = imageUrls(remote);
  const rawCat = remote.category ?? remote.property_type ?? fallback?.category;
  const nextCategory = normalizeCategoryKey(rawCat ? String(rawCat) : undefined);
  const catConfig = getCategoryConfig(nextCategory);
  const price = numeric(remote.starting_price ?? remote.unit_starting_price ?? remote.weekday_price ?? remote.price, fallback?.priceAmount ?? 2500);
  const units = Array.isArray(remote.units) ? remote.units.map((unit) => normalizeUnit(unit, price)) : [];
  const unitsTotalCapacity = units.reduce(
    (sum, u) => sum + (u.totalInventory || 1) * (u.totalPersons || 1),
    0
  );
  const capacity = unitsTotalCapacity > 0
    ? unitsTotalCapacity
    : numeric(remote.max_capacity ?? remote.capacity, nextCategory === "villa" ? 8 : 4);
  const highlights = list(remote.highlights);
  const amenities = list(remote.amenities);
  const defaultFallbackImage = bundledProperties[0]?.image ?? "";
  return {
    ...(fallback || {}),
    id: remoteSlug,
    name: text(remote.title ?? remote.name ?? remote.property_name, fallback?.name ?? "Stay Property"),
    image: gallery[0] || fallback?.image || defaultFallbackImage,
    gallery: gallery.length ? gallery : fallback?.gallery || [fallback?.image || defaultFallbackImage],
    meta: highlights.length ? highlights.slice(0, 3) : amenities.slice(0, 3).length ? amenities.slice(0, 3) : fallback?.meta || ["Scenic Stays", "Verified", "Great Service"],
    priceAmount: price,
    locationSlug: locationSlug(remote.location ?? remote.address, fallback?.locationSlug ?? "pawna-lake"),
    locationLabel: text(remote.location ?? remote.address, fallback?.locationLabel ?? "Pawna Lake, Lonavala"),
    tab: remote.is_top_selling === true || numeric(remote.rating, fallback?.rating ?? 4.8) >= 4.8 ? "top" : "recommended",
    category: nextCategory,
    badge: catConfig.cardBadge,
    rating: numeric(remote.rating, fallback?.rating ?? 4.8),
    reviews: numeric(remote.review_count ?? remote.reviews, fallback?.reviews ?? 50),
    tier: (price >= 12_000 ? "luxury" : price >= 8_000 ? "premium" : "affordable") as PropertyTier,
    description: text(remote.description) || fallback?.description || undefined,
    amenities: amenities.length ? amenities : fallback?.amenities,
    activities: list(remote.activities).length ? list(remote.activities) : fallback?.activities,
    highlights: highlights.length ? highlights : fallback?.highlights,
    policies: list(remote.policies).length ? list(remote.policies) : fallback?.policies,
    schedule: list(remote.schedule).length ? list(remote.schedule) : fallback?.schedule,
    units,
    maxCapacity: capacity,
    checkInTime: text(remote.check_in_time) || fallback?.checkInTime || undefined,
    checkOutTime: text(remote.check_out_time) || fallback?.checkOutTime || undefined,
    isAvailable: remote.is_available !== false,
    hasFood: remote.has_food !== undefined ? Boolean(remote.has_food) : (units.length > 0 ? units[0]?.hasFood : true),
  };
}

export type CalendarDay = {
  date: string;
  status: "available" | "limited" | "partial" | "booked" | "fully_booked" | "pending" | "blocked" | string;
  price?: number;
  totalInventory?: number;
  totalCapacity?: number;
  bookedQuantity?: number;
  blockedQuantity?: number;
  availableQuantity?: number;
  softAvailableQuantity?: number;
  isBooked?: boolean;
  isPending?: boolean;
  isSoftLocked?: boolean;
  isWeekend?: boolean;
  isSpecial?: boolean;
};

type RemoteCalendarDay = {
  date: string;
  status?: string;
  price?: number | string | null;
  is_booked?: boolean;
  is_pending?: boolean;
  is_soft_locked?: boolean;
  total_inventory?: number;
  total_capacity?: number;
  booked_quantity?: number;
  blocked_quantity?: number;
  available_quantity?: number;
  soft_available_quantity?: number;
  is_weekend?: boolean;
  is_special?: boolean;
};

type AvailabilityResponse = { success?: boolean; data?: RemoteCalendarDay[]; meta?: { selectedUnit?: LegacyUnit; units?: LegacyUnit[] } };
export type PropertyAvailability = { days: CalendarDay[]; units: PropertyUnit[]; selectedUnit?: PropertyUnit };

const normalizeDays = (days?: RemoteCalendarDay[]): CalendarDay[] =>
  Array.isArray(days)
    ? days.map((day) => ({
        date: day.date,
        status: day.status || (day.is_booked ? "booked" : day.is_soft_locked ? "blocked" : "available"),
        price: day.price == null ? undefined : numeric(day.price, 0),
        totalInventory: day.total_inventory ?? day.total_capacity,
        totalCapacity: day.total_capacity ?? day.total_inventory,
        bookedQuantity: day.booked_quantity,
        blockedQuantity: day.blocked_quantity,
        availableQuantity: day.available_quantity,
        softAvailableQuantity: day.soft_available_quantity,
        isBooked: day.is_booked,
        isPending: day.is_pending,
        isSoftLocked: day.is_soft_locked,
        isWeekend: day.is_weekend,
        isSpecial: day.is_special,
      }))
    : [];

export async function loadPropertyCatalogue(): Promise<PropertyCatalogue> {
  if (!isApiConfigured()) return { data: bundledProperties, source: "bundled", categorySettings: {} };
  try {
    const result = await apiRequest<PublicListResponse>("/properties/public-list");
    if (!result.success || !Array.isArray(result.data)) throw new Error("Property catalogue is missing from the response.");
    return { data: result.data.map(normalize), source: "remote", categorySettings: result.categorySettings || {} };
  } catch (error) {
    return { data: bundledProperties, source: "bundled", categorySettings: {}, warning: error instanceof Error ? error.message : "Unable to refresh properties." };
  }
}

export async function loadPublicProperty(slug: string): Promise<Property | null> {
  const fallback = bundledProperties.find((item) => item.id === slug) ?? null;
  if (!isApiConfigured()) return fallback;
  try {
    const result = await apiRequest<{ success: boolean; data?: LegacyProperty }>(`/properties/public/${encodeURIComponent(slug)}`);
    return result.success && result.data ? normalize(result.data, Math.max(0, bundledProperties.indexOf(fallback!))) : fallback;
  } catch { return fallback; }
}

const defaultDemoDays: CalendarDay[] = [
  { date: "2026-10-09", status: "booked" },
  { date: "2026-10-10", status: "booked" },
  { date: "2026-10-11", status: "booked" },
  { date: "2026-10-16", status: "booked" },
  { date: "2026-10-17", status: "booked" },
  { date: "2026-10-18", status: "booked" },
  { date: "2026-10-24", status: "booked" },
  { date: "2026-10-25", status: "booked" },
  { date: "2026-10-31", status: "booked" },
];

export async function loadPropertyAvailability(slug: string, unitId?: number): Promise<PropertyAvailability> {
  const fallbackPrice = bundledProperties.find((property) => property.id === slug)?.priceAmount ?? 0;
  if (!isApiConfigured()) {
    return {
      days: defaultDemoDays,
      units: [],
      selectedUnit: undefined,
    };
  }
  try {
    const suffix = unitId ? `?unitId=${encodeURIComponent(String(unitId))}` : "";
    const result = await apiRequest<AvailabilityResponse>(`/properties/public/${encodeURIComponent(slug)}/availability${suffix}`);
    const units = Array.isArray(result.meta?.units) ? result.meta.units.map((unit) => normalizeUnit(unit, fallbackPrice)) : [];
    const normalized = normalizeDays(result.data);
    return {
      days: normalized.length ? normalized : defaultDemoDays,
      units,
      selectedUnit: result.meta?.selectedUnit ? normalizeUnit(result.meta.selectedUnit, fallbackPrice) : undefined,
    };
  } catch {
    return {
      days: defaultDemoDays,
      units: [],
      selectedUnit: undefined,
    };
  }
}

export async function loadPropertyCalendar(propertyId: string): Promise<CalendarDay[]> {
  return (await loadPropertyAvailability(propertyId)).days;
}

export async function loadUnitCalendar(unitId: number): Promise<CalendarDay[]> {
  const result = await apiRequest<{ success?: boolean; data?: RemoteCalendarDay[] }>(`/properties/units/${unitId}/calendar`);
  return normalizeDays(result.data);
}
