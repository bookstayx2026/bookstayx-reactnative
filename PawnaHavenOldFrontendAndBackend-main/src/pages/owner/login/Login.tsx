import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useOtpAutoFill } from "@/hooks/useOtpAutoFill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Shield, Loader2, RefreshCw, Code2 } from "lucide-react";
import { startOwnerDeveloperSession } from "@/lib/developerAccess";

const COOLDOWN_SECONDS = 30;
const RATE_LIMIT = 4;

const OwnerLogin = () => {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLimitLeft, setOtpLimitLeft] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = () => {
    setCooldown(COOLDOWN_SECONDS);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const sendOtpRequest = async () => {
    if (mobile.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits");
      return false;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/owners/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: mobile }),
      });
      const data = await response.json();

      if (data.success) {
        if (data.otpLimitLeft !== null && data.otpLimitLeft !== undefined) {
          setOtpLimitLeft(data.otpLimitLeft);
        }
        startCooldown();
        return true;
      } else {
        toast.error(data.message || "Failed to send OTP");
        return false;
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      toast.error("Error connecting to server");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await sendOtpRequest();
    if (ok) {
      setShowOTP(true);
      toast.success("OTP sent successfully!");
    }
  };

  const handleResendOTP = async () => {
    const ok = await sendOtpRequest();
    if (ok) {
      setOtp("");
      toast.success("OTP resent successfully!");
    }
  };

  const performLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/owners/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: mobile, otp }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem("ownerLoggedIn", "true");
        localStorage.setItem("ownerToken", data.token);
        if (data.refreshToken) localStorage.setItem("ownerRefreshToken", data.refreshToken);
        localStorage.setItem("ownerData", JSON.stringify(data.data));
        toast.success("Login successful!");
        navigate("/owner/dashboard");
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin();
  };

  const { onOtpChange } = useOtpAutoFill(setOtp, showOTP);

  useEffect(() => {
    if (showOTP && otp.length === 6 && !loading) {
      performLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, showOTP]);

  const limitReached = otpLimitLeft !== null && otpLimitLeft <= 0;

  const handleDeveloperAccess = () => {
    startOwnerDeveloperSession();
    toast.success("Developer preview enabled");
    navigate("/owner/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden p-4">
      <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#F59E0B]/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#F59E0B]/5 rounded-full blur-3xl animate-float delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-[#F59E0B]/5 to-transparent rounded-full" />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl 
          bg-[#F59E0B] mb-6 
          shadow-[0_0_25px_rgba(245,158,11,0.35)] 
          mx-auto"
          >
            <Shield className="w-10 h-10 text-black" />
          </div>
          <h1 className="font-display text-4xl font-semibold text-foreground mb-2">
            PawnaHavenCamp
          </h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            Owner Login
            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
          </p>
        </div>

        <div className="glass rounded-3xl p-8 border border-border/50 shadow-card">
          {!showOTP ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  Welcome back
                </h2>
                <p className="text-sm text-muted-foreground">
                  Enter your mobile number to receive an OTP
                </p>
              </div>
              <Input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                placeholder="Enter registered mobile number"
                value={mobile}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setMobile(value.slice(0, 10));
                }}
                className="h-12 bg-secondary/50 border-border/50 rounded-xl px-4 text-foreground placeholder:text-muted-foreground focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 transition-all duration-300"
                required
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-gold-dark hover:from-gold-dark hover:to-primary transition-all duration-500 shadow-gold hover:shadow-gold-lg transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  "Send OTP"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4 text-center">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  Verify OTP
                </h2>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code sent to your mobile
                </p>
              </div>

              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => onOtpChange(e.target.value)}
                placeholder="Enter OTP"
                className="
            h-14
            bg-secondary/50
            border-border/50
            rounded-xl
            text-center
            text-2xl
            tracking-widest
            font-bold
            placeholder:text-muted-foreground
            placeholder:opacity-40
            focus:placeholder:opacity-25
            focus:border-[#F59E0B]
            focus:ring-2
            focus:ring-[#F59E0B]/20
            transition-all
          "
              />

              <Button
                type="submit"
                disabled={loading}
                className="
            w-full h-12 text-base font-semibold rounded-xl
            bg-[#F59E0B]
            text-black
            hover:bg-[#D97706]
            active:bg-[#B45309]
            shadow-[0_0_15px_rgba(245,158,11,0.35)]
            hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]
            transition-all duration-200
          "
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-black" />
                ) : (
                  "Verify & Login"
                )}
              </Button>

              {/* Resend OTP section */}
              <div className="pt-1 space-y-2">
                {limitReached ? (
                  <p className="text-xs text-red-400">
                    OTP limit reached. Try again after some time.
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={loading || cooldown > 0}
                    onClick={handleResendOTP}
                    className="w-full text-sm text-[#F59E0B] hover:text-[#D97706] hover:bg-[#F59E0B]/10 disabled:opacity-50 gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
                  </Button>
                )}

                {otpLimitLeft !== null && otpLimitLeft > 0 && (
                  <p className="text-[11px] text-muted-foreground/60">
                    {otpLimitLeft} of {RATE_LIMIT} OTPs remaining this hour
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant="link"
                onClick={() => setShowOTP(false)}
                className="
            text-muted-foreground
            hover:text-[#F59E0B]
            hover:bg-transparent
            focus:bg-transparent
            active:bg-transparent
            transition-colors
          "
              >
                Change mobile number
              </Button>
            </form>
          )}

          {!showOTP && (
            <>
              <div className="relative my-6" aria-hidden="true">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/40" /></div>
                <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">Developer tools</span></div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleDeveloperAccess}
                className="w-full min-h-12 rounded-xl border-[#F59E0B]/40 bg-[#F59E0B]/5 text-foreground hover:bg-[#F59E0B]/10"
              >
                <Code2 className="w-5 h-5 mr-2 text-[#F59E0B]" />
                Open owner developer preview
              </Button>
              <p className="mt-2 text-center text-xs leading-relaxed text-muted-foreground">
                Demo villa workspace. No production owner session is created.
              </p>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <Button
            variant="link"
            onClick={() => navigate("/owner/register")}
            className="text-sm text-muted-foreground hover:text-[#F59E0B] hover:bg-transparent"
          >
            Not registered yet? Register as Owner
          </Button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[10px] tracking-[0.2em] font-bold text-muted-foreground/40 uppercase">
            Powered by PawnaHavenCamp Luxury Stay
          </p>
        </div>
      </div>
    </div>
  );
};

export default OwnerLogin;
