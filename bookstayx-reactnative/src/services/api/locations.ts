import { locations as bundledLocations, type Location, images } from "@/data/discovery";
import { apiRequest } from "./client";
import { isApiConfigured } from "./config";

export type RemoteLocation = {
  id: number;
  name: string;
  slug: string;
  district: string;
  region: string;
  category?: string;
  image_url?: string | null;
  tagline?: string | null;
  rating?: number | string;
  reviews_count?: string | null;
  is_popular?: boolean;
  property_count?: number;
};

export type LocationCatalogue = {
  data: Location[];
  source: "remote" | "bundled";
  warning?: string;
};

const mapImage = (slug: string) => {
  if (slug.includes("pawna")) return images.lake;
  if (slug.includes("lonavala") || slug.includes("khandala")) return images.hills;
  if (slug.includes("karjat") || slug.includes("valley")) return images.valley;
  if (slug.includes("alib") || slug.includes("fort") || slug.includes("murud")) return images.fort;
  if (slug.includes("temple") || slug.includes("ganpatipule")) return images.temple;
  if (slug.includes("lighthouse") || slug.includes("harihareshwar") || slug.includes("devgad")) return images.lighthouse;
  if (slug.includes("kashid") || slug.includes("diveagar") || slug.includes("tarkarli")) return images.beach4;
  return images.beach1;
};

const normalizeLocation = (item: RemoteLocation): Location => {
  const fallback = bundledLocations.find((b) => b.slug === item.slug) ?? {
    slug: item.slug,
    name: item.name,
    district: item.district,
    region: item.region,
    category: item.category || "Beach Destination",
    image: mapImage(item.slug),
    rating: Number(item.rating) || 4.6,
    reviews: item.reviews_count || "1.2K Reviews",
    tagline: item.tagline || `A serene destination in ${item.region}`,
  };

  return {
    ...fallback,
    name: item.name || fallback.name,
    slug: item.slug || fallback.slug,
    district: item.district || fallback.district,
    region: item.region || fallback.region,
    category: item.category || fallback.category,
    rating: Number(item.rating) || fallback.rating,
    reviews: item.reviews_count || fallback.reviews,
    tagline: item.tagline || fallback.tagline,
  };
};

export async function loadLocations(): Promise<LocationCatalogue> {
  if (!isApiConfigured()) {
    return { data: bundledLocations, source: "bundled" };
  }

  try {
    const result = await apiRequest<{ success: boolean; data?: RemoteLocation[] }>("/locations");
    if (!result.success || !Array.isArray(result.data)) {
      throw new Error("Locations response is invalid.");
    }
    return {
      data: result.data.map(normalizeLocation),
      source: "remote",
    };
  } catch (error) {
    return {
      data: bundledLocations,
      source: "bundled",
      warning: error instanceof Error ? error.message : "Unable to refresh locations.",
    };
  }
}

export async function loadLocationDetails(slug: string): Promise<Location | null> {
  const fallback = bundledLocations.find((item) => item.slug === slug) ?? null;
  if (!isApiConfigured()) return fallback;

  try {
    const result = await apiRequest<{ success: boolean; location?: RemoteLocation }>(
      `/locations/${encodeURIComponent(slug)}`
    );
    return result.success && result.location ? normalizeLocation(result.location) : fallback;
  } catch {
    return fallback;
  }
}
