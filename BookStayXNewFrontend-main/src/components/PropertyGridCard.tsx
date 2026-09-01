import { Link } from "@tanstack/react-router";
import {
  BedDouble,
  Flame,
  Heart,
  MapPin,
  Mountain,
  Star,
  Tent,
  Waves,
  Droplets,
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
      return "bg-[#1F4D3A]/92 text-white";
    case "camping":
      return "bg-[#4A2F6B]/92 text-white";
    case "hotel":
      return "bg-[#1E3A5F]/92 text-white";
    case "campings":
      return "bg-[#3D4A2A]/92 text-white";
    default:
      return "bg-black/55 text-white";
  }
}

function formatPrice(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function PropertyGridCard({ property }: { property: Property }) {
  return (
    <Link
      to="/properties/$id"
      params={{ id: property.id }}
      className="press group flex min-w-0 flex-col overflow-hidden rounded-[14px] bg-[#14181F]"
    >
      <div className="relative aspect-[4/3.05] overflow-hidden">
        <img
          src={property.image}
          alt={property.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span
          className={cn(
            "absolute left-2 top-2 max-w-[78%] truncate rounded-[5px] px-1.5 py-[3px] text-[8px] font-semibold uppercase tracking-[0.03em] backdrop-blur-[2px]",
            badgeTone(property.category),
          )}
        >
          {property.badge}
        </span>
        <button
          type="button"
          aria-label={`Save ${property.name}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-white"
        >
          <Heart className="h-[15px] w-[15px]" strokeWidth={1.7} />
        </button>
      </div>

      <div className="px-2 pb-2.5 pt-2">
        <h3 className="truncate text-[12.5px] font-semibold leading-tight tracking-[-0.01em] text-white">
          {property.name}
        </h3>

        <p className="mt-[5px] flex min-w-0 items-center gap-1 text-[10px] leading-none text-[#8B93A0]">
          <MapPin className="h-[10px] w-[10px] shrink-0" strokeWidth={2} />
          <span className="truncate">{property.locationLabel}</span>
        </p>

        <ul className="mt-[7px] flex min-w-0 flex-wrap items-center gap-x-[6px] gap-y-1">
          {property.meta.slice(0, 3).map((m) => {
            const Icon = amenityIcon(m);
            return (
              <li
                key={m}
                className="flex max-w-full items-center gap-[2px] text-[9px] leading-none text-[#8B93A0]"
              >
                <Icon className="h-[9px] w-[9px] shrink-0" strokeWidth={1.9} />
                <span className="truncate">{m}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-[8px] flex items-end justify-between gap-1">
          <p className="min-w-0 leading-none">
            <span className="text-[12.5px] font-bold tracking-[-0.02em] text-[#E0B84A]">
              {formatPrice(property.priceAmount)}
            </span>
            <span className="text-[9.5px] font-medium text-[#8B93A0]"> / night</span>
          </p>
          <p className="flex shrink-0 items-center gap-[2px] leading-none">
            <Star className="h-[9px] w-[9px] fill-[#E0B84A] text-[#E0B84A]" strokeWidth={0} />
            <span className="text-[10.5px] font-semibold text-white">{property.rating.toFixed(1)}</span>
            <span className="text-[9.5px] text-[#8B93A0]">({property.reviews})</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
