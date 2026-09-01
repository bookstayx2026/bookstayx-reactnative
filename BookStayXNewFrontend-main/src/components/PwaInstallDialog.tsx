import { Share, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PwaInstallDialogProps = {
  open: boolean;
  isIos: boolean;
  canNativeInstall: boolean;
  onInstall: () => void;
  onCancel: () => void;
};

export function PwaInstallDialog({
  open,
  isIos,
  canNativeInstall,
  onInstall,
  onCancel,
}: PwaInstallDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close install dialog backdrop"
        className="absolute inset-0 bg-black/55 backdrop-blur-[6px]"
        onClick={onCancel}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
        className={cn(
          "relative w-full max-w-[360px] overflow-hidden rounded-[28px]",
          "border border-white/20 bg-white/[0.12] shadow-[0_24px_80px_rgba(0,0,0,0.45)]",
          "backdrop-blur-[28px] backdrop-saturate-[180%]",
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.14] via-white/[0.04] to-transparent pointer-events-none" />

        <div className="relative px-6 pb-6 pt-5">
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            className="press absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-black/20 text-white/80"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>

          <div className="mx-auto mt-1 h-[72px] w-[72px] overflow-hidden rounded-[18px] border border-white/20 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
            <img src="/icons/pwa-icon.jpg" alt="BookStayX app icon" className="h-full w-full object-cover" />
          </div>

          <h2
            id="pwa-install-title"
            className="mt-4 text-center font-display text-[22px] font-semibold leading-tight text-ink"
          >
            Install BookStayX
          </h2>

          <p className="mt-2 text-center text-[13px] leading-[1.55] text-ink-soft">
            {isIos
              ? "Add BookStayX to your Home Screen for a fast, app-like experience."
              : "Install the app for quicker access, offline-ready browsing, and a full-screen stay experience."}
          </p>

          {isIos ? (
            <div className="mt-4 rounded-[18px] border border-white/15 bg-black/25 px-4 py-3.5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-gold">On iPhone</p>
              <ol className="mt-2.5 space-y-2.5 text-[13px] leading-[1.5] text-ink-soft">
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold/15 text-[11px] font-bold text-gold">
                    1
                  </span>
                  <span>
                    Tap the <Share className="mx-0.5 inline h-4 w-4 -translate-y-px text-gold" strokeWidth={2} />{" "}
                    Share button in Safari
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold/15 text-[11px] font-bold text-gold">
                    2
                  </span>
                  <span>Scroll down and tap “Add to Home Screen”</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold/15 text-[11px] font-bold text-gold">
                    3
                  </span>
                  <span>Tap “Add” in the top-right corner</span>
                </li>
              </ol>
            </div>
          ) : !canNativeInstall ? (
            <div className="mt-4 rounded-[18px] border border-white/15 bg-black/25 px-4 py-3.5 text-[13px] leading-[1.5] text-ink-soft">
              Open <span className="font-semibold text-gold">https://www.bookstayx.shop</span> in Chrome on your
              Android phone, then tap Install App again to add BookStayX to your home screen.
            </div>
          ) : null}

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="press flex-1 rounded-[14px] border border-white/20 bg-white/[0.08] py-3 text-[14px] font-semibold text-ink backdrop-blur-md"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onInstall}
              className="press gold-gradient flex-1 rounded-[14px] py-3 text-[14px] font-semibold text-[#141007] shadow-[0_10px_28px_-12px_rgba(217,165,42,0.8)]"
            >
              {isIos ? "Got it" : canNativeInstall ? "Install" : "Install"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
