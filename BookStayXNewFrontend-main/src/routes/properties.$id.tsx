import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AirVent,
  ArrowRight,
  Bath,
  BedDouble,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleParking,
  CookingPot,
  Droplets,
  Flame,
  Heart,
  MapPin,
  Minus,
  Plus,
  Refrigerator,
  Share2,
  ShieldCheck,
  Ship,
  Sparkles,
  Star,
  Trees,
  Tv,
  Users,
  Waves,
  Wifi,
  Zap,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getLocation, getProperty, type Property } from "@/data/locations";
import { IMG } from "@/lib/images";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/properties/$id")({
  loader: ({ params }) => {
    const property = getProperty(params.id);
    if (!property) throw notFound();
    return { property };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Property unavailable" }, { name: "robots", content: "noindex" }] };
    }
    const p = loaderData.property;
    const title = `${p.name} — Property Details | BookStayX`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: `Book ${p.name} near ${p.locationLabel}. Starting from ₹${p.priceAmount.toLocaleString("en-IN")}/night.`,
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: `Handpicked stay at ${p.name}. ${p.locationLabel}.`,
        },
      ],
    };
  },
  component: PropertyDetailsPage,
});

type DetailTab = "descriptions" | "amenities" | "activities" | "schedule";

const AMENITIES = [
  { label: "Wi-Fi", Icon: Wifi },
  { label: "AC", Icon: AirVent },
  { label: "Kitchen", Icon: CookingPot },
  { label: "TV", Icon: Tv },
  { label: "Refrigerator", Icon: Refrigerator },
  { label: "Parking", Icon: CircleParking },
  { label: "Power Backup", Icon: Zap },
] as const;

const ACTIVITIES = [
  { title: "Bonfire Nights", image: IMG.valley },
  { title: "Kayaking", image: IMG.lake },
  { title: "Beach Walks", image: IMG.beach2 },
  { title: "Cycling", image: IMG.hills },
] as const;

const FEATURES = [
  { label: "Sea View", Icon: Waves },
  { label: "Private Pool", Icon: Droplets },
  { label: "Beach Access", Icon: Ship },
  { label: "Lawn", Icon: Trees },
] as const;

const TRUST = [
  { label: "Best Price Guarantee", Icon: Sparkles },
  { label: "Secure Booking", Icon: ShieldCheck },
  { label: "Instant Confirmation", Icon: CheckCircle2 },
  { label: "24/7 Guest Support", Icon: Users },
] as const;

function formatPrice(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function parseSpec(property: Property) {
  const join = property.meta.join(" ").toLowerCase();
  const guestsRange = join.match(/(\d+)\s*-\s*(\d+)\s*guests?/);
  const guestsMatch = join.match(/(\d+)\s*guests?/);
  const bedMatch = join.match(/(\d+)\s*bedrooms?/);
  const maxGuests = guestsRange
    ? Number(guestsRange[2])
    : guestsMatch
      ? Number(guestsMatch[1])
      : property.category === "villas"
        ? 8
        : property.category === "hotel"
          ? 2
          : 4;
  const bedrooms = bedMatch ? Number(bedMatch[1]) : property.category === "villas" ? 2 : 1;
  return {
    maxGuests,
    bedrooms,
    bathrooms: bedrooms >= 2 ? 2 : 1,
    hasPool: join.includes("pool"),
  };
}

function fullLocationLabel(property: Property) {
  const loc = getLocation(property.locationSlug);
  if (property.locationSlug === "alibagh") return "Alibagh, Raigad, Maharashtra";
  if (loc) {
    const district = loc.district.replace(" District", "");
    return `${loc.name}, ${district}, Maharashtra`;
  }
  return property.locationLabel;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(d: Date, n: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return startOfDay(next);
}

function formatChipDate(d: Date | null) {
  if (!d) return "Select";
  const day = d.getDate();
  const mon = d.toLocaleString("en-IN", { month: "short" });
  const yy = String(d.getFullYear()).slice(-2);
  return `${day} ${mon} '${yy}`;
}

/** Demo inventory: past / booked / available */
function getDayStatus(d: Date): "past" | "booked" | "available" {
  const day = startOfDay(d);
  const today = startOfDay(new Date());
  if (day < today) return "past";
  // Booked demo: Fridays & Saturdays
  if (day.getDay() === 5 || day.getDay() === 6) return "booked";
  return "available";
}

function nightsBetween(checkIn: Date, checkOut: Date) {
  const ms = startOfDay(checkOut).getTime() - startOfDay(checkIn).getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

/** True if any night from checkIn (inclusive) to day before checkOut is booked */
function rangeHasBookedNight(checkIn: Date, checkOut: Date) {
  let cur = startOfDay(checkIn);
  const end = startOfDay(checkOut);
  while (cur < end) {
    if (getDayStatus(cur) === "booked") return true;
    cur = addDays(cur, 1);
  }
  return false;
}

function nextAvailableOnOrAfter(from: Date) {
  let cur = startOfDay(from);
  for (let i = 0; i < 60; i++) {
    if (getDayStatus(cur) === "available") return cur;
    cur = addDays(cur, 1);
  }
  return startOfDay(from);
}

function defaultStayDates() {
  let checkIn = nextAvailableOnOrAfter(addDays(new Date(), 2));

  for (let attempt = 0; attempt < 45; attempt++) {
    let checkOut = addDays(checkIn, 1);
    for (let j = 0; j < 21; j++) {
      if (getDayStatus(checkOut) === "available" && !rangeHasBookedNight(checkIn, checkOut)) {
        return { checkIn, checkOut };
      }
      checkOut = addDays(checkOut, 1);
    }
    checkIn = nextAvailableOnOrAfter(addDays(checkIn, 1));
  }

  const fallbackIn = startOfDay(addDays(new Date(), 3));
  return { checkIn: fallbackIn, checkOut: addDays(fallbackIn, 1) };
}

type CalendarMode = "checkin" | "checkout" | "range";

function PropertyDetailsPage() {
  const { property } = Route.useLoaderData();
  const router = useRouter();
  const [tab, setTab] = useState<DetailTab>("descriptions");
  const [persons, setPersons] = useState(1);
  const [saved, setSaved] = useState(false);
  const [stayDates] = useState(() => defaultStayDates());
  const [checkIn, setCheckIn] = useState<Date | null>(stayDates.checkIn);
  const [checkOut, setCheckOut] = useState<Date | null>(stayDates.checkOut);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("range");

  const specs = useMemo(() => parseSpec(property), [property]);
  const maxPersons = specs.maxGuests;
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const total = property.priceAmount * Math.max(nights, 1);

  const about =
    property.id === "seaside-serenity-villa"
      ? "Wake up to the sound of waves at this exclusive beachfront villa in Alibagh. Featuring a private infinity pool, lush lawns, and direct beach access — perfect for families and groups seeking a serene coastal escape."
      : `Experience ${property.name} in ${property.locationLabel}. A handpicked BookStayX stay with premium comforts, thoughtful hospitality, and unforgettable views — ideal for your next Konkan getaway.`;

  const openCalendar = (mode: CalendarMode) => {
    setCalendarMode(mode);
    setCalendarOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-[#050709] pb-[92px]">
      {/* HERO */}
      <section className="relative h-[min(58vh,420px)] overflow-hidden">
        <img
          src={property.image}
          alt={property.name}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-transparent" />
        <div className="img-shade absolute inset-0" />

        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-[max(12px,env(safe-area-inset-top))]">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => router.history.back()}
            className="press grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur-md"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={saved ? "Unsave" : "Save"}
              onClick={() => setSaved((v) => !v)}
              className="press grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur-md"
            >
              <Heart
                className={cn("h-[18px] w-[18px]", saved && "fill-[#E11D48] text-[#E11D48]")}
                strokeWidth={1.6}
              />
            </button>
            <button
              type="button"
              aria-label="Share"
              className="press grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur-md"
            >
              <Share2 className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </button>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-5">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-full border border-[#E0B84A]/45 bg-black/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#E0B84A] backdrop-blur-md">
                {property.badge}
              </span>
              <h1 className="mt-2.5 font-display text-[28px] font-semibold leading-[1.08] tracking-[-0.01em] text-white">
                {property.name}
              </h1>
              <p className="mt-2 flex min-w-0 items-center gap-1.5 text-[12px] text-[#D1D5DB]">
                <MapPin className="h-[13px] w-[13px] shrink-0 text-[#E0B84A]" strokeWidth={2} />
                <span className="truncate">{fullLocationLabel(property)}</span>
              </p>
              <ul className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <SpecItem Icon={Users} label={`Max ${maxPersons} Guests`} />
                <SpecItem Icon={BedDouble} label={`${specs.bedrooms} Bedrooms`} />
                <SpecItem Icon={Bath} label={`${specs.bathrooms} Bathrooms`} />
                {specs.hasPool ? <SpecItem Icon={Waves} label="Pool" /> : null}
              </ul>
            </div>

            <div className="shrink-0 rounded-[12px] border border-[#E0B84A]/55 bg-black/55 px-2.5 py-2 text-center backdrop-blur-md">
              <p className="flex items-center justify-center gap-1 leading-none">
                <Star className="h-[12px] w-[12px] fill-[#E0B84A] text-[#E0B84A]" strokeWidth={0} />
                <span className="text-[13px] font-semibold text-white">
                  {property.rating.toFixed(1)}
                </span>
                <span className="text-[11px] text-[#C9CDD4]">({property.reviews})</span>
              </p>
              <p className="mt-1 text-[9.5px] font-medium text-[#E0B84A]">Loved by Guests</p>
            </div>
          </div>
        </div>
      </section>

      {/* BOOKING CARD */}
      <div className="relative z-10 -mt-1 px-4">
        <div className="rounded-[18px] border border-[#E0B84A]/25 bg-[#10141B] p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-[#8B93A0]">Starting from</p>
              <p className="mt-1 leading-none">
                <span className="text-[22px] font-bold tracking-[-0.02em] text-[#E0B84A]">
                  {formatPrice(property.priceAmount)}
                </span>
                <span className="text-[12px] font-medium text-[#8B93A0]"> / night</span>
              </p>
              <p className="mt-2 text-[11px] font-medium text-[#34D399]">
                Free cancellation before 48 hrs
              </p>
            </div>
            <p className="shrink-0 rounded-full border border-[#E0B84A]/35 bg-[#E0B84A]/10 px-2.5 py-1 text-[10.5px] font-semibold text-[#E0B84A]">
              Max {maxPersons} persons
            </p>
          </div>

          <div className="mt-3.5 grid grid-cols-[1fr_auto_1fr] gap-2">
            <DateChip
              label="Check-in"
              value={formatChipDate(checkIn)}
              onClick={() => openCalendar("checkin")}
            />
            <div className="flex flex-col items-center justify-center rounded-[12px] border border-white/12 bg-[#0B0E11] px-2.5 py-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Decrease persons"
                  disabled={persons <= 1}
                  onClick={() => setPersons((n) => Math.max(1, n - 1))}
                  className="press grid h-7 w-7 place-items-center rounded-full border border-white/15 text-white disabled:opacity-35"
                >
                  <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
                <span className="min-w-[1.25rem] text-center text-[15px] font-semibold text-white">
                  {persons}
                </span>
                <button
                  type="button"
                  aria-label="Increase persons"
                  disabled={persons >= maxPersons}
                  onClick={() => setPersons((n) => Math.min(maxPersons, n + 1))}
                  className="press grid h-7 w-7 place-items-center rounded-full border border-white/15 text-white disabled:opacity-35"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
              <span className="mt-1 text-[10px] text-[#8B93A0]">
                {persons === 1 ? "Person" : "Persons"}
              </span>
            </div>
            <DateChip
              label="Check-out"
              value={formatChipDate(checkOut)}
              onClick={() => openCalendar("checkout")}
            />
          </div>

          <button
            type="button"
            onClick={() => openCalendar("range")}
            className="press mt-3 flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#E0B84A]/45 bg-[#E0B84A]/[0.08] py-3 text-[13px] font-semibold text-[#E0B84A]"
          >
            <CalendarDays className="h-[16px] w-[16px]" strokeWidth={1.8} />
            Availability Calendar
          </button>

          <button
            type="button"
            className="press gold-gradient mt-2.5 flex w-full items-center justify-center gap-2 rounded-[12px] py-3.5 text-[14.5px] font-semibold text-[#141007] shadow-[0_12px_28px_-10px_rgba(217,165,42,0.75)]"
          >
            Book Now
            <ArrowRight className="h-[16px] w-[16px]" strokeWidth={2} />
          </button>

          <div className="mt-3.5 grid grid-cols-4 gap-1.5">
            {TRUST.map(({ label, Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                <Icon className="h-[14px] w-[14px] text-[#E0B84A]/85" strokeWidth={1.7} />
                <span className="text-[8.5px] leading-tight text-[#C4A35A]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABS — content panels swap (no scroll-to-all) */}
      <div className="sticky top-0 z-20 mt-5 border-b border-white/[0.06] bg-[#050709]/92 px-2 backdrop-blur-md">
        <div className="no-scrollbar flex items-stretch gap-0 overflow-x-auto">
          {(
            [
              { id: "descriptions", label: "Descriptions", Icon: Sparkles },
              { id: "amenities", label: "Amenities", Icon: Wifi },
              { id: "activities", label: "Activities", Icon: Flame },
              { id: "schedule", label: "Property Schedule", Icon: CalendarDays },
            ] as const
          ).map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "press relative flex shrink-0 items-center gap-1.5 px-3 py-3 text-[11.5px] font-semibold",
                  active ? "text-[#E0B84A]" : "text-[#8B93A0]",
                )}
              >
                <Icon className="h-[14px] w-[14px]" strokeWidth={1.7} />
                {label}
                {active ? (
                  <span className="absolute inset-x-2 bottom-0 h-[2.5px] rounded-full bg-[#E0B84A]" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-6 pt-5">
        {tab === "descriptions" ? (
          <section>
            <h2 className="font-display text-[22px] font-semibold text-white">About this property</h2>
            <p className="mt-3 text-[13px] leading-[1.65] text-[#B0B6BF]">{about}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {FEATURES.map(({ label, Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/12 bg-[#12161C] px-3 py-2 text-[11.5px] font-medium text-[#E8EAED]"
                >
                  <Icon className="h-[13px] w-[13px] text-[#E0B84A]" strokeWidth={1.7} />
                  {label}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {tab === "amenities" ? (
          <section>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-[22px] font-semibold text-white">Amenities</h2>
              <button type="button" className="press text-[12.5px] font-semibold text-[#E0B84A]">
                View all
              </button>
            </div>
            <div className="mt-3.5 grid grid-cols-4 gap-2.5">
              {AMENITIES.map(({ label, Icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 rounded-[12px] border border-white/10 bg-[#12161C] px-2 py-3"
                >
                  <Icon className="h-[18px] w-[18px] text-[#E0B84A]" strokeWidth={1.6} />
                  <span className="text-center text-[9.5px] leading-tight text-[#C9CDD4]">{label}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {tab === "activities" ? (
          <section>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-[22px] font-semibold text-white">Activities</h2>
              <button type="button" className="press text-[12.5px] font-semibold text-[#E0B84A]">
                View all
              </button>
            </div>
            <div className="mt-3.5 grid grid-cols-2 gap-3">
              {ACTIVITIES.map(({ title, image }) => (
                <article
                  key={title}
                  className="relative h-[128px] overflow-hidden rounded-[14px]"
                >
                  <img src={image} alt={title} className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  <p className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5 text-[12.5px] font-semibold text-white">
                    {title}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {tab === "schedule" ? (
          <section>
            <h2 className="font-display text-[22px] font-semibold text-white">Property Schedule</h2>
            <div className="mt-3.5 grid grid-cols-2 gap-2.5">
              <div className="rounded-[14px] border border-white/10 bg-[#12161C] px-3 py-3.5">
                <div className="flex items-start gap-2">
                  <CalendarDays className="mt-0.5 h-[15px] w-[15px] shrink-0 text-[#E0B84A]" strokeWidth={1.7} />
                  <div>
                    <p className="text-[11px] text-[#8B93A0]">Check-in</p>
                    <p className="mt-1 text-[12.5px] font-semibold leading-snug text-white">
                      2:00 PM onwards
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[14px] border border-white/10 bg-[#12161C] px-3 py-3.5">
                <div className="flex items-start gap-2">
                  <Car className="mt-0.5 h-[15px] w-[15px] shrink-0 text-[#E0B84A]" strokeWidth={1.7} />
                  <div>
                    <p className="text-[11px] text-[#8B93A0]">Check-out</p>
                    <p className="mt-1 text-[12.5px] font-semibold leading-snug text-white">11:00 AM</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-snug text-[#E0B84A]/90">
              * Early check-in or late check-out is subject to availability.
            </p>
          </section>
        ) : null}

        {/* Policy dropdowns */}
        <div className="mt-8">
          <Accordion type="multiple" className="space-y-2.5">
            <AccordionItem
              value="love"
              className="!border-b-0 overflow-hidden rounded-[14px] border border-white/10 bg-[#12161C] px-3.5"
            >
              <AccordionTrigger className="py-3.5 text-[14px] font-semibold text-white hover:no-underline [&[data-state=open]>svg]:text-[#E0B84A]">
                What you&apos;ll love
              </AccordionTrigger>
              <AccordionContent className="pb-3.5 text-[12.5px] leading-relaxed text-[#B0B6BF]">
                <ul className="space-y-2">
                  <li>• Private spaces with premium interiors and curated comforts</li>
                  <li>• Scenic views and peaceful surroundings near {property.locationLabel}</li>
                  <li>• Thoughtful hospitality from the BookStayX team</li>
                  <li>• Ideal for families, couples and small groups</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="rules"
              className="!border-b-0 overflow-hidden rounded-[14px] border border-white/10 bg-[#12161C] px-3.5"
            >
              <AccordionTrigger className="py-3.5 text-[14px] font-semibold text-white hover:no-underline [&[data-state=open]>svg]:text-[#E0B84A]">
                Rules & Policies
              </AccordionTrigger>
              <AccordionContent className="pb-3.5 text-[12.5px] leading-relaxed text-[#B0B6BF]">
                <ul className="space-y-2">
                  <li>• Check-in from 2:00 PM · Check-out by 11:00 AM</li>
                  <li>• Guests must carry a valid government ID</li>
                  <li>• Quiet hours: 10:00 PM – 7:00 AM</li>
                  <li>• No parties or events without prior approval</li>
                  <li>• Pets allowed only where listed — confirm before booking</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="cancel"
              className="!border-b-0 overflow-hidden rounded-[14px] border border-white/10 bg-[#12161C] px-3.5"
            >
              <AccordionTrigger className="py-3.5 text-[14px] font-semibold text-white hover:no-underline [&[data-state=open]>svg]:text-[#E0B84A]">
                Cancellation & Refund Policies
              </AccordionTrigger>
              <AccordionContent className="pb-3.5 text-[12.5px] leading-relaxed text-[#B0B6BF]">
                <ul className="space-y-2">
                  <li>• Free cancellation up to 48 hours before check-in</li>
                  <li>• Cancellations within 48 hours: 50% of booking amount</li>
                  <li>• No-show: full booking amount is non-refundable</li>
                  <li>• Refunds (if applicable) are processed within 5–7 business days</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center">
        <div className="pointer-events-auto w-full max-w-[480px] border-t border-white/10 bg-[#0B0E11]/92 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] text-[#8B93A0]">Total Price</p>
              <p className="mt-0.5 text-[18px] font-bold leading-none tracking-[-0.02em] text-[#E0B84A]">
                {formatPrice(total)}
              </p>
              <p className="mt-1 text-[10.5px] text-[#8B93A0]">
                ({Math.max(nights, 1)} {Math.max(nights, 1) === 1 ? "Night" : "Nights"} • {persons}{" "}
                {persons === 1 ? "Guest" : "Guests"})
              </p>
            </div>

            <button
              type="button"
              className="press inline-flex shrink-0 items-center gap-0.5 text-[11.5px] font-semibold text-[#E0B84A]"
            >
              View Details
              <ChevronDown className="h-[14px] w-[14px]" strokeWidth={2} />
            </button>

            <button
              type="button"
              className="press gold-gradient inline-flex shrink-0 items-center gap-1.5 rounded-[12px] px-3.5 py-3 text-[12.5px] font-semibold text-[#141007] shadow-[0_10px_24px_-10px_rgba(217,165,42,0.75)]"
            >
              Continue Booking
              <ArrowRight className="h-[14px] w-[14px]" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {calendarOpen ? (
        <BookingCalendarSheet
          mode={calendarMode}
          propertyName={property.name}
          checkIn={checkIn}
          checkOut={checkOut}
          onClose={() => setCalendarOpen(false)}
          onChange={(nextIn, nextOut) => {
            setCheckIn(nextIn);
            setCheckOut(nextOut);
          }}
        />
      ) : null}
    </div>
  );
}

function SpecItem({ Icon, label }: { Icon: typeof Users; label: string }) {
  return (
    <li className="inline-flex items-center gap-1 text-[11px] text-white">
      <Icon className="h-[12px] w-[12px] text-[#E0B84A]" strokeWidth={1.8} />
      {label}
    </li>
  );
}

function DateChip({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press rounded-[12px] border border-white/12 bg-[#0B0E11] px-2.5 py-2 text-left"
    >
      <p className="text-[10px] text-[#8B93A0]">{label}</p>
      <p className="mt-1 flex items-center justify-between gap-1 text-[12px] font-semibold text-white">
        <span className="truncate">{value}</span>
        <CalendarDays className="h-[13px] w-[13px] shrink-0 text-[#E0B84A]" strokeWidth={1.7} />
      </p>
    </button>
  );
}

function BookingCalendarSheet({
  mode,
  propertyName,
  checkIn,
  checkOut,
  onClose,
  onChange,
}: {
  mode: CalendarMode;
  propertyName: string;
  checkIn: Date | null;
  checkOut: Date | null;
  onClose: () => void;
  onChange: (checkIn: Date | null, checkOut: Date | null) => void;
}) {
  const [cursor, setCursor] = useState(() => {
    const base = checkIn ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [draftIn, setDraftIn] = useState<Date | null>(checkIn);
  const [draftOut, setDraftOut] = useState<Date | null>(checkOut);
  const [picking, setPicking] = useState<"in" | "out">(() =>
    mode === "checkout" && checkIn ? "out" : "in",
  );
  const [error, setError] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = cursor.toLocaleString("en-IN", { month: "long", year: "numeric" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const cells: Array<number | null> = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const title =
    mode === "checkin"
      ? "Select check-in"
      : mode === "checkout"
        ? "Select check-out"
        : "Select dates";

  const hint =
    picking === "in"
      ? "Tap an available (green) date for check-in"
      : "Tap an available (green) date for check-out";

  const inRange = (day: Date) => {
    if (!draftIn || !draftOut) return false;
    const t = day.getTime();
    return t > draftIn.getTime() && t < draftOut.getTime();
  };

  const onPickDay = (dayNum: number) => {
    const date = startOfDay(new Date(year, month, dayNum));
    const status = getDayStatus(date);
    if (status === "past" || status === "booked") return;

    setError(null);

    if (picking === "in" || !draftIn) {
      setDraftIn(date);
      setDraftOut(null);
      setPicking("out");
      return;
    }

    // picking check-out
    if (date <= draftIn) {
      // restart range from this date
      setDraftIn(date);
      setDraftOut(null);
      setPicking("out");
      return;
    }

    if (rangeHasBookedNight(draftIn, date)) {
      setError("Selected range includes booked nights. Choose different dates.");
      return;
    }

    setDraftOut(date);
    setPicking("in");
  };

  const apply = () => {
    if (!draftIn || !draftOut) {
      setError("Please select both check-in and check-out dates.");
      return;
    }
    if (draftOut <= draftIn) {
      setError("Check-out must be after check-in.");
      return;
    }
    if (rangeHasBookedNight(draftIn, draftOut)) {
      setError("Selected range includes booked nights. Choose different dates.");
      return;
    }
    onChange(draftIn, draftOut);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close calendar"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[480px] rounded-t-[22px] border border-white/10 bg-[#10141B] px-4 pb-[max(18px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-16px_48px_rgba(0,0,0,0.55)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-[20px] font-semibold text-white">{title}</h3>
            <p className="mt-1 truncate text-[12px] text-[#8B93A0]">{propertyName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="press text-[12.5px] font-semibold text-[#8B93A0]"
          >
            Close
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-[12px] border border-white/10 bg-[#0B0E11] px-3 py-2">
            <p className="text-[10px] text-[#8B93A0]">Check-in</p>
            <p className="mt-0.5 text-[13px] font-semibold text-white">{formatChipDate(draftIn)}</p>
          </div>
          <div className="rounded-[12px] border border-white/10 bg-[#0B0E11] px-3 py-2">
            <p className="text-[10px] text-[#8B93A0]">Check-out</p>
            <p className="mt-0.5 text-[13px] font-semibold text-white">{formatChipDate(draftOut)}</p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-[#E0B84A]">{hint}</p>

        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="press grid h-9 w-9 place-items-center rounded-full border border-white/12 text-white"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <p className="text-[14px] font-semibold text-white">{monthLabel}</p>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="press grid h-9 w-9 place-items-center rounded-full border border-white/12 text-white"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[#8B93A0]">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <span key={`${d}-${i}`} className="py-1">
              {d}
            </span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day == null) return <span key={`e-${idx}`} className="aspect-square" />;
            const date = startOfDay(new Date(year, month, day));
            const status = getDayStatus(date);
            const isIn = draftIn ? sameDay(date, draftIn) : false;
            const isOut = draftOut ? sameDay(date, draftOut) : false;
            const mid = inRange(date);
            const disabled = status === "past" || status === "booked";

            return (
              <button
                key={day}
                type="button"
                disabled={disabled}
                onClick={() => onPickDay(day)}
                className={cn(
                  "press aspect-square rounded-[10px] text-[12px] font-semibold",
                  status === "past" && "bg-[#1A1D24] text-[#6B7280]",
                  status === "booked" && "bg-[#7F1D1D]/55 text-[#FCA5A5]",
                  status === "available" &&
                    !isIn &&
                    !isOut &&
                    !mid &&
                    "bg-[#14532D]/55 text-[#86EFAC]",
                  mid && "bg-[#E0B84A]/20 text-[#E0B84A]",
                  (isIn || isOut) && "bg-[#E0B84A] text-[#141007]",
                  disabled && "cursor-not-allowed opacity-90",
                )}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-[#8B93A0]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
            Available
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
            Booked
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#6B7280]" />
            Past
          </span>
        </div>

        {error ? <p className="mt-3 text-[11.5px] font-medium text-[#F87171]">{error}</p> : null}

        <button
          type="button"
          onClick={apply}
          className="press gold-gradient mt-4 flex w-full items-center justify-center gap-2 rounded-[12px] py-3.5 text-[14px] font-semibold text-[#141007]"
        >
          Confirm Dates
          <ArrowRight className="h-[15px] w-[15px]" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

