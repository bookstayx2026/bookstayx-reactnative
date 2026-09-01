import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type Base = {
  slug: string;
  name: string;
  sub: string;
  image: string;
  className?: string;
};

export function LocationCard({ slug, name, sub, image, className }: Base) {
  return (
    <Link
      to="/locations/$slug"
      params={{ slug }}
      className={cn(
        "press group relative block overflow-hidden rounded-[15px] border border-white/8",
        className,
      )}
    >
      <img
        src={image}
        alt={name}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
      />
      <span className="img-shade absolute inset-0" />
      <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-[#0b0e12]/80 ring-1 ring-gold/40">
        <MapPin className="h-3.5 w-3.5 text-gold" strokeWidth={1.8} />
      </span>
      <span className="absolute inset-x-0 bottom-0 block p-2.5">
        <span className="block truncate text-[7.5px] font-semibold uppercase tracking-[0.08em] text-gold">
          {sub}
        </span>
        <span className="mt-0.5 block truncate font-display text-[17px] font-medium text-ink">{name}</span>
      </span>
    </Link>
  );
}

export function PinnedLocationCard({ slug, name, sub, image, className }: Base) {
  return (
    <Link
      to="/locations/$slug"
      params={{ slug }}
      className={cn("press group relative block overflow-hidden rounded-[15px] border border-white/8", className)}
    >
      <img
        src={image}
        alt={name}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
      />
      <span className="img-shade absolute inset-0" />
      <span className="absolute inset-x-0 bottom-0 flex items-start gap-1.5 p-2.5">
        <MapPin className="mt-[3px] h-3.5 w-3.5 shrink-0 text-ink-soft" strokeWidth={1.8} />
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-semibold text-ink">{name}</span>
          <span className="block truncate text-[10.5px] text-ink-muted">{sub}</span>
        </span>
      </span>
    </Link>
  );
}

export function RankedLocationCard({
  slug,
  name,
  sub,
  image,
  rank,
  className,
}: Base & { rank: number }) {
  return (
    <Link
      to="/locations/$slug"
      params={{ slug }}
      className={cn("press group relative block overflow-hidden rounded-[13px] border border-white/8", className)}
    >
      <img
        src={image}
        alt={name}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
      />
      <span className="img-shade absolute inset-0" />
      <span className="absolute left-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#0b0e12]/85 text-[9.5px] font-bold text-gold ring-1 ring-gold/45">
        {rank}
      </span>
      <span className="absolute inset-x-0 bottom-0 block p-1.5">
        <span className="block text-[10.5px] font-semibold leading-tight text-ink">{name}</span>
        <span className="mt-0.5 block truncate text-[8.5px] text-ink-muted">{sub}</span>
      </span>
    </Link>
  );
}
