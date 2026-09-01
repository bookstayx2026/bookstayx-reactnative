import { Link } from "@tanstack/react-router";
import {
  Camera,
  ChevronRight,
  CircleHelp,
  LogOut,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { AppTopNav } from "@/components/AppTopNav";

const AVATAR_URL =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&h=240&fit=crop&crop=faces";

const PROFILE = {
  name: "Hrushikesh Patil",
  tags: "Adventure seeker • Nature lover • Explorer",
  email: "hrushikesh@email.com",
  phone: "+91 98765 43210",
};

export function CustomerProfile({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-[#0B0E11] pb-4">
      <AppTopNav />

      <div className="px-4 pt-4">
        <h1 className="text-[26px] font-bold leading-none tracking-[-0.02em] text-white">
          My Profile
        </h1>
        <p className="mt-2 text-[12.5px] leading-snug text-[#8B93A0]">
          Manage your account details and preferences
        </p>

        {/* Profile overview card */}
        <div className="mt-5 rounded-[18px] border border-white/[0.06] bg-[#14181F] p-4">
          <div className="flex items-start gap-3.5">
            <div className="relative shrink-0">
              <img
                src={AVATAR_URL}
                alt={PROFILE.name}
                className="h-[72px] w-[72px] rounded-full object-cover ring-2 ring-white/10"
              />
              <button
                type="button"
                aria-label="Change photo"
                className="press absolute -bottom-0.5 -right-0.5 grid h-7 w-7 place-items-center rounded-full bg-[#E0B84A] text-[#141007] shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
              >
                <Camera className="h-[13px] w-[13px]" strokeWidth={2} />
              </button>
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="text-[16px] font-bold leading-tight tracking-[-0.01em] text-white">
                {PROFILE.name}
              </h2>
              <p className="mt-1.5 text-[11px] leading-snug text-[#8B93A0]">{PROFILE.tags}</p>

              <div className="mt-2.5 space-y-1.5">
                <p className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-[#C9CDD4]">
                  <Mail className="h-[12px] w-[12px] shrink-0 text-[#E0B84A]" strokeWidth={1.8} />
                  <span className="truncate">{PROFILE.email}</span>
                </p>
                <p className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-[#C9CDD4]">
                  <Phone className="h-[12px] w-[12px] shrink-0 text-[#E0B84A]" strokeWidth={1.8} />
                  <span className="truncate">{PROFILE.phone}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <h3 className="text-[15px] font-semibold text-white">Personal Information</h3>
          <button
            type="button"
            className="press inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#E0B84A]"
          >
            <Pencil className="h-[13px] w-[13px]" strokeWidth={1.9} />
            Edit Profile
          </button>
        </div>

        <div className="mt-3 rounded-[18px] border border-white/[0.06] bg-[#14181F] px-3.5 py-4">
          <ProfileField icon={UserRound} label="Full Name" value={PROFILE.name} />
          <ProfileField
            icon={Mail}
            label="Email Address"
            value={PROFILE.email}
            className="mt-3.5"
          />
          <ProfileField
            icon={Phone}
            label="Mobile Number"
            value={PROFILE.phone}
            className="mt-3.5"
          />

          <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-snug text-[#34D399]">
            <ShieldCheck className="mt-px h-[13px] w-[13px] shrink-0" strokeWidth={1.9} />
            Your information is securely stored and never shared.
          </p>
        </div>

        {/* Menu links */}
        <div className="mt-4 space-y-2.5">
          <Link
            to="/referrals"
            className="press flex items-center gap-3 rounded-[16px] border border-white/[0.06] bg-[#14181F] px-3.5 py-3.5"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#1F6B45]/25 text-[#34D399]">
              <Users className="h-[18px] w-[18px]" strokeWidth={1.7} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-white">Referral Dashboard</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-[#8B93A0]">
                View your referral earnings, stats and withdraw
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-[#E0B84A]" strokeWidth={1.8} />
          </Link>

          <button
            type="button"
            className="press flex w-full items-center gap-3 rounded-[16px] border border-white/[0.06] bg-[#14181F] px-3.5 py-3.5 text-left"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#6B3FA0]/30 text-[#C4B5FD]">
              <CircleHelp className="h-[18px] w-[18px]" strokeWidth={1.7} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-white">Help & Support</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-[#8B93A0]">
                Get help, FAQ and support
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-[#E0B84A]" strokeWidth={1.8} />
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="press flex w-full items-center gap-3 rounded-[16px] border border-[#E11D48]/55 bg-[#14181F] px-3.5 py-3.5 text-left"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#E11D48]/15 text-[#F87171]">
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.7} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-[#F87171]">Logout</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-[#8B93A0]">
                Sign out from your account
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-[#6B7280]" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 ${className ?? ""}`}>
      <span className="mt-5 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#E0B84A]/40 bg-[#E0B84A]/[0.08] text-[#E0B84A]">
        <Icon className="h-[16px] w-[16px]" strokeWidth={1.7} />
      </span>
      <div className="min-w-0 flex-1">
        <label className="text-[11px] font-medium text-[#8B93A0]">
          {label} <span className="text-[#E11D48]">*</span>
        </label>
        <div className="mt-1.5 rounded-[10px] border border-white/12 bg-[#0B0E11] px-3 py-2.5 text-[13px] font-medium text-white">
          {value}
        </div>
      </div>
    </div>
  );
}
