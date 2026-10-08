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

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production";

export const apiConfig: ApiConfig = {
  baseUrl:
    configuredBaseUrl === "auto" || (!configuredBaseUrl && isDev)
      ? inferDevelopmentApiUrl()
      : configuredBaseUrl
        ? trimSlash(configuredBaseUrl)
        : null,
  ownerPhone: process.env.EXPO_PUBLIC_BOOKING_OWNER_PHONE || null,
  adminPhone: process.env.EXPO_PUBLIC_BOOKING_ADMIN_PHONE || null,
  timeoutMs: 12_000,
};

export function apiConfigurationHint() {
  return "Set EXPO_PUBLIC_API_BASE_URL=auto for local development or use the deployed API URL.";
}

export const isApiConfigured = () => Boolean(apiConfig.baseUrl);
export const isLiveBookingConfigured = () =>
  Boolean(apiConfig.baseUrl);
