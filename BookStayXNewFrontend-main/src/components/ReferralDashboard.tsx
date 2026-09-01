import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CircleAlert,
  Copy,
  Download,
  History,
  Info,
  Phone,
  Share2,
  UserRound,
  Wallet,
} from "lucide-react";
import { IMG } from "@/lib/images";
import { cn } from "@/lib/utils";

type DashTab = "payouts" | "history" | "stats" | "share";

const REFERRAL_CODE = "AISH777";
const REFERRAL_LINK = "https://bookstayx.com/r/AISH777";

const TABS: Array<{ id: DashTab; label: string; Icon: typeof Wallet }> = [
  { id: "payouts", label: "Payouts", Icon: Wallet },
  { id: "history", label: "History", Icon: History },
  { id: "stats", label: "Stats", Icon: CircleAlert },
  { id: "share", label: "Share", Icon: Share2 },
];

function WalletArt() {
  return (
    <div className="relative h-[120px] w-[110px] shrink-0">
      <div className="absolute inset-0 rounded-full bg-[#E0B84A]/20 blur-2xl" />
      <span className="absolute left-3 top-1 grid h-9 w-9 place-items-center rounded-full border border-[#E0B84A]/70 bg-gradient-to-b from-[#F0D078] to-[#B8862A] text-[13px] font-bold text-[#3A2A08] shadow-[0_0_14px_rgba(224,184,74,0.55)]">
        ₹
      </span>
      <span className="absolute right-2 top-5 grid h-8 w-8 place-items-center rounded-full border border-[#E0B84A]/60 bg-gradient-to-b from-[#E8C45C] to-[#9A7020] text-[12px] font-bold text-[#3A2A08] shadow-[0_0_12px_rgba(224,184,74,0.45)]">
        ₹
      </span>
      <div className="absolute bottom-1 left-1 right-1 h-[64px] overflow-hidden rounded-[14px] border border-[#E0B84A]/40 bg-gradient-to-br from-[#3A2E1C] via-[#1C1610] to-[#0E0C09] shadow-[0_10px_24px_rgba(0,0,0,0.45)]">
        <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-[#E0B84A]/25 to-transparent" />
        <div className="absolute right-2 top-1/2 h-7 w-9 -translate-y-1/2 rounded-[8px] border border-[#E0B84A]/35 bg-[#E0B84A]/15" />
        <div className="absolute bottom-2 left-2 right-2 h-px bg-[#E0B84A]/25" />
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-[#C9CDD4]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 h-10 w-full rounded-[12px] border border-white/12 bg-[#0A0D12] px-3 text-[13px] text-white outline-none placeholder:text-[#6B7280] focus:border-[#E0B84A]/50"
      />
    </label>
  );
}

function StatCard({
  label,
  value,
  valueClassName,
  sub,
}: {
  label: string;
  value: string;
  valueClassName: string;
  sub?: string;
}) {
  return (
    <div className="flex min-h-[108px] flex-col items-center justify-center rounded-[20px] border border-white/[0.06] bg-[#12100C] px-3 py-5 text-center">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#A89E94]">
        {label}
      </p>
      <p className={cn("mt-2.5 text-[28px] font-bold leading-none tabular-nums", valueClassName)}>
        {value}
      </p>
      {sub ? <p className="mt-1.5 text-[11px] text-[#8B93A0]">{sub}</p> : null}
    </div>
  );
}

function StatsPanel() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      <StatCard label="Total Earned" value="₹ 0" valueClassName="text-[#E0B84A]" />
      <StatCard label="Total Referrals" value="0" valueClassName="text-[#E0B84A]" />
      <StatCard label="Total Payout" value="₹ 0" valueClassName="text-[#E56B5F]" />
      <StatCard
        label="In-Process"
        value="₹ 0"
        valueClassName="text-[#E0B84A]"
        sub="0 bookings"
      />
    </div>
  );
}

function SharePanel() {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  const qrSrc = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(REFERRAL_LINK)}`,
    [],
  );

  const copyText = async (text: string, kind: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      /* ignore */
    }
  };

  const downloadQr = () => {
    const a = document.createElement("a");
    a.href = qrSrc;
    a.download = `referral-${REFERRAL_CODE}.png`;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.click();
  };

  const shareWhatsApp = () => {
    const msg = `Join BookStayX with my referral code ${REFERRAL_CODE}: ${REFERRAL_LINK}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mt-4 space-y-3">
      <section className="rounded-[22px] border border-white/[0.06] bg-[#12100C] px-4 py-4">
        <p className="text-center text-[12px] font-medium text-[#C9A24A]">Your QR Code</p>
        <div className="mx-auto mt-3 grid h-[200px] w-[200px] place-items-center rounded-[16px] bg-white p-3">
          <img src={qrSrc} alt="Referral QR code" className="h-full w-full object-contain" />
        </div>
        <button
          type="button"
          onClick={downloadQr}
          className="press mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-white/10 bg-[#0A0D12] text-[13px] font-semibold text-white"
        >
          <Download className="h-4 w-4" strokeWidth={1.8} />
          Download QR
        </button>
      </section>

      <section className="rounded-[22px] border border-white/[0.06] bg-[#12100C] px-4 py-3.5">
        <p className="text-[12px] font-medium text-[#C9A24A]">Referral Link</p>
        <div className="mt-2.5 flex items-center gap-2">
          <div className="min-w-0 flex-1 truncate rounded-[12px] border border-white/10 bg-[#0A0D12] px-3 py-2.5 text-[12px] text-[#C9CDD4]">
            {REFERRAL_LINK}
          </div>
          <button
            type="button"
            aria-label="Copy referral link"
            onClick={() => copyText(REFERRAL_LINK, "link")}
            className="press grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-white/10 bg-[#0A0D12] text-white"
          >
            <Copy className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
        {copied === "link" ? (
          <p className="mt-1.5 text-[11px] text-[#3DFF8A]">Link copied</p>
        ) : null}
      </section>

      <section className="rounded-[22px] border border-white/[0.06] bg-[#12100C] px-4 py-3.5">
        <p className="text-[12px] font-medium text-[#C9A24A]">Referral Code</p>
        <div className="mt-2.5 flex items-center gap-2 rounded-[14px] border border-white/10 bg-[#0A0D12] px-3.5 py-3">
          <p className="min-w-0 flex-1 font-display text-[26px] font-semibold tracking-[0.04em] text-[#E0B84A]">
            {REFERRAL_CODE}
          </p>
          <button
            type="button"
            aria-label="Copy referral code"
            onClick={() => copyText(REFERRAL_CODE, "code")}
            className="press grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-white"
          >
            <Copy className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
        {copied === "code" ? (
          <p className="mt-1.5 text-[11px] text-[#3DFF8A]">Code copied</p>
        ) : null}
      </section>

      <button
        type="button"
        onClick={shareWhatsApp}
        className="press mt-1 flex h-[52px] w-full items-center justify-center gap-2.5 rounded-[16px] bg-[#00D95A] text-[15px] font-bold text-white shadow-[0_10px_28px_-10px_rgba(0,217,90,0.55)]"
      >
        <Share2 className="h-[18px] w-[18px]" strokeWidth={2} />
        Share on WhatsApp
      </button>
    </div>
  );
}

export function ReferralDashboard() {
  const [tab, setTab] = useState<DashTab>("payouts");
  const [mobile, setMobile] = useState("");
  const [mobile2, setMobile2] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [amount, setAmount] = useState("");

  return (
    <div className="relative min-h-screen bg-[#050709] pb-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[220px] overflow-hidden">
        <img src={IMG.villa2} alt="" className="h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050709]/40 via-[#050709]/85 to-[#050709]" />
      </div>

      <div className="relative px-4 pt-[max(14px,env(safe-area-inset-top))]">
        <h1 className="font-display text-[30px] font-semibold leading-none tracking-[-0.01em]">
          <span className="text-white">Check </span>
          <span className="text-[#E0B84A]">Earning</span>
        </h1>
        <p className="mt-2 text-[13px] text-[#9AA1AB]">
          Track your referral earnings and manage payouts.
        </p>

        <section className="relative mt-5 overflow-hidden rounded-[22px] border border-[#E0B84A]/35 bg-[#0C1016]/95 shadow-[0_0_28px_rgba(224,184,74,0.08)]">
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#E0B84A]/80 to-transparent" />
          <div className="flex gap-2 px-4 pb-4 pt-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-[#E0B84A] bg-[#141007] text-[#E0B84A] shadow-[0_0_16px_rgba(224,184,74,0.35)]">
                  <UserRound className="h-6 w-6" strokeWidth={1.6} />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[12px] text-[#C9CDD4]">Welcome back</p>
                  <p className="mt-0.5 truncate text-[16px] font-bold text-white">
                    Aish More{" "}
                    <span className="font-semibold text-[#E8ECF2]">(AISH777)</span>
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-[#E0B84A]/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[#E0B84A]">
                  <span className="text-[11px]">♛</span>
                  Owner Referral
                </span>
                <span className="hidden h-3 w-px bg-[#E0B84A]/35 sm:block" />
                <span className="text-[11px] text-[#C9A24A]">25% of advance</span>
              </div>

              <div className="mt-4">
                <p className="text-[12.5px] text-white">Referral Earnings</p>
                <p className="mt-1 font-display text-[34px] font-semibold leading-none text-[#E0B84A]">
                  ₹ 0
                </p>
              </div>
            </div>
            <WalletArt />
          </div>
        </section>

        <div className="mt-4 overflow-hidden rounded-[16px] border border-white/10 bg-[#0B0E12]">
          <div className="grid grid-cols-4">
            {TABS.map(({ id, label, Icon }, i) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "press relative flex flex-col items-center justify-center gap-1 py-2.5",
                    active ? "gold-gradient text-[#141007]" : "text-[#9AA1AB]",
                    !active && i > 0 && "border-l border-white/10",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.7} />
                  <span className="text-[10.5px] font-semibold">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {tab === "payouts" ? (
          <>
            <section className="mt-4 rounded-[22px] border border-white/[0.08] bg-[#0C1016] px-3.5 py-4">
              <div className="flex items-start gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#E0B84A]/45 bg-[#E0B84A]/10 text-[#E0B84A] shadow-[0_0_12px_rgba(224,184,74,0.25)]">
                  <Phone className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold text-white">Saved Mobile Numbers</h2>
                  <p className="mt-0.5 text-[11.5px] text-[#8B93A0]">
                    Add a mobile number to start receiving payouts.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <div className="min-w-0 flex-1 space-y-3">
                  <Field
                    label="Enter Mobile Number"
                    placeholder="e.g. 9876543210"
                    value={mobile}
                    onChange={setMobile}
                    type="tel"
                  />
                  <Field
                    label="Re-Enter Mobile Number"
                    placeholder="e.g. 9876543210"
                    value={mobile2}
                    onChange={setMobile2}
                    type="tel"
                  />
                  <Field
                    label="Beneficiary Name"
                    placeholder="e.g. Aish More"
                    value={beneficiary}
                    onChange={setBeneficiary}
                  />
                </div>

                <aside className="w-[118px] shrink-0 rounded-[14px] border border-[#E0B84A]/45 bg-[#141007]/60 px-2.5 py-3">
                  <p className="text-[11px] font-bold text-[#E0B84A]">Important</p>
                  <p className="mt-2 text-[9.5px] leading-relaxed text-[#C9A24A]">
                    Ensure this mobile number is linked to your bank account / UPI. You are
                    responsible for incorrect details.
                  </p>
                </aside>
              </div>

              <div className="mt-3.5 flex items-start gap-2 rounded-[12px] border border-[#E0B84A]/35 bg-[#E0B84A]/08 px-3 py-2.5">
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#E0B84A]"
                  strokeWidth={1.8}
                />
                <p className="text-[11px] leading-snug text-[#E0B84A]">
                  Double-check the Beneficiary Name matches your bank / UPI profile before
                  confirming.
                </p>
              </div>

              <label className="mt-3.5 flex cursor-pointer items-center gap-2.5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={confirmed}
                  onClick={() => setConfirmed((v) => !v)}
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-[5px] border",
                    confirmed
                      ? "border-[#E0B84A] bg-[#E0B84A] text-[#141007]"
                      : "border-[#E0B84A]/55 bg-transparent",
                  )}
                >
                  {confirmed ? <CheckMark /> : null}
                </button>
                <span className="text-[12px] text-[#C9CDD4]">
                  I confirm the beneficiary name is correct
                </span>
              </label>
            </section>

            <section className="mt-4 rounded-[22px] border border-white/[0.08] bg-[#0C1016] px-3.5 py-4">
              <div className="flex items-start gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#E0B84A]/45 bg-[#E0B84A]/10 text-[#E0B84A]">
                  <Wallet className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold text-white">
                    Payout Amount{" "}
                    <span className="font-medium text-[#C9CDD4]">(Min ₹500)</span>
                  </h2>
                  <p className="mt-0.5 text-[11.5px] text-[#8B93A0]">
                    Add a mobile number above to request a payout.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-stretch gap-2.5">
                <input
                  type="number"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="h-12 min-w-0 flex-1 rounded-[12px] border border-white/12 bg-[#0A0D12] px-3 text-[14px] text-white outline-none placeholder:text-[#6B7280] focus:border-[#E0B84A]/50"
                />
                <button
                  type="button"
                  className="press gold-gradient inline-flex h-12 shrink-0 items-center gap-1.5 rounded-[12px] px-3.5 text-[13px] font-bold text-[#141007] shadow-[0_10px_24px_-10px_rgba(217,165,42,0.75)]"
                >
                  Payout Amount
                  <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                </button>
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-[#60A5FA]">
                <Info className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                Minimum ₹500 balance required for Payout!
              </p>
            </section>
          </>
        ) : tab === "stats" ? (
          <StatsPanel />
        ) : tab === "share" ? (
          <SharePanel />
        ) : (
          <section className="mt-4 rounded-[22px] border border-white/[0.08] bg-[#0C1016] px-4 py-10 text-center">
            <p className="font-display text-[20px] font-semibold text-[#E0B84A]">History</p>
            <p className="mt-2 text-[13px] text-[#8B93A0]">This section will appear here next.</p>
          </section>
        )}
      </div>
    </div>
  );
}

function CheckMark() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
      <path
        d="M2.5 6.2 4.8 8.5 9.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
