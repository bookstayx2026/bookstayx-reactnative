import { apiRequest } from "./client";
import { isApiConfigured } from "./config";

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export type AccommodationItemInput = {
  unitId: number;
  persons: number;
  unitQuantity?: number;
};

export type BookingQuoteAccommodationItem = {
  unitId: number | null;
  unitName: string;
  accommodationType?: string;
  persons: number;
  capacityPerUnit: number;
  requiredUnits: number;
  unitQuantity?: number;
  nightlyRates?: { date: string; price: number; isWeekend: boolean; isSpecial: boolean }[];
  subtotal: number;
};

export type BookingQuoteInput = {
  propertyId: string;
  unitId?: number;
  checkIn: string;
  checkOut: string;
  persons?: number;
  unitQuantity?: number;
  accommodationItems?: AccommodationItemInput[];
  items?: AccommodationItemInput[];
};

export type BookingQuote = {
  property: { id: number; propertyId: string; slug: string; name: string; type: "VILLA" | "CAMPING"; category: string; location: string };
  unit: { id: number; name: string } | null;
  items?: BookingQuoteAccommodationItem[];
  accommodationItems?: BookingQuoteAccommodationItem[];
  accommodationTotal?: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  persons: number;
  unitQuantity?: number;
  maxCapacity: number;
  nightlyBreakdown: { date: string; price: number; isWeekend: boolean; isSpecial: boolean; remainingQuantity: number }[];
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  currency: "INR";
};

export type InitiateBookingInput = BookingQuoteInput & {
  guestName: string;
  guestPhone?: string;
  referralCode?: string;
  vegGuestCount?: number;
  nonVegGuestCount?: number;
  maleGuestCount?: number;
  femaleGuestCount?: number;
  unitQuantity?: number;
  accommodationItems?: AccommodationItemInput[];
};

export type BookingItemRecord = {
  id: number;
  unit_id: number;
  unit_name?: string;
  accommodation_type?: string;
  persons: number;
  unit_quantity: number;
  subtotal?: number;
};

export type RemoteBooking = {
  id: number;
  booking_id: string;
  ticket_id?: string | null;
  property_id: string;
  property_name: string;
  property_type: string;
  guest_name: string;
  guest_phone: string;
  checkin_datetime: string;
  checkout_datetime: string;
  check_in_time?: string | null;
  check_out_time?: string | null;
  advance_amount: string | number;
  total_amount: string | number;
  persons: number;
  items?: BookingItemRecord[];
  veg_guest_count?: number | null;
  nonveg_guest_count?: number | null;
  male_guest_count?: number | null;
  female_guest_count?: number | null;
  booking_status: string;
  payment_status: string;
  unit_id?: number | null;
  unit_name?: string | null;
  slug?: string | null;
  location?: string | null;
  property_image?: string | null;
  ticket_token?: string | null;
  created_at: string;
};
export type InitiatedBooking = RemoteBooking;

export async function quoteBooking(input: BookingQuoteInput): Promise<BookingQuote> {
  if (!isApiConfigured()) throw new Error("Live booking is not configured for this build.");
  const result = await apiRequest<{ success: boolean; quote?: BookingQuote; message?: string }>("/bookings/quote", { method: "POST", body: input });
  if (!result.success || !result.quote) throw new Error(result.message || "Unable to calculate this stay.");
  return result.quote;
}

export async function initiateBooking(token: string, input: InitiateBookingInput): Promise<{ booking: InitiatedBooking; quote: BookingQuote }> {
  const result = await apiRequest<{ success: boolean; booking?: InitiatedBooking; quote?: BookingQuote; message?: string }>("/bookings/initiate", { method: "POST", headers: bearer(token), body: input });
  if (!result.success || !result.booking?.booking_id || !result.quote) throw new Error(result.message || "The server did not create a booking.");
  return { booking: result.booking, quote: result.quote };
}

export const getBooking = (token: string, bookingId: string) => apiRequest<{ success: boolean; booking: RemoteBooking }>(`/bookings/${encodeURIComponent(bookingId)}`, { headers: bearer(token) });
export const getMyBookings = (token: string) => apiRequest<{ success: boolean; bookings: RemoteBooking[] }>("/bookings/mine", { headers: bearer(token) });

export type PaymentInitiation = { success:boolean; already_paid?:boolean; booking_id:string; provider?:"mock"|"razorpay"; mock?:boolean; order_id?:string; amount?:number; currency?:"INR"; checkout_url?:string; mock_token?:string };
export const initiatePayment = (token:string,bookingId:string) => apiRequest<PaymentInitiation>("/payments/initiate", { method:"POST",headers:bearer(token),body:{booking_id:bookingId},timeoutMs:30_000 });
export const confirmMockPayment = (token:string,mockToken:string) => apiRequest<{success:true;already_paid?:boolean}>("/payments/razorpay/mock-confirm",{method:"POST",headers:bearer(token),body:{token:mockToken},timeoutMs:30_000});
export const verifyPayment = (bookingId: string) => apiRequest<Record<string, unknown>>(`/payments/verify/${encodeURIComponent(bookingId)}`, { timeoutMs: 30_000 });

export type BookingTicket = {
  booking_id: string; ticket_id?: string | null; property_name: string; guest_name?: string; guest_phone?: string;
  property_slug?: string | null; property_image?: string | null;
  checkin_datetime?: string; checkout_datetime?: string; check_in_time?: string | null; check_out_time?: string | null;
  advance_amount?: string | number; due_amount?: string | number; total_amount?: string | number;
  owner_name?: string | null; owner_phone?: string | null; map_link?: string | null; property_address?: string | null;
  persons?: number;
  unit_name?: string | null;
  unit_quantity?: number | null;
  items?: BookingItemRecord[];
  has_food?: boolean | null; meal_plan?: string | null; veg_guest_count?: number | null; nonveg_guest_count?: number | null;
  male_guest_count?: number | null; female_guest_count?: number | null;
  booking_status: string; payment_status: string; transaction_id?: string | null;
  order_id?: string | null; created_at?: string | null;
  payment_failure_reason?: string | null; refund_status?: string | null;
};
export const getBookingTicket = (bookingId?: string, token?: string) => {
  const search = token ? `token=${encodeURIComponent(token)}` : `booking_id=${encodeURIComponent(bookingId || "")}`;
  return apiRequest<BookingTicket>(`/etickets/booking?${search}`);
};
