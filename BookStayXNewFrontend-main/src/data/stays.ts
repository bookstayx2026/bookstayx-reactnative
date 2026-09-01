import { IMG } from "@/lib/images";

export type StayCategory = "villas" | "camping" | "hotel";
export type StayTier = "affordable" | "premium" | "luxury";

export type Amenity = { icon: "bed" | "tent" | "lake" | "pool" | "fire" | "mountain" | "parking" | "wifi" | "coffee" | "meals" | "lawn" | "cottage"; label: string };

export type Stay = {
  id: string;
  name: string;
  badge: string;
  category: StayCategory;
  tier: StayTier;
  location: string;
  locationSlug: string;
  image: string;
  gallery: string[];
  price: number;
  rating: number;
  reviews: number;
  amenities: Amenity[];
  about: string;
  highlights: string[];
  guests: string;
  checkIn: string;
};

const badgeFor: Record<StayCategory, string> = {
  villas: "VILLA",
  camping: "CAMPING & COTTAGES",
  hotel: "HOTEL ROOMS",
};

function make(s: Omit<Stay, "badge" | "gallery" | "about" | "highlights" | "guests" | "checkIn"> & Partial<Stay>): Stay {
  return {
    badge: badgeFor[s.category],
    gallery: [s.image, IMG.lake, IMG.hills, IMG.valley],
    guests: "2–8 Guests",
    checkIn: "Check-in 1:00 PM · Check-out 11:00 AM",
    about: `${s.name} sits amid the quiet folds of ${s.location}, framed by golden-hour skies and open views. Wake to mist over the water, spend the day exploring, and end it around a crackling bonfire under a sky full of stars.`,
    highlights: ["Bonfire Evenings", "Sunset Views", "Home-style Meals", "Ample Parking"],
    ...s,
  } as Stay;
}

export const stays: Stay[] = [
  make({
    id: "pawna-lakeview-villa",
    name: "Pawna Lakeview Villa",
    category: "villas",
    tier: "premium",
    location: "Pawna Lake, Lonavala",
    locationSlug: "pawna-lake",
    image: IMG.villa1,
    price: 6999,
    rating: 4.8,
    reviews: 124,
    amenities: [
      { icon: "bed", label: "4 Bedrooms" },
      { icon: "lake", label: "Lake View" },
      { icon: "pool", label: "Pool" },
    ],
  }),
  make({
    id: "sunset-glamping-tents",
    name: "Sunset Glamping Tents",
    category: "camping",
    tier: "affordable",
    location: "Pawna Lake, Lonavala",
    locationSlug: "pawna-lake",
    image: IMG.hero,
    price: 2499,
    rating: 4.7,
    reviews: 89,
    amenities: [
      { icon: "tent", label: "2 Tents" },
      { icon: "lake", label: "Lake View" },
      { icon: "fire", label: "Bonfire" },
    ],
  }),
  make({
    id: "hilltop-ac-cottages",
    name: "Hilltop AC Cottages",
    category: "camping",
    tier: "affordable",
    location: "Khandala, Maval Region",
    locationSlug: "lonavala",
    image: IMG.valley,
    price: 3499,
    rating: 4.6,
    reviews: 76,
    amenities: [
      { icon: "cottage", label: "AC Cottage" },
      { icon: "mountain", label: "Mountain View" },
      { icon: "parking", label: "Parking" },
    ],
  }),
  make({
    id: "misty-mountain-resort",
    name: "The Misty Mountain Resort",
    category: "hotel",
    tier: "premium",
    location: "Khandala, Maval Region",
    locationSlug: "lonavala",
    image: IMG.villa2,
    price: 4299,
    rating: 4.5,
    reviews: 101,
    amenities: [
      { icon: "bed", label: "Hotel Room" },
      { icon: "coffee", label: "Breakfast" },
      { icon: "wifi", label: "Wi-Fi" },
    ],
  }),
  make({
    id: "pawna-lake-camping",
    name: "Pawna Lake Camping",
    category: "camping",
    tier: "affordable",
    location: "Pawna Lake, Lonavala",
    locationSlug: "pawna-lake",
    image: IMG.lake,
    price: 1599,
    rating: 4.6,
    reviews: 68,
    amenities: [
      { icon: "tent", label: "Tent Stay" },
      { icon: "fire", label: "Bonfire" },
      { icon: "meals", label: "Meals" },
    ],
  }),
  make({
    id: "forest-view-luxury-villa",
    name: "Forest View Luxury Villa",
    category: "villas",
    tier: "luxury",
    location: "Lonavala, Maval Region",
    locationSlug: "lonavala",
    image: IMG.villa2,
    price: 9999,
    rating: 4.9,
    reviews: 56,
    amenities: [
      { icon: "bed", label: "5 Bedrooms" },
      { icon: "pool", label: "Private Pool" },
      { icon: "lawn", label: "Lawn" },
    ],
  }),
  make({
    id: "lakeside-infinity-retreat",
    name: "Lakeside Infinity Retreat",
    category: "villas",
    tier: "luxury",
    location: "Pawna Lake, Lonavala",
    locationSlug: "pawna-lake",
    image: IMG.hills,
    price: 12499,
    rating: 4.9,
    reviews: 41,
    amenities: [
      { icon: "bed", label: "3 Bedrooms" },
      { icon: "pool", label: "Infinity Pool" },
      { icon: "lake", label: "Lake View" },
    ],
  }),
  make({
    id: "valley-boutique-rooms",
    name: "Valley Boutique Rooms",
    category: "hotel",
    tier: "premium",
    location: "Lonavala, Maval Region",
    locationSlug: "lonavala",
    image: IMG.waterfall,
    price: 5299,
    rating: 4.4,
    reviews: 133,
    amenities: [
      { icon: "bed", label: "Deluxe Room" },
      { icon: "coffee", label: "Breakfast" },
      { icon: "parking", label: "Parking" },
    ],
  }),
];

export const getStay = (id: string) => stays.find((s) => s.id === id);

export const categoryPills: { key: StayCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "villas", label: "Villas" },
  { key: "camping", label: "Camping & Cottages" },
  { key: "hotel", label: "Hotel Rooms" },
];

export const tierPills: { key: StayTier; label: string }[] = [
  { key: "affordable", label: "Affordable" },
  { key: "premium", label: "Premium" },
  { key: "luxury", label: "Luxury" },
];

export const formatPrice = (n: number) => `₹${n.toLocaleString("en-IN")}`;
