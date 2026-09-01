import { useLayoutEffect, useRef, useState } from "react";
import { Share2, Store } from "lucide-react";
import { Logo } from "@/components/brand";

/** Fixed iOS-style glass header for owner pages. */
export function OwnerHeader() {
  const ref = useRef<HTMLElement>(null);
  const [height, setHeight] = useState(72);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <>
      <header
        ref={ref}
        className="fixed inset-x-0 top-0 z-40 mx-auto w-full max-w-[480px] border-b border-white/10 bg-black/40 px-3 pb-3 pt-[max(10px,env(safe-area-inset-top))] shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-[20px] backdrop-saturate-150"
      >
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <Logo compact />
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              className="press inline-flex h-9 items-center gap-1 rounded-full border border-[#E0B84A]/55 bg-black/20 px-2.5 text-[10px] font-semibold text-[#E0B84A]"
            >
              <Share2 className="h-3.5 w-3.5" strokeWidth={1.8} />
              Referral
            </button>
            <button
              type="button"
              className="press inline-flex h-9 items-center gap-1 rounded-full border border-[#E0B84A]/55 bg-black/20 px-2.5 text-[10px] font-semibold text-[#E0B84A]"
            >
              <Store className="h-3.5 w-3.5" strokeWidth={1.8} />
              B2B
            </button>
          </div>
        </div>
      </header>
      <div style={{ height }} aria-hidden className="shrink-0" />
    </>
  );
}
