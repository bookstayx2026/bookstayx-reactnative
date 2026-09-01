import { useEffect } from "react";

export function useOtpAutoFill(
  setOtp: (otp: string) => void,
  active: boolean = true,
) {
  useEffect(() => {
    if (!active || typeof window === "undefined") return;
    if (!("OTPCredential" in window)) return;

    const ac = new AbortController();

    (navigator.credentials as any)
      .get({ otp: { transport: ["sms"] }, signal: ac.signal })
      .then((cred: any) => {
        if (cred?.code) {
          setOtp(cred.code.replace(/\D/g, "").slice(0, 6));
        }
      })
      .catch(() => {});

    return () => ac.abort();
  }, [active, setOtp]);

  const onOtpChange = (value: string) => {
    setOtp(value.replace(/\D/g, "").slice(0, 6));
  };

  return { onOtpChange };
}
