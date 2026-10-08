import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { apiRequest } from "@/services/api/client";

const KEY = "bookstayx.referral.code";

async function write(value: string | null) {
  if (Platform.OS === "web") {
    if (value) globalThis.localStorage?.setItem(KEY, value);
    else globalThis.localStorage?.removeItem(KEY);
    return;
  }
  if (value) await SecureStore.setItemAsync(KEY, value);
  else await SecureStore.deleteItemAsync(KEY);
}

export async function rememberReferralCode(rawCode: string) {
  const code = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!code) return null;
  const result = await apiRequest<{ valid: boolean }>(`/api/referrals/validate/${encodeURIComponent(code)}`);
  if (!result.valid) return null;
  await write(code);
  return code;
}

export async function getRememberedReferralCode() {
  if (Platform.OS === "web") return globalThis.localStorage?.getItem(KEY) || null;
  return SecureStore.getItemAsync(KEY);
}

export const clearRememberedReferralCode = () => write(null);
