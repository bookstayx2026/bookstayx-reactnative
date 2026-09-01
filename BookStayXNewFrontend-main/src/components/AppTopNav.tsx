import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Heart, Menu } from "lucide-react";
import { AppSideMenu } from "@/components/AppSideMenu";
import { Logo } from "@/components/brand";
import { cn } from "@/lib/utils";

type AppTopNavProps = {
  /** Home only: transparent at scroll top, glass once scrolling. */
  scrollAware?: boolean;
  /** Overlay hero / full-bleed content — no layout spacer under the nav. */
  overlay?: boolean;
  onHeightChange?: (height: number) => void;
  className?: string;
};

/**
 * Shared top navbar: logo left, Saved / Notifications / Menu right.
 * Glass (iOS-style) by default; Home uses scrollAware for clear → frost.
 */
export function AppTopNav({
  scrollAware = false,
  overlay = false,
  onHeightChange,
  className,
}: AppTopNavProps) {
  const ref = useRef<HTMLElement>(null);
  const [height, setHeight] = useState(72);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const frosted = !scrollAware || scrolled;

  useEffect(() => {
    if (!scrollAware) return;

    const update = () => setScrolled(window.scrollY > 10);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [scrollAware]);

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
          "px-4 pb-2.5 pt-[max(10px,env(safe-area-inset-top))]",
          "transition-[background-color,border-color,backdrop-filter,-webkit-backdrop-filter,box-shadow] duration-300 ease-out",
          frosted
            ? "border-b border-white/10 bg-black/40 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-[20px] backdrop-saturate-150"
            : "border-b border-transparent bg-transparent shadow-none backdrop-blur-none",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 shrink-0">
            <Logo compact />
          </div>

          <div className="flex items-center gap-2">
            <NavIconLink to="/saved" label="Saved">
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </NavIconLink>

            <NavIconLink to="/notifications" label="Notifications" badge={3}>
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </NavIconLink>

            <NavIconButton label="Menu" onClick={() => setMenuOpen(true)}>
              <Menu className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </NavIconButton>
          </div>
        </div>
      </header>

      {!overlay ? <div style={{ height }} aria-hidden className="shrink-0" /> : null}

      <AppSideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

function navIconClassName() {
  return cn(
    "press relative grid h-10 w-10 shrink-0 place-items-center rounded-full",
    "border border-white/20 bg-black/25 text-white backdrop-blur-md",
    "hover:border-white/35 hover:bg-black/35",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E0B84A]",
  );
}

function NavIconLink({
  to,
  label,
  badge,
  children,
}: {
  to: "/saved" | "/notifications";
  label: string;
  badge?: number;
  children: ReactNode;
}) {
  return (
    <Link to={to} aria-label={label} className={navIconClassName()}>
      {children}
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-[#E0B84A] px-1 text-[9px] font-bold leading-none text-[#101215]">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function NavIconButton({
  label,
  badge,
  onClick,
  children,
}: {
  label: string;
  badge?: number;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className={navIconClassName()}>
      {children}
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-[#E0B84A] px-1 text-[9px] font-bold leading-none text-[#101215]">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
