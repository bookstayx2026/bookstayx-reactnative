import { useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";

export default function PaymentProcessing() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const initiated = useRef(false);

  const bookingId: string | undefined =
    state?.bookingId || localStorage.getItem("pending_booking_id") || undefined;
  const returnPath: string =
    state?.returnPath || localStorage.getItem("booking_return_url") || "/";

  useEffect(() => {
    if (!bookingId) {
      navigate("/", { replace: true });
      return;
    }

    if (initiated.current) return;
    initiated.current = true;

    async function initPayment() {
      try {
        const res = await fetch("/api/payments/paytm/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ booking_id: bookingId }),
        });

        const data = await res.json();

        if (data.already_paid) {
          navigate(`/ticket?booking_id=${bookingId}`, { replace: true });
          return;
        }

        if (!res.ok) {
          throw new Error(
            data.details || data.error || "Payment initiation failed",
          );
        }

        if (!data.redirect_url) {
          throw new Error("No redirect URL received from payment gateway");
        }

        window.location.href = data.redirect_url;
      } catch (err: any) {
        setError(
          err.message ||
            "Could not connect to the payment gateway. Please try again.",
        );
      }
    }

    initPayment();
  }, [bookingId, navigate]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-50 px-6">
      <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>
      {!error ? (
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <span
              className="text-3xl font-bold tracking-wider"
              style={{ fontFamily: "Georgia, serif", color: "#F59E0B" }}
            >
              PawnaHavenCamp
            </span>
            <span className="text-xs tracking-[0.3em] uppercase text-gray-500">
              Luxury Stays · Pawna Lake
            </span>
          </div>

          <div
            className="w-16 h-16 rounded-full border-4 border-[#F59E0B]/20 border-t-[#F59E0B]"
            style={{ animation: "spin 1s linear infinite" }}
          />

          <div className="flex flex-col items-center gap-2">
            <p className="text-white text-lg font-medium">
              Redirecting to secure payment gateway...
            </p>
            <p className="text-gray-500 text-sm">
              Please do not close or refresh this page
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <span className="text-red-400 text-3xl">✕</span>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-white text-lg font-semibold">
              Payment initialization failed
            </p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
          <button
            onClick={() => navigate(returnPath)}
            className="px-6 py-3 rounded-xl font-bold text-black text-sm"
            style={{ background: "#F59E0B" }}
          >
            Go Back & Try Again
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
