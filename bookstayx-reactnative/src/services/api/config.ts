import { Platform } from "react-native";
import Constants from "expo-constants";

const trimSlash = (value: string) => value.replace(/\/+$/, "");

export type ApiConfig = {
  baseUrl: string | null;
  ownerPhone: string | null;
  adminPhone: string | null;
  timeoutMs: number;
};

function inferDevelopmentApiUrl() {
  if (Platform.OS === "web") {
    return "http://localhost:5001/api";
  }

  const expoHost = Constants.expoConfig?.hostUri?.split(":")[0];
  if (expoHost) {
    return `http://${expoHost}:5001/api`;
  }

  return Platform.OS === "android"
    ? "http://10.0.2.2:5001/api"
    : "http://localhost:5001/api";
}

function resolveApiBaseUrl(): string | null {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  const isDev = typeof __DEV__ !== "undefined" ? Boolean(__DEV__) : process.env.NODE_ENV !== "production";

  if (Platform.OS === "web") {
    // In production web build, always default to relative /api for same-project routing
    if (!isDev) {
      if (!configured || configured.toLowerCase() === "auto") {
        return "/api";
      }
      return trimSlash(configured);
    }

    // In web development: if "auto", empty, or unset, use local development server
    if (!configured || configured.toLowerCase() === "auto") {
      return inferDevelopmentApiUrl();
    }
    return trimSlash(configured);
  }

  // Native mobile (Android / iOS):
  if (!configured || configured.toLowerCase() === "auto") {
    if (isDev) {
      return inferDevelopmentApiUrl();
    }
    return "https://bookstayx.com/api";
  }

  return trimSlash(configured);
}

export const apiConfig: ApiConfig = {
  baseUrl: resolveApiBaseUrl(),
  ownerPhone: process.env.EXPO_PUBLIC_BOOKING_OWNER_PHONE || null,
  adminPhone: process.env.EXPO_PUBLIC_BOOKING_ADMIN_PHONE || null,
  timeoutMs: 12_000,
};

export function apiConfigurationHint() {
  return "Set EXPO_PUBLIC_API_BASE_URL=auto for local development or /api for production on Vercel.";
}

export const isApiConfigured = () => Boolean(apiConfig.baseUrl);
export const isLiveBookingConfigured = () =>
  Boolean(apiConfig.baseUrl);
