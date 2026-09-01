import { Link } from "@tanstack/react-router";
import {
  BedDouble,
  Bookmark,
  CalendarDays,
  Droplets,
  Flame,
  Heart,
  Home,
  Images,
  MapPin,
  Mountain,
  Star,
  Tent,
  Waves,
} from "lucide-react";
import type { Property, PropertyCategory } from "@/data/locations";
import { cn } from "@/lib/utils";

function amenityIcon(label: string) {
  const key = label.toLowerCase();
  if (key.includes("bedroom") || key.includes("guest")) return BedDouble;
  if (key.includes("lake") || key.includes("sea") || key.includes("beach")) return Waves;
  if (key.includes("pool")) return Droplets;
  if (key.includes("bonfire") || key.includes("bbq")) return Flame;
  if (key.includes("mountain") || key.includes("view")) return Mountain;
  if (key.includes("dome") || key.includes("camp")) return Tent;
  return BedDouble;
}

function badgeTone(category: PropertyCategory) {
  switch (category) {
    case "villas":
      return "bg-[#1F6B45] text-white";
    case "camping":
    case "campings":
      return "bg-[#6B3FA0] text-white";
    case "hotel":
      return "bg-[#C45C2A] text-white";
    default:
      return "bg-black/55 text-white";
  }
}

function formatPrice(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function SavedStayCard({
  property,
  photoCount = 18,
}: {
  property: Property;
  photoCount?: number;
}) {
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-[14px] bg-[#161B26]">
      <div className="relative aspect-[4/3.1] overflow-hidden">
        <img
          src={property.image}
          alt={property.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />

        <span
          className={cn(
            "absolute left-2 top-2 max-w-[72%] truncate rounded-[5px] px-1.5 py-[3px] text-[8px] font-semibold uppercase tracking-[0.03em]",
            badgeTone(property.category),
          )}
        >
          {property.badge}
        </span>

        <button
          type="button"
          aria-label={`Unsave ${property.name}`}
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-[#E11D48] shadow-sm"
        >
          <Heart className="h-[13px] w-[13px] fill-current" strokeWidth={1.6} />
        </button>

        <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-[3px]">
          <span className="h-[4px] w-[4px] rounded-full bg-white" />
          <span className="h-[4px] w-[4px] rounded-full bg-white/45" />
          <span className="h-[4px] w-[4px] rounded-full bg-white/45" />
        </div>

        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-[5px] bg-black/65 px-1.5 py-[3px] text-[8.5px] font-medium text-white backdrop-blur-[2px]">
          <Images className="h-[9px] w-[9px]" strokeWidth={1.8} />
          1 / {photoCount}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-2">
        <div className="flex items-start justify-between gap-1.5">
          <h3 className="min-w-0 flex-1 text-[12.5px] font-semibold leading-snug tracking-[-0.01em] text-white">
            {property.name}
          </h3>
          <div className="flex shrink-0 flex-col items-end gap-[2px] pt-0.5 leading-none">
            <p className="flex items-center gap-[2px]">
              <Star className="h-[9px] w-[9px] fill-[#E0B84A] text-[#E0B84A]" strokeWidth={0} />
              <span className="text-[10.5px] font-semibold text-white">{property.rating.toFixed(1)}</span>
            </p>
            <span className="text-[9px] text-[#8B93A0]">({property.reviews})</span>
          </div>
        </div>

        <p className="mt-[6px] flex min-w-0 items-center gap-1 text-[10px] leading-none text-[#8B93A0]">
          <MapPin className="h-[10px] w-[10px] shrink-0 text-[#E0B84A]" strokeWidth={2} />
          <span className="truncate">{property.locationLabel}</span>
        </p>

        <ul className="mt-2 flex min-w-0 flex-wrap gap-1">
          {property.meta.slice(0, 3).map((m) => {
            const Icon = amenityIcon(m);
            return (
              <li
                key={m}
                className="inline-flex max-w-full items-center gap-[3px] rounded-full bg-white/[0.06] px-1.5 py-[3px] text-[8.5px] leading-none text-[#9AA1AB]"
              >
                <Icon className="h-[9px] w-[9px] shrink-0" strokeWidth={1.9} />
                <span className="truncate">{m}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-2.5 flex items-center justify-between gap-1.5">
          <p className="min-w-0 leading-none">
            <span className="text-[13px] font-bold tracking-[-0.02em] text-[#E0B84A]">
              {formatPrice(property.priceAmount)}
            </span>
            <span className="text-[9.5px] font-medium text-[#8B93A0]"> / night</span>
          </p>
          <span className="shrink-0 rounded-full bg-[#1F6B45] px-1.5 py-[3px] text-[8px] font-semibold text-white">
            Starting Price
          </span>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          <Link
            to="/properties/$id"
            params={{ id: property.id }}
            className="press inline-flex items-center justify-center gap-1 rounded-[8px] border border-white/25 bg-transparent px-1 py-2 text-[9px] font-semibold text-white"
          >
            <Bookmark className="h-[11px] w-[11px] shrink-0" strokeWidth={1.8} />
            View Details
          </Link>
          <button
            type="button"
            className="press inline-flex items-center justify-center gap-1 rounded-[8px] bg-[#E0B84A] px-1 py-2 text-[9px] font-semibold text-[#141007]"
          >
            <CalendarDays className="h-[11px] w-[11px] shrink-0" strokeWidth={1.9} />
            View Availability
          </button>
        </div>
      </div>
    </article>
  );
}

export function SavedCategoryIcon({
  id,
  className,
}: {
  id: "all" | "villas" | "camping" | "hotel";
  className?: string;
}) {
  if (id === "villas") return <Home className={className} strokeWidth={1.7} />;
  if (id === "camping") return <Tent className={className} strokeWidth={1.7} />;
  if (id === "hotel") return <BedDouble className={className} strokeWidth={1.7} />;
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
