import { IMG, type ImageKey } from "@/lib/images";

export type NearbyPlace = {
  name: string;
  description: string;
  distance: string;
  image: string;
};

export type Location = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  district: string;
  region: string;
  category: "Beach Destination" | "Lake Destination" | "Hill Station" | "Nature Escape";
  bestFor: string[];
  heroImage: string;
  galleryImages: string[];
  tagline: string;
  description: string;
  about: string;
  highlights: string[];
  rating: number;
  reviews: string;
  bestTime: string;
  distanceFromPune: string;
  idealFor: string;
  nearbyPlaces: NearbyPlace[];
};

const pool: NearbyPlace[] = [
  {
    name: "Suvarnadurg Fort",
    description: "Historic sea fort with stunning views and rich history.",
    distance: "17 km",
    image: IMG.fort,
  },
  {
    name: "Shri Laxmi Narayan Temple",
    description: "Ancient temple with beautiful architecture.",
    distance: "21 km",
    image: IMG.temple,
  },
  {
    name: "Murud Beach",
    description: "Peaceful beach perfect for a relaxing time.",
    distance: "24 km",
    image: IMG.beach4,
  },
  {
    name: "Karde Waterfall",
    description: "Scenic waterfall surrounded by lush greenery.",
    distance: "28 km",
    image: IMG.waterfall,
  },
  {
    name: "Harnai Beach & Lighthouse",
    description: "Beautiful beach with an iconic lighthouse.",
    distance: "32 km",
    image: IMG.lighthouse,
  },
];

type Seed = {
  name: string;
  slug?: string;
  district: string;
  region: string;
  img: ImageKey;
  category?: Location["category"];
  bestFor?: string[];
  rating?: number;
  reviews?: string;
  distance?: string;
  tagline?: string;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[()/&,.]/g, " ")
    .trim()
    .replace(/\s+/g, "-");

function build(seed: Seed): Location {
  const slug = seed.slug ?? slugify(seed.name);
  const category = seed.category ?? "Beach Destination";
  const short = seed.name.replace(/\s*(Beach|Lake)\s*$/i, "").replace(/\s*\(.*\)/, "");
  const kind =
    category === "Beach Destination"
      ? "coastal"
      : category === "Lake Destination"
        ? "lakeside"
        : category === "Hill Station"
          ? "hillside"
          : "natural";
  return {
    id: slug,
    slug,
    name: seed.name,
    shortName: short,
    district: seed.district,
    region: seed.region,
    category,
    bestFor: seed.bestFor ?? ["Family", "Couples", "Relaxation"],
    heroImage: IMG[seed.img],
    galleryImages: [IMG[seed.img], IMG.beach2, IMG.beach1, IMG.beach3],
    tagline: seed.tagline ?? `A serene ${kind} paradise in ${seed.region}`,
    description: `Known for its pristine surroundings, peaceful vibe, and breathtaking sunsets, ${short} is a perfect getaway for families, couples, and nature lovers.`,
    about: `${short} is a picturesque destination in the ${seed.region} region of Maharashtra. It is famous for its clean landscapes, soft light, clear waters, and relaxed environment. Whether you're looking for adventure or peace, ${short} has something for everyone.`,
    highlights:
      category === "Beach Destination"
        ? ["Clean Beaches", "Water Activities", "Sunset View", "Peaceful Vibes"]
        : ["Scenic Trails", "Camping", "Sunset View", "Peaceful Vibes"],
    rating: seed.rating ?? 4.6,
    reviews: seed.reviews ?? "1.2K Reviews",
    bestTime: category === "Hill Station" ? "Jun – Feb" : "Oct – May",
    distanceFromPune: seed.distance ?? "Approx. 165 km",
    idealFor: "Family, Couples",
    nearbyPlaces: pool,
  };
}

export type LocationGroup = {
  index: number;
  title: string;
  layout: "trio" | "feature" | "grid";
  slugs: string[];
};

const seeds: Seed[] = [
  // Pune / Maval
  { name: "Lonavala", district: "Maval Region", region: "Pune District", img: "hills", category: "Hill Station", distance: "Approx. 65 km", rating: 4.7, reviews: "3.4K Reviews" },
  { name: "Pawna Lake", district: "Maval Region", region: "Pune District", img: "lake", category: "Lake Destination", distance: "Approx. 55 km", rating: 4.8, reviews: "5.1K Reviews" },
  { name: "Khandala", district: "Maval Region", region: "Pune District", img: "valley", category: "Hill Station", distance: "Approx. 70 km", rating: 4.5 },
  // Karjat
  { name: "Karjat", district: "Raigad District", region: "Raigad", img: "valley", category: "Nature Escape", distance: "Approx. 95 km", rating: 4.6, reviews: "2.2K Reviews" },
  // Raigad
  { name: "Kihim Beach", district: "Raigad District", region: "Raigad", img: "beach1" },
  { name: "Alibaug Beach", slug: "alibagh", district: "Raigad District", region: "Raigad", img: "fort", rating: 4.6, reviews: "4.0K Reviews", distance: "Approx. 140 km" },
  { name: "Varsoli Beach", district: "Raigad District", region: "Raigad", img: "beach4" },
  { name: "Nagaon Beach", district: "Raigad District", region: "Raigad", img: "beach2" },
  { name: "Akshi Beach", district: "Raigad District", region: "Raigad", img: "beach1" },
  { name: "Kashid Beach", slug: "kashid", district: "Raigad District", region: "Raigad", img: "beach4", rating: 4.7, reviews: "2.8K Reviews" },
  { name: "Murud Beach", slug: "murud", district: "Raigad District", region: "Raigad", img: "fort", rating: 4.5 },
  { name: "Diveagar Beach", slug: "diveagar", district: "Raigad District", region: "Konkan", img: "beach2", rating: 4.7, reviews: "1.2K Reviews", distance: "Approx. 165 km", tagline: "A serene coastal paradise in Konkan" },
  { name: "Shrivardhan Beach", district: "Raigad District", region: "Raigad", img: "beach3" },
  { name: "Harihareshwar Beach", district: "Raigad District", region: "Raigad", img: "lighthouse" },
  // Ratnagiri
  { name: "Velas Beach", district: "Ratnagiri District", region: "Central Konkan", img: "beach4" },
  { name: "Kelshi Beach", district: "Ratnagiri District", region: "Central Konkan", img: "beach1" },
  { name: "Anjarle Beach", district: "Ratnagiri District", region: "Central Konkan", img: "beach3" },
  { name: "Karde & Ladghar Beaches (Dapoli)", slug: "karde-ladghar", district: "Ratnagiri District", region: "Central Konkan", img: "beach2" },
  { name: "Harnai Beach", district: "Ratnagiri District", region: "Central Konkan", img: "lighthouse" },
  { name: "Guhagar Beach", district: "Ratnagiri District", region: "Central Konkan", img: "beach4" },
  { name: "Ganpatipule Beach", district: "Ratnagiri District", region: "Central Konkan", img: "temple" },
  { name: "Bhandarpule Beach", district: "Ratnagiri District", region: "Central Konkan", img: "beach1" },
  { name: "Aare Ware Beach", district: "Ratnagiri District", region: "Central Konkan", img: "beach3" },
  // Sindhudurg
  { name: "Devgad Beach", district: "Sindhudurg District", region: "Southern Konkan", img: "lighthouse" },
  { name: "Kunkeshwar Beach", district: "Sindhudurg District", region: "Southern Konkan", img: "fort" },
  { name: "Tarkarli Beach (Malvan)", slug: "tarkarli", district: "Sindhudurg District", region: "Southern Konkan", img: "beach4", rating: 4.8, reviews: "3.9K Reviews" },
  { name: "Chivla Beach", district: "Sindhudurg District", region: "Southern Konkan", img: "beach1" },
  { name: "Bhogwe Beach", district: "Sindhudurg District", region: "Southern Konkan", img: "beach4" },
  { name: "Nivati Beach", district: "Sindhudurg District", region: "Southern Konkan", img: "beach3" },
  { name: "Vengurla / Sagareshwar Beach", slug: "vengurla", district: "Sindhudurg District", region: "Southern Konkan", img: "beach2" },
  { name: "Redi Beach", district: "Sindhudurg District", region: "Southern Konkan", img: "beach3" },
];

export const locations: Location[] = seeds.map(build);

export const getLocation = (slug: string) => locations.find((l) => l.slug === slug);

export const locationGroups: LocationGroup[] = [
  {
    index: 1,
    title: "Pune District (Maval Region)",
    layout: "trio",
    slugs: ["lonavala", "pawna-lake", "khandala"],
  },
  { index: 2, title: "Karjat District", layout: "trio", slugs: ["karjat"] },
  {
    index: 3,
    title: "Raigad District (Popular Weekend Hubs)",
    layout: "grid",
    slugs: [
      "kihim-beach",
      "alibagh",
      "varsoli-beach",
      "nagaon-beach",
      "akshi-beach",
      "kashid",
      "murud",
      "diveagar",
      "shrivardhan-beach",
      "harihareshwar-beach",
    ],
  },
  {
    index: 4,
    title: "Ratnagiri District (Central Konkan)",
    layout: "grid",
    slugs: [
      "velas-beach",
      "kelshi-beach",
      "anjarle-beach",
      "karde-ladghar",
      "harnai-beach",
      "guhagar-beach",
      "ganpatipule-beach",
      "bhandarpule-beach",
      "aare-ware-beach",
    ],
  },
  {
    index: 5,
    title: "Sindhudurg District (Southern Konkan)",
    layout: "grid",
    slugs: [
      "devgad-beach",
      "kunkeshwar-beach",
      "tarkarli",
      "chivla-beach",
      "bhogwe-beach",
      "nivati-beach",
      "vengurla",
      "redi-beach",
    ],
  },
];

export const popularLocations = [
  { slug: "pawna-lake", name: "Pawna Lake", label: "Maharashtra, India", image: IMG.lake },
  { slug: "lonavala", name: "Lonavala", label: "Maharashtra, India", image: IMG.hills },
  { slug: "alibagh", name: "Alibagh", label: "Raigad, India", image: IMG.fort },
  { slug: "kashid", name: "Kashid", label: "Raigad, India", image: IMG.beach4 },
  { slug: "murud", name: "Murud", label: "Maharashtra, India", image: IMG.fort },
  { slug: "diveagar", name: "Diveagar", label: "Ratnagiri, India", image: IMG.beach2 },
];

export type PropertyCategory = "villas" | "camping" | "hotel" | "campings";
export type PropertyTier = "affordable" | "premium" | "luxury";

export type Property = {
  id: string;
  name: string;
  image: string;
  meta: string[];
  price: string;
  priceAmount: number;
  locationSlug: string;
  locationLabel: string;
  tab: "top" | "recommended";
  category: PropertyCategory;
  badge: string;
  rating: number;
  reviews: number;
  tier: PropertyTier;
};

export const properties: Property[] = [
  {
    id: "pawna-lakeview-villa",
    name: "Pawna Lakeview Villa",
    image: IMG.villa1,
    meta: ["4 Bedrooms", "Lake View", "Pool"],
    price: "Starting from ₹6,999/night",
    priceAmount: 6999,
    locationSlug: "pawna-lake",
    locationLabel: "Pawna Lake, Lonavala",
    tab: "top",
    category: "villas",
    badge: "VILLA",
    rating: 4.8,
    reviews: 124,
    tier: "affordable",
  },
  {
    id: "pawna-lakeside-domes",
    name: "Lakeside Domes",
    image: IMG.hero,
    meta: ["2 Domes", "Lake View", "Bonfire"],
    price: "Starting from ₹4,999/night",
    priceAmount: 4999,
    locationSlug: "pawna-lake",
    locationLabel: "Pawna Lake, Lonavala",
    tab: "recommended",
    category: "camping",
    badge: "CAMPING & COTTAGES",
    rating: 4.9,
    reviews: 86,
    tier: "affordable",
  },
  {
    id: "valley-view-cottage",
    name: "Valley View Cottage",
    image: IMG.valley,
    meta: ["2 Bedrooms", "Mountain View"],
    price: "Starting from ₹5,499/night",
    priceAmount: 5499,
    locationSlug: "lonavala",
    locationLabel: "Lonavala Hills",
    tab: "recommended",
    category: "camping",
    badge: "CAMPING & COTTAGES",
    rating: 4.7,
    reviews: 62,
    tier: "affordable",
  },
  {
    id: "private-pool-villa",
    name: "Private Pool Villa",
    image: IMG.villa2,
    meta: ["5 Bedrooms", "Private Pool", "BBQ"],
    price: "Starting from ₹12,999/night",
    priceAmount: 12999,
    locationSlug: "lonavala",
    locationLabel: "Lonavala",
    tab: "top",
    category: "villas",
    badge: "VILLA",
    rating: 4.9,
    reviews: 201,
    tier: "affordable",
  },
  {
    id: "seaside-serenity-villa",
    name: "Seaside Serenity Villa",
    image: IMG.beach1,
    meta: ["4 Guests", "2 Bedrooms", "Pool"],
    price: "Starting from ₹15,000/night",
    priceAmount: 15000,
    locationSlug: "alibagh",
    locationLabel: "Alibagh Coast",
    tab: "top",
    category: "villas",
    badge: "VILLA",
    rating: 4.8,
    reviews: 98,
    tier: "luxury",
  },
  {
    id: "kashid-beach-cottage",
    name: "Kashid Beach Cottage",
    image: IMG.beach2,
    meta: ["2-6 Guests", "Sea View"],
    price: "Starting from ₹8,500/night",
    priceAmount: 8500,
    locationSlug: "kashid",
    locationLabel: "Kashid Beach",
    tab: "recommended",
    category: "camping",
    badge: "CAMPING & COTTAGES",
    rating: 4.6,
    reviews: 54,
    tier: "premium",
  },
  {
    id: "diveagar-palm-retreat",
    name: "Diveagar Palm Retreat",
    image: IMG.beach3,
    meta: ["6 Guests", "3 Bedrooms", "Beach Access"],
    price: "Starting from ₹11,000/night",
    priceAmount: 11000,
    locationSlug: "diveagar",
    locationLabel: "Diveagar Beach",
    tab: "top",
    category: "hotel",
    badge: "HOTEL ROOMS",
    rating: 4.7,
    reviews: 73,
    tier: "premium",
  },
  {
    id: "pawna-riverside-camp",
    name: "Riverside Camp Stays",
    image: IMG.lake,
    meta: ["Shared Camp", "Bonfire", "Lake View"],
    price: "Starting from ₹3,499/night",
    priceAmount: 3499,
    locationSlug: "pawna-lake",
    locationLabel: "Pawna Lake, Lonavala",
    tab: "recommended",
    category: "campings",
    badge: "CAMPINGS",
    rating: 4.5,
    reviews: 41,
    tier: "affordable",
  },
  {
    id: "lonavala-cliffside-suite",
    name: "Cliffside Suite Hotel",
    image: IMG.hills,
    meta: ["King Bed", "Mountain View", "Breakfast"],
    price: "Starting from ₹9,499/night",
    priceAmount: 9499,
    locationSlug: "lonavala",
    locationLabel: "Lonavala Hills",
    tab: "recommended",
    category: "hotel",
    badge: "HOTEL ROOMS",
    rating: 4.6,
    reviews: 112,
    tier: "premium",
  },
  {
    id: "murud-fort-villa",
    name: "Fort View Heritage Villa",
    image: IMG.fort,
    meta: ["3 Bedrooms", "Sea View", "Pool"],
    price: "Starting from ₹14,500/night",
    priceAmount: 14500,
    locationSlug: "murud",
    locationLabel: "Murud, Raigad",
    tab: "top",
    category: "villas",
    badge: "VILLA",
    rating: 4.8,
    reviews: 67,
    tier: "luxury",
  },
  {
    id: "waterfall-grove-cottage",
    name: "Waterfall Grove Cottage",
    image: IMG.waterfall,
    meta: ["2 Bedrooms", "Forest View", "Bonfire"],
    price: "Starting from ₹6,299/night",
    priceAmount: 6299,
    locationSlug: "lonavala",
    locationLabel: "Lonavala Valley",
    tab: "recommended",
    category: "camping",
    badge: "CAMPING & COTTAGES",
    rating: 4.7,
    reviews: 89,
    tier: "affordable",
  },
  {
    id: "lighthouse-bay-camp",
    name: "Lighthouse Bay Camp",
    image: IMG.lighthouse,
    meta: ["Tent Stay", "Sea View", "Bonfire"],
    price: "Starting from ₹3,999/night",
    priceAmount: 3999,
    locationSlug: "alibagh",
    locationLabel: "Alibagh Coast",
    tab: "recommended",
    category: "campings",
    badge: "CAMPINGS",
    rating: 4.4,
    reviews: 38,
    tier: "affordable",
  },
  {
    id: "ganpatipule-beach-hotel",
    name: "Temple Beach Hotel Rooms",
    image: IMG.beach4,
    meta: ["Sea View", "2 Guests", "Breakfast"],
    price: "Starting from ₹7,899/night",
    priceAmount: 7899,
    locationSlug: "ganpatipule-beach",
    locationLabel: "Ganpatipule Beach",
    tab: "recommended",
    category: "hotel",
    badge: "HOTEL ROOMS",
    rating: 4.5,
    reviews: 156,
    tier: "premium",
  },
];

export function getProperty(id: string): Property | undefined {
  return properties.find((p) => p.id === id);
}
