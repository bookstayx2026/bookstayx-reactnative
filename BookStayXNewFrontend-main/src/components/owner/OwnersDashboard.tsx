import { useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Plus,
  Trash2,
} from "lucide-react";
import { OwnerBottomNav } from "@/components/owner/OwnerBottomNav";
import { OwnerHeader } from "@/components/owner/OwnerHeader";
import { IMG } from "@/lib/images";
import { cn } from "@/lib/utils";

const VILLAS = ["Aish Villa 1", "Aish Villa 2", "Lakeview Suite"] as const;

type DayStatus = "available" | "limited" | "booked" | "empty";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayStatus(date: Date): DayStatus {
  const today = startOfDay(new Date());
  const d = startOfDay(date);
  if (d < today) return "available";
  const n = d.getDate();
  if (n === 21) return "booked";
  if (n === 22 || n === 28) return "limited";
  return "available";
}

function statusClass(status: DayStatus) {
  switch (status) {
    case "booked":
      return "bg-gradient-to-b from-[#EF4444] to-[#B91C1C] text-white";
    case "limited":
      return "bg-gradient-to-b from-[#F59E0B] to-[#D97706] text-white";
    case "available":
      return "bg-gradient-to-b from-[#22C55E] to-[#15803D] text-white";
    default:
      return "bg-transparent";
  }
}

type SpecialRow = { id: string; date: string; price: string };

export function OwnersDashboard() {
  const [villa, setVilla] = useState<(typeof VILLAS)[number]>("Aish Villa 1");
  const [villaOpen, setVillaOpen] = useState(false);
  const [cursor, setCursor] = useState(() => new Date(2026, 7, 1)); // Aug 2026
  const [weekdayPrice, setWeekdayPrice] = useState("11000");
  const [weekendPrice, setWeekendPrice] = useState("15000");
  const [specials, setSpecials] = useState<SpecialRow[]>([
    { id: "1", date: "30/06/2026", price: "30000" },
  ]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = cursor.toLocaleString("en-IN", { month: "long", year: "numeric" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();

  const cells = useMemo(() => {
    const list: Array<{ day: number | null; date: Date | null; status: DayStatus; dow: string }> =
      [];
    for (let i = 0; i < startWeekday; i++) {
      list.push({ day: null, date: null, status: "empty", dow: "" });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      list.push({
        day: d,
        date,
        status: dayStatus(date),
        dow: date.toLocaleString("en-US", { weekday: "short" }).toUpperCase(),
      });
    }
    return list;
  }, [daysInMonth, month, startWeekday, year]);

  return (
    <div className="min-h-screen bg-[#07080A] pb-[110px]">
      <OwnerHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0">
          <img src={IMG.villa2} alt="" className="h-full w-full object-cover opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07080A] via-[#07080A]/88 to-[#07080A]/35" />
        </div>
        <div className="relative px-4 py-7">
          <h1 className="max-w-[15rem] font-display text-[30px] font-semibold leading-[1.12] text-white">
            Manage{" "}
            <span className="italic text-[#E0B84A]">Availability &amp;</span>
            <br />
            Prices
          </h1>
          <p className="mt-2.5 max-w-[18rem] text-[12.5px] leading-snug text-[#B0B6BF]">
            Update availability, set pricing and manage your villa calendars.
          </p>
        </div>
      </section>

      <div className="space-y-4 px-4 pt-4">
        {/* Select villa */}
        <div className="relative rounded-[16px] border border-[#E0B84A]/40 bg-[#10141B] px-3.5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#E0B84A]/40 bg-[#E0B84A]/10 text-[#E0B84A]">
              <Building2 className="h-[18px] w-[18px]" strokeWidth={1.7} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-white">Select Villa Unit</p>
            </div>
            <button
              type="button"
              onClick={() => setVillaOpen((v) => !v)}
              className="press inline-flex min-w-[132px] items-center justify-between gap-2 rounded-[10px] border border-[#E0B84A]/45 bg-[#0B0E11] px-3 py-2 text-[12.5px] font-semibold text-white"
            >
              <span className="truncate">{villa}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-[#E0B84A]" strokeWidth={2} />
            </button>
          </div>
          {villaOpen ? (
            <div className="absolute right-3.5 top-[calc(100%-6px)] z-20 w-[180px] overflow-hidden rounded-[12px] border border-[#E0B84A]/35 bg-[#12161C] shadow-xl">
              {VILLAS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setVilla(v);
                    setVillaOpen(false);
                  }}
                  className={cn(
                    "press block w-full px-3 py-2.5 text-left text-[12.5px]",
                    v === villa ? "bg-[#E0B84A]/15 text-[#E0B84A]" : "text-white",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Availability calendar */}
        <section className="rounded-[16px] border border-[#E0B84A]/35 bg-[#10141B] p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-[18px] w-[18px] text-[#E0B84A]" strokeWidth={1.7} />
              <h2 className="font-display text-[20px] font-semibold text-white">
                Availability Calendar
              </h2>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-x-2.5 gap-y-1 pt-1 text-[10px] text-[#C9CDD4]">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                Available
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                Limited
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
                Booked
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#E0B84A]" />
            <p className="text-[12px] font-medium text-[#E0B84A]">{villa}</p>
          </div>
          <h3 className="mt-1 font-display text-[22px] font-semibold uppercase tracking-[0.04em] text-[#E0B84A]">
            {villa}
          </h3>
          <div className="mt-1 h-px w-16 bg-[#E0B84A]/70" />

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              className="press grid h-8 w-8 place-items-center text-[#E0B84A]"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            <p className="text-[14px] font-semibold text-white">{monthLabel}</p>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              className="press grid h-8 w-8 place-items-center text-[#E0B84A]"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9AA1AB]">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <span key={d} className="py-1">
                {d}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1.5">
            {cells.map((cell, idx) => {
              if (cell.day == null) return <span key={`e-${idx}`} className="aspect-square" />;
              return (
                <button
                  key={cell.day}
                  type="button"
                  className={cn(
                    "press flex aspect-square flex-col items-center justify-center rounded-[10px] leading-none",
                    statusClass(cell.status),
                  )}
                >
                  <span className="text-[13px] font-bold">{cell.day}</span>
                  <span className="mt-0.5 text-[8px] font-medium opacity-90">{cell.dow}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Standard rates */}
        <section className="rounded-[16px] border border-[#E0B84A]/35 bg-[#10141B] p-3.5">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-[#E0B84A]/40 text-[#E0B84A]">
              <CalendarRange className="h-4 w-4" strokeWidth={1.7} />
            </span>
            <h2 className="font-display text-[20px] font-semibold text-white">Standard Rates</h2>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#E0B84A]" />
            <p className="text-[12px] font-medium text-[#E0B84A]">{villa}</p>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <RateSummary
              tone="blue"
              label="Weekday Price (Base)"
              value="₹ 11,000 /night"
            />
            <RateSummary tone="green" label="Weekend Price" value="₹ 15,000 /night" />
            <RateSummary tone="purple" label="Special Price" value="₹ 30,000 /night" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <label className="block">
              <span className="text-[11px] text-[#8B93A0]">Weekday Price (Base)</span>
              <span className="mt-1.5 flex items-center rounded-[10px] border border-[#E0B84A]/40 bg-[#0B0E11] px-3 py-2.5">
                <span className="mr-1 text-[13px] text-[#E0B84A]">₹</span>
                <input
                  value={weekdayPrice}
                  onChange={(e) => setWeekdayPrice(e.target.value.replace(/[^\d]/g, ""))}
                  className="w-full bg-transparent text-[13px] font-semibold text-white outline-none"
                  inputMode="numeric"
                />
              </span>
            </label>
            <label className="block">
              <span className="text-[11px] text-[#8B93A0]">Weekend Price</span>
              <span className="mt-1.5 flex items-center rounded-[10px] border border-[#E0B84A]/40 bg-[#0B0E11] px-3 py-2.5">
                <span className="mr-1 text-[13px] text-[#E0B84A]">₹</span>
                <input
                  value={weekendPrice}
                  onChange={(e) => setWeekendPrice(e.target.value.replace(/[^\d]/g, ""))}
                  className="w-full bg-transparent text-[13px] font-semibold text-white outline-none"
                  inputMode="numeric"
                />
              </span>
            </label>
          </div>

          <div className="mt-5 flex items-center justify-between gap-2">
            <h3 className="text-[14px] font-semibold text-white">Special Date Prices</h3>
            <button
              type="button"
              onClick={() =>
                setSpecials((rows) => [
                  ...rows,
                  {
                    id: String(Date.now()),
                    date: "01/09/2026",
                    price: "25000",
                  },
                ])
              }
              className="press inline-flex items-center gap-1 rounded-full border border-[#E0B84A]/55 px-3 py-1.5 text-[11.5px] font-semibold text-[#E0B84A]"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Add Date
            </button>
          </div>

          <div className="mt-3 space-y-2.5">
            {specials.map((row) => (
              <div key={row.id} className="flex items-end gap-2">
                <label className="min-w-0 flex-1">
                  <span className="text-[11px] text-[#8B93A0]">Date</span>
                  <span className="mt-1.5 flex items-center gap-2 rounded-[10px] border border-[#E0B84A]/40 bg-[#0B0E11] px-3 py-2.5">
                    <input
                      value={row.date}
                      onChange={(e) =>
                        setSpecials((rows) =>
                          rows.map((r) => (r.id === row.id ? { ...r, date: e.target.value } : r)),
                        )
                      }
                      className="min-w-0 flex-1 bg-transparent text-[12.5px] font-semibold text-white outline-none"
                    />
                    <CalendarDays className="h-4 w-4 shrink-0 text-[#E0B84A]" strokeWidth={1.7} />
                  </span>
                </label>
                <label className="min-w-0 flex-1">
                  <span className="text-[11px] text-[#8B93A0]">Price (per night)</span>
                  <span className="mt-1.5 flex items-center rounded-[10px] border border-[#E0B84A]/40 bg-[#0B0E11] px-3 py-2.5">
                    <span className="mr-1 text-[13px] text-[#E0B84A]">₹</span>
                    <input
                      value={row.price}
                      onChange={(e) =>
                        setSpecials((rows) =>
                          rows.map((r) =>
                            r.id === row.id
                              ? { ...r, price: e.target.value.replace(/[^\d]/g, "") }
                              : r,
                          ),
                        )
                      }
                      className="w-full bg-transparent text-[12.5px] font-semibold text-white outline-none"
                      inputMode="numeric"
                    />
                  </span>
                </label>
                <button
                  type="button"
                  aria-label="Remove special date"
                  onClick={() => setSpecials((rows) => rows.filter((r) => r.id !== row.id))}
                  className="press mb-[2px] grid h-11 w-11 shrink-0 place-items-center rounded-[10px] border border-[#EF4444]/40 text-[#F87171]"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="press gold-gradient mt-5 flex w-full items-center justify-center gap-2 rounded-[12px] py-3.5 text-[14px] font-semibold text-[#141007] shadow-[0_12px_28px_-12px_rgba(217,165,42,0.8)]"
          >
            <CalendarDays className="h-[16px] w-[16px]" strokeWidth={2} />
            Update Rates &amp; Sync Calendars
          </button>

          <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-snug text-[#8B93A0]">
            <Info className="mt-px h-[13px] w-[13px] shrink-0 text-[#E0B84A]" strokeWidth={1.8} />
            Calendar will be updated across all connected platforms.
          </p>
        </section>
      </div>

      <OwnerBottomNav active="calendar" />
    </div>
  );
}

function RateSummary({
  tone,
  label,
  value,
}: {
  tone: "blue" | "green" | "purple";
  label: string;
  value: string;
}) {
  const toneCls =
    tone === "blue"
      ? "border-[#3B82F6]/35 bg-[#1E3A5F]/35 text-[#93C5FD]"
      : tone === "green"
        ? "border-[#22C55E]/35 bg-[#14532D]/35 text-[#86EFAC]"
        : "border-[#A855F7]/35 bg-[#4C1D95]/35 text-[#D8B4FE]";

  return (
    <div className={cn("rounded-[12px] border px-2 py-2.5 backdrop-blur-md", toneCls)}>
      <p className="text-[9px] font-medium leading-tight text-white/80">{label}</p>
      <div className="mt-2 flex items-center gap-1.5">
        <CalendarDays className="h-3.5 w-3.5 opacity-90" strokeWidth={1.7} />
      </div>
      <p className="mt-1.5 text-[11px] font-bold leading-snug text-white">{value}</p>
    </div>
  );
}
