import { Helmet } from "react-helmet-async";

export const SITE_URL = "https://pawnahavencamp.com";
export const SITE_NAME = "PawnaHavenCamp";

/**
 * Convert any Cloudinary image URL into a proper 1200×630 social preview.
 * Works by injecting OG-optimised transformations after `/upload/`.
 * Falls back to the site's default OG image if no URL is provided.
 */
export function toOgImage(url?: string | null): string {
  const DEFAULT = `${SITE_URL}/og-image.png`;
  if (!url) return DEFAULT;
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    // Remove any existing transformation chain, then insert OG transform
    return url.replace(
      /\/upload\/([^/]+\/)?/,
      "/upload/w_1200,h_630,c_fill,f_jpg,q_auto/"
    );
  }
  return url;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type JsonLdObject = Record<string, unknown>;

interface SEOProps {
  title: string;
  description: string;
  /** Full canonical URL, e.g. https://pawnahavencamp.com/property/dome-resort */
  canonical?: string;
  /** Raw image URL — auto-converted to 1200×630 Cloudinary OG image */
  ogImage?: string | null;
  /** og:type — defaults to "website" */
  ogType?: string;
  /** Comma-separated keywords for the meta keywords tag */
  keywords?: string;
  /** Set true for admin/owner/ticket/private pages */
  noindex?: boolean;
  /** One or more JSON-LD schema objects to inject as <script type="application/ld+json"> */
  schema?: JsonLdObject | JsonLdObject[];
  /** Twitter card type — defaults to summary_large_image */
  twitterCard?: "summary" | "summary_large_image";
}

// ─── Component ────────────────────────────────────────────────────────────────

const SEO = ({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  keywords,
  noindex = false,
  schema,
  twitterCard = "summary_large_image",
}: SEOProps) => {
  const resolvedOgImage = toOgImage(ogImage);
  const resolvedCanonical = canonical ?? SITE_URL;
  const schemas = schema ? (Array.isArray(schema) ? schema : [schema]) : [];

  return (
    <Helmet>
      {/* ── Primary ─────────────────────────────────────────────────── */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noindex ? "noindex,nofollow" : "index,follow"} />
      <link rel="canonical" href={resolvedCanonical} />

      {/* ── Open Graph ──────────────────────────────────────────────── */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={resolvedCanonical} />
      <meta property="og:image" content={resolvedOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />

      {/* ── Twitter Card ────────────────────────────────────────────── */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedOgImage} />

      {/* ── JSON-LD Structured Data ─────────────────────────────────── */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
