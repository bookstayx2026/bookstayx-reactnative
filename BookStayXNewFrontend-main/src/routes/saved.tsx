import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Heart, ListFilter } from "lucide-react";
import { AppTopNav } from "@/components/AppTopNav";
import { SavedCategoryIcon, SavedStayCard } from "@/components/SavedStayCard";
import { properties, type PropertyCategory } from "@/data/locations";
import { useHideOnScroll } from "@/hooks/use-hide-on-scroll";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved Stays — BookStayX" },
      { name: "description", content: "Your favorite stays, all in one place." },
      { property: "og:title", content: "Saved Stays — BookStayX" },
      { property: "og:description", content: "Your favorite stays, all in one place." },
    ],
  }),
  component: SavedPage,
});

const categories: {
  id: "all" | Extract<PropertyCategory, "villas" | "camping" | "hotel">;
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "villas", label: "Villas" },
  { id: "camping", label: "Camping & Cottages" },
  { id: "hotel", label: "Hotel Rooms" },
];

function SavedPage() {
  const [category, setCategory] = useState<(typeof categories)[number]["id"]>("all");
  const [headerOffset, setHeaderOffset] = useState(64);

  const filtersShellRef = useRef<HTMLDivElement>(null);
  useHideOnScroll([filtersShellRef], { lockMs: 700, threshold: 64 });

  const saved = useMemo(() => {
    // Demo: treat current inventory as saved stays
    const base = properties.filter((p) => p.category !== "campings");
    if (category === "all") return base;
    return base.filter((p) => p.category === category);
  }, [category]);

  return (
    <div className="min-h-screen bg-[#0B0E11] pb-4">
      <AppTopNav onHeightChange={setHeaderOffset} />

      {/* Category pills — hide on scroll up, return on scroll down */}
      <div style={{ top: headerOffset }} className="sticky z-30">
        <div
          ref={filtersShellRef}
          data-visible="true"
          className={cn(
            "group hide-on-scroll-panel grid",
            "data-[visible=true]:grid-rows-[1fr] data-[visible=true]:opacity-100",
            "data-[visible=false]:grid-rows-[0fr] data-[visible=false]:opacity-0",
            "data-[visible=false]:pointer-events-none",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="hide-on-scroll-inner px-4 pt-3 pb-3 group-data-[visible=false]:-translate-y-2 group-data-[visible=false]:opacity-0">
              <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {categories.map(({ id, label }) => {
                  const active = category === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setCategory(id)}
                      className={cn(
                        "press inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-[7px] text-[11.5px] font-semibold backdrop-blur-md",
                        active
                          ? "border-[#E0B84A]/70 bg-[#E0B84A]/12 text-white shadow-[0_0_0_1px_rgba(224,184,74,0.15)]"
                          : "border-white/15 bg-white/[0.06] text-[#E8EAED]",
                      )}
                    >
                      <SavedCategoryIcon
                        id={id}
                        className={cn("h-[14px] w-[14px]", active ? "text-[#E0B84A]" : "text-[#E8EAED]")}
                      />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4">
        {/* Count + sort */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#E0B84A]">
            28 Saved Properties
          </p>
          <button
            type="button"
            className="press inline-flex items-center gap-1.5 rounded-full border border-white/14 bg-transparent px-2.5 py-[5px] text-[11px] font-medium text-[#C9CDD4]"
          >
            <ListFilter className="h-[12px] w-[12px]" strokeWidth={1.8} />
            Recently Saved
            <ChevronDown className="h-[12px] w-[12px] text-[#9AA1AB]" strokeWidth={2} />
          </button>
        </div>

        {/* Grid */}
        <div className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-4">
          {saved.map((p, i) => (
            <SavedStayCard key={p.id} property={p} photoCount={12 + ((i * 3) % 10)} />
          ))}
        </div>

        {saved.length === 0 ? (
          <p className="py-12 text-center text-[13px] text-[#8B93A0]">
            No saved stays in this category yet.
          </p>
        ) : null}

        {/* CTA */}
        <div className="mt-5 flex items-center gap-3 rounded-[14px] border border-[#E0B84A]/55 bg-[#12171E] px-3 py-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#F472B6] to-[#E11D48]">
            <Heart className="h-[16px] w-[16px] fill-white text-white" strokeWidth={1.6} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-snug text-white">
              Can&apos;t find what you saved?
            </p>
            <p className="mt-1 text-[10.5px] leading-snug text-[#8B93A0]">
              Explore more amazing stays near Pawna Lake & Lonavala.
            </p>
          </div>
          <Link
            to="/properties"
            className="press inline-flex shrink-0 items-center gap-1 rounded-full border border-[#E0B84A] px-2.5 py-2 text-[10.5px] font-semibold text-[#E0B84A]"
          >
            Explore All Properties
            <ArrowRight className="h-[12px] w-[12px]" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </div>
  );
}
