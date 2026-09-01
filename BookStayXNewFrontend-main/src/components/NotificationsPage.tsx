import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bell,
  CalendarCheck2,
  CircleDollarSign,
  Info,
  Sparkles,
} from "lucide-react";
import { AppTopNav } from "@/components/AppTopNav";
import { cn } from "@/lib/utils";

type Notif = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  Icon: typeof Bell;
  tone: "gold" | "green" | "blue";
};

const NOTIFS: Notif[] = [
  {
    id: "1",
    title: "Booking confirmed",
    body: "Your stay at Seaside Serenity Villa is confirmed for 21–22 Aug.",
    time: "2h ago",
    unread: true,
    Icon: CalendarCheck2,
    tone: "green",
  },
  {
    id: "2",
    title: "Referral reward unlocked",
    body: "A friend booked using your code. Earnings will update after check-in.",
    time: "Yesterday",
    unread: true,
    Icon: CircleDollarSign,
    tone: "gold",
  },
  {
    id: "3",
    title: "New luxury stays near Pawna",
    body: "Explore handpicked villas and lakeside cottages added this week.",
    time: "2d ago",
    Icon: Sparkles,
    tone: "gold",
  },
  {
    id: "4",
    title: "Payment reminder",
    body: "Complete the remaining balance before check-in to avoid delays.",
    time: "4d ago",
    Icon: Info,
    tone: "blue",
  },
];

function toneClass(tone: Notif["tone"]) {
  switch (tone) {
    case "green":
      return "bg-[#14532D]/35 text-[#86EFAC] border-[#22C55E]/35";
    case "blue":
      return "bg-[#1E3A5F]/40 text-[#93C5FD] border-[#60A5FA]/35";
    default:
      return "bg-[#E0B84A]/12 text-[#E0B84A] border-[#E0B84A]/35";
  }
}

export function NotificationsPage() {
  return (
    <div className="min-h-screen bg-[#050709] pb-6">
      <AppTopNav />

      <div className="px-4 pt-2">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="Back to home"
            className="press grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-[#12161C] text-white"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <div className="min-w-0">
            <h1 className="font-display text-[26px] font-semibold text-white">Notifications</h1>
            <p className="mt-0.5 text-[12.5px] text-[#8B93A0]">Stay updated on bookings & offers</p>
          </div>
        </div>

        <ul className="mt-5 space-y-2.5">
          {NOTIFS.map((n) => (
            <li
              key={n.id}
              className={cn(
                "rounded-[16px] border bg-[#12161C] px-3.5 py-3.5",
                n.unread ? "border-[#E0B84A]/35" : "border-white/[0.06]",
              )}
            >
              <div className="flex gap-3">
                <span
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-full border",
                    toneClass(n.tone),
                  )}
                >
                  <n.Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[14px] font-semibold text-white">{n.title}</p>
                    {n.unread ? (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#E0B84A]" />
                    ) : null}
                  </div>
                  <p className="mt-1 text-[12.5px] leading-snug text-[#9AA1AB]">{n.body}</p>
                  <p className="mt-2 text-[11px] text-[#6B7280]">{n.time}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
