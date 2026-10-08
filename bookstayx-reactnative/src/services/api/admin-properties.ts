import { apiRequest } from "./client";

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
export type AdminPropertyImage = { id?: number; image_url: string; display_order?: number };
export type AdminUnit = { id: number; name: string; available_persons: number; total_persons: number; weekday_price?: string; weekend_price?: string; description?: string; amenities?: string[] | string; images?: string[] | string };
export type AdminProperty = {
  id: number; property_id: string; slug: string; title: string; description: string; category: "villa" | "camping_cottages" | "resort" | "homestay"; location: string;
  price: string; weekday_price?: string; weekend_price?: string; price_note: string; capacity: number; max_capacity?: number; rating?: number;
  owner_name?: string; owner_whatsapp_number?: string; owner_otp_number?: string; is_active: boolean; is_available: boolean; is_top_selling: boolean;
  amenities?: string[] | string; activities?: string[] | string; highlights?: string[] | string; policies?: string[] | string; schedule?: string[] | string;
  images: AdminPropertyImage[]; units: AdminUnit[];
};
export type AdminPropertyInput = Partial<Omit<AdminProperty, "id" | "images" | "units">> & { title: string; description: string; category: AdminProperty["category"]; location: string; images?: string[]; amenities?: string[]; activities?: string[]; highlights?: string[]; policies?: string[]; schedule?: string[] };
export type AdminUnitInput = { name: string; available_persons: number; total_persons: number; weekday_price: string; weekend_price: string; description?: string; amenities?: string[]; images?: string[] };

export const getAdminProperties = (token: string) => apiRequest<{ success: true; data: AdminProperty[] }>("/api/properties/list", { headers: bearer(token) });
export const createAdminProperty = (token: string, body: AdminPropertyInput) => apiRequest<{ success: true; data: { id: number; slug: string } }>("/api/properties/create", { method: "POST", headers: bearer(token), body });
export const updateAdminProperty = (token: string, id: number | string, body: Partial<AdminPropertyInput>) => apiRequest<{ success: true; data: AdminProperty }>(`/api/properties/update/${id}`, { method: "PUT", headers: bearer(token), body });
export const deleteAdminProperty = (token: string, id: number) => apiRequest<{ success: true }>(`/api/properties/delete/${id}`, { method: "DELETE", headers: bearer(token) });
export const toggleAdminProperty = (token: string, id: number, field: "is_active" | "is_available" | "is_top_selling", value: boolean) => apiRequest<{ success: true }>(`/api/properties/toggle-status/${id}`, { method: "PATCH", headers: bearer(token), body: { field, value } });
export const createAdminUnit = (token: string, propertyId: string | number, body: AdminUnitInput) => apiRequest<{ success: true; data: AdminUnit }>(`/api/properties/${propertyId}/units`, { method: "POST", headers: bearer(token), body });
export const updateAdminUnit = (token: string, unitId: number, body: Partial<AdminUnitInput>) => apiRequest<{ success: true; data: AdminUnit }>(`/api/properties/units/${unitId}`, { method: "PUT", headers: bearer(token), body });
export const deleteAdminUnit = (token: string, unitId: number) => apiRequest<{ success: true }>(`/api/properties/units/${unitId}`, { method: "DELETE", headers: bearer(token) });
