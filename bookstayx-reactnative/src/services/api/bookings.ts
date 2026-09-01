import { apiRequest } from "./client";
import { apiConfig, isLiveBookingConfigured } from "./config";

export type InitiateBookingInput = {
  propertyId: string; propertyName: string; propertyType: "VILLA" | "CAMPING";
  guestName: string; guestPhone: string; checkIn: string; checkOut: string;
  advanceAmount: number; totalAmount: number; persons: number; maxCapacity: number;
  referralCode?: string;
};
export type InitiatedBooking = { booking_id: string; booking_status?: string; payment_status?: string };

export async function initiateBooking(input: InitiateBookingInput): Promise<InitiatedBooking> {
  if (!isLiveBookingConfigured()) throw new Error("Live booking is not configured for this build.");
  const camping = input.propertyType === "CAMPING";
  const body = {
    property_id: input.propertyId, property_name: input.propertyName, property_type: input.propertyType,
    guest_name: input.guestName, guest_phone: input.guestPhone,
    owner_phone: apiConfig.ownerPhone, admin_phone: apiConfig.adminPhone,
    checkin_datetime: input.checkIn, checkout_datetime: input.checkOut,
    advance_amount: input.advanceAmount, total_amount: input.totalAmount,
    ...(camping ? { veg_guest_count: input.persons, nonveg_guest_count: 0 } : { persons: input.persons, max_capacity: input.maxCapacity }),
    ...(input.referralCode ? { referral_code: input.referralCode } : {}),
  };
  const result = await apiRequest<{ success: boolean; booking?: InitiatedBooking; message?: string }>("/bookings/initiate", { method: "POST", body });
  if (!result.success || !result.booking?.booking_id) throw new Error(result.message || "The server did not create a booking.");
  return result.booking;
}

export const getBooking = (bookingId: string) => apiRequest<{ success?: boolean; booking?: InitiatedBooking }>(`/bookings/${encodeURIComponent(bookingId)}`);
