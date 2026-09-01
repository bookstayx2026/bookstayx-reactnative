import hero from "@/assets/hero.jpg.asset.json";
import lake from "@/assets/lake.jpg.asset.json";
import hills from "@/assets/hills.jpg.asset.json";
import beach1 from "@/assets/beach1.jpg.asset.json";
import beach2 from "@/assets/beach2.jpg.asset.json";
import beach3 from "@/assets/beach3.jpg.asset.json";
import beach4 from "@/assets/beach4.jpg.asset.json";
import fort from "@/assets/fort.jpg.asset.json";
import temple from "@/assets/temple.jpg.asset.json";
import waterfall from "@/assets/waterfall.jpg.asset.json";
import valley from "@/assets/valley.jpg.asset.json";
import villa1 from "@/assets/villa1.jpg.asset.json";
import villa2 from "@/assets/villa2.jpg.asset.json";
import lighthouse from "@/assets/lighthouse.jpg.asset.json";

/** Lovable hosts media at /__l5e/... — works via Vite proxy in dev; needs absolute URL in prod. */
const DEFAULT_LOVABLE_HOST =
  "id-preview--53ca259a-1d5c-47fe-b39e-41f00b2ff086.lovable.app";

function resolveAssetUrl(path: string): string {
  if (!path || /^(https?:|data:|blob:)/i.test(path)) return path;
  if (import.meta.env.DEV) return path;

  const host = (
    (import.meta.env.VITE_LOVABLE_ASSET_HOST as string | undefined) ||
    DEFAULT_LOVABLE_HOST
  )
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");

  return `https://${host}${path.startsWith("/") ? path : `/${path}`}`;
}

export const IMG = {
  hero: resolveAssetUrl(hero.url),
  lake: resolveAssetUrl(lake.url),
  hills: resolveAssetUrl(hills.url),
  beach1: resolveAssetUrl(beach1.url),
  beach2: resolveAssetUrl(beach2.url),
  beach3: resolveAssetUrl(beach3.url),
  beach4: resolveAssetUrl(beach4.url),
  fort: resolveAssetUrl(fort.url),
  temple: resolveAssetUrl(temple.url),
  waterfall: resolveAssetUrl(waterfall.url),
  valley: resolveAssetUrl(valley.url),
  villa1: resolveAssetUrl(villa1.url),
  villa2: resolveAssetUrl(villa2.url),
  lighthouse: resolveAssetUrl(lighthouse.url),
} as const;

export type ImageKey = keyof typeof IMG;
