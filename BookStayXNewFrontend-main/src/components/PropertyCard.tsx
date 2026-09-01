import { Link } from "@tanstack/react-router";
import { ArrowRight, Heart } from "lucide-react";
import type { Property } from "@/data/locations";
import { cn } from "@/lib/utils";

export function PropertyCard({
  property,
  className,
}: {
  property: Property;
  className?: string;
}) {
  return (
    <Link
      to="/properties"
      search={{ location: property.locationSlug }}
      className={cn(
        /* ~2 location columns wide — balanced vs 3-col grid, clear next-card peek */
        "press group block w-[min(268px,72vw)] shrink-0 overflow-hidden rounded-[16px] border border-hairline bg-[#0d1014]",
        className,
      )}
    >
      <div className="relative h-[148px] overflow-hidden">
        <img
          src={property.image}
          alt={property.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span className="img-shade absolute inset-0 opacity-70" />
        <span className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-black/45 backdrop-blur-md">
          <Heart className="h-3.5 w-3.5 text-ink-soft" strokeWidth={1.6} />
        </span>
      </div>
      <div className="p-3">
        <h3 className="text-[14px] font-semibold leading-snug text-ink">{property.name}</h3>
        <ul className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5">
          {property.meta.map((m) => (
            <li key={m} className="flex items-center gap-1 text-[10.5px] text-ink-muted">
              <span className="h-1 w-1 rounded-full bg-gold/70" />
              {m}
            </li>
          ))}
        </ul>
        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-hairline pt-2.5">
          <span className="text-[12.5px] font-semibold text-gold">{property.price}</span>
          <span className="grid h-7 w-7 place-items-center rounded-full border border-gold/45 text-gold">
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
          </span>
        </div>
      </div>
    </Link>
  );
}
