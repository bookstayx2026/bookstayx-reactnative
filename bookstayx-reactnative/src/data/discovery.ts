export type Location = { slug: string; name: string; district: string; region: string; category: string; image: number; tagline: string; rating: number; reviews: string };
export type PropertyCategory = "villas" | "camping" | "hotel" | "campings";
export type PropertyTier = "affordable" | "premium" | "luxury";
export type Property = { id: string; name: string; image: number | string; meta: string[]; priceAmount: number; locationSlug: string; locationLabel: string; tab: "top" | "recommended"; category: PropertyCategory; badge: string; rating: number; reviews: number; tier: PropertyTier };

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
export const popularLocations = ["pawna-lake", "lonavala", "alibagh", "kashid", "murud", "diveagar"].map((slug) => getLocation(slug)!);
export const locationGroups = [
  { title: "Pune District (Maval Region)", slugs: ["lonavala", "pawna-lake", "khandala"] }, { title: "Karjat District", slugs: ["karjat"] },
  { title: "Raigad District (Popular Weekend Hubs)", slugs: ["kihim-beach", "alibagh", "varsoli-beach", "nagaon-beach", "akshi-beach", "kashid", "murud", "diveagar", "shrivardhan-beach", "harihareshwar-beach"] },
  { title: "Ratnagiri District (Central Konkan)", slugs: ["velas-beach", "kelshi-beach", "anjarle-beach", "karde-ladghar", "harnai-beach", "guhagar-beach", "ganpatipule-beach"] },
  { title: "Sindhudurg District (Southern Konkan)", slugs: ["devgad-beach", "kunkeshwar-beach", "tarkarli", "chivla-beach", "bhogwe-beach", "nivati-beach", "vengurla", "redi-beach"] },
];

export const properties: Property[] = [
  ["pawna-lakeview-villa","Pawna Lakeview Villa",images.villa1,["4 Bedrooms","Lake View","Pool"],6999,"pawna-lake","Pawna Lake, Lonavala","top","villas","VILLA",4.8,124,"affordable"],
  ["pawna-lakeside-domes","Lakeside Domes",images.hero,["2 Domes","Lake View","Bonfire"],4999,"pawna-lake","Pawna Lake, Lonavala","recommended","camping","CAMPING & COTTAGES",4.9,86,"affordable"],
  ["valley-view-cottage","Valley View Cottage",images.valley,["2 Bedrooms","Mountain View"],5499,"lonavala","Lonavala Hills","recommended","camping","CAMPING & COTTAGES",4.7,62,"affordable"],
  ["private-pool-villa","Private Pool Villa",images.villa2,["5 Bedrooms","Private Pool","BBQ"],12999,"lonavala","Lonavala","top","villas","VILLA",4.9,201,"affordable"],
  ["seaside-serenity-villa","Seaside Serenity Villa",images.beach1,["4 Guests","2 Bedrooms","Pool"],15000,"alibagh","Alibagh Coast","top","villas","VILLA",4.8,98,"luxury"],
  ["kashid-beach-cottage","Kashid Beach Cottage",images.beach2,["2-6 Guests","Sea View"],8500,"kashid","Kashid Beach","recommended","camping","CAMPING & COTTAGES",4.6,54,"premium"],
  ["diveagar-palm-retreat","Diveagar Palm Retreat",images.beach3,["6 Guests","3 Bedrooms","Beach Access"],11000,"diveagar","Diveagar Beach","top","hotel","HOTEL ROOMS",4.7,73,"premium"],
  ["pawna-riverside-camp","Riverside Camp Stays",images.lake,["Shared Camp","Bonfire","Lake View"],3499,"pawna-lake","Pawna Lake, Lonavala","recommended","campings","CAMPINGS",4.5,41,"affordable"],
  ["lonavala-cliffside-suite","Cliffside Suite Hotel",images.hills,["King Bed","Mountain View","Breakfast"],9499,"lonavala","Lonavala Hills","recommended","hotel","HOTEL ROOMS",4.6,112,"premium"],
  ["murud-fort-villa","Fort View Heritage Villa",images.fort,["3 Bedrooms","Sea View","Pool"],14500,"murud","Murud, Raigad","top","villas","VILLA",4.8,67,"luxury"],
].map((p) => { const [id,name,image,meta,priceAmount,locationSlug,locationLabel,tab,category,badge,rating,reviews,tier]=p as [string,string,number,string[],number,string,string,Property["tab"],PropertyCategory,string,number,number,PropertyTier]; return {id,name,image,meta,priceAmount,locationSlug,locationLabel,tab,category,badge,rating,reviews,tier}; });

export const getProperty = (id: string) => properties.find((item) => item.id === id);
