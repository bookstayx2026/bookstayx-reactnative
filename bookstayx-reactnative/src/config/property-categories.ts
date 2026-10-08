export type PropertyCategoryKey = "villa" | "camping_cottages" | "resort" | "homestay";

export interface PropertyCategoryConfig {
  key: PropertyCategoryKey;
  label: string;
  shortLabel: string;
  title: string;
  subtitle: string;
  demoPropertyName: string;
  demoPropertyId: string;
  unitLabel: string;
  pluralUnitLabel: string;
  badge: string;
  cardBadge: string;
  iconType: "villa" | "camping" | "resort" | "homestay";
}

export const PROPERTY_CATEGORIES: Record<PropertyCategoryKey, PropertyCategoryConfig> = {
  villa: {
    key: "villa",
    label: "Villa",
    shortLabel: "Villa",
    title: "Villa",
    subtitle: "Private luxury estates, swimming pools, lawns & exclusive group getaways",
    demoPropertyName: "Pawna Lakeview Villa",
    demoPropertyId: "BSX-V001",
    unitLabel: "Villa Unit",
    pluralUnitLabel: "Villa Units",
    badge: "Curated Luxury Villa",
    cardBadge: "VILLA",
    iconType: "villa",
  },
  camping_cottages: {
    key: "camping_cottages",
    label: "Camping & Cottages",
    shortLabel: "Camping",
    title: "Camping & Cottages",
    subtitle: "Lakeside glamping, nature cottages, bonfires, barbecues & outdoor adventure",
    demoPropertyName: "Pawna Lake Camping & Cottages",
    demoPropertyId: "BSX-CAMP01",
    unitLabel: "Tent / Cottage",
    pluralUnitLabel: "Tents & Cottages",
    badge: "Lakeside Glamping & Stay",
    cardBadge: "CAMPING & COTTAGES",
    iconType: "camping",
  },
  resort: {
    key: "resort",
    label: "Resort",
    shortLabel: "Resort",
    title: "Resort",
    subtitle: "Full-service luxury hospitality, suites, multi-cuisine dining & swimming pools",
    demoPropertyName: "Emerald Valley Resort",
    demoPropertyId: "BSX-RESORT01",
    unitLabel: "Room / Suite",
    pluralUnitLabel: "Rooms & Suites",
    badge: "Boutique Luxury Resort",
    cardBadge: "RESORT",
    iconType: "resort",
  },
  homestay: {
    key: "homestay",
    label: "Homestay",
    shortLabel: "Homestay",
    title: "Homestay",
    subtitle: "Cozy local retreats, authentic home-cooked meals, scenic gardens & personal host care",
    demoPropertyName: "Hillview Homestay",
    demoPropertyId: "BSX-HOMESTAY01",
    unitLabel: "Room",
    pluralUnitLabel: "Rooms",
    badge: "Heritage Homestay",
    cardBadge: "HOMESTAY",
    iconType: "homestay",
  },
};

export const PROPERTY_CATEGORY_LIST: PropertyCategoryConfig[] = [
  PROPERTY_CATEGORIES.villa,
  PROPERTY_CATEGORIES.camping_cottages,
  PROPERTY_CATEGORIES.resort,
  PROPERTY_CATEGORIES.homestay,
];

export function normalizeCategoryKey(category?: string | null): PropertyCategoryKey {
  if (!category) return "villa";
  const normalized = category.toLowerCase().trim();
  if (
    normalized === "camping_cottages" ||
    normalized === "campings_cottages" ||
    normalized === "camping" ||
    normalized === "campings"
  ) {
    return "camping_cottages";
  }
  if (normalized === "resort" || normalized === "hotel") {
    return "resort";
  }
  if (normalized === "homestay") {
    return "homestay";
  }
  if (normalized === "villa" || normalized === "villas") {
    return "villa";
  }
  return "villa";
}

export function getCategoryConfig(category?: string | null): PropertyCategoryConfig {
  const key = normalizeCategoryKey(category);
  return PROPERTY_CATEGORIES[key];
}
