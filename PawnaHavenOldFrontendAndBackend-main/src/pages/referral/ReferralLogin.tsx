import { useState, useEffect, useRef } from "react";
import { useOtpAutoFill } from "@/hooks/useOtpAutoFill";
import { Helmet } from "react-helmet-async";
import { ShieldCheck, Lock, Send, Loader2, RefreshCw, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { isReferralDeveloperMode, startReferralDeveloperSession } from "@/lib/developerAccess";

const COOLDOWN_SECONDS = 30;
const RATE_LIMIT = 4;

const ReferralLogin = () => {
  const navigate = useNavigate();
  const dashboardPath = window.location.pathname.startsWith("/referral/")
    ? "/referral/dashboard"
    : "/dashboard";
  const [step, setStep] = useState<"verify" | "otp">("verify");
  const [loading, setLoading] = useState(false);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpLimitLeft, setOtpLimitLeft] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("referral_token");
    if (token || isReferralDeveloperMode()) {
      navigate(dashboardPath, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

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

  const sendOtpRequest = async () => {
    if (!mobile || mobile.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return false;
    }
    setLoading(true);
    try {
      const res = await axios.post("/api/referrals/request-otp", {
        mobile,
        purpose: "referral_login",
      });
      if (res.data.otpLimitLeft !== null && res.data.otpLimitLeft !== undefined) {
        setOtpLimitLeft(res.data.otpLimitLeft);
      }
      startCooldown();
      return true;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to send OTP. Make sure your number is registered.",
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    const ok = await sendOtpRequest();
    if (ok) {
      toast.success("OTP sent to your registered mobile");
      setStep("otp");
    }
  };

  const handleResendOTP = async () => {
    const ok = await sendOtpRequest();
    if (ok) {
      setOtp("");
      toast.success("OTP resent successfully!");
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const verifyRes = await axios.post("/api/referrals/verify-otp", {
        mobile,
        otp,
        purpose: "referral_login",
      });
      const otpToken = verifyRes.data.token;
      const loginRes = await axios.post(
        "/api/referrals/login",
        {},
        { headers: { Authorization: `Bearer ${otpToken}` } },
      );
      const finalToken = loginRes.data.token;
      localStorage.setItem("referral_token", finalToken);
      if (loginRes.data.refreshToken) localStorage.setItem("referral_refresh_token", loginRes.data.refreshToken);
      toast.success("Login successful!");
      navigate(dashboardPath, { replace: true });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Login failed. Please check your OTP.",
      );
    } finally {
      setLoading(false);
    }
  };

  const { onOtpChange } = useOtpAutoFill(setOtp, step === "otp");

  useEffect(() => {
    if (step === "otp" && otp.length === 6 && !loading) {
      handleVerifyOTP();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, step]);

  const limitReached = otpLimitLeft !== null && otpLimitLeft <= 0;

  const handleDeveloperAccess = () => {
    startReferralDeveloperSession();
    toast.success("Referral developer preview enabled");
    navigate(dashboardPath, { replace: true });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Helmet>
        <title>Login - Referral Dashboard</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="sticky top-0 z-50 bg-black border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <h1 className="font-display text-xl font-bold text-[#F59E0B]">
            Referral Dashboard
          </h1>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {step === "verify" && (
            <div className="space-y-8 animate-fade-up">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#F59E0B]/10 rounded-2xl flex items-center justify-center text-[#F59E0B] mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-display font-bold">
                  Login to Dashboard
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your registered mobile number
                </p>
              </div>
              <Card className="p-6 bg-card border-border/50 rounded-3xl space-y-4">
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <Input
                    placeholder="e.g. 9999999999"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 10) setMobile(value);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                    className="h-12 bg-secondary/50 rounded-xl"
                  />
                </div>

                <Button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full h-12 rounded-xl font-bold gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-black"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send OTP
                    </>
                  )}
                </Button>

                <div className="relative py-2" aria-hidden="true">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
                  <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">Developer tools</span></div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDeveloperAccess}
                  className="w-full min-h-12 rounded-xl border-[#F59E0B]/40 bg-[#F59E0B]/5 text-white hover:bg-[#F59E0B]/10 hover:text-white"
                >
                  <Code2 className="w-5 h-5 mr-2 text-[#F59E0B]" />
                  Open referral developer preview
                </Button>
                <p className="text-center text-xs leading-relaxed text-muted-foreground">
                  Read-only demo partner with sample earnings and history.
                </p>

                <div className="text-center pt-2">
                  <Link
                    to="/generate"
                    className="text-sm text-[#F59E0B] hover:text-[#F59E0B] underline transition"
                  >
                    Not created referral code yet? Create one
                  </Link>
                </div>
              </Card>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-8 animate-fade-up">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#F59E0B]/10 rounded-2xl flex items-center justify-center text-[#F59E0B] mx-auto mb-4">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-display font-bold">Enter OTP</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Verification code sent to {mobile}
                </p>
              </div>
              <Card className="p-6 bg-card border-border/50 rounded-3xl space-y-4">
                <div className="space-y-2">
                  <Label>OTP Code</Label>
                  <Input
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => onOtpChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
                    autoComplete="one-time-code"
                    className="h-12 bg-secondary/50 rounded-xl text-center text-2xl tracking-[0.5em] font-normal"
                    maxLength={6}
                    inputMode="numeric"
                  />
                </div>
                <Button
                  onClick={handleVerifyOTP}
                  disabled={loading}
                  className="w-full h-12 rounded-xl font-bold bg-[#F59E0B] hover:bg-[#D97706] text-black"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Verify & Login"
                  )}
                </Button>

                {/* Resend OTP section */}
                <div className="space-y-1 text-center">
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

                <button
                  onClick={() => {
                    setStep("verify");
                    setOtp("");
                  }}
                  className="w-full text-center text-sm text-muted-foreground hover:text-white transition-colors pt-1"
                >
                  ← Change mobile number
                </button>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferralLogin;
