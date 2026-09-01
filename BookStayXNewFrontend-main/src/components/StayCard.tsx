import { Link } from "@tanstack/react-router";
import {
  BedDouble,
  Coffee,
  Flame,
  Heart,
  Home,
  MapPin,
  Mountain,
  ParkingCircle,
  Star,
  Tent,
  Trees,
  UtensilsCrossed,
  Waves,
  Wifi,
} from "lucide-react";
import type { Amenity, Stay } from "@/data/stays";
import { formatPrice } from "@/data/stays";

const icons = {
  bed: BedDouble,
  tent: Tent,
  lake: Waves,
  pool: Waves,
  fire: Flame,
  mountain: Mountain,
  parking: ParkingCircle,
  wifi: Wifi,
  coffee: Coffee,
  meals: UtensilsCrossed,
  lawn: Trees,
  cottage: Home,
} as const;

export function AmenityTag({ amenity, size = "sm" }: { amenity: Amenity; size?: "sm" | "md" }) {
  const Icon = icons[amenity.icon];
  return (
    <span
      className={
        size === "sm"
          ? "flex items-center gap-1 text-[10.5px] text-ink-soft"
          : "flex items-center gap-1.5 text-[12.5px] text-ink-soft"
      }
    >
      <Icon className={size === "sm" ? "h-3.5 w-3.5 text-ink-muted" : "h-4 w-4 text-gold"} strokeWidth={1.6} />
      {amenity.label}
    </span>
  );
}

export function StayCard({ stay }: { stay: Stay }) {
  return (
    <Link
      to="/properties/$id"
      params={{ id: stay.id }}
      className="press group block overflow-hidden rounded-[16px] border border-hairline bg-[#0d1014]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={stay.image}
          alt={stay.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <span className="img-shade absolute inset-0 opacity-80" />
        <span className="absolute left-2 top-2 rounded-md bg-[#1d2b4d]/90 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.06em] text-ink backdrop-blur-md">
          {stay.badge}
        </span>
        <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-black/45 backdrop-blur-md">
          <Heart className="h-3.5 w-3.5 text-ink-soft" strokeWidth={1.7} />
        </span>
      </div>

      <div className="p-3">
        <h3 className="truncate text-[14.5px] font-bold leading-tight text-ink">{stay.name}</h3>
        <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-ink-muted">
          <MapPin className="h-3 w-3 shrink-0 text-ink-muted" strokeWidth={1.6} />
          {stay.location}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-2.5 gap-y-1">
          {stay.amenities.map((a) => (
            <AmenityTag key={a.label} amenity={a} />
          ))}
        </div>
        <div className="mt-2.5 flex items-end justify-between gap-2">
          <p className="min-w-0 truncate">
            <span className="text-[15px] font-bold text-gold">{formatPrice(stay.price)}</span>
            <span className="text-[10.5px] text-ink-muted"> / night</span>
          </p>
          <span className="flex shrink-0 items-center gap-1 text-[11.5px] font-semibold text-ink">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" strokeWidth={1.5} />
            {stay.rating}
            <span className="font-normal text-ink-muted">({stay.reviews})</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
