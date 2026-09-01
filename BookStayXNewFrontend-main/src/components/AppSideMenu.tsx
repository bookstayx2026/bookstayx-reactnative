import { useEffect } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  Heart,
  Home,
  Hotel,
  IndianRupee,
  LogOut,
  MapPin,
  RefreshCcw,
  Scale,
  Shield,
  User,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { cn } from "@/lib/utils";

const ROLE_KEY = "pawna-profile-role";

const NAV_ITEMS = [
  { to: "/", label: "Home", Icon: Home, exact: true as const },
  { to: "/locations", label: "Locations", Icon: MapPin, exact: false as const },
  { to: "/properties", label: "Properties", Icon: Hotel, exact: false as const },
  { to: "/bookings", label: "Bookings", Icon: CalendarDays, exact: false as const },
  { to: "/saved", label: "Saved", Icon: Heart, exact: false as const },
  { to: "/referrals", label: "Referral", Icon: IndianRupee, exact: false as const },
  { to: "/profile", label: "Profile", Icon: User, exact: false as const },
] as const;

const POLICY_ITEMS = [
  { to: "/terms", label: "Terms & Privacy", Icon: Scale },
  { to: "/privacy", label: "Privacy Policy", Icon: Shield },
  { to: "/refund-policy", label: "Refund Policy", Icon: RefreshCcw },
] as const;

type AppSideMenuProps = {
  open: boolean;
  onClose: () => void;
};

/** Row sizing scales with sidebar height (cqh) so options fit any device. */
const rowClass =
  "press flex min-h-0 flex-1 items-center gap-[clamp(0.4rem,1.8cqh,0.7rem)] rounded-[clamp(8px,1.6cqh,12px)] px-[clamp(0.45rem,1.6cqh,0.7rem)] py-[clamp(0.2rem,0.9cqh,0.45rem)] text-[#C9CDD4] transition-colors hover:bg-white/[0.08] data-[status=active]:bg-[#E0B84A]/18 data-[status=active]:text-[#E0B84A]";

const iconWrapClass =
  "grid aspect-square h-[clamp(1.35rem,4.2cqh,1.85rem)] w-[clamp(1.35rem,4.2cqh,1.85rem)] shrink-0 place-items-center rounded-full border";

const iconClass = "h-[clamp(0.7rem,2.2cqh,0.9rem)] w-[clamp(0.7rem,2.2cqh,0.9rem)]";

const labelClass = "truncate text-[clamp(0.72rem,2.4cqh,0.875rem)] font-semibold leading-tight";

const sectionLabelClass =
  "shrink-0 px-2 pb-[clamp(0.15rem,0.6cqh,0.35rem)] pt-[clamp(0.1rem,0.4cqh,0.25rem)] text-[clamp(0.55rem,1.5cqh,0.65rem)] font-semibold uppercase tracking-[0.14em] text-[#8B93A0]";

export function AppSideMenu({ open, onClose }: AppSideMenuProps) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const logout = () => {
    sessionStorage.removeItem(ROLE_KEY);
    window.dispatchEvent(new Event("pawna-auth-change"));
    onClose();
    void router.navigate({ to: "/profile" });
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex justify-center",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <div className="relative h-full w-full max-w-[480px] overflow-hidden">
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className={cn(
            "absolute inset-0 bg-black/45 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            open ? "opacity-100" : "opacity-0",
          )}
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
          className={cn(
            "absolute right-0 top-0 flex w-[min(86%,300px)] max-w-full flex-col overflow-hidden",
            "bottom-[calc(78px+max(10px,env(safe-area-inset-bottom)))]",
            "rounded-bl-[22px] border-b border-l border-white/15",
            "bg-black/40 shadow-[-20px_0_50px_rgba(0,0,0,0.45)]",
            "backdrop-blur-[40px] backdrop-saturate-150",
            "supports-[backdrop-filter]:bg-black/35",
            "transform-gpu will-change-transform",
            "transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            "[container-type:size]",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.08] via-transparent to-black/20"
          />

          <div className="relative flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 pb-[clamp(0.35rem,1.2cqh,0.55rem)] pt-[max(10px,env(safe-area-inset-top))]">
            <div className="min-w-0">
              <Logo compact />
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="press grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md"
            >
              <X className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>

          <nav className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-[clamp(0.45rem,1.5cqh,0.7rem)] py-[clamp(0.35rem,1.2cqh,0.65rem)]">
            <p className={sectionLabelClass}>Explore</p>
            <ul className="flex min-h-0 flex-[1.4] flex-col gap-[clamp(0.1rem,0.45cqh,0.3rem)]">
              {NAV_ITEMS.map(({ to, label, Icon, exact }) => (
                <li key={to} className="flex min-h-0 flex-1">
                  <Link
                    to={to}
                    activeOptions={{ exact }}
                    onClick={onClose}
                    className={cn(rowClass, "w-full")}
                  >
                    <span
                      className={cn(
                        iconWrapClass,
                        "border-white/15 bg-white/[0.08]",
                      )}
                    >
                      <Icon className={iconClass} strokeWidth={1.7} />
                    </span>
                    <span className={labelClass}>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="my-[clamp(0.35rem,1.2cqh,0.65rem)] h-px shrink-0 bg-white/10" />

            <p className={sectionLabelClass}>Policies</p>
            <ul className="flex min-h-0 flex-1 flex-col gap-[clamp(0.1rem,0.45cqh,0.3rem)]">
              {POLICY_ITEMS.map(({ to, label, Icon }) => (
                <li key={to} className="flex min-h-0 flex-1">
                  <Link to={to} onClick={onClose} className={cn(rowClass, "w-full")}>
                    <span
                      className={cn(
                        iconWrapClass,
                        "border-[#E0B84A]/30 bg-[#E0B84A]/10 text-[#E0B84A]",
                      )}
                    >
                      <Icon className={iconClass} strokeWidth={1.7} />
                    </span>
                    <span className={labelClass}>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Flexible gap — grows on tall screens, shrinks on short ones */}
            <div className="min-h-[clamp(0.5rem,2.5cqh,1.25rem)] flex-[0.55]" aria-hidden />

            <div className="flex shrink-0 flex-col gap-[clamp(0.15rem,0.55cqh,0.35rem)]">
              <Link
                to="/notifications"
                onClick={onClose}
                className={cn(
                  rowClass,
                  "flex-none border border-white/12 bg-white/[0.06]",
                )}
              >
                <span
                  className={cn(iconWrapClass, "border-white/15 bg-white/[0.08]")}
                >
                  <Bell className={cn(iconClass, "text-[#E0B84A]")} strokeWidth={1.7} />
                </span>
                <span className={cn(labelClass, "text-white")}>Notifications</span>
              </Link>

              <button
                type="button"
                onClick={logout}
                className={cn(
                  rowClass,
                  "w-full flex-none border border-[#E11D48]/45 bg-[#E11D48]/10 text-left",
                )}
              >
                <span
                  className={cn(
                    iconWrapClass,
                    "border-[#E11D48]/40 bg-[#E11D48]/15 text-[#F87171]",
                  )}
                >
                  <LogOut className={iconClass} strokeWidth={1.7} />
                </span>
                <span className={cn(labelClass, "text-[#F87171]")}>Logout</span>
              </button>
            </div>
          </nav>
        </aside>
      </div>
    </div>
  );
}
