import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { ArrowRight, Search, SlidersHorizontal, X } from "lucide-react";
import { AppTopNav } from "@/components/AppTopNav";
import { IconButton } from "@/components/brand";
import { PinnedLocationCard, RankedLocationCard } from "@/components/LocationCard";
import { locationGroups, locations, type Location } from "@/data/locations";
import { useHideOnScroll } from "@/hooks/use-hide-on-scroll";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/locations/")({
  head: () => ({
    meta: [
      { title: "Locations — Pawna to the Konkan Coast | BookStayX" },
      {
        name: "description",
        content:
          "Browse destinations across Pune, Raigad, Ratnagiri and Sindhudurg — beaches, lakes, hill stations and forts.",
      },
      { property: "og:title", content: "Locations — Pawna to the Konkan Coast" },
      {
        property: "og:description",
        content: "Curated Maharashtra destinations grouped by district, from Pawna Lake to Redi Beach.",
      },
    ],
  }),
  component: LocationsPage,
});

const districts = ["Pune District", "Raigad District", "Ratnagiri District", "Sindhudurg District"];
const types = ["Beach Destination", "Lake Destination", "Hill Station", "Nature Escape"];
const bestFor = ["Couples", "Families", "Groups", "Adventure", "Relaxation"];

function LocationsPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [district, setDistrict] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [headerOffset, setHeaderOffset] = useState(64);

  const searchShellRef = useRef<HTMLDivElement>(null);
  useHideOnScroll([searchShellRef], { lockMs: 700, threshold: 64 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return locations.filter((l) => {
      const matchQ =
        !q ||
        [l.name, l.district, l.region, l.category].some((v) => v.toLowerCase().includes(q));
      const matchD = !district || l.region === district || l.district === district;
      const matchT = !type || l.category === type;
      return matchQ && matchD && matchT;
    });
  }, [query, district, type]);

  const isFiltering = query.trim().length > 0 || !!district || !!type;
  const bySlug = new Map(locations.map((l) => [l.slug, l]));

  return (
    <div className="pb-6">
      <AppTopNav onHeightChange={setHeaderOffset} />

      {/*
        Separate glass search row — no strip background.
        Hides behind the solid header on scroll up; returns on scroll down.
      */}
      <div style={{ top: headerOffset }} className="sticky z-30">
        <div
          ref={searchShellRef}
          data-visible="true"
          className={cn(
            "group hide-on-scroll-panel grid",
            "data-[visible=true]:grid-rows-[1fr] data-[visible=true]:opacity-100",
            "data-[visible=false]:grid-rows-[0fr] data-[visible=false]:opacity-0",
            "data-[visible=false]:pointer-events-none",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="hide-on-scroll-inner px-5 pt-3 pb-3 group-data-[visible=false]:-translate-y-3 group-data-[visible=false]:opacity-0">
              <div className="flex items-center gap-2.5">
                <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-3 shadow-[0_8px_28px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
                  <Search className="h-[17px] w-[17px] shrink-0 text-white/75" strokeWidth={1.7} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search locations..."
                    aria-label="Search locations"
                    className="min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/45"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  aria-label="Filters"
                  className={cn(
                    "press grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 shadow-[0_8px_28px_rgba(0,0,0,0.28)] backdrop-blur-2xl",
                    district || type ? "text-[#E0B84A]" : "text-white/90",
                  )}
                >
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={1.7} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isFiltering ? (
        <section className="px-5 pt-4">
          <p className="mb-3 text-[12px] text-ink-muted">{filtered.length} destinations found</p>
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((l) => (
              <PinnedLocationCard
                key={l.slug}
                slug={l.slug}
                name={l.name}
                sub={l.district}
                image={l.heroImage}
                className="aspect-[4/3]"
              />
            ))}
          </div>
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-ink-muted">No destinations match your search.</p>
          ) : null}
        </section>
      ) : (
        <div className="space-y-7 pt-4">
          {locationGroups.map((g) => {
            const items = g.slugs.map((s) => bySlug.get(s)).filter(Boolean) as Location[];
            return (
              <section key={g.index} className="px-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="min-w-0 text-[14.5px] font-semibold leading-snug text-ink">
                    <span className="text-gold">{g.index}.</span> {g.title}
                  </h2>
                  <span className="press flex shrink-0 items-center gap-1 pt-0.5 text-[12.5px] font-medium text-gold">
                    View all
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </span>
                </div>

                {g.layout === "trio" ? (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {items.map((l) => (
                      <PinnedLocationCard
                        key={l.slug}
                        slug={l.slug}
                        name={l.name}
                        sub={l.district}
                        image={l.heroImage}
                        className="aspect-[3/3.5]"
                      />
                    ))}
                  </div>
                ) : null}

                {g.layout === "feature" ? (
                  <div className="mt-3">
                    {items.map((l) => (
                      <PinnedLocationCard
                        key={l.slug}
                        slug={l.slug}
                        name={l.shortName}
                        sub={l.district}
                        image={l.heroImage}
                        className="aspect-[16/10]"
                      />
                    ))}
                  </div>
                ) : null}

                {g.layout === "grid" ? (
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    {items.map((l, i) => (
                      <RankedLocationCard
                        key={l.slug}
                        rank={i + 1}
                        slug={l.slug}
                        name={l.name}
                        sub={l.district}
                        image={l.heroImage}
                        className="aspect-[3/3.2]"
                      />
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-[480px] rounded-t-[26px] border border-hairline bg-[#0b0e12] p-5 pb-[max(24px,env(safe-area-inset-bottom))]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[22px] font-semibold text-ink">Filters</h3>
              <IconButton label="Close filters" size="sm" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" strokeWidth={1.8} />
              </IconButton>
            </div>

            <FilterGroup title="District" options={districts} value={district} onChange={setDistrict} />
            <FilterGroup title="Destination Type" options={types} value={type} onChange={setType} />
            <FilterGroup title="Best For" options={bestFor} value={null} onChange={() => {}} />

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setDistrict(null);
                  setType(null);
                }}
                className="press flex-1 rounded-[14px] border border-hairline py-3 text-[13.5px] font-medium text-ink-soft"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="press gold-gradient flex-1 rounded-[14px] py-3 text-[13.5px] font-semibold text-[#141007]"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterGroup({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="mt-5">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-gold">{title}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(value === o ? null : o)}
            className={cn(
              "press rounded-full border px-3.5 py-2 text-[12.5px]",
              value === o
                ? "border-gold bg-gold/15 text-gold"
                : "border-hairline bg-[#11151a] text-ink-soft",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
