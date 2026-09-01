import {
  ArrowRight,
  Building2,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  Headphones,
  Hotel,
  List,
  MapPin,
  Tent,
  Ticket,
  Users,
} from "lucide-react";
import type { Booking, BookingCategory } from "@/data/bookings";
import { cn } from "@/lib/utils";

function formatINR(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function categoryIcon(category: BookingCategory) {
  if (category === "Villa") return Building2;
  if (category === "Hotel Room") return Hotel;
  return Tent;
}

export function BookingCard({ booking }: { booking: Booking }) {
  const due = Math.max(0, booking.totalAmount - booking.advancedPaid);
  const CategoryIcon = categoryIcon(booking.category);
  const isLive = booking.tab === "live";
  const isCancelled = booking.status === "cancelled";

  return (
    <article className="overflow-hidden rounded-[14px] border border-white/[0.08] bg-[#12171E]">
      {/* Top: image + details */}
      <div className="flex gap-3 p-3">
        <div className="relative h-[104px] w-[92px] shrink-0 overflow-hidden rounded-[10px]">
          <img
            src={booking.image}
            alt={booking.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <span
            className={cn(
              "absolute left-1.5 top-1.5 rounded-[5px] px-1.5 py-[2px] text-[8.5px] font-semibold leading-none",
              booking.status === "confirmed" && "bg-[#1B7A3D] text-white",
              booking.status === "completed" && "bg-[#1E4B8A] text-white",
              booking.status === "cancelled" && "bg-[#8A2E2E] text-white",
            )}
          >
            {booking.status === "confirmed"
              ? "Confirmed"
              : booking.status === "completed"
                ? "Completed"
                : "Cancelled"}
          </span>
          <span className="absolute bottom-1.5 left-1.5 flex max-w-[calc(100%-12px)] items-center gap-1 rounded-[5px] bg-black/65 px-1.5 py-[3px] text-[8px] font-medium text-white backdrop-blur-[2px]">
            <CategoryIcon className="h-[9px] w-[9px] shrink-0" strokeWidth={2} />
            <span className="truncate">{booking.category}</span>
          </span>
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 text-[13.5px] font-semibold leading-snug text-white">
              {booking.name}
            </h3>
            <button
              type="button"
              className="press flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-[#E0B84A]"
            >
              #{booking.bookingCode}
              <ChevronRight className="h-3 w-3" strokeWidth={2.2} />
            </button>
          </div>

          <ul className="mt-2 space-y-1.5">
            <li className="flex items-center gap-1.5 text-[10.5px] leading-none text-[#8B93A0]">
              <MapPin className="h-[11px] w-[11px] shrink-0" strokeWidth={1.9} />
              <span className="truncate">{booking.location}</span>
            </li>
            <li className="flex items-center gap-1.5 text-[10.5px] leading-none text-[#8B93A0]">
              <CalendarDays className="h-[11px] w-[11px] shrink-0" strokeWidth={1.9} />
              <span className="truncate">
                {booking.dateRange} ({booking.nights} Night{booking.nights > 1 ? "s" : ""})
              </span>
            </li>
            <li className="flex items-center gap-1.5 text-[10.5px] leading-none text-[#8B93A0]">
              <Users className="h-[11px] w-[11px] shrink-0" strokeWidth={1.9} />
              <span>
                {booking.guests} Guest{booking.guests > 1 ? "s" : ""}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Check-in status + ticket */}
      <div
        className={cn(
          "mx-3 mb-3 flex items-center gap-2 rounded-[10px] px-2.5 py-2",
          isCancelled
            ? "bg-[#3A1C1C]/80"
            : isLive
              ? "bg-[#163526]/90"
              : "bg-[#1A2740]/90",
        )}
      >
        <Clock3
          className={cn(
            "h-[13px] w-[13px] shrink-0",
            isCancelled ? "text-[#FF8A8A]" : isLive ? "text-[#3DDC84]" : "text-[#7EB6FF]",
          )}
          strokeWidth={1.9}
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-[11px] font-semibold leading-tight",
              isCancelled ? "text-[#FF8A8A]" : isLive ? "text-[#3DDC84]" : "text-[#7EB6FF]",
            )}
          >
            {booking.checkInLabel}
          </p>
          <p className="truncate text-[10px] leading-tight text-white/85">{booking.checkInWhen}</p>
        </div>
        <button
          type="button"
          className="press inline-flex shrink-0 items-center gap-1 rounded-full border border-[#E0B84A] px-2.5 py-1.5 text-[10px] font-semibold text-[#E0B84A]"
        >
          <Ticket className="h-[11px] w-[11px]" strokeWidth={1.9} />
          View Ticket
        </button>
      </div>

      {/* Payment row */}
      <div className="border-t border-white/[0.06] px-3 py-3">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[9.5px] font-medium text-[#8B93A0]">Total Amount</p>
            <p className="mt-1 text-[13px] font-bold leading-none text-white">
              {formatINR(booking.totalAmount)}
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9.5px] font-medium text-[#8B93A0]">Advanced Paid</p>
            <p className="mt-1 text-[13px] font-bold leading-none text-[#3DDC84]">
              {formatINR(booking.advancedPaid)}
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9.5px] font-medium text-[#8B93A0]">Due Payment</p>
            <p
              className={cn(
                "mt-1 text-[13px] font-bold leading-none",
                due > 0 ? "text-[#FF5C5C]" : "text-[#3DDC84]",
              )}
            >
              {formatINR(due)}
            </p>
            {due > 0 ? (
              <p className="mt-1 text-[8.5px] leading-none text-[#6B7280]">
                {formatINR(booking.totalAmount)} − {formatINR(booking.advancedPaid)}
              </p>
            ) : null}
          </div>
          {due > 0 ? (
            <button
              type="button"
              className="press mb-0.5 inline-flex shrink-0 items-center gap-1 rounded-[8px] bg-[#24A148] px-2.5 py-2 text-[11px] font-semibold text-white"
            >
              Pay Now
              <ArrowRight className="h-[12px] w-[12px]" strokeWidth={2.2} />
            </button>
          ) : (
            <span className="mb-0.5 inline-flex shrink-0 items-center rounded-[8px] border border-white/10 px-2.5 py-2 text-[10px] font-medium text-[#8B93A0]">
              Paid
            </span>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="grid grid-cols-3 gap-2 border-t border-white/[0.06] px-3 py-3">
        <button
          type="button"
          className="press flex items-center justify-center gap-1 rounded-[9px] border border-[#3B82F6]/55 px-1.5 py-2 text-[9.5px] font-medium text-white"
        >
          <FileText className="h-[12px] w-[12px] shrink-0 text-[#60A5FA]" strokeWidth={1.8} />
          <span className="leading-tight">View Payments Status</span>
        </button>
        <button
          type="button"
          className="press flex items-center justify-center gap-1 rounded-[9px] border border-white/18 px-1.5 py-2 text-[9.5px] font-medium text-white"
        >
          <List className="h-[12px] w-[12px] shrink-0" strokeWidth={1.8} />
          <span className="leading-tight">View Details</span>
        </button>
        <button
          type="button"
          className="press flex items-center justify-center gap-1 rounded-[9px] border border-[#E0B84A]/70 px-1.5 py-2 text-[9.5px] font-medium text-[#E0B84A]"
        >
          <Headphones className="h-[12px] w-[12px] shrink-0" strokeWidth={1.8} />
          <span className="leading-tight">Contact Support</span>
        </button>
      </div>
    </article>
  );
}
