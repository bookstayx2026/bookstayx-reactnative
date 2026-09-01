import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import {
  Download,
  Heart,
  Home as HomeIcon,
  Leaf,
  RefreshCw,
  Star,
} from "lucide-react";
import { AppTopNav } from "@/components/AppTopNav";
import { PwaInstallDialog } from "@/components/PwaInstallDialog";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { SectionLabel, SerifTitle } from "@/components/brand";
import { LocationCard } from "@/components/LocationCard";
import { PropertyCard } from "@/components/PropertyCard";
import { popularLocations, properties } from "@/data/locations";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BookStayX — Luxury Glamping & Konkan Villas" },
      {
        name: "description",
        content:
          "Handpicked luxury glamping domes, hillside villas and lakeside cottages near Pawna Lake, Lonavala and across the Konkan coast.",
      },
      { property: "og:title", content: "BookStayX — Luxury Glamping & Konkan Villas" },
      {
        property: "og:description",
        content: "Premium stays from Pawna Lake to Diveagar. Discover extraordinary Konkan escapes.",
      },
    ],
  }),
  component: HomePage,
});

const stats = [
  { Icon: HomeIcon, value: "50+", label: "Luxury\nProperties" },
  { Icon: Star, value: "4.6", label: "Guest\nRating" },
  { Icon: Heart, value: "10K+", label: "Happy\nGuests" },
  { Icon: Leaf, value: "100%", label: "Nature\nScenery" },
];

const tabs = [
  { id: "top", label: "Top Rated" },
  { id: "recommended", label: "Recommended" },
] as const;

const heroImages = [
  { src: "/heroes/hero-1.jpg", alt: "Luxury glamping terrace at golden sunset" },
  { src: "/heroes/hero-2.jpg", alt: "Lakeside balcony at sunrise with mountain views" },
  { src: "/heroes/hero-3.jpg", alt: "Private pool villa under moonlit skies" },
  { src: "/heroes/hero-4.jpg", alt: "Coastal lighthouse view from a cliffside deck" },
] as const;

function HomePage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("top");
  const [heroIndex, setHeroIndex] = useState(0);
  const [installOpen, setInstallOpen] = useState(false);
  const { isInstalled, isIos, canNativeInstall, promptNativeInstall, showInstallOption } = usePwaInstall();
  const shown = properties.filter((p) => p.tab === tab);
  const activeHero = heroImages[heroIndex];

  const handleInstall = useCallback(async () => {
    if (isIos) {
      setInstallOpen(false);
      return;
    }

    if (canNativeInstall) {
      const accepted = await promptNativeInstall();
      if (accepted) setInstallOpen(false);
      return;
    }

    setInstallOpen(false);
  }, [canNativeInstall, isIos, promptNativeInstall]);

  return (
    <div className="pb-8">
      <AppTopNav scrollAware overlay />

      {/* HERO */}
      <section className="relative flex min-h-[620px] flex-col justify-end overflow-hidden">
        <img
          key={activeHero.src}
          src={activeHero.src}
          alt={activeHero.alt}
          width={1280}
          height={1280}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(5, 7, 9, 0.38) 58%, rgba(5, 7, 9, 0.88) 82%, rgba(5, 7, 9, 0.98) 100%)",
          }}
        />

        <div className="absolute inset-x-0 top-[calc(max(10px,env(safe-area-inset-top))+64px)] flex justify-center gap-1.5 px-5">
          {heroImages.map((hero, index) => (
            <span
              key={hero.src}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                index === heroIndex ? "w-6 bg-gold shadow-[0_0_10px_rgba(217,165,42,0.65)]" : "w-1.5 bg-white/35",
              )}
            />
          ))}
        </div>

        <div className="relative px-5 pb-10 pt-28">
          <div className="-translate-y-[10%]">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-black/35 px-3 py-1.5 backdrop-blur-md">
              <Star className="h-3.5 w-3.5 fill-gold text-gold" strokeWidth={1.4} />
              <span className="text-[11.5px] font-medium tracking-wide text-gold-pale">Premium Luxury Stays</span>
            </div>

            <h1 className="mt-4 max-w-[18rem] font-display text-[32px] font-semibold leading-[1.12] text-ink">
              Experience Extraordinary Escapes —{" "}
              <span className="italic text-gold">Pawna to Konkan.</span>
            </h1>

            <p className="mt-2.5 max-w-[20rem] line-clamp-3 text-[13px] leading-[1.58] text-ink-soft/95">
              Discover handpicked luxury glamping domes, hillside villas, and lakeside cottages near Pawna
              Lake, Lonavala, and across the entire Konkan coast — from Alibagh to Diveagar.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 pb-1">
            {showInstallOption ? (
              <button
                type="button"
                onClick={() => setInstallOpen(true)}
                className="press inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-ink backdrop-blur-md"
              >
                <Download className="h-4 w-4 text-gold" strokeWidth={2} />
                Install App
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setHeroIndex((prev) => (prev + 1) % heroImages.length)}
              className="press gold-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-[#141007] shadow-[0_10px_28px_-12px_rgba(217,165,42,0.75)]"
            >
              <RefreshCw className="h-4 w-4" strokeWidth={2} />
              Switch
            </button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mt-4 px-5">
        <div className="relative grid grid-cols-4 rounded-[18px] border border-hairline bg-[#0c1014]/95 px-2 py-4 backdrop-blur-xl">
          {stats.map(({ Icon, value, label }, i) => (
            <div
              key={value}
              className={cn(
                "flex items-start justify-center gap-2 px-1",
                i > 0 && "border-l border-hairline",
              )}
            >
              <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-gold" strokeWidth={1.5} />
              <div className="min-w-0">
                <p className="text-[15px] font-bold leading-none text-ink">{value}</p>
                <p className="mt-1 whitespace-pre-line text-[9.5px] leading-[1.3] text-ink-muted">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* POPULAR LOCATIONS */}
      <section className="mt-9 px-5">
        <SectionLabel>Popular Locations</SectionLabel>
        <div className="mt-2 text-center">
          <SerifTitle lead="Popular" accent="Locations" className="text-[32px]" />
        </div>
        <p className="mx-auto mt-2 max-w-[21rem] text-center text-[12.5px] leading-[1.6] text-ink-soft">
          Explore our curated destinations, offering unique experiences and breathtaking landscapes, from
          serene lakes to the Arabian Sea.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {popularLocations.map((l) => (
            <LocationCard
              key={l.slug}
              slug={l.slug}
              name={l.name}
              sub={l.label}
              image={l.image}
              className="aspect-[3/3.4]"
            />
          ))}
        </div>
      </section>

      {/* PROPERTIES — same content inset as locations; cards share that width */}
      <section className="mt-10">
        <div className="px-5 text-center">
          <SerifTitle lead="Explore Our" accent="Properties" />
        </div>

        <div className="mt-4 px-5">
          <div className="flex rounded-full border border-hairline bg-[#0c1014] p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "press flex-1 rounded-full py-2.5 text-[12.5px] font-medium transition-colors",
                  tab === t.id ? "gold-gradient text-[#141007]" : "text-ink-soft",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div
          key={tab}
          className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-[7.5%] pb-3 [scroll-padding-inline:7.5%]"
        >
          {shown.map((p) => (
            <div key={p.id} className="w-[85%] shrink-0 snap-center">
              <PropertyCard property={p} className="w-full" />
            </div>
          ))}
        </div>
      </section>

      <PwaInstallDialog
        open={installOpen}
        isIos={isIos}
        canNativeInstall={canNativeInstall}
        onInstall={handleInstall}
        onCancel={() => setInstallOpen(false)}
      />
    </div>
  );
}
