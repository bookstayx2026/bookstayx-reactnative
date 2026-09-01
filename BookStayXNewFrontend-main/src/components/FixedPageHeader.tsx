import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Fixed top chrome constrained to the app column (max-w 480px). Auto-reserves scroll space. */
export function FixedPageHeader({
  children,
  className,
  onHeightChange,
}: {
  children: ReactNode;
  className?: string;
  onHeightChange?: (height: number) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const [height, setHeight] = useState(72);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const next = el.offsetHeight;
      setHeight(next);
      onHeightChange?.(next);
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [onHeightChange]);

  return (
    <>
      <header
        ref={ref}
        className={cn(
          "fixed inset-x-0 top-0 z-40 mx-auto w-full max-w-[480px]",
          "border-b border-white/5 bg-[#0B0E11] backdrop-blur-md",
          className,
        )}
      >
        {children}
      </header>
      <div style={{ height }} aria-hidden className="shrink-0" />
    </>
  );
}
