import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Fingerprint,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";

function FormField({
  icon,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  icon: ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-white">
        <span className="text-[#E0B84A]">{icon}</span>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-[14px] border border-white/10 bg-[#0A0D12] px-4 text-[14px] text-white outline-none placeholder:text-[#6B7280] focus:border-[#E0B84A]/50"
      />
    </label>
  );
}

export function GenerateNewCodePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");

  return (
    <div className="min-h-screen bg-[#050709] px-4 pb-8 pt-[max(12px,env(safe-area-inset-top))]">
      {/* Page chrome (not AppTopNav) */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.history.back()}
          className="press grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/12 bg-[#151A22] text-white"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </button>
        <h1 className="font-display text-[24px] font-semibold text-white">Generate Code</h1>
      </div>

      <div className="mt-8 flex flex-col items-center text-center">
        <span className="grid h-[72px] w-[72px] place-items-center rounded-[20px] border border-[#E0B84A]/35 bg-[#1A150C] text-[#E0B84A] shadow-[0_0_24px_rgba(224,184,74,0.28)]">
          <Fingerprint className="h-9 w-9" strokeWidth={1.5} />
        </span>
        <h2 className="mt-5 font-display text-[26px] font-semibold leading-tight text-white">
          Create New Referral code
        </h2>
        <p className="mt-2 max-w-[17rem] text-[13px] leading-snug text-[#8B93A0]">
          Enter your details to generate a new unique referral code
        </p>
      </div>

      <section className="mt-7 rounded-[24px] border border-[#E0B84A]/25 bg-[#12100C] px-4 py-5 shadow-[0_0_28px_rgba(224,184,74,0.06)]">
        <div className="space-y-5">
          <FormField
            icon={<UserRound className="h-4 w-4" strokeWidth={1.8} />}
            label="Full Name"
            placeholder="Enter Your Full Name"
            value={fullName}
            onChange={setFullName}
          />
          <FormField
            icon={<Smartphone className="h-4 w-4" strokeWidth={1.8} />}
            label="Mobile Number"
            placeholder="Enter Mobile Number to get OTP"
            value={mobile}
            onChange={setMobile}
            type="tel"
          />
          <FormField
            icon={<ShieldCheck className="h-4 w-4" strokeWidth={1.8} />}
            label="Create Your Referral Code"
            placeholder="e.g. ABC123"
            value={code}
            onChange={(v) => setCode(v.toUpperCase())}
          />
        </div>

        <button
          type="button"
          className="press gold-gradient mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] text-[15px] font-bold text-[#141007] shadow-[0_12px_28px_-12px_rgba(217,165,42,0.8)]"
        >
          Send OTP
          <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </section>

      <p className="mx-auto mt-8 max-w-[18rem] text-center text-[11px] leading-relaxed text-[#7A828E]">
        By continuing, you agree to our referral program terms and conditions. Standard verification
        process applies.
      </p>
    </div>
  );
}
