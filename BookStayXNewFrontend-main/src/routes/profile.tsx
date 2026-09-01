import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, ChevronRight, UserRound } from "lucide-react";
import { AppTopNav } from "@/components/AppTopNav";
import { CustomerProfile } from "@/components/CustomerProfile";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — BookStayX" },
      {
        name: "description",
        content: "Sign in as a customer or vendor to manage your BookStayX account.",
      },
      { property: "og:title", content: "Profile — BookStayX" },
      {
        property: "og:description",
        content: "Choose how you want to log in — as a customer/user or as a vendor.",
      },
    ],
  }),
  component: ProfilePage,
});

type LoginRole = "customer" | "vendor";

const ROLE_KEY = "pawna-profile-role";

function readStoredRole(): LoginRole | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(ROLE_KEY);
  return value === "customer" || value === "vendor" ? value : null;
}

function ProfilePage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<LoginRole | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      const stored = readStoredRole();
      if (stored === "vendor") {
        void navigate({ to: "/owner" });
        return;
      }
      setRole(stored === "customer" ? "customer" : null);
      setReady(true);
    };

    sync();
    window.addEventListener("pawna-auth-change", sync);
    return () => window.removeEventListener("pawna-auth-change", sync);
  }, [navigate]);

  const loginAsCustomer = () => {
    sessionStorage.setItem(ROLE_KEY, "customer");
    setRole("customer");
  };

  const loginAsVendor = () => {
    sessionStorage.setItem(ROLE_KEY, "vendor");
    void navigate({ to: "/owner" });
  };

  const logout = () => {
    sessionStorage.removeItem(ROLE_KEY);
    setRole(null);
    window.dispatchEvent(new Event("pawna-auth-change"));
  };

  if (!ready) {
    return <div className="min-h-screen bg-[#0B0E11]" />;
  }

  if (role === "customer") {
    return <CustomerProfile onLogout={logout} />;
  }

  return (
    <div className="min-h-screen bg-[#0B0E11] pb-4">
      <AppTopNav />

      <div className="flex flex-col px-5 pt-10">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#E0B84A]">
          Welcome
        </p>
        <h1 className="mt-3 text-center text-[28px] font-bold leading-none tracking-[-0.02em] text-white">
          Login
        </h1>
        <p className="mx-auto mt-3 max-w-[280px] text-center text-[13px] leading-snug text-[#8B93A0]">
          Choose how you want to continue with BookStayX.
        </p>

        <div className="mt-10 flex flex-col gap-3.5">
          <RoleOption
            label="Login As Customer/User"
            description="Book stays, manage bookings and saved properties."
            Icon={UserRound}
            onClick={loginAsCustomer}
          />
          <RoleOption
            label="Login As Vendor"
            description="Manage your properties, listings and guest stays."
            Icon={Building2}
            onClick={loginAsVendor}
          />
        </div>
      </div>
    </div>
  );
}

function RoleOption({
  label,
  description,
  Icon,
  onClick,
}: {
  label: string;
  description: string;
  Icon: typeof UserRound;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press flex w-full items-center gap-3.5 rounded-[16px] border border-white/12 bg-[#12161C] px-4 py-4 text-left hover:border-white/20"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/12 bg-white/[0.04] text-[#C9CDD4]">
        <Icon className="h-5 w-5" strokeWidth={1.7} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-snug text-white">{label}</span>
        <span className="mt-1 block text-[11.5px] leading-snug text-[#8B93A0]">{description}</span>
      </span>

      <ChevronRight className="h-5 w-5 shrink-0 text-[#6B7280]" strokeWidth={1.8} />
    </button>
  );
}
