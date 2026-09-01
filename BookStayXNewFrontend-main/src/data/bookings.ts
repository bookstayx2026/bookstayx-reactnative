import { IMG } from "@/lib/images";

export type BookingStatus = "confirmed" | "completed" | "cancelled";
export type BookingCategory = "Villa" | "Camping & Cottages" | "Hotel Room";

export type Booking = {
  id: string;
  bookingCode: string;
  name: string;
  image: string;
  location: string;
  dateRange: string;
  nights: number;
  guests: number;
  category: BookingCategory;
  status: BookingStatus;
  checkInLabel: string;
  checkInWhen: string;
  totalAmount: number;
  advancedPaid: number;
  tab: "live" | "history";
};

export const bookings: Booking[] = [
  {
    id: "b1",
    bookingCode: "PHC78945",
    name: "Pawna Lakeview Villa",
    image: IMG.villa1,
    location: "Pawna Lake, Lonavala",
    dateRange: "24 May – 26 May 2025",
    nights: 2,
    guests: 6,
    category: "Villa",
    status: "confirmed",
    checkInLabel: "Check-in in 2 days",
    checkInWhen: "24 May, 2:00 PM",
    totalAmount: 13998,
    advancedPaid: 6998,
    tab: "live",
  },
  {
    id: "b2",
    bookingCode: "PHC78946",
    name: "Lakeside Domes",
    image: IMG.hero,
    location: "Pawna Lake, Lonavala",
    dateRange: "28 May – 29 May 2025",
    nights: 1,
    guests: 2,
    category: "Camping & Cottages",
    status: "confirmed",
    checkInLabel: "Check-in in 6 days",
    checkInWhen: "28 May, 1:00 PM",
    totalAmount: 4999,
    advancedPaid: 2499,
    tab: "live",
  },
  {
    id: "b3",
    bookingCode: "PHC78947",
    name: "Cliffside Suite Hotel",
    image: IMG.hills,
    location: "Lonavala Hills",
    dateRange: "01 Jun – 03 Jun 2025",
    nights: 2,
    guests: 3,
    category: "Hotel Room",
    status: "confirmed",
    checkInLabel: "Check-in in 10 days",
    checkInWhen: "01 Jun, 12:00 PM",
    totalAmount: 18998,
    advancedPaid: 9499,
    tab: "live",
  },
  {
    id: "b4",
    bookingCode: "PHC71220",
    name: "Valley View Cottage",
    image: IMG.valley,
    location: "Lonavala Hills",
    dateRange: "10 Apr – 12 Apr 2025",
    nights: 2,
    guests: 4,
    category: "Camping & Cottages",
    status: "completed",
    checkInLabel: "Completed stay",
    checkInWhen: "Checked out 12 Apr",
    totalAmount: 10998,
    advancedPaid: 10998,
    tab: "history",
  },
  {
    id: "b5",
    bookingCode: "PHC71001",
    name: "Private Pool Villa",
    image: IMG.villa2,
    location: "Lonavala",
    dateRange: "02 Mar – 04 Mar 2025",
    nights: 2,
    guests: 8,
    category: "Villa",
    status: "cancelled",
    checkInLabel: "Booking cancelled",
    checkInWhen: "Cancelled on 28 Feb",
    totalAmount: 25998,
    advancedPaid: 0,
    tab: "history",
  },
];

export const bookingSummary = {
  upcoming: 3,
  completed: 5,
  cancelled: 1,
  totalSpent: 20796,
};
