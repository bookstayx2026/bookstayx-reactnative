import { Platform } from "react-native";

const trimSlash = (value: string) => value.replace(/\/+$/, "");

export type ApiConfig = {
  baseUrl: string | null;
  ownerPhone: string | null;
  adminPhone: string | null;
  timeoutMs: number;
};

export const apiConfig: ApiConfig = {
  baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL
    ? trimSlash(process.env.EXPO_PUBLIC_API_BASE_URL)
    : null,
  ownerPhone: process.env.EXPO_PUBLIC_BOOKING_OWNER_PHONE || null,
  adminPhone: process.env.EXPO_PUBLIC_BOOKING_ADMIN_PHONE || null,
  timeoutMs: 12_000,
};

export function apiConfigurationHint() {
  const localhost = Platform.OS === "android" ? "http://10.0.2.2:5001/api" : "http://localhost:5001/api";
  return `Set EXPO_PUBLIC_API_BASE_URL (for example ${localhost}) to enable the legacy API.`;
}

export const isApiConfigured = () => Boolean(apiConfig.baseUrl);
export const isLiveBookingConfigured = () =>
  Boolean(apiConfig.baseUrl && apiConfig.ownerPhone && apiConfig.adminPhone);
