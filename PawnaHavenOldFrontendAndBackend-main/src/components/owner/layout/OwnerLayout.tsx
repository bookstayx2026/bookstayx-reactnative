import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Calendar,
  IndianRupee,
  User,
  LayoutGrid,
  Info,
  ClipboardList,
  Share2,
  Phone,
  MessageCircle,
  X,
  Loader2,
  Users2,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PWAInstallButton from "../pwa/PWAInstallButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useOwnerTheme,
  OwnerThemeProvider,
} from "@/contexts/OwnerThemeContext";

const OwnerLayoutInner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useOwnerTheme();
  const isLight = theme === "light";

  const isLoggedIn = localStorage.getItem("ownerLoggedIn") === "true";
  const ownerDataString = localStorage.getItem("ownerData");
  const ownerData = ownerDataString
    ? JSON.parse(ownerDataString)
    : { propertyName: "My Property", propertyType: "Villa" };
  const ownerMobile =
    ownerData?.owner_otp_number ||
    ownerData?.ownerNumber ||
    ownerData?.mobileNumber ||
    ownerData?.mobile ||
    "";
  const ownerPropertyId = ownerData?.property_id || ownerData?.propertyId || "";

  const [showContactModal, setShowContactModal] = useState(false);
  const [referralLoading, setReferralLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/owner");
    }

    if (window.location.hostname.includes("pawnahavencamp.shop")) {
      const link = document.querySelector(
        'link[rel="manifest"]',
      ) as HTMLLinkElement;
      if (link) {
        link.href = "/manifest-owner.json";
      }
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    const token = localStorage.getItem("ownerToken");
    if (!token) return;

    const checkSession = async () => {
      try {
        const res = await fetch("/api/owners/verify-session", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.valid && data.code === "SESSION_INVALIDATED") {
          localStorage.removeItem("ownerToken");
          localStorage.removeItem("ownerRefreshToken");
          localStorage.removeItem("ownerData");
          localStorage.removeItem("ownerLoggedIn");
          toast.error("Your session has been updated. Please log in again.");
          navigate("/owner/login");
        }
      } catch {
        // Network error — ignore, don't log out
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 10000);
    return () => clearInterval(interval);
  }, [navigate]);

  if (!isLoggedIn) return null;

  const isVilla =
    (ownerData.property_type || "").toLowerCase() === "villa" ||
    (ownerData.property_category || "").toLowerCase() === "villa";
  const dashboardPath = isVilla
    ? "/owner/dashboard/villa"
    : "/owner/dashboard/camping";
  const profilePath = isVilla
    ? "/owner/profile/villa"
    : "/owner/profile/camping";

  const unitsPath = isVilla ? "/owner/units/villa" : "/owner/units";

  const navItems = [
    { label: "Calendar", icon: Calendar, path: dashboardPath },
    { label: "Bookings", icon: ClipboardList, path: "/owner/bookings" },
    { label: "Units", icon: LayoutGrid, path: unitsPath },
    { label: "Profile", icon: User, path: profilePath },
  ];

  const handleReferralClick = async () => {
    if (!ownerPropertyId) {
      setShowContactModal(true);
      return;
    }

    setReferralLoading(true);
    try {
      const res = await fetch(
        `/api/referrals/owner-lookup-property/${ownerPropertyId}`,
      );
      const result = await res.json();

      if (result.found && result.data?.referral_code) {
        const loginRes = await fetch("/api/referrals/owner-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId: ownerPropertyId }),
        });
        const loginData = await loginRes.json();
        if (loginData.success && loginData.token) {
          localStorage.setItem("referral_token", loginData.token);
          navigate("/referral/check?from=owner");
        } else {
          setShowContactModal(true);
        }
      } else {
        setShowContactModal(true);
      }
    } catch (e) {
      console.error("Referral lookup failed:", e);
      setShowContactModal(true);
    } finally {
      setReferralLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen pb-24 transition-colors duration-300",
        isLight ? "bg-[#F9F5F0]" : "bg-black",
      )}
    >
      <header
        className={cn(
          "border-b border-[#F59E0B]/20 px-3 py-3 sticky top-0 z-[60] shadow-2xl transition-colors duration-300",
          isLight ? "bg-white" : "bg-[#1A1A1A]",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0 flex-shrink">
            <h1 className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#F59E0B] leading-none mb-0.5">
              Owner Portal
            </h1>
            <span
              className={cn(
                "text-sm font-bold leading-tight truncate transition-colors duration-300",
                isLight ? "text-[#1A1A1A]" : "text-white",
              )}
            >
              {ownerData.propertyName}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Install App */}
            <div className="flex">
              <PWAInstallButton />
            </div>

            {/* Theme toggle */}
            {/* <button
              onClick={toggleTheme}
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300 border",
                isLight
                  ? "border-gray-300 text-gray-600 hover:bg-gray-100"
                  : "border-[#F59E0B]/30 text-[#F59E0B] hover:bg-[#F59E0B]/10",
              )}
              aria-label="Toggle theme"
            >
              {isLight ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button> */}

            {/* Referral */}
            <button
              onClick={handleReferralClick}
              disabled={referralLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black rounded-lg transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.25)] group disabled:opacity-70"
            >
              {referralLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Share2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              )}

              <span className="text-[11px] font-bold whitespace-nowrap">
                Referral
              </span>
            </button>

            {/* B2B */}
            <button
              onClick={() => navigate("/owner/b2b")}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black rounded-lg transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.25)] group"
            >
              <Users2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />

              <span className="text-[11px] font-bold whitespace-nowrap">
                B2B
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-6">
        <Outlet />
      </main>

      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 border-t border-[#F59E0B]/20 flex justify-around items-center h-20 px-4 z-50 transition-colors duration-300",
          isLight
            ? "bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
            : "bg-[#1A1A1A] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]",
        )}
      >
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === "/owner/dashboard" &&
              location.pathname === "/owner/dashboard");
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center space-y-1.5 w-full h-full transition-all duration-300",
                isActive
                  ? "text-[#F59E0B]"
                  : isLight
                    ? "text-gray-500 hover:text-[#F59E0B]"
                    : "text-white hover:text-[#F59E0B]",
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-xl transition-all",
                  isActive
                    ? "bg-[#F59E0B]/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                    : "",
                )}
              >
                <item.icon className="w-5 h-5" />
              </div>
              <span
                className={cn(
                  "text-xs font-bold tracking-wide transition-colors duration-300",
                  isActive
                    ? "text-[#F59E0B]"
                    : isLight
                      ? "text-gray-500"
                      : "text-white",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent
          className={cn(
            "border border-[#F59E0B]/20 rounded-3xl max-w-sm mx-auto transition-colors duration-300",
            isLight ? "bg-white" : "bg-[#1A1A1A]",
          )}
        >
          <DialogHeader>
            <DialogTitle
              className={cn(
                "text-center font-display text-lg transition-colors duration-300",
                isLight ? "text-[#1A1A1A]" : "text-white",
              )}
            >
              Referral Code Not Available
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-gray-400 text-center leading-relaxed">
              You don't have a referral code generated yet. Please contact admin
              to generate a referral code and earn more on bookings.
            </p>
            <div className="flex gap-3">
              <a
                href="tel:8806092609"
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm">Call Admin</span>
              </a>
              <a
                href="https://wa.me/918806092609"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">WhatsApp</span>
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const OwnerLayout = () => (
  <OwnerThemeProvider>
    <OwnerLayoutInner />
  </OwnerThemeProvider>
);

export default OwnerLayout;
