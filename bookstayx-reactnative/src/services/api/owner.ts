import { apiRequest } from "./client";

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const query = (params: Record<string, string | number | undefined>) => new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string | number] => entry[1] !== undefined).map(([key, value]) => [key, String(value)])).toString();

export type OwnerUnit = { id: number; name: string; available_persons?: number; total_persons?: number; amenities?: string[] | string; images?: string[] | string; price_per_person?: string; weekday_price?: string; weekend_price?: string; special_price?: string; special_dates?: unknown[] | string };
export type OwnerCalendarDay = { date: string; price: string | number | null; is_booked: boolean; available_quantity?: number; total_capacity?: number; is_soft_locked?: boolean; is_payment_initiated?: boolean };
export type OwnerLedgerEntry = { id: number; customer_name: string; check_in: string; check_out: string; payment_mode?: string; amount?: number | string; advance_amount?: number | string; total_amount?: number | string; unit_id?: number; unit_name?: string; source: "website" | "offline"; booking_id?: string; booking_status?: string };
export type UnitInput = { name: string; available_persons: number; total_persons: number; amenities?: string[]; images?: string[]; price_per_person?: string; weekday_price?: string; weekend_price?: string; special_price?: string; special_dates?: unknown[] };

export const getOwnerProperty = (propertyId: string, token: string) => apiRequest<{ success: true; data: Record<string, unknown> }>(`/api/owners/my-property/${encodeURIComponent(propertyId)}`, { headers: bearer(token) });
export const getOwnerPropertyUnits = (propertyId: string, token: string) => apiRequest<{ success: true; data: OwnerUnit[] }>(`/api/properties/${encodeURIComponent(propertyId)}/units`, { headers: bearer(token) });
export const createOwnerUnit = (propertyId: string, token: string, body: UnitInput) => apiRequest<{ success: true; data: OwnerUnit }>(`/api/properties/${encodeURIComponent(propertyId)}/units`, { method: "POST", headers: bearer(token), body });
export const updateOwnerUnit = (unitId: number, token: string, body: Partial<UnitInput>) => apiRequest<{ success: true; data: OwnerUnit }>(`/api/properties/units/${unitId}`, { method: "PUT", headers: bearer(token), body });
export const deleteOwnerUnit = (unitId: number, token: string) => apiRequest<{ success: true }>(`/api/properties/units/${unitId}`, { method: "DELETE", headers: bearer(token) });
export const getOwnerCalendar = (propertyId: string) => apiRequest<{ success: true; data: OwnerCalendarDay[]; meta: { totalCapacity: number; isVilla: boolean } }>(`/api/properties/${encodeURIComponent(propertyId)}/calendar`);
export const updateOwnerCalendarDay = (propertyId: string, token: string, body: { date: string; price: number; is_booked: boolean }) => apiRequest<{ success: true; message: string }>(`/api/properties/${encodeURIComponent(propertyId)}/calendar`, { method: "PUT", headers: bearer(token), body });
export const getOwnerLedger = (propertyId: string, mobile: string, year: number, month: number, unitId?: number | "all") => apiRequest<{ success: true; data: OwnerLedgerEntry[] }>(`/api/bookings/owner/ledger?${query({ property_id: propertyId, mobile, year, month, unit_id: unitId })}`);
export const getOwnerLedgerUnits = (propertyId: string, mobile: string) => apiRequest<{ success: true; data: { id: number; name: string }[] }>(`/api/bookings/owner/units?${query({ property_id: propertyId, mobile })}`);
