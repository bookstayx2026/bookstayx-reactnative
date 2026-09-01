import { useState, useEffect, useRef } from "react";
import { useOtpAutoFill } from "@/hooks/useOtpAutoFill";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ChevronLeft,
  ShieldCheck,
  Lock,
  Wallet,
  User,
  History,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  LogOut,
  Copy,
  Download,
  Share2,
  AlertCircle,
  RefreshCw,
  Pencil,
  Trash2,
  Plus,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import PaginationBar from "@/components/ui/PaginationBar";
import axios from "axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogClose } from "@/components/ui/dialog";

interface DashboardData {
  username: string;
  referral_code: string;
  referral_type: string;
  commission_label: string;
  linked_property_id: number | null;
  linked_property_slug: string | null;
  total_earnings: number;
  total_withdrawals: number;
  available_balance: number;
  pending_withdrawal_amount: number;
  total_referrals: number;
}

interface ShareData {
  referralCode: string;
  referralLink: string;
  referralQrCode: string;
  referralType: string;
  linkedPropertySlug: string | null;
}

interface InProcessBooking {
  booking_id: string;
  property_name: string;
  guest_name: string;
  checkin_datetime: string;
  checkout_datetime: string;
  referrer_commission: number;
}

interface HistoryItem {
  type:
    | "booking_success"
    | "booking_cancelled"
    | "withdrawal_paid"
    | "withdrawal_rejected";
  property_name?: string;
  guest_name?: string;
  amount: number;
  date: string;
  message: string;
  upi_id?: string;
  payout_id?: string | null;
}

interface UpiIdItem {
  id: number;
  upi_id: string;
  beneficiary_name: string;
  is_default: boolean;
  is_invalid: boolean;
  created_at: string;
}

const validateMobile = (mobile: string) => {
  return /^[6-9]\d{9}$/.test(mobile.replace(/\D/g, ""));
};

const COOLDOWN_SECONDS = 30;
const RATE_LIMIT = 4;
const PAGE_SIZE = 10;

const CheckEarningPage = () => {
  const navigate = useNavigate();
  const fromParam = new URLSearchParams(window.location.search).get("from");
  const isFromAdmin = fromParam === "admin";
  const isFromOwner = fromParam === "owner";
  const [step, setStep] = useState<"verify" | "otp" | "dashboard">("verify");
  const [loading, setLoading] = useState(false);
  const [otpLimitLeft, setOtpLimitLeft] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [inProcess, setInProcess] = useState<InProcessBooking[]>([]);
  const [inProcessAmount, setInProcessAmount] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<
    {
      id: number;
      amount: number;
      upi_id: string;
      status: string;
      created_at: string;
    }[]
  >([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [pendingPage, setPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [activeEarningTab, setActiveEarningTab] = useState("withdraw");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("referral_token"),
  );

  const [formData, setFormData] = useState({
    code: "",
    otp: "",
    withdrawAmount: "",
  });

  // Multi-UPI management
  const [upiList, setUpiList] = useState<UpiIdItem[]>([]);
  const [upiListLoading, setUpiListLoading] = useState(false);
  const [showAddUpiForm, setShowAddUpiForm] = useState(false);
  const [addUpiField1, setAddUpiField1] = useState("");
  const [addUpiField2, setAddUpiField2] = useState("");
  const [addUpiMakeDefault, setAddUpiMakeDefault] = useState(false);
  const [addUpiSaving, setAddUpiSaving] = useState(false);
  const [editingUpiId, setEditingUpiId] = useState<number | null>(null);
  const [editUpiField1, setEditUpiField1] = useState("");
  const [editUpiField2, setEditUpiField2] = useState("");
  const [addBeneficiaryName, setAddBeneficiaryName] = useState("");
  const [addBeneficiaryAgreed, setAddBeneficiaryAgreed] = useState(false);
  const [editBeneficiaryName, setEditBeneficiaryName] = useState("");
  const [editBeneficiaryAgreed, setEditBeneficiaryAgreed] = useState(false);

  useEffect(() => {
    if (token) {
      fetchDashboard(token);
      fetchShareData(token);
      fetchInProcess(token);
      fetchHistory(token);
      fetchUpiList(token);
      fetchPendingWithdrawals(token);
    }
  }, [token]);

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

  const fetchDashboard = async (authToken: string) => {
    setLoading(true);
    try {
      const res = await axios.get("/api/referrals/dashboard", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setDashboard(res.data);
      setStep("dashboard");
    } catch {
      localStorage.removeItem("referral_token");
      setToken(null);
      setStep("verify");
    } finally {
      setLoading(false);
    }
  };

  const fetchShareData = async (authToken: string) => {
    try {
      const res = await axios.get("/api/referrals/share", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setShareData(res.data);
    } catch (error: any) {
      console.error("Share data error:", error);
    }
  };

  const fetchInProcess = async (authToken: string) => {
    try {
      const res = await axios.get("/api/referrals/in-process", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setInProcess(res.data.in_process || []);
      setInProcessAmount(res.data.in_process_amount || 0);
    } catch (error: any) {
      console.error("In-process error:", error);
    }
  };

  const fetchHistory = async (authToken: string) => {
    setHistoryLoading(true);
    try {
      const res = await axios.get("/api/referrals/history", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setHistoryItems(res.data.history || []);
    } catch (error: any) {
      console.error("History error:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchUpiList = async (authToken: string) => {
    setUpiListLoading(true);
    try {
      const res = await axios.get("/api/referrals/upi-ids", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setUpiList(res.data.upi_ids || []);
    } catch (err: any) {
      console.error("UPI list error:", err);
    } finally {
      setUpiListLoading(false);
    }
  };

  const fetchPendingWithdrawals = async (authToken: string) => {
    try {
      const res = await axios.get("/api/referrals/pending-withdrawals", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setPendingWithdrawals(res.data.pending_withdrawals || []);
    } catch (err: any) {
      console.error("Pending withdrawals error:", err);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const handleDownloadQR = () => {
    if (!shareData) return;
    const link = document.createElement("a");
    link.href = shareData.referralQrCode;
    link.download = `referral-qr-${shareData.referralCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWhatsAppShare = () => {
    if (!shareData) return;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareData.referralLink)}`,
      "_blank",
    );
  };

  const sendOtpRequest = async () => {
    if (!formData.code) {
      toast.error("Please enter your mobile number");
      return false;
    }
    setLoading(true);
    try {
      const res = await axios.post("/api/referrals/request-otp", {
        mobile: formData.code,
        purpose: "referral_login",
      });
      if (
        res.data.otpLimitLeft !== null &&
        res.data.otpLimitLeft !== undefined
      ) {
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
      setFormData((prev) => ({ ...prev, otp: "" }));
      toast.success("OTP resent successfully!");
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    try {
      const verifyRes = await axios.post("/api/referrals/verify-otp", {
        mobile: formData.code,
        otp: formData.otp,
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
      setToken(finalToken);
      fetchDashboard(finalToken);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Login failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const setOtpValue = (v: string) =>
    setFormData((prev) => ({ ...prev, otp: v }));

  const { onOtpChange } = useOtpAutoFill(setOtpValue, step === "otp");

  useEffect(() => {
    if (step === "otp" && formData.otp.length === 6 && !loading) {
      handleVerifyOTP();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.otp, step]);

  const defaultUpi = upiList.find((u) => u.is_default) || null;

  const handleWithdraw = async () => {
    if (!token || !dashboard) return;

    if (!defaultUpi) {
      toast.error("Please add and select a mobile number first");
      return;
    }

    if (!formData.withdrawAmount || Number(formData.withdrawAmount) < 500) {
      toast.error("Minimum withdrawal amount is ₹500");
      return;
    }

    if (Number(formData.withdrawAmount) > dashboard.available_balance) {
      toast.error("Withdrawal amount exceeds available balance");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "/api/referrals/withdraw",
        { amount: parseFloat(formData.withdrawAmount), upi: defaultUpi.upi_id },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const data = res.data;
      const payoutStatus = data.status || "pending";
      const payoutId = data.payout_id;

      if (payoutStatus === "completed") {
        toast.success(
          payoutId
            ? `Payout Completed (ID: ${payoutId})! Amount will be credited shortly.`
            : "Payout Completed! Amount will be credited shortly.",
        );
      } else if (
        payoutStatus === "processing" ||
        payoutStatus === "initiated"
      ) {
        toast.success(
          payoutId
            ? `Payout Initiated (ID: ${payoutId}). Usually completes within minutes.`
            : "Payout Initiated! Processing your withdrawal.",
        );
      } else {
        toast.success(
          data.message || "Withdrawal request submitted. Processing shortly.",
        );
      }

      fetchDashboard(token);
      fetchHistory(token);
      fetchPendingWithdrawals(token);
      setFormData({ ...formData, withdrawAmount: "" });
    } catch (error) {
      const axiosErr = error as { response?: { data?: { error?: string } } };
      toast.error(axiosErr.response?.data?.error || "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  // ── UPI management handlers ──────────────────────────────────────

  const resetAddForm = () => {
    setAddUpiField1("");
    setAddUpiField2("");
    setAddBeneficiaryName("");
    setAddBeneficiaryAgreed(false);
    setAddUpiMakeDefault(false);
    setShowAddUpiForm(false);
  };

  const handleAddUpi = async () => {
    if (!token) return;
    if (!validateMobile(addUpiField1)) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    if (!addBeneficiaryName.trim()) {
      toast.error("Please enter the beneficiary name");
      return;
    }
    if (!addBeneficiaryAgreed) {
      toast.error("Please confirm the beneficiary name is correct");
      return;
    }
    setAddUpiSaving(true);
    try {
      const res = await axios.post(
        "/api/referrals/upi-ids",
        {
          upi_id: addUpiField1,
          make_default: upiList.length === 0 || addUpiMakeDefault,
          beneficiary_name: addBeneficiaryName.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      resetAddForm();
      toast.success("Mobile number saved");
      fetchUpiList(token);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save mobile number");
    } finally {
      setAddUpiSaving(false);
    }
  };

  const startEditUpi = (upi: UpiIdItem) => {
    setEditingUpiId(upi.id);
    setEditUpiField1(upi.upi_id);
    setEditUpiField2(upi.upi_id);
    setEditBeneficiaryName(upi.beneficiary_name || "");
    setEditBeneficiaryAgreed(false);
  };

  const cancelEditUpi = () => {
    setEditingUpiId(null);
    setEditUpiField1("");
    setEditUpiField2("");
    setEditBeneficiaryName("");
    setEditBeneficiaryAgreed(false);
  };

  const handleEditUpi = async (id: number) => {
    if (!token) return;
    if (!validateMobile(editUpiField1)) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    if (!editBeneficiaryName.trim()) {
      toast.error("Please enter the beneficiary name");
      return;
    }
    if (!editBeneficiaryAgreed) {
      toast.error("Please confirm the beneficiary name is correct");
      return;
    }
    try {
      await axios.put(
        `/api/referrals/upi-ids/${id}`,
        { upi_id: editUpiField1, beneficiary_name: editBeneficiaryName.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      cancelEditUpi();
      toast.success("Mobile number updated");
      fetchUpiList(token);
    } catch (err: any) {
      toast.error(
        err.response?.data?.error || "Failed to update mobile number",
      );
    }
  };

  const handleSetDefaultUpi = async (id: number) => {
    if (!token) return;
    try {
      await axios.put(
        `/api/referrals/upi-ids/${id}/set-default`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setUpiList((prev) =>
        prev.map((u) => ({ ...u, is_default: u.id === id })),
      );
      toast.success("Default mobile number updated");
    } catch (err: any) {
      toast.error(
        err.response?.data?.error || "Failed to set default mobile number",
      );
    }
  };

  const handleDeleteUpi = async (id: number) => {
    if (!token) return;
    try {
      await axios.delete(`/api/referrals/upi-ids/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Mobile number removed");
      fetchUpiList(token);
    } catch (err: any) {
      toast.error(
        err.response?.data?.error || "Failed to remove mobile number",
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("referral_token");
    setToken(null);
    setDashboard(null);
    setInProcess([]);
    setHistoryItems([]);
    setStep("verify");
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatDateShort = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  if (loading && !dashboard) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <Helmet>
        <title>Check Earning - PawnaHavenCamp</title>
      </Helmet>

      <div className="sticky top-0 z-50 bg-black border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (isFromAdmin) window.close();
                else if (isFromOwner) navigate(-1);
                else navigate("/");
              }}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground/70 hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="font-display text-xl font-bold">Check Earning</h1>
          </div>
          {dashboard && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className="flex items-center gap-2 
                  bg-red-500 text-black 
                  hover:bg-red-500 hover:opacity-80 
                  transition-all px-4 py-2 rounded-md"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Logout Referral</span>
                </Button>
              </DialogTrigger>

              <DialogContent
                className="sm:max-w-[400px] 
                bg-black 
                border border-[#F59E0B]/30 
                rounded-3xl 
                shadow-[0_0_40px_rgba(245,158,11,0.15)]"
              >
                <DialogHeader>
                  <DialogTitle className="text-[#F59E0B] font-display text-xl">
                    Confirm Logout
                  </DialogTitle>

                  <DialogDescription className="text-gray-400">
                    Are you sure you want to log out of your dashboard?
                  </DialogDescription>
                </DialogHeader>

                <div className="flex gap-3 mt-4">
                  {/* Cancel → Amber */}
                  <DialogClose asChild>
                    <Button
                      className="flex-1 
                      bg-[#F59E0B] 
                      text-black 
                      rounded-xl 
                      hover:bg-[#F59E0B] 
                      hover:opacity-80 
                      transition-all"
                    >
                      Cancel
                    </Button>
                  </DialogClose>

                  {/* Logout → Red */}
                  <Button
                    onClick={handleLogout}
                    className="flex-1 
                    bg-red-600 
                    text-black 
                    rounded-xl 
                    hover:bg-red-600 
                    hover:opacity-80 
                    transition-all"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Logout
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="container mx-auto px-6 pt-8 max-w-md">
        {step === "verify" && (
          <div className="space-y-8 animate-fade-up">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-display font-bold">
                Login to Referral Dashboard
              </h2>
              <p className="text-sm text-muted-foreground">
                Enter your registered mobile number
              </p>
            </div>
            <Card className="p-6 bg-card border-border/50 rounded-3xl space-y-4">
              <div className="space-y-2">
                <Label>Enter Mobile Number</Label>
                <Input
                  placeholder="e.g. 9999999999"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  value={formData.code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 10)
                      setFormData({ ...formData, code: value });
                  }}
                  className="h-12 bg-secondary/50 rounded-xl"
                />
              </div>
              <Button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full h-12 rounded-xl font-bold gap-2"
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
              <div className="text-center pt-2">
                <span className="text-xs text-muted-foreground">
                  Not registered yet?{" "}
                  <Link
                    to="/referral/generate"
                    className="text-primary font-bold hover:underline"
                  >
                    Create your own referral code
                  </Link>
                </span>
              </div>
            </Card>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-8 animate-fade-up">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-display font-bold">Enter OTP</h2>
              <p className="text-sm text-muted-foreground">
                Verification code sent to {formData.code}
              </p>
            </div>
            <Card className="p-6 bg-card border-border/50 rounded-3xl space-y-4">
              <div className="space-y-2">
                <Label>OTP Code</Label>
                <Input
                  placeholder="Enter OTP"
                  value={formData.otp}
                  onChange={(e) => onOtpChange(e.target.value)}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  className="h-12 bg-secondary/50 rounded-xl text-center text-2xl tracking-[0.5em] font-normal"
                  maxLength={6}
                />
              </div>
              <Button
                onClick={handleVerifyOTP}
                disabled={loading}
                className="w-full h-12 rounded-xl font-bold"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Verify & Login"
                )}
              </Button>

              {/* Resend OTP section */}
              <div className="space-y-1 text-center">
                {otpLimitLeft !== null && otpLimitLeft <= 0 ? (
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

              <button
                onClick={() => {
                  setStep("verify");
                  setFormData((prev) => ({ ...prev, otp: "" }));
                }}
                className="w-full text-center text-sm text-muted-foreground hover:text-white transition-colors pt-1"
              >
                ← Change mobile number
              </button>
            </Card>
          </div>
        )}

        {step === "dashboard" && dashboard && (
          <div className="space-y-6 animate-fade-up">
            <Card className="p-6 bg-gradient-to-br from-primary to-gold-dark text-white rounded-[2rem] border-none shadow-gold relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white font-bold tracking-widest">
                      Welcome back
                    </p>
                    <p className="text-xl text-white font-bold capitalize text-black">
                      {dashboard.username} ({dashboard.referral_code})
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={cn(
                          "text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full border",
                          dashboard.referral_type === "owner"
                            ? "text-blue-700 border-blue-500 bg-blue-500/10"
                            : dashboard.referral_type === "b2b"
                              ? "text-amber-800 border-amber-500 bg-amber-500/10"
                              : dashboard.referral_type === "owners_b2b"
                                ? "text-purple-700 border-purple-500 bg-purple-500/10"
                                : "text-emerald-700 border-emerald-500 bg-emerald-500/10",
                        )}
                      >
                        {dashboard.referral_type === "owner"
                          ? "Owner"
                          : dashboard.referral_type === "b2b"
                            ? "B2B Partner"
                            : dashboard.referral_type === "owners_b2b"
                              ? "Owners B2B"
                              : "Public"}{" "}
                        Referral
                      </span>
                      <span className="text-[10px] text-white">
                        {dashboard.commission_label}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-white font-bold tracking-widest mb-1">
                    Referral Earnings
                  </p>
                  <p className="text-4xl font-display font-bold text-white">
                    ₹ {dashboard.available_balance.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              <Wallet className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10" />
            </Card>

            <Tabs
              value={activeEarningTab}
              onValueChange={(v) => {
                setActiveEarningTab(v);
                setPendingPage(1);
                setHistoryPage(1);
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4 bg-secondary/50 rounded-2xl p-1 h-14">
                <TabsTrigger
                  value="withdraw"
                  className="rounded-xl font-bold data-[state=active]:bg-primary text-xs"
                >
                  <Wallet className="w-4 h-4 mr-1" />
                  Payouts
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="rounded-xl font-bold data-[state=active]:bg-primary text-xs"
                >
                  <History className="w-4 h-4 mr-1" />
                  History
                </TabsTrigger>
                <TabsTrigger
                  value="stats"
                  className="rounded-xl font-bold data-[state=active]:bg-primary text-xs"
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Stats
                </TabsTrigger>
                <TabsTrigger
                  value="share"
                  className="rounded-xl font-bold data-[state=active]:bg-primary text-xs"
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </TabsTrigger>
              </TabsList>

              <TabsContent value="withdraw" className="mt-6 space-y-6">
                {/* ── UPI ID Setup ── */}
                <Card className="p-5 bg-card border-border/50 rounded-3xl space-y-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold tracking-wide">
                      Saved Mobile Numbers
                    </h3>
                  </div>

                  {upiListLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      {upiList.length > 0 && (
                        <div className="space-y-2">
                          {upiList.map((upi) =>
                            editingUpiId === upi.id ? (
                              <div
                                key={upi.id}
                                className="bg-secondary/40 rounded-2xl p-4 space-y-3 border border-primary/30"
                              >
                                <p className="text-xs font-semibold text-primary/80 uppercase tracking-widest">
                                  Editing Mobile Number
                                </p>
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-muted-foreground">
                                    Enter Mobile Number
                                  </Label>

                                  <Input
                                    value={editUpiField1}
                                    onChange={(e) => {
                                      let value = e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 10);

                                      // First digit must be 6, 7, 8 or 9
                                      if (
                                        value.length > 0 &&
                                        !/^[6-9]/.test(value)
                                      ) {
                                        value = "";
                                      }

                                      setEditUpiField1(value);
                                      setEditUpiField2("");
                                    }}
                                    placeholder="e.g. 9876543210"
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[6-9][0-9]{9}"
                                    maxLength={10}
                                    className="h-11 bg-secondary/50 rounded-xl text-sm"
                                  />
                                </div>
                                <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3">
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-amber-300 leading-relaxed">
                                      <span className="font-semibold">
                                        Important:
                                      </span>{" "}
                                      The entered mobile number must be linked
                                      to your bank account and enabled for UPI.
                                      PawnaHavenCamp will not be responsible for
                                      any financial loss, failed transaction, or
                                      incorrect payment resulting from an
                                      incorrect mobile number entered by the
                                      user.
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-muted-foreground">
                                    Re-Enter Mobile Number
                                  </Label>

                                  <Input
                                    value={editUpiField2}
                                    onChange={(e) => {
                                      let value = e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 10);

                                      if (
                                        value.length > 0 &&
                                        !/^[6-9]/.test(value)
                                      ) {
                                        value = "";
                                      }

                                      setEditUpiField2(value);
                                    }}
                                    onPaste={(e) => e.preventDefault()}
                                    onCopy={(e) => e.preventDefault()}
                                    onCut={(e) => e.preventDefault()}
                                    onDrop={(e) => e.preventDefault()}
                                    onDragOver={(e) => e.preventDefault()}
                                    autoComplete="new-password"
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[6-9][0-9]{9}"
                                    maxLength={10}
                                    placeholder="Type again — no paste allowed"
                                    className={cn(
                                      "h-11 bg-secondary/50 rounded-xl font-mono text-sm",
                                      editUpiField1 &&
                                        editUpiField2 &&
                                        editUpiField1 !== editUpiField2
                                        ? "border-red-500 focus-visible:ring-red-500"
                                        : editUpiField1 &&
                                            editUpiField2 &&
                                            editUpiField1 === editUpiField2
                                          ? "border-emerald-500 focus-visible:ring-emerald-500"
                                          : "",
                                    )}
                                  />

                                  {editUpiField1 &&
                                    editUpiField2 &&
                                    editUpiField1 !== editUpiField2 && (
                                      <p className="text-xs text-red-400 flex items-center gap-1">
                                        <XCircle className="w-3 h-3 shrink-0" />
                                        Mobile numbers do not match.
                                      </p>
                                    )}

                                  {editUpiField1 &&
                                    editUpiField2 &&
                                    editUpiField1 === editUpiField2 && (
                                      <p className="text-xs text-emerald-400 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                                        Mobile numbers match.
                                      </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-muted-foreground">
                                    Beneficiary Name
                                  </Label>
                                  <Input
                                    value={editBeneficiaryName}
                                    onChange={(e) =>
                                      setEditBeneficiaryName(e.target.value)
                                    }
                                    placeholder="e.g. Rajesh Kumar"
                                    className="h-11 bg-secondary/50 rounded-xl text-sm"
                                  />
                                </div>
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-2">
                                  <p className="text-xs text-amber-300 leading-relaxed">
                                    ⚠️ Please verify the Beneficiary Name
                                    exactly matches your bank account holder's
                                    name. Incorrect details may result in
                                    incorrect payment. We are not responsible
                                    for any money loss caused by incorrect
                                    information provided by the user.
                                  </p>
                                  <label className="flex items-start gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={editBeneficiaryAgreed}
                                      onChange={(e) =>
                                        setEditBeneficiaryAgreed(
                                          e.target.checked,
                                        )
                                      }
                                      className="mt-0.5 accent-amber-500 w-3.5 h-3.5 flex-shrink-0"
                                    />
                                    <span className="text-xs text-amber-200/80">
                                      I confirm the beneficiary name is correct
                                    </span>
                                  </label>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleEditUpi(upi.id)}
                                    disabled={
                                      !editUpiField1 ||
                                      !editUpiField2 ||
                                      editUpiField1 !== editUpiField2 ||
                                      !editBeneficiaryName.trim() ||
                                      !editBeneficiaryAgreed
                                    }
                                    className="flex-1 h-10 rounded-xl font-bold text-sm disabled:opacity-40"
                                  >
                                    Save Changes
                                  </Button>
                                  <Button
                                    onClick={cancelEditUpi}
                                    variant="ghost"
                                    className="flex-1 h-10 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div key={upi.id} className="space-y-1">
                                <div
                                  className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all",
                                    upi.is_invalid
                                      ? "bg-red-500/10 border-red-500/40"
                                      : upi.is_default
                                        ? "bg-emerald-500/10 border-emerald-500/30"
                                        : "bg-secondary/30 border-border/40 hover:border-border/70",
                                  )}
                                >
                                  <button
                                    onClick={() =>
                                      !upi.is_default &&
                                      handleSetDefaultUpi(upi.id)
                                    }
                                    className={cn(
                                      "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                                      upi.is_invalid
                                        ? "border-red-400 bg-red-400"
                                        : upi.is_default
                                          ? "border-emerald-400 bg-emerald-400"
                                          : "border-white/30 hover:border-primary",
                                    )}
                                    title={
                                      upi.is_default
                                        ? "Default mobile"
                                        : "Set as default"
                                    }
                                  >
                                    {upi.is_invalid ? (
                                      <XCircle className="w-3.5 h-3.5 text-white" />
                                    ) : (
                                      upi.is_default && (
                                        <div className="w-2 h-2 rounded-full bg-white" />
                                      )
                                    )}
                                  </button>
                                  <div className="flex-1 flex flex-col min-w-0">
                                    <span
                                      className={cn(
                                        "font-mono text-sm truncate",
                                        upi.is_invalid
                                          ? "text-red-300"
                                          : "text-white/90",
                                      )}
                                    >
                                      {upi.upi_id}
                                    </span>
                                    {upi.beneficiary_name && (
                                      <span className="text-[10px] text-white/40 truncate">
                                        {upi.beneficiary_name}
                                      </span>
                                    )}
                                  </div>
                                  {upi.is_invalid ? (
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/30 flex-shrink-0">
                                      Invalid
                                    </span>
                                  ) : (
                                    upi.is_default && (
                                      <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex-shrink-0">
                                        Default
                                      </span>
                                    )
                                  )}
                                  <button
                                    onClick={() => startEditUpi(upi)}
                                    className={cn(
                                      "w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                                      upi.is_invalid
                                        ? "bg-red-500/15 hover:bg-red-500/30"
                                        : "bg-white/5 hover:bg-primary/15",
                                    )}
                                    title="Edit mobile number"
                                  >
                                    <Pencil
                                      className={cn(
                                        "w-3.5 h-3.5",
                                        upi.is_invalid
                                          ? "text-red-400"
                                          : "text-white/50 hover:text-primary",
                                      )}
                                    />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUpi(upi.id)}
                                    disabled={upiList.length === 1}
                                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/15 flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-25 disabled:cursor-not-allowed"
                                    title={
                                      upiList.length === 1
                                        ? "Cannot delete your only mobile number"
                                        : "Remove mobile number"
                                    }
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-white/50 hover:text-red-400" />
                                  </button>
                                </div>
                                {upi.is_invalid && (
                                  <p className="text-[11px] text-red-400 flex items-center gap-1.5 px-1">
                                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                    Mobile number is not matching with
                                    Beneficiary Name(Banking Name) — please edit
                                    and correct it to request payouts.
                                  </p>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      )}

                      {(showAddUpiForm || upiList.length === 0) && (
                        <div
                          className={cn(
                            "space-y-3",
                            upiList.length > 0 &&
                              "border-t border-border/40 pt-4",
                          )}
                        >
                          {upiList.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                              Add a mobile number to start receiving payouts.
                            </p>
                          )}
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">
                              Enter Mobile Number
                            </Label>

                            <Input
                              value={addUpiField1}
                              onChange={(e) => {
                                let value = e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 10);

                                // First digit must be 6, 7, 8 or 9
                                if (value.length > 0 && !/^[6-9]/.test(value)) {
                                  value = "";
                                }

                                setAddUpiField1(value);
                                setAddUpiField2("");
                              }}
                              placeholder="e.g. 9876543210"
                              type="tel"
                              inputMode="numeric"
                              pattern="[6-9][0-9]{9}"
                              maxLength={10}
                              className="h-11 bg-secondary/50 rounded-xl text-sm"
                            />
                          </div>
                          <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-amber-300 leading-relaxed">
                                <span className="font-semibold">
                                  Important:
                                </span>{" "}
                                The entered mobile number must be linked to your
                                bank account and enabled for UPI. PawnaHavenCamp
                                will not be responsible for any financial loss,
                                failed transaction, or incorrect payment
                                resulting from an incorrect mobile number
                                entered by the user.
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">
                              Re-Enter Mobile Number
                            </Label>

                            <Input
                              value={addUpiField2}
                              onChange={(e) => {
                                let value = e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 10);

                                if (value.length > 0 && !/^[6-9]/.test(value)) {
                                  value = "";
                                }

                                setAddUpiField2(value);
                              }}
                              onPaste={(e) => e.preventDefault()}
                              onCopy={(e) => e.preventDefault()}
                              onCut={(e) => e.preventDefault()}
                              onDrop={(e) => e.preventDefault()}
                              onDragOver={(e) => e.preventDefault()}
                              autoComplete="new-password"
                              type="tel"
                              inputMode="numeric"
                              pattern="[6-9][0-9]{9}"
                              maxLength={10}
                              placeholder="Type again — no paste allowed"
                              className={cn(
                                "h-11 bg-secondary/50 rounded-xl font-mono text-sm",
                                addUpiField1 &&
                                  addUpiField2 &&
                                  addUpiField1 !== addUpiField2
                                  ? "border-red-500 focus-visible:ring-red-500"
                                  : addUpiField1 &&
                                      addUpiField2 &&
                                      addUpiField1 === addUpiField2
                                    ? "border-emerald-500 focus-visible:ring-emerald-500"
                                    : "",
                              )}
                            />

                            {addUpiField1 &&
                              addUpiField2 &&
                              addUpiField1 !== addUpiField2 && (
                                <p className="text-xs text-red-400 flex items-center gap-1">
                                  <XCircle className="w-3 h-3 shrink-0" />
                                  Mobile numbers do not match.
                                </p>
                              )}

                            {addUpiField1 &&
                              addUpiField2 &&
                              addUpiField1 === addUpiField2 && (
                                <p className="text-xs text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                                  Mobile numbers match.
                                </p>
                              )}
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">
                              Beneficiary Name
                            </Label>

                            <Input
                              value={addBeneficiaryName}
                              onChange={(e) =>
                                setAddBeneficiaryName(e.target.value)
                              }
                              placeholder="e.g. Rajesh Kumar"
                              maxLength={50}
                              className="h-11 bg-secondary/50 rounded-xl text-sm"
                            />
                          </div>
                          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-2">
                            <p className="text-xs text-amber-300 leading-relaxed">
                              ⚠️ Please verify the Beneficiary Name exactly
                              matches your bank account holder's name. Incorrect
                              details may result in incorrect payment. We are
                              not responsible for any money loss caused by
                              incorrect information provided by the user.
                            </p>
                            <label className="flex items-start gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={addBeneficiaryAgreed}
                                onChange={(e) =>
                                  setAddBeneficiaryAgreed(e.target.checked)
                                }
                                className="mt-0.5 accent-amber-500 w-3.5 h-3.5 flex-shrink-0"
                              />
                              <span className="text-xs text-amber-200/80">
                                I confirm the beneficiary name is correct
                              </span>
                            </label>
                          </div>
                          {upiList.length > 0 && (
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                              <div
                                onClick={() => setAddUpiMakeDefault((v) => !v)}
                                className={cn(
                                  "w-9 h-5 rounded-full transition-colors flex items-center px-0.5",
                                  addUpiMakeDefault
                                    ? "bg-primary"
                                    : "bg-white/20",
                                )}
                              >
                                <div
                                  className={cn(
                                    "w-4 h-4 rounded-full bg-white transition-transform shadow",
                                    addUpiMakeDefault
                                      ? "translate-x-4"
                                      : "translate-x-0",
                                  )}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                Make this my default mobile number
                              </span>
                            </label>
                          )}
                          <div className="flex gap-2">
                            {addUpiField1 &&
                              addUpiField2 &&
                              addUpiField1 === addUpiField2 && (
                                <Button
                                  onClick={handleAddUpi}
                                  disabled={
                                    addUpiSaving ||
                                    !addBeneficiaryName.trim() ||
                                    !addBeneficiaryAgreed
                                  }
                                  className="flex-1 h-11 rounded-2xl font-bold"
                                >
                                  {addUpiSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Plus className="w-4 h-4 mr-1.5" />
                                      Add Number
                                    </>
                                  )}
                                </Button>
                              )}
                            {upiList.length > 0 && (
                              <Button
                                onClick={resetAddForm}
                                variant="ghost"
                                className={cn(
                                  "h-11 rounded-2xl border border-white/10 text-sm text-white/60 hover:text-white",
                                  addUpiField1 &&
                                    addUpiField2 &&
                                    addUpiField1 === addUpiField2
                                    ? "flex-1"
                                    : "w-full",
                                )}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {upiList.length > 0 &&
                        !showAddUpiForm &&
                        editingUpiId === null && (
                          <button
                            onClick={() => setShowAddUpiForm(true)}
                            className="w-full h-10 rounded-xl border border-dashed border-white/20 hover:border-primary/50 text-xs text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Another Mobile Number
                          </button>
                        )}
                    </>
                  )}
                </Card>

                {/* ── Payout Request ── */}
                <Card className="p-6 bg-card border-border/50 rounded-3xl space-y-4">
                  {defaultUpi ? (
                    defaultUpi.is_invalid ? (
                      <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/35 rounded-xl px-4 py-3">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-red-400/80 font-semibold uppercase tracking-wider mb-0.5">
                            Mobile Number is Invalid
                          </p>
                          <p className="text-sm font-mono text-red-300/80 font-medium truncate">
                            {defaultUpi.upi_id}
                          </p>
                          <p className="text-[10px] text-red-400/60 mt-0.5">
                            Please correct your mobile number above before
                            requesting a payout.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-emerald-400/70 font-semibold uppercase tracking-wider mb-0.5">
                            Payout to
                          </p>
                          <p className="text-sm font-mono text-emerald-300 font-medium truncate">
                            {defaultUpi.upi_id}
                          </p>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <p className="text-xs text-amber-300">
                        Add a mobile number above to request a payout
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Payout Amount (Min ₹500)</Label>
                    <Input
                      placeholder="e.g. 500"
                      type="number"
                      min="500"
                      step="1"
                      value={formData.withdrawAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || Number(value) >= 0) {
                          setFormData({ ...formData, withdrawAmount: value });
                        }
                      }}
                      className="h-12 bg-secondary/50 rounded-xl"
                    />
                    {dashboard.available_balance < 500 && (
                      <p className="text-xs text-blue-400">
                        Minimum ₹500 balance required for Payout!
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleWithdraw}
                    disabled={
                      loading ||
                      !defaultUpi ||
                      defaultUpi?.is_invalid ||
                      !formData.withdrawAmount ||
                      parseFloat(formData.withdrawAmount) < 500 ||
                      parseFloat(formData.withdrawAmount) >
                        dashboard.available_balance ||
                      dashboard.available_balance < 500
                    }
                    className="w-full h-14 rounded-2xl font-bold shadow-gold"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Payout Amount"
                    )}
                  </Button>
                </Card>

                {pendingWithdrawals.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold flex items-center gap-2 px-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      Pending Requests
                      <span className="ml-auto text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                        {pendingWithdrawals.length}
                      </span>
                    </h3>
                    {pendingWithdrawals
                      .slice(
                        (pendingPage - 1) * PAGE_SIZE,
                        pendingPage * PAGE_SIZE,
                      )
                      .map((pw) => (
                        <Card
                          key={pw.id}
                          className="p-4 bg-card border-orange-500/20 rounded-2xl"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="min-w-0">
                              <p className="font-bold text-base">
                                ₹
                                {parseFloat(String(pw.amount)).toLocaleString(
                                  "en-IN",
                                )}
                              </p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                                Payout Request
                              </p>
                              {pw.upi_id && (
                                <p className="text-[11px] font-mono text-white/50 mt-1 truncate">
                                  {pw.upi_id}
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                {new Date(pw.created_at).toLocaleString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>
                            <span
                              className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest flex-shrink-0 ${
                                pw.status === "processing"
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  : "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                              }`}
                            >
                              {pw.status === "processing"
                                ? "Processing"
                                : "Pending"}
                            </span>
                          </div>
                        </Card>
                      ))}
                    <PaginationBar
                      currentPage={pendingPage}
                      totalPages={Math.ceil(
                        pendingWithdrawals.length / PAGE_SIZE,
                      )}
                      onPageChange={setPendingPage}
                    />
                  </div>
                )}

                {inProcess.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold flex items-center gap-2 px-2">
                      <Clock className="w-4 h-4 text-[#F59E0B]" />
                      Referral Earnings In-Process
                    </h3>
                    {inProcess.map((booking) => (
                      <Card
                        key={booking.booking_id}
                        className="p-4 bg-card border-[#F59E0B]/20 rounded-2xl space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-sm">
                              {booking.property_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Guest: {booking.guest_name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDateShort(booking.checkin_datetime)} →{" "}
                              {formatDateShort(booking.checkout_datetime)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#F59E0B]">
                              ₹
                              {parseFloat(
                                String(booking.referrer_commission),
                              ).toLocaleString("en-IN")}
                            </p>
                            <span className="text-[9px] bg-[#F59E0B]/10 text-[#F59E0B] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                              Awaiting Check-out
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="stats" className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 bg-card border-border/50 rounded-2xl text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                      Total Earned
                    </p>
                    <p className="text-lg font-bold text-primary">
                      ₹ {dashboard.total_earnings.toLocaleString("en-IN")}
                    </p>
                  </Card>
                  <Card className="p-4 bg-card border-border/50 rounded-2xl text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                      Total Referrals
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {dashboard.total_referrals}
                    </p>
                  </Card>
                  <Card className="p-4 bg-card border-border/50 rounded-2xl text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                      Total Payout
                    </p>
                    <p className="text-lg font-bold text-red-400">
                      ₹ {dashboard.total_withdrawals.toLocaleString("en-IN")}
                    </p>
                  </Card>
                  <Card className="p-4 bg-card border-border/50 rounded-2xl text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                      In-Process
                    </p>
                    <p className="text-lg font-bold text-[#F59E0B]">
                      ₹ {inProcessAmount.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {inProcess.length} booking
                      {inProcess.length !== 1 ? "s" : ""}
                    </p>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="share" className="mt-6 space-y-6">
                {shareData ? (
                  <div className="space-y-6">
                    <Card className="p-6 bg-card border-border/50 rounded-3xl text-center space-y-4">
                      <Label className="text-xs font-bold tracking-widest text-muted-foreground">
                        Your QR Code
                      </Label>
                      <div className="bg-white p-4 rounded-2xl inline-block mx-auto">
                        <img
                          src={shareData.referralQrCode}
                          alt="Referral QR"
                          className="w-48 h-48"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleDownloadQR}
                        className="w-full gap-2 rounded-xl"
                      >
                        <Download className="w-4 h-4" />
                        Download QR
                      </Button>
                    </Card>

                    <Card className="p-6 bg-card border-border/50 rounded-3xl space-y-3">
                      <Label className="text-xs font-bold tracking-widest text-muted-foreground">
                        Referral Link
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={shareData.referralLink}
                          className="bg-secondary/30 border-none"
                        />
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() =>
                            handleCopy(shareData.referralLink, "Link")
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card border-border/50 rounded-3xl space-y-3">
                      <Label className="text-xs font-bold tracking-widest text-muted-foreground">
                        Referral Code
                      </Label>
                      <div className="flex items-center justify-between bg-secondary/30 p-4 rounded-xl">
                        <span className="text-2xl font-display font-bold text-primary tracking-wider">
                          {shareData.referralCode}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            handleCopy(shareData.referralCode, "Code")
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>

                    <Button
                      onClick={handleWhatsAppShare}
                      className="w-full h-14 rounded-2xl font-bold bg-[#25D366] hover:bg-[#128C7E] text-white shadow-lg"
                    >
                      <Share2 className="w-5 h-5 mr-2" />
                      Share on WhatsApp
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-6 space-y-4">
                {historyLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : historyItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-secondary/50 rounded-2xl flex items-center justify-center mb-4">
                      <History className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="font-bold text-muted-foreground">
                      No History Yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Complete your first referral to see earnings here.
                    </p>
                  </div>
                ) : (
                  historyItems
                    .slice(
                      (historyPage - 1) * PAGE_SIZE,
                      historyPage * PAGE_SIZE,
                    )
                    .map((item, idx) => {
                      const isSuccess =
                        item.type === "booking_success" ||
                        item.type === "withdrawal_paid";
                      const isCancelled = item.type === "booking_cancelled";
                      const isWithdrawal =
                        item.type === "withdrawal_paid" ||
                        item.type === "withdrawal_rejected";
                      return (
                        <Card
                          key={idx}
                          className={cn(
                            "p-4 bg-card rounded-2xl flex items-center gap-4",
                            isSuccess
                              ? "border-emerald-500/20"
                              : isCancelled
                                ? "border-red-500/20"
                                : "border-red-500/20",
                          )}
                        >
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                              isSuccess
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-red-500/10 text-red-400",
                            )}
                          >
                            {item.type === "booking_success" && (
                              <CheckCircle2 className="w-5 h-5" />
                            )}
                            {item.type === "booking_cancelled" && (
                              <XCircle className="w-5 h-5" />
                            )}
                            {item.type === "withdrawal_paid" && (
                              <Wallet className="w-5 h-5" />
                            )}
                            {item.type === "withdrawal_rejected" && (
                              <Wallet className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm">{item.message}</p>
                            {item.property_name && (
                              <p className="text-xs text-muted-foreground truncate">
                                {item.property_name}
                              </p>
                            )}
                            {isWithdrawal && item.upi_id && (
                              <p className="text-xs text-muted-foreground">
                                Mobile: {item.upi_id}
                              </p>
                            )}
                            {item.type === "withdrawal_paid" &&
                              item.payout_id && (
                                <p className="text-[10px] text-emerald-500/70 font-mono mt-0.5">
                                  ID: {item.payout_id}
                                </p>
                              )}
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {formatDate(item.date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={cn(
                                "font-bold",
                                isSuccess ? "text-emerald-500" : "text-red-400",
                              )}
                            >
                              {isSuccess ? "+" : ""}₹
                              {item.amount.toLocaleString("en-IN")}
                            </p>
                            <span
                              className={cn(
                                "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                                isSuccess
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : "bg-red-500/10 text-red-400",
                              )}
                            >
                              {item.type === "booking_success"
                                ? "Completed"
                                : item.type === "booking_cancelled"
                                  ? "Cancelled"
                                  : item.type === "withdrawal_paid"
                                    ? "Paid"
                                    : "Rejected"}
                            </span>
                          </div>
                        </Card>
                      );
                    })
                )}
                {historyItems.length > PAGE_SIZE && (
                  <PaginationBar
                    currentPage={historyPage}
                    totalPages={Math.ceil(historyItems.length / PAGE_SIZE)}
                    onPageChange={setHistoryPage}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckEarningPage;
