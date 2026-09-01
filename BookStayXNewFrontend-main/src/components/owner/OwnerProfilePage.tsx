import { Link, useRouter } from "@tanstack/react-router";
import { LogOut, UserRound } from "lucide-react";
import { OwnerBottomNav } from "@/components/owner/OwnerBottomNav";
import { OwnerHeader } from "@/components/owner/OwnerHeader";

export function OwnerProfileContent() {
  const router = useRouter();

  const logout = () => {
    sessionStorage.removeItem("pawna-profile-role");
    router.navigate({ to: "/profile" });
  };

  return (
    <div className="px-4 pb-4 pt-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[32px] font-semibold leading-none text-[#E0B84A]">
          Profile
        </h1>
        <button
          type="button"
          onClick={logout}
          className="press inline-flex h-10 items-center gap-1.5 rounded-[12px] bg-[#DC2626] px-3.5 text-[13px] font-bold text-white"
        >
          <LogOut className="h-4 w-4" strokeWidth={2.2} />
          Logout
        </button>
      </div>

      <div className="mt-5 rounded-[16px] border border-[#E0B84A]/45 bg-[#12161C] px-4 py-4">
        <div className="flex items-center gap-3.5">
          <span className="relative grid h-14 w-14 shrink-0 place-items-center">
            <span className="absolute inset-0 rounded-full bg-[#E0B84A]/25 blur-[10px]" />
            <span className="relative grid h-14 w-14 place-items-center rounded-full border-2 border-[#E0B84A] bg-[#0B0E11] text-[#E0B84A]">
              <UserRound className="h-7 w-7" strokeWidth={1.6} />
            </span>
          </span>
          <div className="min-w-0">
            <p className="truncate text-[18px] font-bold text-[#E0B84A]">Aish More Villa</p>
            <p className="mt-1 truncate text-[13px] text-[#C9CDD4]">
              Aish More <span className="text-[#8B93A0]">•</span> 4444444444
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[16px] border border-[#E0B84A]/35 bg-[#12161C] px-4 py-4">
        <p className="text-[13.5px] leading-relaxed text-[#C9CDD4]">
          Amenities, Activities, Highlights, Schedule, Policies, and Description are now managed
          at the unit level. Go to the{" "}
          <Link to="/owner/units" className="font-semibold text-[#E0B84A]">
            Units
          </Link>{" "}
          tab to edit these details for each villa unit.
        </p>
      </div>
    </div>
  );
}

export function OwnerProfilePageView() {
  return (
    <div className="min-h-screen bg-[#07080A] pb-[110px]">
      <OwnerHeader />
      <OwnerProfileContent />
      <OwnerBottomNav active="profile" />
    </div>
  );
}
