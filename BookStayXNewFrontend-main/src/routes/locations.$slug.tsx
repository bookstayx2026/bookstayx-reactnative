import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  Car,
  Heart,
  MapIcon,
  MapPin,
  Navigation,
  Palmtree,
  Play,
  Share2,
  Sparkles,
  Star,
  Sun,
  Users,
  Waves,
} from "lucide-react";
import { IconButton } from "@/components/brand";
import { getLocation } from "@/data/locations";

export const Route = createFileRoute("/locations/$slug")({
  loader: ({ params }) => {
    const location = getLocation(params.slug);
    if (!location) throw notFound();
    return { location };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Location unavailable" }, { name: "robots", content: "noindex" }] };
    }
    const l = loaderData.location;
    const title = `${l.name} — Location Guide | BookStayX`;
    return {
      meta: [
        { title },
        { name: "description", content: l.description },
        { property: "og:title", content: title },
        { property: "og:description", content: l.description },
      ],
    };
  },
  component: LocationDetail,
});

const highlightIcons = [Waves, Sparkles, Sun, Palmtree];

function LocationDetail() {
  const { location } = Route.useLoaderData();
  const router = useRouter();

  return (
    <div className="pb-6">
      {/* HERO */}
      <section className="relative min-h-[430px] overflow-hidden">
        <img
          src={location.heroImage}
          alt={location.name}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="hero-shade absolute inset-0" />

        <div className="relative px-5 pt-[max(14px,env(safe-area-inset-top))]">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <IconButton label="Go back" onClick={() => router.history.back()}>
              <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.7} />
            </IconButton>
            <p className="truncate text-center text-[16px] font-semibold text-ink">Location Guide</p>
            <div className="flex items-center gap-2">
              <IconButton label="Save location">
                <Heart className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </IconButton>
              <IconButton label="Share location">
                <Share2 className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </IconButton>
            </div>
          </div>

          <div className="mt-16">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/45 bg-black/45 px-3 py-1.5 backdrop-blur-md">
              <MapPin className="h-3.5 w-3.5 text-gold" strokeWidth={1.8} />
              <span className="text-[11.5px] font-medium text-gold">{location.district}</span>
            </span>

            <h1 className="mt-3 font-display text-[38px] font-semibold leading-[1.08] text-ink">
              {location.name}
            </h1>
            <p className="mt-1.5 text-[15px] font-medium text-ink">{location.tagline}</p>

            <div className="mt-3 flex items-end gap-3">
              <p className="min-w-0 flex-1 text-[12.5px] leading-[1.6] text-ink-soft">
                {location.description}
              </p>
              <div className="shrink-0 rounded-[16px] border border-hairline bg-[#0b0e12]/90 px-4 py-3 text-center backdrop-blur-md">
                <div className="flex items-center justify-center gap-1.5">
                  <Star className="h-4 w-4 fill-gold text-gold" strokeWidth={1.2} />
                  <span className="text-[20px] font-bold leading-none text-ink">{location.rating}</span>
                </div>
                <p className="mt-1.5 text-[10px] text-ink-muted">{location.reviews}</p>
              </div>
            </div>
          </div>
          <div className="h-6" />
        </div>
      </section>

      {/* INFO STRIP */}
      <section className="border-y border-hairline">
        <div className="no-scrollbar flex gap-0 overflow-x-auto px-5 py-4">
          <Info Icon={Palmtree} title={location.category} />
          <Info Icon={CalendarDays} title="Best Time to Visit" value={location.bestTime} divided />
          <Info Icon={Car} title={location.distanceFromPune} value="from Pune" divided />
          <Info Icon={Users} title="Ideal for" value={location.idealFor} divided />
        </div>
      </section>

      {/* GLIMPSES */}
      <section className="mt-6">
        <h2 className="px-5 font-display text-[24px] font-semibold text-ink">
          Glimpses of {location.shortName}
        </h2>
        <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto px-5 pb-1">
          {location.galleryImages.map((img, i) => (
            <div
              key={`${img}-${i}`}
              className="relative h-[150px] w-[210px] shrink-0 overflow-hidden rounded-[15px] border border-white/8"
            >
              <img src={img} alt={`${location.shortName} view ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
              {i === 0 ? (
                <span className="absolute inset-0 grid place-items-center bg-black/25">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-black/55 ring-1 ring-white/25 backdrop-blur-md">
                    <Play className="ml-0.5 h-5 w-5 fill-ink text-ink" strokeWidth={1} />
                  </span>
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="mt-6 px-5">
        <div className="relative overflow-hidden rounded-[18px] border border-hairline bg-[#0c1014] p-4">
          <Palmtree
            className="pointer-events-none absolute -right-4 top-2 h-28 w-28 text-gold/10"
            strokeWidth={0.8}
          />
          <h2 className="relative font-display text-[22px] font-semibold text-ink">
            About {location.name}
          </h2>
          <p className="relative mt-2 text-[12.5px] leading-[1.65] text-ink-soft">{location.about}</p>
          <div className="relative mt-4 flex flex-wrap gap-2">
            {location.highlights.map((h, i) => {
              const Icon = highlightIcons[i % highlightIcons.length] ?? Sparkles;
              return (
                <span
                  key={h}
                  className="inline-flex items-center gap-2 rounded-full border border-hairline bg-[#11151a] px-3 py-2 text-[11.5px] text-ink"
                >
                  <Icon className="h-3.5 w-3.5 text-gold" strokeWidth={1.6} />
                  {h}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* NEARBY */}
      <section className="mt-7 px-5">
        <h2 className="font-display text-[23px] font-semibold leading-tight text-ink">
          Best Places to Visit Near {location.shortName}
        </h2>
        <p className="mt-1 text-[12px] text-ink-muted">Explore amazing spots around {location.shortName}</p>

        <ul className="mt-3 space-y-2.5">
          {location.nearbyPlaces.map((p) => (
            <li key={p.name}>
              <button
                type="button"
                className="press flex w-full items-center gap-3 overflow-hidden rounded-[14px] border border-hairline bg-[#0c1014] pr-3 text-left"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  className="h-[70px] w-[86px] shrink-0 object-cover"
                />
                <span className="min-w-0 flex-1 py-2">
                  <span className="block font-display text-[15.5px] font-semibold leading-tight text-ink">
                    {p.name}
                  </span>
                  <span className="mt-1 block text-[11px] leading-snug text-ink-muted">{p.description}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2.5">
                  <span className="flex items-center gap-1 text-[11.5px] text-ink-soft">
                    <MapPin className="h-3.5 w-3.5 text-gold" strokeWidth={1.7} />
                    {p.distance}
                  </span>
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-gold/50 text-gold">
                    <Navigation className="h-4 w-4" strokeWidth={1.7} />
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* STAY CTA */}
      <section className="mt-6 px-5">
        <div className="rounded-[18px] border border-gold/35 bg-[#0d1014] p-4">
          <div className="flex items-start gap-3">
            <MapIcon className="mt-0.5 h-8 w-8 shrink-0 text-gold" strokeWidth={1.3} />
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-[19px] font-semibold leading-tight text-ink">
                Stay at Best Properties in {location.shortName}
              </h3>
              <p className="mt-1 text-[11.5px] leading-snug text-ink-muted">
                Villas, Cottages, and Beach Stays for a perfect vacation.
              </p>
            </div>
          </div>
          <Link
            to="/properties"
            search={{ location: location.slug }}
            className="press gold-gradient mt-3.5 flex items-center justify-center gap-2 rounded-[13px] px-4 py-3 text-[13.5px] font-semibold text-[#141007]"
          >
            Explore Stays
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Info({
  Icon,
  title,
  value,
  divided,
}: {
  Icon: typeof Palmtree;
  title: string;
  value?: string;
  divided?: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 items-start gap-2 px-4 first:pl-0 ${divided ? "border-l border-hairline" : ""}`}
    >
      <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-gold" strokeWidth={1.5} />
      <div>
        <p className="text-[11.5px] font-medium leading-tight text-ink">{title}</p>
        {value ? <p className="mt-0.5 text-[11px] text-ink-muted">{value}</p> : null}
      </div>
    </div>
  );
}
