import lakesideImage from "@/assets/lakestory-resort.jpg";
import domeImage from "@/assets/dome-resort.jpg";
import cozyImage from "@/assets/cozynest-resort.jpg";
import riversideImage from "@/assets/riverside-glamping.jpg";
import retreatImage from "@/assets/couple-retreat.jpg";
import cabinsImage from "@/assets/colorful-cabins.jpg";

export interface DemoProperty {
  id: string;
  property_id: string;
  slug: string;
  title: string;
  description: string;
  category: "villa" | "campings_cottages";
  location: string;
  price: string;
  price_note: string;
  rating: number;
  capacity: number;
  amenities: string[];
  image: string;
  images: string[];
  is_active: true;
  is_available: true;
  is_top_selling: boolean;
  is_demo: true;
}

const createDemo = (
  index: number,
  category: DemoProperty["category"],
  title: string,
  location: string,
  price: number,
  image: string,
  amenities: string[],
  topSelling = false,
): DemoProperty => ({
  id: `demo-${category}-${index}`,
  property_id: `DEMO-${category === "villa" ? "V" : "C"}-${index}`,
  slug: `demo-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
  title,
  description: "Developer preview listing with sample content and availability.",
  category,
  location,
  price: String(price),
  price_note: category === "villa" ? "per villa" : "per person",
  rating: Number((4.5 + index * 0.08).toFixed(1)),
  capacity: category === "villa" ? 12 + index * 2 : 30 + index * 5,
  amenities,
  image,
  images: [image],
  is_active: true,
  is_available: true,
  is_top_selling: topSelling,
  is_demo: true,
});

export const demoProperties: DemoProperty[] = [
  createDemo(1, "campings_cottages", "Lakeside Story Camp", "Pawna Lake", 1299, lakesideImage, ["Lake View", "Meals", "Bonfire"], true),
  createDemo(2, "campings_cottages", "Moonlit Dome Retreat", "Tikona", 1799, domeImage, ["AC Dome", "Pool", "Breakfast"]),
  createDemo(3, "campings_cottages", "Cozy Nest Cottages", "Kamshet", 2199, cozyImage, ["Private Cottage", "Meals", "Parking"]),
  createDemo(4, "campings_cottages", "Riverside Glamping", "Lonavala", 1499, riversideImage, ["River View", "Music", "Bonfire"], true),
  createDemo(5, "campings_cottages", "Sunset Couple Camp", "Pawna Nagar", 1999, retreatImage, ["Couple Friendly", "Dinner", "Kayaking"]),
  createDemo(1, "villa", "Azure Lake Villa", "Pawna Lake", 8999, lakesideImage, ["Private Pool", "Lake View", "Caretaker"], true),
  createDemo(2, "villa", "Golden Ridge Villa", "Lonavala", 12999, retreatImage, ["Infinity Pool", "BBQ", "Mountain View"]),
  createDemo(3, "villa", "Dome House Estate", "Tikona", 15999, domeImage, ["5 Bedrooms", "Lawn", "Indoor Games"]),
  createDemo(4, "villa", "Riverside Manor", "Kamshet", 18999, riversideImage, ["River Access", "Private Pool", "Chef"]),
  createDemo(5, "villa", "Color Cove Villa", "Pawna Nagar", 22999, cabinsImage, ["Luxury Suites", "Jacuzzi", "Event Lawn"], true),
];

export const demoCategorySettings = [
  { category: "campings_cottages", is_active: true, is_closed: false, description: "Demo camping and cottage stays" },
  { category: "villa", is_active: true, is_closed: false, description: "Demo private villas" },
];
