import { FilePenLine, Plus, UserRound } from "lucide-react";
import { OwnerBottomNav } from "@/components/owner/OwnerBottomNav";
import { OwnerHeader } from "@/components/owner/OwnerHeader";
import { IMG } from "@/lib/images";
import { cn } from "@/lib/utils";

type UnitRow = {
  id: string;
  name: string;
  image: string;
  capacity: number;
  status: "booked" | "available";
  weekdayPrice: number;
};

const UNITS: UnitRow[] = [
  {
    id: "1",
    name: "Aish Villa 1",
    image: IMG.villa1,
    capacity: 10,
    status: "booked",
    weekdayPrice: 11000,
  },
  {
    id: "2",
    name: "Aish Villa 2",
    image: IMG.villa2,
    capacity: 10,
    status: "available",
    weekdayPrice: 10000,
  },
];

function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function OwnerUnitsContent() {
  return (
    <div className="px-4 pb-4 pt-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[26px] font-semibold leading-tight text-[#E0B84A]">
          Manage Villa Units
        </h1>
        <button
          type="button"
          className="press gold-gradient inline-flex h-10 shrink-0 items-center gap-1 rounded-[12px] px-3.5 text-[13px] font-bold text-[#141007]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          Add Unit
        </button>
      </div>

      <ul className="mt-4 space-y-4">
        {UNITS.map((unit) => (
          <li
            key={unit.id}
            className="rounded-[16px] border border-white/[0.1] bg-[#12161C] p-3.5"
          >
            <div className="flex items-start gap-3">
              <img
                src={unit.image}
                alt=""
                className="h-[52px] w-[52px] shrink-0 rounded-[10px] object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-semibold text-white">{unit.name}</p>
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#1A2740] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-[#7EB6FF]">
                      <UserRound className="h-3 w-3" strokeWidth={2} />
                      Max Capacity: {unit.capacity}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em]",
                      unit.status === "booked"
                        ? "bg-[#7F1D1D]/70 text-[#FCA5A5]"
                        : "bg-[#14532D]/70 text-[#86EFAC]",
                    )}
                  >
                    {unit.status === "booked" ? "Booked" : "Available"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-between rounded-[12px] border border-white/[0.06] bg-[#0B0E11] px-3.5 py-3">
              <p className="text-[20px] font-bold tabular-nums text-[#E0B84A]">
                {formatInr(unit.weekdayPrice)}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B93A0]">
                Weekday
              </p>
            </div>

            <button
              type="button"
              className="press gold-gradient mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[12px] text-[14px] font-bold text-[#141007]"
            >
              <FilePenLine className="h-[18px] w-[18px]" strokeWidth={2} />
              Edit Unit
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OwnerUnitsPage() {
  return (
    <div className="min-h-screen bg-[#07080A] pb-[110px]">
      <OwnerHeader />
      <OwnerUnitsContent />
      <OwnerBottomNav active="units" />
    </div>
  );
}
