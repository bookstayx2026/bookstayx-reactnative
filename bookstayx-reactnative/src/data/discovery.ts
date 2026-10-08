import type { PropertyCategoryKey } from "@/config/property-categories";

export type Location = { slug: string; name: string; district: string; region: string; category: string; image: number; tagline: string; rating: number; reviews: string };
export type PropertyCategory = PropertyCategoryKey;
export type PropertyTier = "affordable" | "premium" | "luxury";
export type PropertyUnit = {
  id: number;
  name: string;
  availablePersons: number;
  totalPersons: number;
  totalInventory?: number;
  availableInventory?: number;
  accommodationType?: string;
  weekdayPrice: number;
  weekendPrice: number;
  specialPrice?: number;
  description?: string;
  images: (number | string)[];
  hasFood?: boolean;
  mealPlan?: string;
  vegPrice?: number;
  nonVegPrice?: number;
  kitchenFacility?: string;
  bedrooms?: number;
  bathrooms?: number;
  bedConfig?: string;
  extraGuestPrice?: number;
  securityDeposit?: number;
};
export type Property = { id: string; name: string; image: number | string; meta: string[]; priceAmount: number; locationSlug: string; locationLabel: string; tab: "top" | "recommended"; category: PropertyCategory; badge: string; rating: number; reviews: number; tier: PropertyTier; description?: string; amenities?: string[]; activities?: string[]; highlights?: string[]; policies?: string[]; schedule?: string[]; gallery?: (number | string)[]; units?: PropertyUnit[]; maxCapacity?: number; checkInTime?: string; checkOutTime?: string; isAvailable?: boolean; hasFood?: boolean };

export const images = {
  hero: require("../../assets/images/discovery/hero.jpg"), lake: require("../../assets/images/discovery/lake.jpg"), hills: require("../../assets/images/discovery/hills.jpg"),
  beach1: require("../../assets/images/discovery/beach1.jpg"), beach2: require("../../assets/images/discovery/beach2.jpg"), beach3: require("../../assets/images/discovery/beach3.jpg"), beach4: require("../../assets/images/discovery/beach4.jpg"),
  fort: require("../../assets/images/discovery/fort.jpg"), temple: require("../../assets/images/discovery/temple.jpg"), waterfall: require("../../assets/images/discovery/waterfall.jpg"), valley: require("../../assets/images/discovery/valley.jpg"),
  villa1: require("../../assets/images/discovery/villa1.jpg"), villa2: require("../../assets/images/discovery/villa2.jpg"), lighthouse: require("../../assets/images/discovery/lighthouse.jpg"),
} as const;

const seed = (slug: string, name: string, district: string, region: string, category: string, image: number, rating = 4.6): Location => ({ slug, name, district, region, category, image, rating, reviews: "1.2K Reviews", tagline: `A serene ${category === "Beach Destination" ? "coastal" : "natural"} paradise in ${region}` });

export const locations: Location[] = [
  seed("lonavala", "Lonavala", "Maval Region", "Pune District", "Hill Station", images.hills, 4.7), seed("pawna-lake", "Pawna Lake", "Maval Region", "Pune District", "Lake Destination", images.lake, 4.8), seed("khandala", "Khandala", "Maval Region", "Pune District", "Hill Station", images.valley, 4.5),
  seed("karjat", "Karjat", "Raigad District", "Raigad", "Nature Escape", images.valley),
  seed("kihim-beach", "Kihim Beach", "Raigad District", "Raigad", "Beach Destination", images.beach1), seed("alibagh", "Alibaug Beach", "Raigad District", "Raigad", "Beach Destination", images.fort), seed("varsoli-beach", "Varsoli Beach", "Raigad District", "Raigad", "Beach Destination", images.beach4), seed("nagaon-beach", "Nagaon Beach", "Raigad District", "Raigad", "Beach Destination", images.beach2), seed("akshi-beach", "Akshi Beach", "Raigad District", "Raigad", "Beach Destination", images.beach1), seed("kashid", "Kashid Beach", "Raigad District", "Raigad", "Beach Destination", images.beach4, 4.7), seed("murud", "Murud Beach", "Raigad District", "Raigad", "Beach Destination", images.fort), seed("diveagar", "Diveagar Beach", "Raigad District", "Konkan", "Beach Destination", images.beach2, 4.7), seed("shrivardhan-beach", "Shrivardhan Beach", "Raigad District", "Raigad", "Beach Destination", images.beach3), seed("harihareshwar-beach", "Harihareshwar Beach", "Raigad District", "Raigad", "Beach Destination", images.lighthouse),
  seed("velas-beach", "Velas Beach", "Ratnagiri District", "Central Konkan", "Beach Destination", images.beach4), seed("kelshi-beach", "Kelshi Beach", "Ratnagiri District", "Central Konkan", "Beach Destination", images.beach1), seed("anjarle-beach", "Anjarle Beach", "Ratnagiri District", "Central Konkan", "Beach Destination", images.beach3), seed("karde-ladghar", "Karde & Ladghar", "Ratnagiri District", "Central Konkan", "Beach Destination", images.beach2), seed("harnai-beach", "Harnai Beach", "Ratnagiri District", "Central Konkan", "Beach Destination", images.lighthouse), seed("guhagar-beach", "Guhagar Beach", "Ratnagiri District", "Central Konkan", "Beach Destination", images.beach4), seed("ganpatipule-beach", "Ganpatipule Beach", "Ratnagiri District", "Central Konkan", "Beach Destination", images.temple),
  seed("devgad-beach", "Devgad Beach", "Sindhudurg District", "Southern Konkan", "Beach Destination", images.lighthouse), seed("kunkeshwar-beach", "Kunkeshwar Beach", "Sindhudurg District", "Southern Konkan", "Beach Destination", images.fort), seed("tarkarli", "Tarkarli Beach", "Sindhudurg District", "Southern Konkan", "Beach Destination", images.beach4, 4.8), seed("chivla-beach", "Chivla Beach", "Sindhudurg District", "Southern Konkan", "Beach Destination", images.beach1), seed("bhogwe-beach", "Bhogwe Beach", "Sindhudurg District", "Southern Konkan", "Beach Destination", images.beach4), seed("nivati-beach", "Nivati Beach", "Sindhudurg District", "Southern Konkan", "Beach Destination", images.beach3), seed("vengurla", "Vengurla Beach", "Sindhudurg District", "Southern Konkan", "Beach Destination", images.beach2), seed("redi-beach", "Redi Beach", "Sindhudurg District", "Southern Konkan", "Beach Destination", images.beach3),
];

export const getLocation = (slug: string) => locations.find((item) => item.slug === slug);
export const popularLocations = ["pawna-lake", "lonavala", "alibagh", "kashid", "murud", "diveagar", "karjat", "tarkarli"].map((slug) => getLocation(slug)!);
export type LocationGroup = { title: string; subtitle?: string; districtKey: string; slugs: string[] };

export const locationGroups: LocationGroup[] = [
  {
    title: "Pune District (Maval & Lakeside Hubs)",
    subtitle: "Tranquil lakes, misty valleys & private hillside sanctuaries",
    districtKey: "Pune District",
    slugs: ["lonavala", "pawna-lake", "khandala"],
  },
  {
    title: "Raigad District (Coastal & Weekend Getaways)",
    subtitle: "Sun-kissed beaches, historic forts & serene nature escapes",
    districtKey: "Raigad District",
    slugs: ["karjat", "kihim-beach", "alibagh", "varsoli-beach", "nagaon-beach", "akshi-beach", "kashid", "murud", "diveagar", "shrivardhan-beach", "harihareshwar-beach"],
  },
  {
    title: "Ratnagiri District (Central Konkan Charm)",
    subtitle: "Untouched golden shorelines, heritage temples & secluded coastal havens",
    districtKey: "Ratnagiri District",
    slugs: ["velas-beach", "kelshi-beach", "anjarle-beach", "karde-ladghar", "harnai-beach", "guhagar-beach", "ganpatipule-beach"],
  },
  {
    title: "Sindhudurg District (Southern Konkan Jewels)",
    subtitle: "Crystal clear waters, pristine coral shores & backwater serenity",
    districtKey: "Sindhudurg District",
    slugs: ["devgad-beach", "kunkeshwar-beach", "tarkarli", "chivla-beach", "bhogwe-beach", "nivati-beach", "vengurla", "redi-beach"],
  },
];

export const properties: Property[] = [
  ["pawna-lakeview-villa","Pawna Lakeview Villa",images.villa1,["4 Bedrooms","Lake View","Pool"],6999,"pawna-lake","Pawna Lake, Lonavala","top","villa","VILLA",4.8,124,"affordable"],
  ["pawna-lakeside-domes","Lakeside Domes",images.hero,["2 Domes","Lake View","Bonfire"],4999,"pawna-lake","Pawna Lake, Lonavala","recommended","camping_cottages","CAMPING & COTTAGES",4.9,86,"affordable"],
  ["valley-view-cottage","Valley View Cottage",images.valley,["2 Bedrooms","Mountain View"],5499,"lonavala","Lonavala Hills","recommended","camping_cottages","CAMPING & COTTAGES",4.7,62,"affordable"],
  ["private-pool-villa","Private Pool Villa",images.villa2,["5 Bedrooms","Private Pool","BBQ"],12999,"lonavala","Lonavala","top","villa","VILLA",4.9,201,"affordable"],
  ["seaside-serenity-villa","Seaside Serenity Villa",images.beach1,["4 Guests","2 Bedrooms","Pool"],15000,"alibagh","Alibagh Coast","top","villa","VILLA",4.8,98,"luxury"],
  ["kashid-beach-cottage","Kashid Beach Cottage",images.beach2,["2-6 Guests","Sea View"],8500,"kashid","Kashid Beach","recommended","camping_cottages","CAMPING & COTTAGES",4.6,54,"premium"],
  ["diveagar-palm-retreat","Diveagar Palm Retreat",images.beach3,["6 Guests","3 Bedrooms","Beach Access"],11000,"diveagar","Diveagar Beach","top","resort","RESORT",4.7,73,"premium"],
  ["pawna-riverside-camp","Riverside Camp Stays",images.lake,["Shared Camp","Bonfire","Lake View"],3499,"pawna-lake","Pawna Lake, Lonavala","recommended","camping_cottages","CAMPING & COTTAGES",4.5,41,"affordable"],
  ["lonavala-cliffside-suite","Cliffside Suite Hotel",images.hills,["King Bed","Mountain View","Breakfast"],9499,"lonavala","Lonavala Hills","recommended","resort","RESORT",4.6,112,"premium"],
  ["murud-fort-villa","Fort View Heritage Villa",images.fort,["3 Bedrooms","Sea View","Pool"],14500,"murud","Murud, Raigad","top","villa","VILLA",4.8,67,"luxury"],
  ["pawna-lake-camping-cottages","Pawna Lake Camping & Cottages",images.lake,["Lakeside Tents & Cottages","Lake View Sunsets","Live Barbecue & Music"],2500,"pawna-lake","Pawna Lake, Lonavala","recommended","camping_cottages","CAMPING & COTTAGES",4.8,95,"affordable"],
  ["emerald-valley-resort","Emerald Valley Resort",images.hills,["Infinity Pool Overlooking Valley","Multi-Cuisine Fine Dining","Private Balconies In All Rooms"],6000,"lonavala","Lonavala Hills","top","resort","RESORT",4.9,150,"premium"],
  ["hillview-homestay","Hillview Homestay",images.valley,["Scenic Garden & Mountain Facing","Authentic Home-Cooked Konkani Food","Peaceful Hillside Neighborhood"],3500,"khandala","Khandala Hills","recommended","homestay","HOMESTAY",4.8,78,"affordable"],
].map((p) => { const [id,name,image,meta,priceAmount,locationSlug,locationLabel,tab,category,badge,rating,reviews,tier]=p as [string,string,number,string[],number,string,string,Property["tab"],PropertyCategory,string,number,number,PropertyTier]; return {id,name,image,meta,priceAmount,locationSlug,locationLabel,tab,category,badge,rating,reviews,tier}; });

export const getProperty = (id: string) => properties.find((item) => item.id === id);
