import { useEffect } from "react";
import { useGlobalSearchParams } from "expo-router";
import { rememberReferralCode } from "@/services/referrals/attribution";

export function ReferralAttributionTracker() {
  const params = useGlobalSearchParams<{ ref?: string | string[]; referralCode?: string | string[] }>();
  const value = params.ref ?? params.referralCode;
  const code = Array.isArray(value) ? value[0] : value;
  useEffect(() => { if (code) void rememberReferralCode(code).catch(() => undefined); }, [code]);
  return null;
}
