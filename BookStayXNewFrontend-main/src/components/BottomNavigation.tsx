import { Link } from "@tanstack/react-router";
import { CalendarDays, Heart, Home, Hotel, IndianRupee, MapPin, User } from "lucide-react";

type NavDef = {
  to: string;
  label: string;
  /** Shorter label for narrow phones (e.g. S22 ~360px) */
  shortLabel: string;
  Icon: typeof Home;
  exact: boolean;
};

const leftItems: NavDef[] = [
  { to: "/", label: "Home", shortLabel: "Home", Icon: Home, exact: true },
  { to: "/locations", label: "Locations", shortLabel: "Places", Icon: MapPin, exact: false },
  { to: "/properties", label: "Properties", shortLabel: "Stays", Icon: Hotel, exact: false },
];

const rightItems: NavDef[] = [
  { to: "/bookings", label: "Bookings", shortLabel: "Bookings", Icon: CalendarDays, exact: false },
  { to: "/saved", label: "Saved", shortLabel: "Saved", Icon: Heart, exact: false },
  { to: "/profile", label: "Profile", shortLabel: "Profile", Icon: User, exact: false },
];

function NavLabel({ label, shortLabel }: { label: string; shortLabel: string }) {
  if (label === shortLabel) {
    return (
      <span className="max-w-full truncate px-0.5 text-[8.5px] font-medium leading-none tracking-[0.01em] min-[390px]:text-[9px]">
        {label}
      </span>
    );
  }

  return (
    <>
      <span className="hidden max-w-full truncate px-0.5 text-[9px] font-medium leading-none tracking-[0.01em] min-[390px]:inline">
        {label}
      </span>
      <span className="max-w-full truncate px-0.5 text-[8.5px] font-medium leading-none tracking-[0.01em] min-[390px]:hidden">
        {shortLabel}
      </span>
    </>
  );
}

function NavItem({ to, label, shortLabel, Icon, exact }: NavDef) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      aria-label={label}
      className="press flex h-full min-w-0 flex-col items-center justify-end gap-[3px] text-ink-muted data-[status=active]:text-gold"
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.55} />
      <NavLabel label={label} shortLabel={shortLabel} />
    </Link>
  );
}

const FILL = "rgba(11, 14, 18, 0.94)";
const STROKE = "rgba(224, 184, 74, 0.42)";

/**
 * Screenshot-matched shell:
 * - Bar body ~56px tall, pill ends
 * - Center rise ~12–14px (~25% of body) with soft S-curve shoulders
 * - Fixed-width center SVG so the crest stays round at any screen width
 */
function NavShell() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div
        className="absolute bottom-0 left-0 top-[14px] rounded-l-[28px] border border-r-0"
        style={{
          right: "calc(50% + 48px)",
          background: FILL,
          borderColor: STROKE,
        }}
      />
      <div
        className="absolute bottom-0 right-0 top-[14px] rounded-r-[28px] border border-l-0"
        style={{
          left: "calc(50% + 48px)",
          background: FILL,
          borderColor: STROKE,
        }}
      />

      <svg
        className="absolute bottom-0 left-1/2 h-full w-[120px] -translate-x-1/2"
        viewBox="0 0 120 70"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="
            M 0 14
            L 12 14
            C 24 14 30 14 38 9
            C 46 4 52 2 60 2
            C 68 2 74 4 82 9
            C 90 14 96 14 108 14
            L 120 14
            L 120 70
            L 0 70
            Z
          "
          fill={FILL}
        />
        <path
          d="
            M 0 14
            L 12 14
            C 24 14 30 14 38 9
            C 46 4 52 2 60 2
            C 68 2 74 4 82 9
            C 90 14 96 14 108 14
            L 120 14
          "
          stroke={STROKE}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Completes the existing footer gold outline under the Referral crest only */}
        <path
          d="M 0 70 H 120"
          stroke={STROKE}
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

export function BottomNavigation() {
  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-2.5 pb-[max(10px,env(safe-area-inset-bottom))] min-[390px]:px-3"
    >
      <div className="pointer-events-auto relative w-full max-w-[480px] drop-shadow-[0_-8px_28px_rgba(0,0,0,0.5)]">
        <div className="relative h-[70px] w-full">
          <NavShell />

          <ul className="relative z-[1] grid h-full grid-cols-7 px-1 pb-[10px] pt-[14px] min-[390px]:px-1.5">
            {leftItems.map((item) => (
              <li key={item.to} className="min-w-0">
                <NavItem {...item} />
              </li>
            ))}

            <li className="relative min-w-0">
              <Link
                to="/referrals"
                aria-label="Referral"
                className="press absolute inset-x-0 bottom-0 flex min-w-0 flex-col items-center gap-[3px]"
              >
                <span
                  className="
                    -mt-[11px] grid h-[38px] w-[38px] place-items-center rounded-full
                    border-[1.5px] border-[#3DFF8A] bg-[#0a0d10] text-[#3DFF8A]
                    shadow-[0_0_10px_rgba(61,255,138,0.5),0_0_22px_rgba(61,255,138,0.28),inset_0_0_6px_rgba(61,255,138,0.12)]
                  "
                >
                  <IndianRupee className="h-[18px] w-[18px]" strokeWidth={2.2} />
                </span>
                <span className="max-w-full truncate px-0.5 text-[8.5px] font-semibold leading-none tracking-[0.01em] text-[#3DFF8A] drop-shadow-[0_0_6px_rgba(61,255,138,0.7)] min-[390px]:text-[9px]">
                  Referral
                </span>
              </Link>
            </li>

            {rightItems.map((item) => (
              <li key={item.to} className="min-w-0">
                <NavItem {...item} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
