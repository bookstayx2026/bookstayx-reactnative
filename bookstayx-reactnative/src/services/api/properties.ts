import { properties as bundledProperties, type Property, type PropertyCategory, type PropertyTier } from "@/data/discovery";
import { apiRequest } from "./client";
import { isApiConfigured } from "./config";

type LegacyImage = { image_url?: unknown };
type LegacyProperty = Record<string, unknown> & { images?: LegacyImage[] };
type PublicListResponse = { success: boolean; data?: LegacyProperty[]; categorySettings?: Record<string, unknown> };
export type PropertyCatalogue = { data: Property[]; source: "remote" | "bundled"; categorySettings: Record<string, unknown>; warning?: string };

const text = (value: unknown, fallback: string) => typeof value === "string" && value.trim() ? value.trim() : fallback;
const numeric = (value: unknown, fallback: number) => { const n = Number(value); return Number.isFinite(n) && n > 0 ? n : fallback; };
const category = (value: unknown, fallback: PropertyCategory): PropertyCategory => {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("villa")) return "villas";
  if (normalized.includes("hotel")) return "hotel";
  if (normalized.includes("camping") && !normalized.includes("cottage")) return "campings";
  if (normalized.includes("camp") || normalized.includes("cottage")) return "camping";
  return fallback;
};

function normalize(remote: LegacyProperty, index: number): Property {
  const remoteSlug = text(remote.slug, text(remote.id, `property-${index + 1}`));
  const fallback = bundledProperties.find((item) => item.id === remoteSlug) ?? bundledProperties[index % bundledProperties.length]!;
  const imageUrl = Array.isArray(remote.images) && typeof remote.images[0]?.image_url === "string" ? remote.images[0].image_url : null;
  const nextCategory = category(remote.property_type ?? remote.category, fallback.category);
  const price = numeric(remote.unit_starting_price ?? remote.price, fallback.priceAmount);
  return {
    ...fallback,
    id: remoteSlug,
    name: text(remote.name ?? remote.property_name, fallback.name),
    image: imageUrl || fallback.image,
    priceAmount: price,
    locationLabel: text(remote.location ?? remote.address, fallback.locationLabel),
    category: nextCategory,
    badge: nextCategory === "villas" ? "VILLA" : nextCategory === "hotel" ? "HOTEL ROOMS" : nextCategory === "campings" ? "CAMPINGS" : "CAMPING & COTTAGES",
    rating: numeric(remote.rating, fallback.rating),
    reviews: numeric(remote.review_count ?? remote.reviews, fallback.reviews),
    tier: price >= 12_000 ? "luxury" : price >= 8_000 ? "premium" : "affordable" as PropertyTier,
  };
}

export type CalendarDay = { date: string; status: "available" | "booked" | "blocked" | string; price?: number; availableQuantity?: number };

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

export async function loadPropertyCalendar(propertyId: string): Promise<CalendarDay[]> {
  const result = await apiRequest<{ success?: boolean; data?: { date: string; status?: string; price?: number | string | null; is_booked?: boolean; available_quantity?: number; is_soft_locked?: boolean }[] }>(`/properties/${encodeURIComponent(propertyId)}/calendar`);
  return Array.isArray(result.data) ? result.data.map((day) => ({
    date: day.date,
    status: day.is_booked ? "booked" : day.is_soft_locked ? "blocked" : day.status || "available",
    price: day.price == null ? undefined : Number(day.price),
    availableQuantity: day.available_quantity,
  })) : [];
}

export async function loadUnitCalendar(unitId: number): Promise<CalendarDay[]> {
  const result = await apiRequest<{ success?: boolean; data?: { date: string; status?: string; price?: number | string | null; is_booked?: boolean; available_quantity?: number; is_soft_locked?: boolean }[] }>(`/properties/units/${unitId}/calendar`);
  return Array.isArray(result.data) ? result.data.map((day) => ({ date: day.date, status: day.is_booked ? "booked" : day.is_soft_locked ? "blocked" : day.status || "available", price: day.price == null ? undefined : Number(day.price), availableQuantity: day.available_quantity })) : [];
}
