import { Link, useRouterState } from "@tanstack/react-router";
import { Building2, CalendarCheck2, CalendarDays, Home, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", Icon: Home, match: "home" as const },
  { to: "/owner", label: "Calendar", Icon: CalendarDays, match: "calendar" as const },
  { to: "/owner/bookings", label: "Bookings", Icon: CalendarCheck2, match: "bookings" as const },
  { to: "/owner/units", label: "Units", Icon: Building2, match: "units" as const },
  { to: "/owner/profile", label: "Profile", Icon: UserRound, match: "profile" as const },
];

export type OwnerNavTab = "home" | "calendar" | "bookings" | "units" | "profile";

export function OwnerBottomNav({ active = "calendar" }: { active?: OwnerNavTab }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Owner"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-2.5 pb-[max(10px,env(safe-area-inset-bottom))]"
    >
      <div className="pointer-events-auto w-full max-w-[480px] rounded-[22px] border border-[#E0B84A]/25 bg-[#0b0e12]/92 px-1 py-2 shadow-[0_-10px_40px_rgba(224,184,74,0.12)] backdrop-blur-xl">
        <ul className="grid grid-cols-5">
          {items.map(({ to, label, Icon, match }) => {
            const pathActive =
              (match === "calendar" && (pathname === "/owner" || pathname === "/owner/")) ||
              (match === "bookings" && pathname.startsWith("/owner/bookings")) ||
              (match === "units" && pathname.startsWith("/owner/units")) ||
              (match === "profile" && pathname.startsWith("/owner/profile"));
            const isActive = active === match || pathActive;
            return (
              <li key={`${match}-${label}`}>
                <Link
                  to={to}
                  className={cn(
                    "press mx-auto flex min-h-[52px] w-full max-w-[76px] flex-col items-center justify-center gap-1 rounded-[14px] py-1.5",
                    isActive
                      ? "border border-[#E0B84A] text-[#E0B84A]"
                      : "border border-transparent text-[#9AA1AB]",
                  )}
                >
                  <Icon className="h-[17px] w-[17px]" strokeWidth={1.7} />
                  <span className="text-[9.5px] font-medium tracking-[0.01em]">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
