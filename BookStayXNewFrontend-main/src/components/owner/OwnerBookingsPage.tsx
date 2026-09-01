import { useMemo, useState } from "react";
import { ChevronDown, FileSpreadsheet, FileText } from "lucide-react";
import { OwnerBottomNav } from "@/components/owner/OwnerBottomNav";
import { OwnerHeader } from "@/components/owner/OwnerHeader";
import { cn } from "@/lib/utils";

const YEARS = ["2026", "2025", "2024"] as const;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;
const UNITS = ["All Units", "Aish Villa 1", "Aish Villa 2"] as const;

type Booking = {
  id: number;
  guest: string;
  unit: string;
  channel: string;
  amount: number;
  range: string;
};

const BOOKINGS: Booking[] = [
  {
    id: 1,
    guest: "rgf",
    unit: "Aish Villa 1",
    channel: "ONLINE",
    amount: 23424,
    range: "21 Aug - 22 Aug",
  },
];

function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function FilterSelect({
  value,
  options,
  onChange,
  className,
}: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("relative min-w-0", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="press flex h-10 w-full items-center justify-between gap-1.5 rounded-[12px] border border-[#E0B84A]/30 bg-[#14181F] px-3 text-[13px] font-semibold text-[#E0B84A]"
      >
        <span className="truncate">{value}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2.2} />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-[12px] border border-[#E0B84A]/35 bg-[#12161C] shadow-xl">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={cn(
                "press block w-full px-3 py-2.5 text-left text-[12.5px]",
                opt === value ? "bg-[#E0B84A]/15 text-[#E0B84A]" : "text-white",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function OwnerBookingsContent() {
  const [year, setYear] = useState<(typeof YEARS)[number]>("2026");
  const [month, setMonth] = useState<(typeof MONTHS)[number]>("Aug");
  const [unit, setUnit] = useState<(typeof UNITS)[number]>("All Units");

  const rows = useMemo(() => {
    if (unit === "All Units") return BOOKINGS;
    return BOOKINGS.filter((b) => b.unit === unit);
  }, [unit]);

  const total = useMemo(() => rows.reduce((sum, b) => sum + b.amount, 0), [rows]);

  return (
    <div className="px-4 pb-4 pt-3">
      {/* Filters */}
      <div className="grid grid-cols-3 gap-2.5">
        <FilterSelect value={year} options={YEARS} onChange={(v) => setYear(v as (typeof YEARS)[number])} />
        <FilterSelect
          value={month}
          options={MONTHS}
          onChange={(v) => setMonth(v as (typeof MONTHS)[number])}
        />
        <FilterSelect
          value={unit}
          options={UNITS}
          onChange={(v) => setUnit(v as (typeof UNITS)[number])}
        />
      </div>

      {/* Ledger header */}
      <div className="mt-5 flex items-end justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B93A0]">
          Bookings Ledger
        </p>
        <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[#C9CDD4]">
          Total: <span className="text-[#E0B84A]">{formatInr(total)}</span>
        </p>
      </div>

      {/* Booking cards */}
      <ul className="mt-3 space-y-3">
        {rows.map((b) => (
          <li
            key={b.id}
            className="rounded-[16px] border border-white/[0.08] bg-[#12161C] px-3 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] border border-[#E0B84A]/35 bg-[#E0B84A]/12 text-[13px] font-bold text-[#E0B84A]">
                #{b.id}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-white">{b.guest}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-[11.5px] text-[#8B93A0]">{b.unit}</span>
                  <span className="rounded-full bg-[#2A303A] px-2 py-[2px] text-[9px] font-semibold uppercase tracking-[0.06em] text-[#D5D9E0]">
                    {b.channel}
                  </span>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-[16px] font-bold tabular-nums text-[#E0B84A]">
                  {formatInr(b.amount)}
                </p>
                <p className="mt-1 text-[11px] text-[#8B93A0]">{b.range}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Export actions */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          className="press flex h-[52px] items-center justify-center gap-2 rounded-[14px] border border-[#22C55E]/55 bg-[#10141B] text-[13px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_0_18px_rgba(34,197,94,0.12)]"
        >
          <FileSpreadsheet className="h-5 w-5 text-[#22C55E]" strokeWidth={1.8} />
          Excel
        </button>
        <button
          type="button"
          className="press flex h-[52px] items-center justify-center gap-2 rounded-[14px] border border-[#EF4444]/55 bg-[#10141B] text-[13px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_0_18px_rgba(239,68,68,0.12)]"
        >
          <FileText className="h-5 w-5 text-[#EF4444]" strokeWidth={1.8} />
          Pdf
        </button>
      </div>
    </div>
  );
}

export function OwnerBookingsPage() {
  return (
    <div className="min-h-screen bg-[#07080A] pb-[110px]">
      <OwnerHeader />
      <OwnerBookingsContent />
      <OwnerBottomNav active="bookings" />
    </div>
  );
}
