import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { adminPaths } from "@/lib/adminPaths";
import {
  ChevronLeft,
  Clock,
  History,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Bell,
  X,
  MessageCircle,
  Phone,
  CheckCircle2,
  Wallet,
  Copy,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PaginationBar from "@/components/ui/PaginationBar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Helmet } from "react-helmet-async";

interface WithdrawalRequest {
  id: number;
  username: string;
  referral_otp_number: string;
  whatsapp_number: string;
  referral_code: string;
  referral_type: string;
  amount: number;
  upi_id: string | null;
  beneficiary_name: string | null;
  available_balance: number;
  created_at: string;
}

interface HistoryItem {
  id: string;
  type: "Refund" | "Withdrawal";
  user: string;
  property?: string;
  amount: number;
  date: string;
  status: string;
}

interface WithdrawalDialogState {
  open: boolean;
  mode: "paid" | "reject" | null;
  req: WithdrawalRequest | null;
}

const WITHDRAWAL_DIALOG_CLOSED: WithdrawalDialogState = {
  open: false,
  mode: null,
  req: null,
};

const REFERRAL_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  public: {
    label: "Public",
    color: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  },
  owner: {
    label: "Owner",
    color: "bg-green-500/15 text-green-300 border-green-500/20",
  },
  b2b: {
    label: "B2B",
    color: "bg-purple-500/15 text-purple-300 border-purple-500/20",
  },
  owners_b2b: {
    label: "Owner B2B",
    color: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  },
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const formatPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
};

const buildUpiPayLink = (upi_id: string, name: string, amount: number) =>
  `upi://pay?pa=${encodeURIComponent(upi_id)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent("Withdrawal")}`;

const PAGE_SIZE = 10;

const RequestsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("withdrawals");
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setWithdrawPage(1);
    setHistoryPage(1);
  };
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [withdrawalDialog, setWithdrawalDialog] =
    useState<WithdrawalDialogState>(WITHDRAWAL_DIALOG_CLOSED);

  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawalRequest[]>(
    [],
  );
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);

  const [withdrawPage, setWithdrawPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [copiedUpi, setCopiedUpi] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const highlightRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const copyUpi = (upi: string) => {
    navigator.clipboard.writeText(upi).then(() => {
      setCopiedUpi(upi);
      setTimeout(() => setCopiedUpi(null), 2000);
    });
  };

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [withdrawRes, historyRes] = await Promise.all([
        fetch("/api/payments/withdrawal/requests", {
          headers: getAuthHeaders(),
        }),
        fetch("/api/payments/requests/history", { headers: getAuthHeaders() }),
      ]);

      if (withdrawRes.status === 401 || historyRes.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please log in again.",
          variant: "destructive",
        });
        navigate(adminPaths.login);
        return;
      }

      if (withdrawRes.ok) {
        const data = await withdrawRes.json();
        setWithdrawRequests(data.withdrawal_requests || []);
      }
      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistoryData(data.history || []);
      }
    } catch (error) {
      console.error("Error fetching requests data:", error);
      toast({
        title: "Error",
        description: "Failed to load requests data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, navigate]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    const highlightParam = searchParams.get("highlight");
    if (!highlightParam || withdrawRequests.length === 0) return;
    const highlightId = parseInt(highlightParam, 10);
    const index = withdrawRequests.findIndex((r) => r.id === highlightId);
    if (index === -1) return;

    setActiveTab("withdrawals");
    setWithdrawPage(Math.floor(index / PAGE_SIZE) + 1);
    setHighlightedId(highlightId);

    const scrollTimer = setTimeout(() => {
      highlightRefs.current[highlightId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);

    const clearTimer = setTimeout(() => {
      setHighlightedId(null);
      setSearchParams({}, { replace: true });
    }, 4000);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withdrawRequests, searchParams]);

  const openWithdrawalDialog = (
    mode: "paid" | "reject",
    req: WithdrawalRequest,
  ) => setWithdrawalDialog({ open: true, mode, req });
  const closeWithdrawalDialog = () =>
    setWithdrawalDialog(WITHDRAWAL_DIALOG_CLOSED);

  const removeWithdrawal = (id: number) =>
    setWithdrawRequests((prev) => prev.filter((r) => r.id !== id));

  const executeApproveWithdrawal = async (req: WithdrawalRequest) => {
    closeWithdrawalDialog();
    setActionLoading(`approve-${req.id}`);
    try {
      const res = await fetch("/api/payments/withdrawal/process", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ transaction_id: req.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        removeWithdrawal(req.id);
        toast({
          title: "Withdrawal Marked as Paid",
          description: "The withdrawal has been marked as completed.",
        });
        fetchAllData();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to approve withdrawal",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Network error approving withdrawal",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const executeRejectWithdrawal = async (req: WithdrawalRequest) => {
    closeWithdrawalDialog();
    setActionLoading(`reject-${req.id}`);
    try {
      const res = await fetch("/api/payments/withdrawal/reject", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ transaction_id: req.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        removeWithdrawal(req.id);
        toast({
          title: "Withdrawal Rejected",
          description: "The withdrawal request has been rejected.",
        });
        fetchAllData();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to reject withdrawal",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Network error rejecting withdrawal",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const typeInfo = (type: string) =>
    REFERRAL_TYPE_LABELS[type?.toLowerCase()] || REFERRAL_TYPE_LABELS["public"];

  return (
    <div className="min-h-screen bg-charcoal text-white pb-20">
      <Helmet>
        <title>Requests Management - Admin</title>
      </Helmet>

      {/* Withdrawal confirm dialog */}
      {withdrawalDialog.open && withdrawalDialog.req && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{
            background: "rgba(0,0,0,0.80)",
            backdropFilter: "blur(8px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeWithdrawalDialog();
          }}
        >
          <div className="w-full sm:max-w-md bg-[#151515] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                    withdrawalDialog.mode === "reject"
                      ? "bg-red-500/15 text-red-400"
                      : "bg-emerald-500/15 text-emerald-400",
                  )}
                >
                  {withdrawalDialog.mode === "reject" ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>
                <h3 className="font-display font-bold text-base text-white">
                  {withdrawalDialog.mode === "reject"
                    ? "Reject Withdrawal"
                    : "Confirm Payment"}
                </h3>
              </div>
              <button
                onClick={closeWithdrawalDialog}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="bg-white/5 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-base">
                    {withdrawalDialog.req.username}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                      typeInfo(withdrawalDialog.req.referral_type).color,
                    )}
                  >
                    {typeInfo(withdrawalDialog.req.referral_type).label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Mobile</span>
                  <span className="text-white/80 font-mono">
                    {withdrawalDialog.req.referral_otp_number}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">WhatsApp</span>
                  <a
                    href={`https://wa.me/91${formatPhone(withdrawalDialog.req.whatsapp_number)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 font-mono hover:text-green-300 transition-colors"
                  >
                    {withdrawalDialog.req.whatsapp_number}
                  </a>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Referral Code</span>
                  <span className="text-white/80 font-mono">
                    {withdrawalDialog.req.referral_code}
                  </span>
                </div>
                {withdrawalDialog.req.beneficiary_name && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Beneficiary Name</span>
                    <span className="text-white/80 font-medium">{withdrawalDialog.req.beneficiary_name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Mobile No.</span>
                  {withdrawalDialog.req.upi_id ? (
                    <div className="flex items-center gap-1.5">
                      <a
                        href={buildUpiPayLink(
                          withdrawalDialog.req.upi_id,
                          withdrawalDialog.req.username,
                          withdrawalDialog.req.amount,
                        )}
                        className="text-[#F59E0B] font-mono hover:text-[#D97706] transition-colors"
                      >
                        {withdrawalDialog.req.upi_id}
                      </a>
                      <button
                        onClick={() => copyUpi(withdrawalDialog.req.upi_id!)}
                        title="Copy UPI ID"
                        className="flex-shrink-0 text-white/40 hover:text-[#F59E0B] transition-colors"
                      >
                        {copiedUpi === withdrawalDialog.req.upi_id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-white/30 italic text-xs">
                      Not provided
                    </span>
                  )}
                </div>
                <div className="border-t border-white/10 pt-2.5 flex items-center justify-between">
                  <span className="text-white/50 text-sm">
                    Available Balance
                  </span>
                  <span className="text-white/70 font-bold">
                    ₹
                    {Number(
                      withdrawalDialog.req.available_balance,
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70 font-semibold">
                    Requested Amount
                  </span>
                  <span className="text-2xl font-bold text-[#F59E0B]">
                    ₹
                    {Number(withdrawalDialog.req.amount).toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>
              </div>
              {withdrawalDialog.mode === "reject" ? (
                <p className="text-xs text-white/40 leading-relaxed px-1">
                  The partner will be notified that their withdrawal request was
                  rejected. Their balance will remain unchanged.
                </p>
              ) : (
                <p className="text-xs text-white/40 leading-relaxed px-1">
                  Confirm only after the payment has been sent to the UPI ID
                  above. This will mark the withdrawal as completed.
                </p>
              )}
            </div>

            <div className="flex gap-3 px-5 pb-6">
              <Button
                variant="ghost"
                className="flex-1 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 hover:text-white h-11 text-sm"
                onClick={closeWithdrawalDialog}
              >
                Cancel
              </Button>
              <Button
                className={cn(
                  "flex-1 rounded-xl h-11 text-sm font-bold text-white",
                  withdrawalDialog.mode === "reject"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-emerald-500 hover:bg-emerald-600",
                )}
                onClick={() => {
                  if (!withdrawalDialog.req) return;
                  if (withdrawalDialog.mode === "paid")
                    executeApproveWithdrawal(withdrawalDialog.req);
                  else executeRejectWithdrawal(withdrawalDialog.req);
                }}
              >
                {withdrawalDialog.mode === "reject"
                  ? "Reject"
                  : "Paid — Mark Complete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(adminPaths.dashboard)}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-gold/20 hover:text-gold transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="font-display text-xl font-bold flex items-center gap-2">
            <Bell className="w-5 h-5 text-gold" />
            Requests Center
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-6 pt-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-gold mb-4" />
            <p className="text-white/50">Loading requests...</p>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-6"
          >
            <TabsList className="bg-white/5 p-1 rounded-2xl w-full border border-white/10 grid grid-cols-2">
              <TabsTrigger
                value="withdrawals"
                className="rounded-xl flex items-center gap-2 py-3 data-[state=active]:bg-gold data-[state=active]:text-black transition-all"
              >
                Withdrawals
                {withdrawRequests.length > 0 && (
                  <Badge className="bg-red-500 text-white border-none h-5 px-1.5 text-[10px]">
                    {withdrawRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-xl flex items-center gap-2 py-3 data-[state=active]:bg-gold data-[state=active]:text-black transition-all"
              >
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>

            {/* ── WITHDRAWALS TAB ── */}
            <TabsContent
              value="withdrawals"
              className="space-y-4 animate-in fade-in slide-in-from-bottom-4"
            >
              {withdrawRequests.length > 0 ? (
                <>
                  {withdrawRequests
                    .slice(
                      (withdrawPage - 1) * PAGE_SIZE,
                      withdrawPage * PAGE_SIZE,
                    )
                    .map((req) => {
                      const phone = formatPhone(
                        req.whatsapp_number || req.referral_otp_number,
                      );
                      const whatsappUrl = `https://wa.me/91${phone}`;
                      const callUrl = `tel:+91${formatPhone(req.referral_otp_number)}`;
                      const info = typeInfo(req.referral_type);
                      const isApproving = actionLoading === `approve-${req.id}`;
                      const isRejecting = actionLoading === `reject-${req.id}`;
                      const isBusy = isApproving || isRejecting;

                      return (
                        <Card
                          key={req.id}
                          ref={(el) => {
                            highlightRefs.current[req.id] = el;
                          }}
                          className={cn(
                            "bg-white/[0.04] border border-white/10 rounded-2xl hover:border-gold/30 transition-all overflow-hidden",
                            highlightedId === req.id &&
                              "animate-glow-pulse border-[#F59E0B]",
                          )}
                        >
                          {/* Top strip */}
                          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.06]">
                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border",
                                info.color,
                              )}
                            >
                              {info.label}
                            </span>
                            <div className="flex items-center gap-2">
                              {isBusy ? (
                                <div className="flex items-center gap-2 opacity-40 pointer-events-none">
                                  <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
                                    <MessageCircle className="w-4 h-4 text-green-400" />
                                  </div>
                                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <Phone className="w-4 h-4 text-blue-400" />
                                  </div>
                                  {req.upi_id && (
                                    <div className="h-8 px-3 rounded-xl bg-[#F59E0B]/10 flex items-center gap-1.5">
                                      <Wallet className="w-3.5 h-3.5 text-[#F59E0B]" />
                                      <span className="text-[#F59E0B] text-xs font-bold">
                                        Pay
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-8 h-8 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center hover:bg-green-500/20 transition-colors"
                                    title="WhatsApp"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </a>
                                  <a
                                    href={callUrl}
                                    className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 transition-colors"
                                    title="Call"
                                  >
                                    <Phone className="w-4 h-4" />
                                  </a>
                                  {req.upi_id && (
                                    <a
                                      href={buildUpiPayLink(
                                        req.upi_id,
                                        req.username,
                                        req.amount,
                                      )}
                                      className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 transition-colors text-xs font-bold"
                                      title="Pay via UPI"
                                    >
                                      <Wallet className="w-3.5 h-3.5" />
                                      <span>Pay</span>
                                    </a>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Card body */}
                          <div className="px-5 py-4 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-bold text-white text-lg leading-tight">
                                  {req.username
                                    ?.split(" ")
                                    .map(
                                      (word) =>
                                        word.charAt(0).toUpperCase() +
                                        word.slice(1).toLowerCase(),
                                    )
                                    .join(" ")}
                                </h3>
                                <p className="text-xs text-white/40 mt-0.5">
                                  {formatDateTime(req.created_at)}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-2xl font-bold text-[#F59E0B] leading-none">
                                  ₹{Number(req.amount).toLocaleString("en-IN")}
                                </p>
                                <p className="text-[10px] text-white/40 mt-0.5 uppercase tracking-wide">
                                  Requested
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-white/5 rounded-xl px-3 py-2">
                                <p className="text-white/40 mb-0.5">Mobile</p>
                                <p className="text-white/80 font-mono">
                                  {req.referral_otp_number}
                                </p>
                              </div>
                              <div className="bg-white/5 rounded-xl px-3 py-2">
                                <p className="text-white/40 mb-0.5">
                                  Referral Code
                                </p>
                                <p className="text-white/80 font-mono">
                                  {req.referral_code}
                                </p>
                              </div>
                              <div className="bg-white/5 rounded-xl px-3 py-2">
                                <p className="text-white/40 mb-0.5">
                                  Available Balance
                                </p>
                                <p className="text-white/80 font-semibold">
                                  ₹
                                  {Number(req.available_balance).toLocaleString(
                                    "en-IN",
                                  )}
                                </p>
                              </div>
                              {req.beneficiary_name && (
                                <div className="bg-white/5 rounded-xl px-3 py-2">
                                  <p className="text-white/40 mb-0.5">Beneficiary Name</p>
                                  <p className="text-white/90 font-medium text-sm">{req.beneficiary_name}</p>
                                </div>
                              )}
                              <div className="bg-white/5 rounded-xl px-3 py-2">
                                <p className="text-white/40 mb-0.5">Mobile No.</p>
                                {req.upi_id ? (
                                  <div className="flex items-center gap-1.5">
                                    <a
                                      href={buildUpiPayLink(
                                        req.upi_id,
                                        req.username,
                                        req.amount,
                                      )}
                                      className="text-[#F59E0B] font-mono hover:text-[#D97706] transition-colors truncate"
                                      title={req.upi_id}
                                    >
                                      {req.upi_id}
                                    </a>
                                    <button
                                      onClick={() => copyUpi(req.upi_id!)}
                                      title="Copy UPI ID"
                                      className="flex-shrink-0 text-white/40 hover:text-[#F59E0B] transition-colors"
                                    >
                                      {copiedUpi === req.upi_id ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-white/30 italic">
                                    Not provided
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 pt-1">
                              <Button
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-10 text-sm font-bold"
                                onClick={() =>
                                  openWithdrawalDialog("paid", req)
                                }
                                disabled={isBusy}
                              >
                                {isApproving ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  "Paid"
                                )}
                              </Button>
                              <Button
                                variant="destructive"
                                className="flex-1 h-10 rounded-xl text-sm font-semibold"
                                onClick={() =>
                                  openWithdrawalDialog("reject", req)
                                }
                                disabled={isBusy}
                              >
                                {isRejecting ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  "Reject"
                                )}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  <PaginationBar
                    currentPage={withdrawPage}
                    totalPages={Math.ceil(withdrawRequests.length / PAGE_SIZE)}
                    onPageChange={setWithdrawPage}
                  />
                </>
              ) : (
                <EmptyState icon={Clock} title="No Pending Withdrawals" />
              )}
            </TabsContent>

            {/* ── HISTORY TAB ── */}
            <TabsContent
              value="history"
              className="space-y-4 animate-in fade-in slide-in-from-bottom-4"
            >
              {historyData.length > 0 ? (
                <>
                  {historyData
                    .slice(
                      (historyPage - 1) * PAGE_SIZE,
                      historyPage * PAGE_SIZE,
                    )
                    .map((item) => (
                      <Card
                        key={item.id}
                        className="p-4 bg-white/5 border-white/10 rounded-2xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              item.type === "Withdrawal"
                                ? item.status === "paid"
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : "bg-red-500/10 text-red-500"
                                : item.status === "refunded"
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : item.status === "processing"
                                    ? "bg-[#F59E0B]/10 text-[#F59E0B]"
                                    : "bg-red-500/10 text-red-500",
                            )}
                          >
                            {item.type === "Withdrawal" ? (
                              <ArrowUpRight className="w-5 h-5" />
                            ) : (
                              <ArrowDownLeft className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm">{item.user}</h4>
                            <p className="text-[10px] text-white/40">
                              {formatDate(item.date)}
                              {item.type === "Refund" && item.property
                                ? ` • ${item.property}`
                                : ""}{" "}
                              • {item.type}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={cn(
                              "font-bold",
                              item.status === "paid" ||
                                item.status === "refunded"
                                ? "text-emerald-500"
                                : item.status === "processing"
                                  ? "text-[#F59E0B]"
                                  : "text-red-500",
                            )}
                          >
                            ₹{item.amount}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] h-5",
                              item.status === "denied" ||
                                item.status === "rejected"
                                ? "border-red-500/20 text-red-400"
                                : item.status === "processing"
                                  ? "border-[#F59E0B]/20 text-[#F59E0B]"
                                  : "border-white/10 text-white/40",
                            )}
                          >
                            {item.status === "refunded"
                              ? "REFUNDED"
                              : item.status === "paid"
                                ? "PAID"
                                : item.status === "denied"
                                  ? "DENIED"
                                  : item.status === "processing"
                                    ? "PROCESSING"
                                    : "REJECTED"}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  <PaginationBar
                    currentPage={historyPage}
                    totalPages={Math.ceil(historyData.length / PAGE_SIZE)}
                    onPageChange={setHistoryPage}
                  />
                </>
              ) : (
                <EmptyState icon={History} title="No History Yet" />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

const EmptyState = ({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) => (
  <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-[2rem] border border-dashed border-white/10 text-white/30">
    <Icon className="w-16 h-16 mb-4 opacity-20" />
    <h3 className="font-display text-lg font-bold">{title}</h3>
    <p className="text-sm">Everything is up to date.</p>
  </div>
);

export default RequestsPage;
