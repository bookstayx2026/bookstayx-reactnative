import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Share, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createPortal } from "react-dom";

interface PWAInstallButtonProps {
  variant?: "floating" | "menu" | "hero" | "compact";
  className?: string;
}

export function PWAInstallButton({
  variant = "floating",
  className,
}: PWAInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const isDesktop = !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const checkInstalled = useCallback(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;
    setIsInstalled(isStandalone);
  }, []);

  useEffect(() => {
    if (showIOSModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showIOSModal]);

  useEffect(() => {
    checkInstalled();

    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const appInstalledHandler = () => {
      setIsInstalled(true);
      setIsInstalling(false);
      setDeferredPrompt(null);
      toast.success("App installed successfully!");
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", appInstalledHandler);

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const displayChangeHandler = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
      if (!e.matches) {
        setDeferredPrompt(null);
      }
    };
    mediaQuery.addEventListener("change", displayChangeHandler);

    const visibilityHandler = () => {
      if (!document.hidden) {
        checkInstalled();
      }
    };
    document.addEventListener("visibilitychange", visibilityHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", appInstalledHandler);
      mediaQuery.removeEventListener("change", displayChangeHandler);
      document.removeEventListener("visibilitychange", visibilityHandler);
    };
  }, [checkInstalled]);

  const handleInstallClick = async () => {
    if (isInstalled) {
      if (isDesktop) {
        toast.success("App is already installed");
      }
      return;
    }

    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) {
      if (isDesktop) {
        toast.success("App is already installed");
      } else {
        toast.info("To install: Add to Home Screen from browser options.", {
          duration: 6000,
        });
      }
      return;
    }

    try {
      setIsInstalling(true);
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
      setIsInstalling(false);
    } catch (error) {
      console.error("PWA install error:", error);
      setIsInstalling(false);
    }
  };

  if (isInstalled && isDesktop) return null;

  return (
    <>
      <Button
        onClick={handleInstallClick}
        disabled={isInstalling}
        className={cn(
          variant === "hero"
            ? "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F59E0B] hover:bg-[#D97706] hover:scale-105 active:scale-95 transition-all duration-300 group shadow-gold h-auto mb-4 border-2 border-white/20 sm:px-6 sm:py-3"
            : variant === "menu"
              ? "w-full justify-start gap-3 h-12 px-4 rounded-xl font-bold text-black bg-[#F59E0B] hover:bg-[#d97706] transition-all shadow-[0_6px_20px_rgba(245,158,11,0.4)]"
              : variant === "compact"
                ? "flex items-center gap-1.5 px-3 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black rounded-lg transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.25)] group"
                : "fixed bottom-6 right-6 z-[9999] rounded-full shadow-[0_0_30px_rgba(245,158,11,0.5)] bg-[#F59E0B] hover:bg-[#D97706] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center gap-2 px-6 py-8 border-2 border-white/40 animate-pulse",
          className,
        )}
      >
        {isInstalling ? (
          <Loader2
            className={cn(
              "animate-spin",
              variant === "hero"
                ? "w-3.5 h-3.5 sm:w-5 sm:h-5 text-white"
                : variant === "compact"
                  ? "w-3.5 h-3.5"
                  : "w-6 h-6 text-primary",
            )}
          />
        ) : (
          <Download
            className={cn(
              "w-6 h-6",
              variant === "menu"
                ? "text-black"
                : variant === "hero"
                  ? "text-black"
                  : variant === "compact"
                    ? ""
                    : "text-primary",
              variant !== "compact" &&
                "animate-bounce group-hover:animate-none",
            )}
          />
        )}
        <span
          className={cn(
            "font-bold uppercase tracking-wider",
            variant === "hero"
              ? "text-xs sm:text-base text-black"
              : variant === "compact"
                ? "text-[11px] font-bold whitespace-nowrap"
                : "text-lg text-black",
          )}
        >
          {isInstalling ? "Installing..." : "Install App"}
        </span>
      </Button>

      {showIOSModal &&
        createPortal(
          <div className="fixed inset-0 z-[999999] bg-black/90 flex items-center justify-center p-4">
            <div className="bg-[#1A1A1A] border border-[#F59E0B]/30 rounded-2xl w-full max-w-md p-6 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[#F59E0B]">
                  Install App
                </h3>

                <button
                  onClick={() => setShowIOSModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="flex gap-3">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] font-bold">
                    1
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">
                      Tap Share
                    </p>
                    <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                      Look for the <Share className="w-3 h-3 text-[#F59E0B]" />{" "}
                      icon in Safari
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] font-bold">
                    2
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">
                      Tap "Add to Home Screen"
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Scroll and select the option
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] font-bold">
                    3
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">
                      Tap "Add" Button
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      The app will appear on your home screen
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-black font-bold"
              >
                Got It
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
