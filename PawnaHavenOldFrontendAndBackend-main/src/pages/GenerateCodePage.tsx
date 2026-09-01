import { useState, useEffect, useRef } from "react";
import { useOtpAutoFill } from "@/hooks/useOtpAutoFill";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ChevronLeft,
  Smartphone,
  Fingerprint,
  ShieldCheck,
  ArrowRight,
  User,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { toast } from "sonner";

const COOLDOWN_SECONDS = 30;
const RATE_LIMIT = 4;

const GenerateCodePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    mobile: "",
    username: "",
    referralCode: "",
  });
  const [step, setStep] = useState<"details" | "otp">("details");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLimitLeft, setOtpLimitLeft] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    if (formData.mobile.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return false;
    }
    if (!formData.mobile || !formData.username || !formData.referralCode) {
      toast.error("Please fill all fields");
      return false;
    }
    if (
      !/[A-Za-z]/.test(formData.referralCode) ||
      !/[0-9]/.test(formData.referralCode)
    ) {
      toast.error("Referral code must contain both letters and numbers");
      return false;
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/referrals/request-otp", {
        mobile: formData.mobile,
        purpose: "referral_register",
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
          "Failed to send OTP",
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    const ok = await sendOtpRequest();
    if (ok) {
      toast.success("OTP sent to your mobile");
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

  const handleVerifyAndRegister = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const verifyRes = await axios.post("/api/referrals/verify-otp", {
        mobile: formData.mobile,
        otp: otp,
        purpose: "referral_register",
      });

      const token = verifyRes.data.token;

      await axios.post(
        "/api/referrals/register",
        {
          username: formData.username,
          referralCode: formData.referralCode,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("Referral account created successfully!");
      navigate("/referral/check");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const { onOtpChange } = useOtpAutoFill(setOtp, step === "otp");

  useEffect(() => {
    if (step === "otp" && otp.length === 6 && !loading) {
      handleVerifyAndRegister();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, step]);

  const limitReached = otpLimitLeft !== null && otpLimitLeft <= 0;

  return (
    <div className="min-h-screen bg-black">
      <Helmet>
        <title>Generate Referral Code - PawnaHavenCamp</title>
      </Helmet>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-black border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            to="/referral/check"
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground/70 hover:bg-primary hover:text-primary-foreground transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-display text-xl font-bold">Generate Code</h1>
        </div>
      </div>

      <div className="container mx-auto px-6 pt-12 max-w-md">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6">
            <Fingerprint className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-display font-bold mb-3">
            {step === "details"
              ? "Create New Referral code"
              : "Verify Your Mobile"}
          </h2>
          <p className="text-muted-foreground">
            {step === "details"
              ? "Enter your details to generate a new unique referral code"
              : `Enter the OTP sent to ${formData.mobile}`}
          </p>
        </div>

        <Card className="p-8 bg-card border-border/50 rounded-[2rem] shadow-2xl space-y-6">
          {step === "details" ? (
            <>
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-sm font-bold flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-primary" />
                  Full Name
                </Label>
                <Input
                  id="username"
                  placeholder="Enter Your Full Name"
                  className="h-14 bg-secondary/50 rounded-2xl border-border/50 focus:border-primary transition-all text-lg"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="mobile"
                  className="text-sm font-bold flex items-center gap-2"
                >
                  <Smartphone className="w-4 h-4 text-primary" />
                  Mobile Number
                </Label>
                <Input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="Enter Mobile Number to get OTP"
                  className="h-14 bg-secondary/50 rounded-2xl border-border/50 focus:border-primary transition-all text-lg"
                  value={formData.mobile}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 10) {
                      setFormData({ ...formData, mobile: value });
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="referralCode"
                  className="text-sm font-bold flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Create Your Referral Code
                </Label>
                <Input
                  id="referralCode"
                  placeholder="e.g. ABC123"
                  className="h-14 bg-secondary/50 rounded-2xl border-border/50 focus:border-primary transition-all text-lg Capatalize"
                  value={formData.referralCode}
                  maxLength={15}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      referralCode: e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 15),
                    })
                  }
                />
              </div>

              <Button
                className="w-full h-16 rounded-2xl text-xl font-bold gap-3 shadow-gold group transition-all"
                onClick={handleRequestOTP}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label
                  htmlFor="otp"
                  className="text-sm font-bold flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Enter OTP
                </Label>
                <Input
                  id="otp"
                  placeholder="Enter OTP"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className="h-14 bg-secondary/50 rounded-2xl border-border/50 focus:border-primary transition-all text-center text-lg tracking-[0.3em] font-normal placeholder:font-normal"
                  value={otp}
                  onChange={(e) => onOtpChange(e.target.value)}
                />
              </div>

              <Button
                className="w-full h-16 rounded-2xl text-xl font-bold gap-3 shadow-gold group transition-all"
                onClick={handleVerifyAndRegister}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  "Verify & Generate"
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
                    className="w-full text-sm text-primary hover:text-primary/80 hover:bg-primary/10 disabled:opacity-50 gap-2"
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
                variant="ghost"
                className="w-full text-xs text-muted-foreground"
                onClick={() => setStep("details")}
                disabled={loading}
              >
                Change Details
              </Button>
            </>
          )}
        </Card>

        <p className="mt-8 text-center text-xs text-muted-foreground px-6 leading-relaxed">
          By continuing, you agree to our referral program terms and conditions.
          Standard verification process applies.
        </p>
      </div>
    </div>
  );
};

export default GenerateCodePage;
