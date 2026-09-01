import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Crown,
  Gift,
  Trophy,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Period = "month" | "all";

type Earner = {
  id: string;
  name: string;
  monthAmount: number;
  allAmount: number;
  avatar: string;
};

const EARNERS: Earner[] = [
  {
    id: "sujay-1",
    name: "Sujay",
    monthAmount: 8420,
    allAmount: 26840,
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces",
  },
  {
    id: "anjali",
    name: "Anjali",
    monthAmount: 12150,
    allAmount: 18420,
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces",
  },
  {
    id: "rahul",
    name: "Rahul",
    monthAmount: 9650,
    allAmount: 12650,
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces",
  },
];

function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function rankStyles(rank: number) {
  switch (rank) {
    case 1:
      return {
        badge: "border-[#E0B84A] text-[#E0B84A] shadow-[0_0_12px_rgba(224,184,74,0.35)]",
        ring: "ring-[#E0B84A] shadow-[0_0_14px_rgba(224,184,74,0.45)]",
      };
    case 2:
      return {
        badge: "border-[#C0C6D0] text-[#E8ECF2] shadow-[0_0_10px_rgba(192,198,208,0.25)]",
        ring: "ring-[#C0C6D0]/70 shadow-[0_0_10px_rgba(192,198,208,0.3)]",
      };
    default:
      return {
        badge: "border-[#C9854A] text-[#E8A86A] shadow-[0_0_10px_rgba(201,133,74,0.3)]",
        ring: "ring-[#C9854A]/80 shadow-[0_0_10px_rgba(201,133,74,0.3)]",
      };
  }
}

function ActionCard({
  tone,
  title,
  subtitle,
  icon,
  onClick,
}: {
  tone: "green" | "gold";
  title: string;
  subtitle: string;
  icon: ReactNode;
  onClick?: () => void;
}) {
  const isGreen = tone === "green";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "press relative flex flex-1 items-start gap-2.5 overflow-hidden rounded-[16px] border px-2.5 py-2.5 text-left",
        isGreen
          ? "border-[#3DFF8A]/45 bg-[#0C1210] shadow-[0_0_16px_rgba(61,255,138,0.1)]"
          : "border-[#E0B84A]/45 bg-[#12100A] shadow-[0_0_16px_rgba(224,184,74,0.1)]",
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full",
          isGreen
            ? "bg-[#3DFF8A]/12 text-[#3DFF8A] shadow-[0_0_12px_rgba(61,255,138,0.35)]"
            : "bg-[#E0B84A]/12 text-[#E0B84A] shadow-[0_0_12px_rgba(224,184,74,0.35)]",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1 pr-5">
        <p className="text-[12.5px] font-bold leading-tight text-white">{title}</p>
        <p className="mt-0.5 text-[10px] leading-snug text-[#8B93A0]">{subtitle}</p>
      </div>
      <span
        className={cn(
          "absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full border",
          isGreen
            ? "border-[#3DFF8A]/35 text-[#3DFF8A]/90"
            : "border-[#E0B84A]/40 text-[#E0B84A]/90",
        )}
      >
        <ChevronRight className="h-3 w-3" strokeWidth={2.2} />
      </span>
    </button>
  );
}

/** Gold referral-chain mark for the Invite card. */
function ReferralChainIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Links */}
      <path
        d="M22 24c4-5 10-7 16-5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M26 40c5 4 12 5 18 1"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Person nodes */}
      <circle cx="16" cy="20" r="7" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="20" r="2.8" fill="currentColor" />
      <path
        d="M10.5 28.5c1.6-2.2 3.4-3.2 5.5-3.2s3.9 1 5.5 3.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="48" cy="18" r="7" stroke="currentColor" strokeWidth="2" />
      <circle cx="48" cy="18" r="2.8" fill="currentColor" />
      <path
        d="M42.5 26.5c1.6-2.2 3.4-3.2 5.5-3.2s3.9 1 5.5 3.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="46" r="7" stroke="currentColor" strokeWidth="2" />
      <circle cx="32" cy="46" r="2.8" fill="currentColor" />
      <path
        d="M26.5 54.5c1.6-2.2 3.4-3.2 5.5-3.2s3.9 1 5.5 3.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ReferralMainListing() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("all");

  const ranked = useMemo(() => {
    const sorted = [...EARNERS]
      .map((e) => ({
        ...e,
        amount: period === "month" ? e.monthAmount : e.allAmount,
      }))
      .sort((a, b) => b.amount - a.amount);

    return sorted.map((e, i) => ({ ...e, rank: i + 1 }));
  }, [period]);

  return (
    <div className="min-h-screen bg-[#050709] px-4 pb-6 pt-[max(12px,env(safe-area-inset-top))]">
      <div className="relative flex items-center justify-center py-1">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.history.back()}
          className="press absolute left-0 grid h-11 w-11 place-items-center rounded-[14px] border border-[#E0B84A]/40 bg-[#10141B] text-white shadow-[0_0_14px_rgba(224,184,74,0.12)]"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </button>
        <h1 className="font-display text-[26px] font-semibold tracking-[-0.01em]">
          <span className="text-white">Referral </span>
          <span className="text-[#E0B84A]">Earning</span>
        </h1>
      </div>

      <div className="mt-4 flex gap-2.5">
        <ActionCard
          tone="green"
          title="Check Earning"
          subtitle="Check your referral earnings & history"
          icon={<Check className="h-4 w-4" strokeWidth={2.4} />}
          onClick={() => router.navigate({ to: "/referrals/dashboard" })}
        />
        <ActionCard
          tone="gold"
          title="Generate New Code"
          subtitle="Generate a new referral code to invite"
          icon={<Zap className="h-4 w-4" strokeWidth={2} />}
          onClick={() => router.navigate({ to: "/referrals/generate" })}
        />
      </div>

      <section className="mt-5 rounded-[24px] border border-white/[0.07] bg-[#0C1016] px-3.5 pb-3.5 pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-[18px] w-[18px] text-[#E0B84A]" strokeWidth={1.7} />
            <h2 className="font-display text-[20px] font-semibold text-white">Top Earners</h2>
          </div>
          <div className="inline-flex rounded-full border border-white/10 bg-[#080A0E] p-0.5">
            <button
              type="button"
              onClick={() => setPeriod("month")}
              className={cn(
                "press rounded-full px-3 py-1.5 text-[11px] font-semibold",
                period === "month"
                  ? "border border-[#E0B84A] text-[#E0B84A]"
                  : "border border-transparent text-[#8B93A0]",
              )}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setPeriod("all")}
              className={cn(
                "press rounded-full px-3 py-1.5 text-[11px] font-semibold",
                period === "all"
                  ? "border border-[#E0B84A] text-[#E0B84A]"
                  : "border border-transparent text-[#8B93A0]",
              )}
            >
              All Time
            </button>
          </div>
        </div>

        <ul className="mt-3.5 space-y-2.5">
          {ranked.map((e) => {
            const styles = rankStyles(e.rank);
            return (
              <li
                key={e.id}
                className="flex items-center gap-2.5 rounded-[16px] border border-white/[0.06] bg-[#10151D] px-2.5 py-2.5"
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border bg-[#0B0E12] text-[12px] font-bold",
                    styles.badge,
                  )}
                >
                  #{e.rank}
                </span>

                <div className="relative shrink-0">
                  {e.rank === 1 ? (
                    <Crown
                      className="absolute -top-2.5 left-1/2 z-[1] h-3.5 w-3.5 -translate-x-1/2 fill-[#E0B84A] text-[#E0B84A]"
                      strokeWidth={1.5}
                    />
                  ) : null}
                  <img
                    src={e.avatar}
                    alt=""
                    className={cn("h-11 w-11 rounded-full object-cover ring-2", styles.ring)}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-white">{e.name}</p>
                  <p className="mt-0.5 text-[11px] text-[#8B93A0]">Successful Partner</p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[15px] font-bold tabular-nums text-[#E0B84A]">
                    {formatInr(e.amount)}
                  </p>
                  <span className="mt-1 inline-flex rounded-full bg-[#14532D]/70 px-2 py-[2px] text-[9px] font-bold uppercase tracking-[0.08em] text-[#86EFAC]">
                    Earned
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="relative mt-5 overflow-hidden rounded-[24px] border border-[#E0B84A]/35 bg-[#12100A]">
        <div className="pointer-events-none absolute -bottom-10 -right-6 h-40 w-40 rounded-full bg-[#E0B84A]/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(224,184,74,0.18) 0, transparent 42%), radial-gradient(circle at 80% 70%, rgba(224,184,74,0.12) 0, transparent 40%)",
          }}
        />

        <div className="relative flex items-center gap-3 px-4 py-4">
          <div className="min-w-0 flex-1 py-0.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E0B84A]/45 bg-[#E0B84A]/10 px-2.5 py-1 text-[11px] font-semibold text-[#E0B84A]">
              <Gift className="h-3.5 w-3.5" strokeWidth={1.8} />
              Invite &amp; Earn
            </span>
            <h3 className="mt-3 font-display text-[22px] font-semibold leading-[1.15] text-white">
              Invite Friends &amp;{" "}
              <span className="text-[#E0B84A]">Earn Rewards</span>
            </h3>
            <p className="mt-2 max-w-[13.5rem] text-[12px] leading-snug text-[#A8AFB8]">
              Get rewarded for every booking made using your referral code.
            </p>
            <button
              type="button"
              className="press gold-gradient mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold text-[#141007] shadow-[0_10px_24px_-10px_rgba(217,165,42,0.75)]"
            >
              Start Inviting
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>

          <div className="relative grid h-[96px] w-[96px] shrink-0 place-items-center">
            <span className="absolute inset-0 rounded-full bg-[#E0B84A]/20 blur-xl" />
            <span className="relative grid h-[84px] w-[84px] place-items-center rounded-full border border-[#E0B84A]/55 bg-[#1A150C] text-[#E0B84A] shadow-[0_0_22px_rgba(224,184,74,0.35)]">
              <ReferralChainIcon className="h-12 w-12" />
            </span>
          </div>
        </div>
      </section>

      <div className="h-2" />
    </div>
  );
}
