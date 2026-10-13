import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Wallet,
  User,
  History,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  LogOut,
  Copy,
  Download,
  Share2,
  AlertCircle,
  X,
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
import { isReferralDeveloperMode } from "@/lib/developerAccess";
import {
  demoReferralDashboard,
  demoReferralHistory,
  demoReferralInProcess,
  demoReferralUpiIds,
} from "@/data/demoReferral";

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
  saved_upi_id: string | null;
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
}

interface UpiIdItem {
  id: number;
  upi_id: string;
  beneficiary_name: string;
  is_default: boolean;
  created_at: string;
}

const validateMobile = (mobile: string) => {
  return /^[6-9]\d{9}$/.test(mobile.replace(/\D/g, ""));
};

const ReferralDashboard = () => {
  const navigate = useNavigate();
  const developerPreview = isReferralDeveloperMode();
  const loginPath = window.location.pathname.startsWith("/referral/")
    ? "/referral/login"
    : "/login";
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [inProcess, setInProcess] = useState<InProcessBooking[]>([]);
  const [inProcessAmount, setInProcessAmount] = useState(0);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ amount: "" });
  const [withdrawLoading, setWithdrawLoading] = useState(false);

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

  const getToken = () => localStorage.getItem("referral_token");

  useEffect(() => {
    if (developerPreview) {
      setDashboard(demoReferralDashboard);
      setShareData({
        referralCode: demoReferralDashboard.referral_code,
        referralLink: `${window.location.origin}/?ref=${demoReferralDashboard.referral_code}`,
        referralQrCode: "",
        referralType: demoReferralDashboard.referral_type,
        linkedPropertySlug: null,
      });
      setInProcess(demoReferralInProcess);
      setInProcessAmount(
        demoReferralInProcess.reduce(
          (total, booking) => total + booking.referrer_commission,
          0,
        ),
      );
      setHistoryItems(demoReferralHistory);
      setUpiList(demoReferralUpiIds);
      setLoading(false);
      return;
    }

    const token = getToken();
    if (!token) {
      navigate(loginPath, { replace: true });
      return;
    }
    fetchAll(token);
  }, [navigate]);

  const fetchAll = (token: string) => {
    fetchDashboard(token);
    fetchShareData(token);
    fetchInProcess(token);
    fetchHistory(token);
    fetchUpiList(token);
  };

  const fetchUpiList = async (token: string) => {
    setUpiListLoading(true);
    try {
      const res = await axios.get("/api/referrals/upi-ids", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUpiList(res.data.upi_ids || []);
    } catch (err: any) {
      console.error("UPI list error:", err);
    } finally {
      setUpiListLoading(false);
    }
  };

  const fetchDashboard = async (token: string) => {
    setLoading(true);
    try {
      const res = await axios.get("/api/referrals/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboard(res.data);
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        localStorage.removeItem("referral_token");
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchShareData = async (token: string) => {
    try {
      const res = await axios.get("/api/referrals/share", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShareData(res.data);
    } catch (error: any) {
      console.error("Share data error:", error);
    }
  };

  const fetchInProcess = async (token: string) => {
    try {
      const res = await axios.get("/api/referrals/in-process", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInProcess(res.data.in_process || []);
      setInProcessAmount(res.data.in_process_amount || 0);
    } catch (error: any) {
      console.error("In-process error:", error);
    }
  };

  const fetchHistory = async (token: string) => {
    setHistoryLoading(true);
    try {
      const res = await axios.get("/api/referrals/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistoryItems(res.data.history || []);
    } catch (error: any) {
      console.error("History error:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const defaultUpi = upiList.find((u) => u.is_default) || null;

  const handleWithdraw = async () => {
    if (developerPreview) {
      toast.info("Withdrawals are disabled in developer preview.");
      return;
    }
    const token = getToken();
    if (!token || !dashboard) return;

    if (!defaultUpi) {
      toast.error("Please add and select a mobile number first");
      return;
    }
    if (!withdrawForm.amount || Number(withdrawForm.amount) < 500) {
      toast.error("Minimum withdrawal amount is ₹500");
      return;
    }
    if (Number(withdrawForm.amount) > dashboard.available_balance) {
      toast.error("Withdrawal amount exceeds available balance");
      return;
    }

    setWithdrawLoading(true);
    try {
      const response = await axios.post(
        "/api/referrals/withdraw",
        { amount: parseFloat(withdrawForm.amount), upi: defaultUpi.upi_id },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const status = response.data?.status;
      const msg = response.data?.message || "Withdrawal initiated!";
      if (status === "completed") {
        toast.success(
          "Withdrawal Successful! 💰 Amount will be credited shortly.",
        );
      } else {
        toast.success(msg);
      }
      setWithdrawForm({ amount: "" });
      fetchDashboard(token);
      fetchHistory(token);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Withdrawal failed");
    } finally {
      setWithdrawLoading(false);
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
    if (developerPreview) {
      toast.info("Payment details are read-only in developer preview.");
      return;
    }
    const token = getToken();
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
      setUpiList((prev) => {
        const updated =
          addUpiMakeDefault || prev.length === 0
            ? prev.map((u) => ({ ...u, is_default: false }))
            : [...prev];
        return [...updated, res.data.upi];
      });
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
    if (developerPreview) {
      toast.info("Payment details are read-only in developer preview.");
      return;
    }
    const token = getToken();
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
      const res = await axios.put(
        `/api/referrals/upi-ids/${id}`,
        { upi_id: editUpiField1, beneficiary_name: editBeneficiaryName.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setUpiList((prev) => prev.map((u) => (u.id === id ? res.data.upi : u)));
      cancelEditUpi();
      toast.success("Mobile number updated");
    } catch (err: any) {
      toast.error(
        err.response?.data?.error || "Failed to update mobile number",
      );
    }
  };

  const handleSetDefaultUpi = async (id: number) => {
    if (developerPreview) {
      toast.info("Payment details are read-only in developer preview.");
      return;
    }
    const token = getToken();
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
    if (developerPreview) {
      toast.info("Payment details are read-only in developer preview.");
      return;
    }
    const token = getToken();
    if (!token) return;
    try {
      await axios.delete(`/api/referrals/upi-ids/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUpiList((prev) => {
        const remaining = prev.filter((u) => u.id !== id);
        const deletedWasDefault = prev.find((u) => u.id === id)?.is_default;
        if (deletedWasDefault && remaining.length > 0) {
          remaining[0] = { ...remaining[0], is_default: true };
        }
        return remaining;
      });
      toast.success("Mobile number removed");
    } catch (err: any) {
      toast.error(
        err.response?.data?.error || "Failed to remove mobile number",
      );
    }
  };

  const handleLogout = () => {
    const rawRefreshToken = localStorage.getItem("referral_refresh_token");
    if (rawRefreshToken) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rawRefreshToken }),
      }).catch(() => {});
    }
    localStorage.removeItem("referral_token");
    localStorage.removeItem("referral_refresh_token");
    localStorage.removeItem("referralDeveloperMode");
    navigate(loginPath, { replace: true });
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

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatDateShort = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#F59E0B]" />
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <Helmet>
        <title>Dashboard - Referral</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {developerPreview && (
        <div className="bg-[#F59E0B] px-4 py-2 text-center text-xs font-semibold text-black">
          Referral developer preview · Sample earnings and history · Withdrawals are disabled
        </div>
      )}

      <div className="sticky top-0 z-50 bg-black border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold text-[#F59E0B]">
            Referral Dashboard
          </h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="flex items-center gap-2 
                bg-red-600 text-black 
                hover:bg-red-600 hover:opacity-80 
                transition-all px-4 py-2 rounded-xl"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
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

              <div className="flex gap-3 mt-6">
                {/* Cancel */}
                <DialogClose asChild>
                  <Button className="flex-1 bg-[#F59E0B] text-black rounded-xl hover:opacity-80 transition-all">
                    Cancel
                  </Button>
                </DialogClose>

                {/* Logout */}
                <Button
                  onClick={handleLogout}
                  className="flex-1 bg-red-600 text-black rounded-xl hover:opacity-80 transition-all"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="container mx-auto px-6 pt-8 max-w-md space-y-6">
        <Card className="p-6 bg-gradient-to-br from-[#D97706] to-[#B45309] text-white rounded-[2rem] border-none shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-white font-bold tracking-widest">
                  Welcome back
                </p>
                <p className="text-xl font-display font-bold capitalize">
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

        <Tabs defaultValue="withdraw" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-secondary/50 rounded-2xl p-1 h-14">
            <TabsTrigger
              value="withdraw"
              className="rounded-xl font-bold data-[state=active]:bg-[#F59E0B] data-[state=active]:text-black text-xs"
            >
              <Wallet className="w-4 h-4 mr-1" />
              Payouts
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-xl font-bold data-[state=active]:bg-[#F59E0B] data-[state=active]:text-black text-xs"
            >
              <History className="w-4 h-4 mr-1" />
              History
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="rounded-xl font-bold data-[state=active]:bg-[#F59E0B] data-[state=active]:text-black text-xs"
            >
              <AlertCircle className="w-4 h-4 mr-1" />
              Stats
            </TabsTrigger>
            <TabsTrigger
              value="share"
              className="rounded-xl font-bold data-[state=active]:bg-[#F59E0B] data-[state=active]:text-black text-xs"
            >
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </TabsTrigger>
          </TabsList>

          <TabsContent value="withdraw" className="mt-6 space-y-6">
            {/* ── UPI ID Setup ── */}
            <Card className="p-5 bg-card border-border/50 rounded-3xl space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#F59E0B]" />
                <h3 className="text-sm font-bold tracking-wide">
                  Saved Mobile Numbers
                </h3>
              </div>

              {upiListLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-[#F59E0B]" />
                </div>
              ) : (
                <>
                  {/* Saved UPI list */}
                  {upiList.length > 0 && (
                    <div className="space-y-2">
                      {upiList.map((upi) =>
                        editingUpiId === upi.id ? (
                          /* ── Edit mode for this row ── */
                          <div
                            key={upi.id}
                            className="bg-secondary/40 rounded-2xl p-4 space-y-3 border border-[#F59E0B]/30"
                          >
                            <p className="text-xs font-semibold text-[#F59E0B]/80 uppercase tracking-widest">
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
                                  The entered mobile number must be linked to
                                  your bank account and enabled for UPI.
                                  PawnaHavenCamp will not be responsible for any
                                  financial loss, failed transaction, or
                                  incorrect payment resulting from an incorrect
                                  mobile number entered by the user.
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
                                matches your bank account holder's name.
                                Incorrect details may result in incorrect
                                payment. We are not responsible for any money
                                loss caused by incorrect information provided by
                                the user.
                              </p>
                              <label className="flex items-start gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={editBeneficiaryAgreed}
                                  onChange={(e) =>
                                    setEditBeneficiaryAgreed(e.target.checked)
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
                                className="flex-1 h-10 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold text-sm disabled:opacity-40"
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
                          /* ── Display mode for this row ── */
                          <div
                            key={upi.id}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all",
                              upi.is_default
                                ? "bg-emerald-500/10 border-emerald-500/30"
                                : "bg-secondary/30 border-border/40 hover:border-border/70",
                            )}
                          >
                            {/* Radio — tap to set default */}
                            <button
                              onClick={() =>
                                !upi.is_default && handleSetDefaultUpi(upi.id)
                              }
                              className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                                upi.is_default
                                  ? "border-emerald-400 bg-emerald-400"
                                  : "border-white/30 hover:border-[#F59E0B]",
                              )}
                              title={
                                upi.is_default
                                  ? "Default mobile"
                                  : "Set as default"
                              }
                            >
                              {upi.is_default && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </button>

                            {/* UPI ID text + beneficiary name */}
                            <div className="flex-1 flex flex-col min-w-0">
                              <span className="font-mono text-sm truncate text-white/90">
                                {upi.upi_id}
                              </span>
                              {upi.beneficiary_name && (
                                <span className="text-[10px] text-white/40 truncate">
                                  {upi.beneficiary_name}
                                </span>
                              )}
                            </div>

                            {/* Default badge */}
                            {upi.is_default && (
                              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex-shrink-0">
                                Default
                              </span>
                            )}

                            {/* Edit */}
                            <button
                              onClick={() => startEditUpi(upi)}
                              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-[#F59E0B]/15 flex items-center justify-center transition-colors flex-shrink-0"
                              title="Edit mobile number"
                            >
                              <Pencil className="w-3.5 h-3.5 text-white/50 hover:text-[#F59E0B]" />
                            </button>

                            {/* Delete */}
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
                        ),
                      )}
                    </div>
                  )}

                  {/* ── Add UPI form ── */}
                  {(showAddUpiForm || upiList.length === 0) && (
                    <div
                      className={cn(
                        "space-y-3",
                        upiList.length > 0 && "border-t border-border/40 pt-4",
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
                            <span className="font-semibold">Important:</span>{" "}
                            The entered mobile number must be linked to your
                            bank account and enabled for UPI. PawnaHavenCamp
                            will not be responsible for any financial loss,
                            failed transaction, or incorrect payment resulting
                            from an incorrect mobile number entered by the user.
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
                              Mobile numbers matched.
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
                          ⚠️ Please verify the Beneficiary Name exactly matches
                          your bank account holder's name. Incorrect details may
                          result in incorrect payment. We are not responsible
                          for any money loss caused by incorrect information
                          provided by the user.
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

                      {/* Make default toggle — only relevant when user already has UPIs */}
                      {upiList.length > 0 && (
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <div
                            onClick={() => setAddUpiMakeDefault((v) => !v)}
                            className={cn(
                              "w-9 h-5 rounded-full transition-colors flex items-center px-0.5",
                              addUpiMakeDefault
                                ? "bg-[#F59E0B]"
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

                      {/* Add UPI button — only visible when both fields match */}
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
                              className="flex-1 h-11 rounded-2xl bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold"
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

                  {/* Add another mobile number trigger */}
                  {upiList.length > 0 &&
                    !showAddUpiForm &&
                    editingUpiId === null && (
                      <button
                        onClick={() => setShowAddUpiForm(true)}
                        className="w-full h-10 rounded-xl border border-dashed border-white/20 hover:border-[#F59E0B]/50 text-xs text-muted-foreground hover:text-[#F59E0B] transition-all flex items-center justify-center gap-1.5"
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
              {/* Selected UPI read-only display */}
              {defaultUpi ? (
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
                  value={withdrawForm.amount}
                  onChange={(e) =>
                    setWithdrawForm({ ...withdrawForm, amount: e.target.value })
                  }
                  className="h-12 bg-secondary/50 rounded-xl"
                />
                {dashboard.available_balance < 500 && (
                  <p className="text-xs text-blue-400">
                    Minimum ₹500 balance required to payout!
                  </p>
                )}
              </div>
              <Button
                onClick={handleWithdraw}
                disabled={
                  withdrawLoading ||
                  !defaultUpi ||
                  !withdrawForm.amount ||
                  parseFloat(withdrawForm.amount) < 500 ||
                  parseFloat(withdrawForm.amount) >
                    dashboard.available_balance ||
                  dashboard.available_balance < 500
                }
                className="w-full h-14 rounded-2xl font-bold bg-[#F59E0B] hover:bg-[#D97706] text-black disabled:opacity-50"
              >
                {withdrawLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Payout Amount"
                )}
              </Button>
            </Card>

            {dashboard.pending_withdrawal_amount > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold flex items-center gap-2 px-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Pending Requests
                </h3>
                <Card className="p-4 bg-card border-orange-500/20 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="font-bold">
                      ₹
                      {dashboard.pending_withdrawal_amount.toLocaleString(
                        "en-IN",
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                      Payout Request
                    </p>
                  </div>
                  <span className="text-[10px] bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                    Pending
                  </span>
                </Card>
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
                      </div>
                      <span className="text-[10px] bg-[#F59E0B]/10 text-[#F59E0B] px-2 py-1 rounded-full font-bold">
                        In-Process
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {formatDateShort(booking.checkin_datetime)} →{" "}
                        {formatDateShort(booking.checkout_datetime)}
                      </span>
                      <span className="text-[#F59E0B] font-bold">
                        +₹{booking.referrer_commission.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6 space-y-4">
            {historyLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#F59E0B]" />
              </div>
            ) : historyItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No history yet</p>
              </div>
            ) : (
              historyItems.map((item, i) => (
                <Card
                  key={i}
                  className="p-4 bg-card border-border/50 rounded-2xl"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        item.type === "booking_success"
                          ? "bg-emerald-500/10"
                          : item.type === "withdrawal_paid"
                            ? "bg-blue-500/10"
                            : "bg-red-500/10",
                      )}
                    >
                      {item.type === "booking_success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : item.type === "withdrawal_paid" ? (
                        <Wallet className="w-4 h-4 text-blue-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">
                        {item.message}
                      </p>
                      {item.property_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {item.property_name}
                          {item.guest_name ? ` · ${item.guest_name}` : ""}
                        </p>
                      )}
                      {item.upi_id && (
                        <p className="text-xs text-muted-foreground">
                          Mobile: {item.upi_id}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(item.date)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-bold flex-shrink-0",
                        item.type === "booking_success" ||
                          item.type === "withdrawal_paid"
                          ? "text-emerald-400"
                          : "text-red-400",
                      )}
                    >
                      {item.type === "booking_success"
                        ? `+₹${item.amount.toLocaleString("en-IN")}`
                        : item.type === "withdrawal_paid"
                          ? `-₹${item.amount.toLocaleString("en-IN")}`
                          : `₹${item.amount.toLocaleString("en-IN")}`}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="stats" className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-card border-border/50 rounded-2xl text-center">
                <p className="text-2xl font-display font-bold text-[#F59E0B]">
                  {dashboard.total_referrals}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total Referrals
                </p>
              </Card>
              <Card className="p-4 bg-card border-border/50 rounded-2xl text-center">
                <p className="text-2xl font-display font-bold text-emerald-400">
                  ₹ {dashboard.total_earnings.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total Earned
                </p>
              </Card>
              <Card className="p-4 bg-card border-border/50 rounded-2xl text-center">
                <p className="text-2xl font-display font-bold text-blue-400">
                  ₹ {dashboard.total_withdrawals.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total Payouts
                </p>
              </Card>
              <Card className="p-4 bg-card border-border/50 rounded-2xl text-center">
                <p className="text-2xl font-display font-bold text-[#F59E0B]">
                  ₹ {inProcessAmount.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">In-Process</p>
              </Card>
            </div>
            <Card className="p-4 bg-card border-border/50 rounded-2xl">
              <p className="text-xs text-muted-foreground mb-1">
                Commission Rate
              </p>
              <p className="font-bold">{dashboard.commission_label}</p>
            </Card>
          </TabsContent>

          <TabsContent value="share" className="mt-6 space-y-4">
            {shareData ? (
              <>
                <Card className="p-4 bg-card border-border/50 rounded-2xl space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Referral Code
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-lg tracking-widest text-[#F59E0B]">
                        {shareData.referralCode}
                      </p>
                      <button
                        onClick={() =>
                          handleCopy(shareData.referralCode, "Code")
                        }
                        className="text-muted-foreground hover:text-white transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Referral Link
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white/70 truncate flex-1">
                        {shareData.referralLink}
                      </p>
                      <button
                        onClick={() =>
                          handleCopy(shareData.referralLink, "Link")
                        }
                        className="text-muted-foreground hover:text-white transition-colors flex-shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>

                {shareData.referralQrCode && (
                  <Card className="p-4 bg-card border-border/50 rounded-2xl flex flex-col items-center gap-4">
                    <img
                      src={shareData.referralQrCode}
                      alt="Referral QR Code"
                      className="w-48 h-48 rounded-xl"
                    />
                    <div className="flex gap-3 w-full">
                      <Button
                        onClick={handleDownloadQR}
                        variant="outline"
                        className="flex-1 rounded-xl gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download QR
                      </Button>
                      <Button
                        onClick={handleWhatsAppShare}
                        className="flex-1 rounded-xl gap-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Share2 className="w-4 h-4" />
                        WhatsApp
                      </Button>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#F59E0B]" />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReferralDashboard;
