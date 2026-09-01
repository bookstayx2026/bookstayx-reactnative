import React, { useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  XCircle,
  Clock,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { ETicket } from "@/components/ETicket";

const BackConfirmPopup = ({
  onCancel,
  onBack,
}: {
  onCancel: () => void;
  onBack: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm">
    <div className="bg-[#1c1c1c] border border-[#F59E0B]/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center shrink-0 mt-0.5">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h3 className="text-white font-bold text-base leading-snug">
            Payment Received ✅
          </h3>
          <p className="text-gray-400 text-sm mt-1.5 leading-relaxed">
            Your payment was successful! The property owner will review and
            confirm your booking shortly. Once confirmed, you'll receive your
            complete booking details and e-ticket link directly on your{" "}
            <span className="text-green-400 font-semibold">WhatsApp</span>{" "}
            number — you don't need to stay on this page.
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-[#2a2a2a] text-gray-200 hover:bg-[#383838] active:bg-[#444] transition-colors duration-150"
        >
          Stay on Page
        </button>
        <button
          onClick={onBack}
          className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-[#F59E0B] text-black hover:bg-[#D97706] active:bg-[#B45309] transition-colors duration-150"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
);

const TicketPage = () => {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking_id");
  const ticketToken = searchParams.get("token");
  const paymentResult = searchParams.get("payment_result");
  const identifier = ticketToken || bookingId;

  const isCancelledByPaytm = paymentResult === "cancelled";

  const returnUrl = localStorage.getItem("booking_return_url") || "/";

  // Clear stale pending state immediately on cancellation
  useEffect(() => {
    if (isCancelledByPaytm) {
      localStorage.removeItem("pending_booking_id");
      localStorage.removeItem("pending_booking_time");
    }
  }, [isCancelledByPaytm]);

  const hasPendingBooking =
    !isCancelledByPaytm && bookingId
      ? localStorage.getItem("pending_booking_id") === bookingId
      : false;

  const [verifyingPayment, setVerifyingPayment] = useState(hasPendingBooking);
  const [verifyTimedOut, setVerifyTimedOut] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [isBlurred, setIsBlurred] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const verifyAttempts = useRef(0);
  const maxVerifyAttempts = 12;
  const navGuardActive = useRef(false);
  const [showBackConfirmPopup, setShowBackConfirmPopup] = useState(false);

  // Anti-screenshot / screen-share protection
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", preventDefault);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && (e.key === "p" || e.key === "P")) ||
        (e.ctrlKey && (e.key === "s" || e.key === "S")) ||
        (e.ctrlKey && e.shiftKey && (e.key === "i" || e.key === "I"))
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    const handleVisibility = () => {
      setIsBlurred(document.visibilityState === "hidden");
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("contextmenu", preventDefault);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const apiUrl = ticketToken
    ? `/api/etickets/booking?token=${ticketToken}`
    : `/api/etickets/booking?booking_id=${bookingId}`;

  const {
    data: ticket,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["ticket", identifier],
    queryFn: async () => {
      const response = await fetch(apiUrl, {
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch ticket");
      }

      return response.json();
    },
    enabled: !!identifier && !isCancelledByPaytm,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (
        data &&
        (data.booking_status === "PENDING_OWNER_CONFIRMATION" ||
          data.booking_status === "BOOKING_REQUEST_SENT_TO_OWNER" ||
          data.booking_status === "OWNER_CONFIRMED")
      ) {
        return 10000;
      }
      return false;
    },
  });

  // Payment verification loop — runs when pending_booking_id is in localStorage
  useEffect(() => {
    if (!bookingId || isCancelledByPaytm) return;

    const isPending = localStorage.getItem("pending_booking_id") === bookingId;
    if (!isPending) return;

    if (
      ticket &&
      (ticket.payment_status === "SUCCESS" ||
        ticket.booking_status === "PENDING_OWNER_CONFIRMATION" ||
        ticket.booking_status === "OWNER_CONFIRMED" ||
        ticket.booking_status === "TICKET_GENERATED" ||
        ticket.booking_status === "PAYMENT_FAILED" ||
        ticket.booking_status === "CANCELLED_BY_OWNER")
    ) {
      localStorage.removeItem("pending_booking_id");
      localStorage.removeItem("pending_booking_time");
      return;
    }

    setVerifyingPayment(true);

    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/payments/verify/${bookingId}`);
        const data = await response.json();

        if (data.success && data.payment_status === "SUCCESS") {
          localStorage.removeItem("pending_booking_id");
          localStorage.removeItem("pending_booking_time");
          setVerifyingPayment(false);
          refetch();
          return;
        }

        if (
          data.payment_status === "FAILED" ||
          data.payment_status === "FRAUD_DETECTED"
        ) {
          localStorage.removeItem("pending_booking_id");
          localStorage.removeItem("pending_booking_time");
          setVerifyingPayment(false);
          refetch();
          return;
        }
      } catch (err) {
        console.error("Payment verification error:", err);
      }

      verifyAttempts.current++;

      if (verifyAttempts.current >= maxVerifyAttempts) {
        setVerifyingPayment(false);
        setVerifyTimedOut(true);
        localStorage.removeItem("pending_booking_id");
        localStorage.removeItem("pending_booking_time");
      }
    };

    verifyPayment();

    const interval = setInterval(() => {
      if (verifyAttempts.current >= maxVerifyAttempts) {
        clearInterval(interval);
        return;
      }
      verifyPayment();
    }, 5000);

    return () => clearInterval(interval);
  // retryKey intentionally re-triggers this effect on manual retry
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, ticket, refetch, isCancelledByPaytm, retryKey]);

  // Navigation guard — push dummy history state on in-flight payment screens
  useEffect(() => {
    const inFlight =
      ticket &&
      (ticket.booking_status === "PENDING_OWNER_CONFIRMATION" ||
        ticket.booking_status === "BOOKING_REQUEST_SENT_TO_OWNER" ||
        ticket.booking_status === "OWNER_CONFIRMED");

    if (!inFlight) {
      navGuardActive.current = false;
      return;
    }

    navGuardActive.current = true;
    window.history.pushState({ paymentGuard: true }, "");

    const handlePopState = () => {
      if (navGuardActive.current) {
        window.history.pushState({ paymentGuard: true }, "");
        setShowBackConfirmPopup(true);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [ticket?.booking_status]);

  // Clear localStorage and release nav guard when ticket is generated
  useEffect(() => {
    if (ticket?.booking_status === "TICKET_GENERATED") {
      navGuardActive.current = false;
      localStorage.removeItem("pending_booking_id");
      localStorage.removeItem("pending_booking_time");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [ticket?.booking_status]);

  const handleRetry = () => {
    if (!bookingId) return;
    verifyAttempts.current = 0;
    localStorage.setItem("pending_booking_id", bookingId);
    setVerifyTimedOut(false);
    setVerifyingPayment(true);
    setRetryKey((k) => k + 1);
  };

  const copyBookingId = () => {
    if (bookingId) {
      navigator.clipboard.writeText(bookingId).then(() => {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      });
    }
  };

  const formatPaymentDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ─── No identifier ────────────────────────────────────────────────────────
  if (!identifier && !isCancelledByPaytm) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4 bg-[#0a0a0a] px-4">
        <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h1 className="text-2xl font-bold text-red-500">Invalid Request</h1>
        <p className="text-gray-400">No booking ID or token provided</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-6 py-2 rounded-lg bg-[#F59E0B] text-black font-semibold"
        >
          Go Home
        </button>
      </div>
    );
  }

  // ─── Payment Cancelled (user pressed back at Paytm) ───────────────────────
  if (isCancelledByPaytm) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
        <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#F59E0B]/20 text-center max-w-md w-full space-y-5">
          <div className="w-20 h-20 mx-auto bg-[#F59E0B]/10 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12 text-[#F59E0B]" />
          </div>

          <h1 className="text-2xl font-bold text-[#F59E0B]">
            Payment Cancelled
          </h1>

          <p className="text-gray-400">
            You cancelled the payment. No amount has been charged to your
            account.
          </p>

          {bookingId && (
            <div className="bg-[#111] rounded-xl p-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Booking ID</span>
                <span className="text-white text-sm font-mono">{bookingId}</span>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500">
            Your selected dates are still available. You can try booking again.
          </p>

          <button
            onClick={() => navigate(returnUrl)}
            className="mt-2 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#F59E0B] text-black font-semibold hover:bg-[#D97706] transition"
          >
            <ArrowLeft size={18} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ─── Loading / Verifying ──────────────────────────────────────────────────
  if (isLoading || verifyingPayment) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#0a0a0a] space-y-4 px-4">
        <Loader2 className="w-12 h-12 text-[#F59E0B] animate-spin" />
        <p className="text-white text-lg font-medium">
          {verifyingPayment
            ? "Verifying your payment with Paytm..."
            : "Loading your ticket..."}
        </p>
        {verifyingPayment && (
          <p className="text-gray-500 text-sm text-center max-w-xs">
            Please wait while we confirm your payment. This may take up to a
            minute.
          </p>
        )}
      </div>
    );
  }

  // ─── Error state ──────────────────────────────────────────────────────────
  if (error) {
    const errMsg = (error as Error).message || "";
    const isNotFound =
      errMsg.toLowerCase().includes("not found") ||
      errMsg.toLowerCase().includes("booking not found");

    // 404 while we had a pending booking in progress — clear stale state
    if (isNotFound && bookingId) {
      localStorage.removeItem("pending_booking_id");
      localStorage.removeItem("pending_booking_time");
    }

    if (isNotFound && hasPendingBooking) {
      return (
        <div className="flex flex-col justify-center items-center h-screen space-y-4 bg-[#0a0a0a] px-4">
          <AlertCircle className="w-16 h-16 text-yellow-500" />
          <h1 className="text-xl font-bold text-yellow-400">
            Booking Not Located
          </h1>
          <p className="text-gray-400 text-center max-w-sm">
            We couldn't find your booking in our system right now. If money was
            deducted, it will be refunded automatically within 5–7 business
            days.
          </p>
          <div className="bg-[#1a1a1a] rounded-xl px-5 py-4 border border-yellow-500/20 text-center">
            <p className="text-gray-500 text-xs mb-1">Your Booking ID</p>
            <p className="text-white font-mono text-sm">{bookingId}</p>
            <p className="text-gray-500 text-xs mt-2">
              Save this ID and share it when contacting support.
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="mt-2 px-6 py-2 rounded-lg bg-[#F59E0B] text-black font-semibold"
          >
            Go Home
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4 bg-[#0a0a0a] px-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h1 className="text-2xl font-bold text-red-500">
          {isNotFound ? "Booking Not Found" : "Something Went Wrong"}
        </h1>
        <p className="text-gray-400 text-center max-w-sm">
          {isNotFound
            ? "This booking may have expired or the link is invalid."
            : errMsg || "Unable to load your ticket. Please try again."}
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-6 py-2 rounded-lg bg-[#F59E0B] text-black font-semibold"
        >
          Go Home
        </button>
      </div>
    );
  }

  // ─── No ticket data ───────────────────────────────────────────────────────
  if (!ticket) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4 bg-[#0a0a0a] px-4">
        <AlertCircle className="w-16 h-16 text-gray-500" />
        <p className="text-gray-400">Ticket not found</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 rounded-lg bg-[#F59E0B] text-black font-semibold"
        >
          Go Home
        </button>
      </div>
    );
  }

  // ─── PAYMENT_PENDING (verify exhausted or still processing) ──────────────
  if (
    ticket.booking_status === "PAYMENT_PENDING" ||
    (verifyTimedOut &&
      ticket.booking_status !== "PAYMENT_FAILED" &&
      ticket.booking_status !== "PENDING_OWNER_CONFIRMATION" &&
      ticket.booking_status !== "TICKET_GENERATED")
  ) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
        <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-yellow-500/20 text-center max-w-md w-full space-y-5">
          <div className="w-20 h-20 mx-auto bg-yellow-500/10 rounded-full flex items-center justify-center">
            <Clock className="w-12 h-12 text-yellow-400" />
          </div>

          <h1 className="text-2xl font-bold text-yellow-400">
            Payment Pending
          </h1>

          <p className="text-gray-400">
            We're having trouble confirming your payment status from Paytm. If
            money was deducted, it will be reflected once the payment is
            confirmed.
          </p>

          <div className="bg-[#111] rounded-xl p-4 space-y-3 text-left">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Booking ID</span>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-mono">
                  {ticket.booking_id}
                </span>
                <button
                  onClick={copyBookingId}
                  className="text-gray-400 hover:text-[#F59E0B] transition"
                  title="Copy booking ID"
                >
                  {copiedId ? (
                    <Check size={14} className="text-green-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>
            {ticket.property_name && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Property</span>
                <span className="text-white text-sm">{ticket.property_name}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500">
            Save your Booking ID and contact us on WhatsApp if you don't receive
            a confirmation within 30 minutes.
          </p>

          <button
            onClick={handleRetry}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#F59E0B] text-black font-semibold hover:bg-[#D97706] transition"
          >
            <RefreshCw size={16} />
            Retry Verification
          </button>

          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition text-sm"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // ─── PAYMENT_FAILED / FRAUD_DETECTED ─────────────────────────────────────
  if (
    ticket.booking_status === "PAYMENT_FAILED" ||
    ticket.payment_status === "FRAUD_DETECTED"
  ) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
        <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-red-500/20 text-center max-w-md w-full space-y-5">
          <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-red-400">Payment Failed</h1>

          {ticket.payment_failure_reason && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              <p className="text-red-400 text-sm font-medium">
                {ticket.payment_failure_reason}
              </p>
            </div>
          )}

          <p className="text-gray-400">
            Your payment could not be processed. No amount has been charged.
          </p>

          <div className="bg-[#111] rounded-xl p-4 space-y-3 text-left">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Booking ID</span>
              <span className="text-white text-sm font-mono">
                {ticket.booking_id}
              </span>
            </div>
            {ticket.property_name && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Property</span>
                <span className="text-white text-sm">{ticket.property_name}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500">
            Please try booking again. If money was deducted, it will be refunded
            automatically within 5–7 business days.
          </p>

          <button
            onClick={() => navigate(returnUrl)}
            className="mt-2 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#F59E0B] text-black font-semibold hover:bg-[#D97706] transition"
          >
            <ArrowLeft size={18} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ─── PENDING_OWNER_CONFIRMATION / BOOKING_REQUEST_SENT_TO_OWNER ──────────
  if (
    ticket.booking_status === "PENDING_OWNER_CONFIRMATION" ||
    ticket.booking_status === "BOOKING_REQUEST_SENT_TO_OWNER"
  ) {
    const paymentDate = formatPaymentDate(
      ticket.updated_at || ticket.created_at || "",
    );

    return (
      <>
        {showBackConfirmPopup && (
          <BackConfirmPopup
            onCancel={() => setShowBackConfirmPopup(false)}
            onBack={() => {
              navGuardActive.current = false;
              navigate(returnUrl);
            }}
          />
        )}
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#F59E0B]/20 text-center max-w-md w-full space-y-5">
            <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>

            <h1 className="text-2xl font-bold text-[#F59E0B]">
              Payment Successful!
            </h1>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
              <p className="text-amber-300 text-sm font-semibold">
                🔒 Your ticket is being generated
              </p>
              <p className="text-amber-200/70 text-xs mt-1">
                Stay on this page to see your ticket as soon as it's ready
              </p>
            </div>

            <div className="bg-[#111] rounded-xl p-4 space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Booking ID</span>
                <span className="text-white text-sm font-mono">
                  {ticket.booking_id}
                </span>
              </div>

              {ticket.transaction_id && (
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Transaction ID</span>
                  <span className="text-white text-sm font-mono truncate max-w-[160px]">
                    {ticket.transaction_id}
                  </span>
                </div>
              )}

              {ticket.property_name && (
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Property</span>
                  <span className="text-white text-sm">{ticket.property_name}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Advance Paid</span>
                <span className="text-green-400 text-sm font-bold">
                  ₹{Number(ticket.advance_amount).toLocaleString("en-IN")}
                </span>
              </div>

              {paymentDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Payment Date</span>
                  <span className="text-white text-sm">{paymentDate}</span>
                </div>
              )}
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-left space-y-1">
              <p className="text-green-400 text-sm font-semibold flex items-center gap-2">
                <span>📱</span> WhatsApp Confirmation
              </p>
              <p className="text-gray-400 text-xs leading-relaxed">
                Your e-ticket will be sent to your{" "}
                <span className="text-green-400 font-semibold">WhatsApp</span>{" "}
                number once the property owner confirms your booking.
              </p>
            </div>

            <div className="flex items-center gap-2 justify-center">
              <Loader2 className="w-4 h-4 text-[#F59E0B] animate-spin" />
              <p className="text-gray-500 text-xs">
                Waiting for owner confirmation...
              </p>
            </div>

            <button
              onClick={() => setShowBackConfirmPopup(true)}
              className="mt-2 flex items-center justify-center gap-2 w-full py-2 rounded-lg font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors duration-200"
            >
              <ArrowLeft size={18} />
              Back
            </button>
          </div>
        </div>
      </>
    );
  }

  // ─── OWNER_CONFIRMED — ticket being generated ─────────────────────────────
  if (ticket.booking_status === "OWNER_CONFIRMED") {
    return (
      <>
        {showBackConfirmPopup && (
          <BackConfirmPopup
            onCancel={() => setShowBackConfirmPopup(false)}
            onBack={() => {
              navGuardActive.current = false;
              navigate(returnUrl);
            }}
          />
        )}
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#F59E0B]/20 text-center max-w-md w-full space-y-5">
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-[#F59E0B]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-[#F59E0B]">
              Owner Confirmed!
            </h1>

            <p className="text-gray-400">
              Your booking has been confirmed by the property owner. Your e-ticket
              is being generated now.
            </p>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
              <p className="text-amber-300 text-sm font-semibold">
                ⏳ Generating your e-ticket...
              </p>
              <p className="text-amber-200/70 text-xs mt-1">
                Stay on this page to receive your ticket instantly
              </p>
            </div>

            <div className="bg-[#111] rounded-xl p-4 space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Booking ID</span>
                <span className="text-white text-sm font-mono">
                  {ticket.booking_id}
                </span>
              </div>
              {ticket.property_name && (
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Property</span>
                  <span className="text-white text-sm">{ticket.property_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Advance Paid</span>
                <span className="text-green-400 text-sm font-bold">
                  ₹{Number(ticket.advance_amount).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowBackConfirmPopup(true)}
              className="mt-2 flex items-center justify-center gap-2 w-full py-2 rounded-lg font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors duration-200"
            >
              <ArrowLeft size={18} />
              Back
            </button>
          </div>
        </div>
      </>
    );
  }

  // ─── CANCELLED_BY_OWNER ───────────────────────────────────────────────────
  if (ticket.booking_status === "CANCELLED_BY_OWNER") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
        <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-red-500/20 text-center max-w-md w-full space-y-5">
          <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-red-400">Booking Cancelled</h1>

          <p className="text-gray-400">
            The property owner has cancelled your booking. Your advance will be
            refunded within 24 hours.
          </p>

          <div className="bg-[#111] rounded-xl p-4 space-y-3 text-left">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Booking ID</span>
              <span className="text-white text-sm font-mono">
                {ticket.booking_id}
              </span>
            </div>
            {ticket.property_name && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Property</span>
                <span className="text-white text-sm">{ticket.property_name}</span>
              </div>
            )}
            {ticket.advance_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Refund Amount</span>
                <span className="text-[#F59E0B] text-sm font-bold">
                  ₹{Number(ticket.advance_amount).toLocaleString("en-IN")}
                </span>
              </div>
            )}
            {ticket.refund_status && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Refund Status</span>
                <span
                  className={`text-sm font-medium ${
                    ticket.refund_status === "REFUND_SUCCESSFUL"
                      ? "text-green-400"
                      : ticket.refund_status === "REFUND_DENIED"
                        ? "text-red-400"
                        : "text-yellow-400"
                  }`}
                >
                  {ticket.refund_status === "REFUND_INITIATED"
                    ? "Processing"
                    : ticket.refund_status === "REFUND_SUCCESSFUL"
                      ? "Refunded ✓"
                      : ticket.refund_status === "REFUND_DENIED"
                        ? "Denied"
                        : ticket.refund_status}
                </span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500">
            Our team will process your refund shortly. For assistance, contact
            us on WhatsApp.
          </p>

          <button
            onClick={() => navigate(returnUrl)}
            className="mt-2 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#F59E0B] text-black font-semibold hover:bg-[#D97706] transition"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ─── TICKET_GENERATED → full ETicket ─────────────────────────────────────
  return (
    <ETicket
      bookingData={{
        propertyTitle: ticket.property_name,
        name: ticket.guest_name,
        mobile: ticket.guest_phone,
        persons: ticket.persons,
        checkIn: ticket.checkin_datetime,
        checkOut: ticket.checkout_datetime,
        checkInTime: ticket.check_in_time,
        checkOutTime: ticket.check_out_time,
        totalPrice: ticket.total_amount,
        advanceAmount: ticket.advance_amount,
        mapLink: ticket.map_link,
      }}
      paymentInfo={{
        orderId: ticket.booking_id,
        transactionId: ticket.transaction_id,
        status: ticket.payment_status,
        date: ticket.created_at
          ? new Date(ticket.created_at).toLocaleString("en-GB", {
              timeZone: "Asia/Kolkata",
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "",
      }}
    />
  );
};

export default TicketPage;
