import SEO, { SITE_URL } from "@/components/SEO";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Destinations from "@/components/Destinations";
import Properties from "@/components/Properties";
import FloatingContact from "@/components/FloatingContact";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

// ─── JSON-LD Structured Data ──────────────────────────────────────────────────
// Defined outside the component so they are not re-created on every render.

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "PawnaHavenCamp",
  url: SITE_URL,
  logo: "https://res.cloudinary.com/dwlvmhcav/image/upload/q_auto,f_png/pawnahaven/public_site_icon",
  description:
    "PawnaHavenCamp offers luxury glamping domes, cottages and villas near Pawna Lake and Lonavala, Maharashtra, India.",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "reservations",
    availableLanguage: ["English", "Hindi"],
  },
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "PawnaHavenCamp",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const lodgingBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  name: "PawnaHavenCamp",
  description:
    "Luxury glamping domes, lakeside cottages, and premium villas near Pawna Lake and Lonavala, Maharashtra.",
  url: SITE_URL,
  image:
    "https://res.cloudinary.com/dwlvmhcav/image/upload/w_1200,h_630,c_fill,f_jpg,q_auto/pawnahaven/public_site_icon",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Pawna Lake, Pawna Nagar",
    addressLocality: "Lonavala",
    addressRegion: "Maharashtra",
    postalCode: "410401",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 18.8848,
    longitude: 73.4596,
  },
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "Swimming Pool", value: true },
    { "@type": "LocationFeatureSpecification", name: "Air Conditioning", value: true },
    { "@type": "LocationFeatureSpecification", name: "Meals Included", value: true },
    { "@type": "LocationFeatureSpecification", name: "Bonfire", value: true },
    { "@type": "LocationFeatureSpecification", name: "Parking", value: true },
  ],
  priceRange: "₹₹₹",
  currenciesAccepted: "INR",
  paymentAccepted: "Cash, Credit Card, UPI",
  touristType: ["Family", "Couple", "Friends", "Corporate"],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const Index = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const pendingBookingId = localStorage.getItem("pending_booking_id");
    const pendingBookingTime = localStorage.getItem("pending_booking_time");
    if (pendingBookingId && pendingBookingTime) {
      const elapsed = Date.now() - parseInt(pendingBookingTime);
      if (elapsed < 30 * 60 * 1000) {
        window.location.href = `/ticket?booking_id=${pendingBookingId}`;
        return;
      } else {
        localStorage.removeItem("pending_booking_id");
        localStorage.removeItem("pending_booking_time");
      }
    }

    const savedPosition = sessionStorage.getItem("homeScrollPosition");

    const loaderTimer = setTimeout(() => {
      setIsInitialLoading(false);

      if (savedPosition) {
        requestAnimationFrame(() => {
          window.scrollTo({
            top: parseInt(savedPosition),
            behavior: "instant",
          });
          sessionStorage.removeItem("homeScrollPosition");
        });
      }
    }, 500);

    return () => clearTimeout(loaderTimer);
  }, []);

  if (isInitialLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground animate-pulse">
            PawnaHavenCamp
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="PawnaHavenCamp - #1 Luxury Pawna Lake Camping & Lonavala Villa Booking"
        description="PawnaHavenCamp offers the best luxury glamping domes at Pawna Lake and premium villas in Lonavala. Book lakeside camping with pool, AC, and meals. Top-rated stays near Mumbai & Pune."
        keywords="Pawna Lake camping, Pawna Lake resort, Lonavala villa booking, glamping near Mumbai, luxury dome resort, lakeside stay Lonavala, Pawna camping, Pawna Nagar resorts, camping near Pune, weekend getaway Mumbai"
        canonical="https://pawnahavencamp.com"
        schema={[organizationSchema, webSiteSchema, lodgingBusinessSchema]}
      />

      <div className="min-h-screen">
        <Header />
        <main>
          <Hero />
          <Destinations />
          <Properties />
        </main>
        <Footer />
        <FloatingContact />
      </div>
    </>
  );
};

export default Index;
