import { useMemo, useState } from "react";
import { Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Car,
  CheckCircle2,
  Compass,
  Heart,
  MapPin,
  Navigation,
  Palmtree,
  Play,
  Share2,
  Sparkles,
  Star,
  Sun,
  Umbrella,
  Waves,
  Wind,
} from "lucide-react-native";
import { AppScreen } from "@/components/foundation";
import { PropertyCard } from "@/components/discovery";
import { getLocation, images } from "@/data/discovery";
import { usePropertyCatalogue } from "@/hooks/use-property-catalogue";
import { colors, fontFamilies, layout, radii } from "@/theme";
import { useIsDesktop } from "@/hooks/use-window-class";

const lonavalaNearby = [
  {
    name: "Tiger's Leap & Cliff View",
    description: "Iconic cliff-top viewpoint with panoramic valley vistas and dramatic drop-offs.",
    distance: "8 km",
    image: images.valley,
  },
  {
    name: "Bhushi Dam & Waterfalls",
    description: "Famous waterfall steps and serene water body surrounded by lush greenery.",
    distance: "6 km",
    image: images.waterfall,
  },
  {
    name: "Karla & Bhaja Caves",
    description: "Ancient 2nd-century BC rock-cut Buddhist shrines with majestic prayer halls.",
    distance: "11 km",
    image: images.temple,
  },
  {
    name: "Pawna Lake Sanctuary",
    description: "Idyllic freshwater lake with watersports, boating, and scenic sunset camping.",
    distance: "14 km",
    image: images.lake,
  },
  {
    name: "Lohagad & Visapur Forts",
    description: "Historic twin hill forts offering trekking trails and panoramic mountain panoramas.",
    distance: "15 km",
    image: images.fort,
  },
  {
    name: "Rajmachi Viewpoint",
    description: "Breathtaking vantage point overlooking dense Sahyadri forests and misty hills.",
    distance: "12 km",
    image: images.hills,
  },
];

const generalNearby = [
  {
    name: "Historic Fort Trail",
    description: "Heritage coastal and hill fortifications with spectacular vistas.",
    distance: "12 km",
    image: images.fort,
  },
  {
    name: "Scenic Coastline & Cove",
    description: "Pristine sandy shores, sea breeze, and golden sunset viewpoints.",
    distance: "15 km",
    image: images.beach1,
  },
  {
    name: "Ancient Temple Sanctuary",
    description: "Architectural masterpiece and serene spiritual haven.",
    distance: "18 km",
    image: images.temple,
  },
  {
    name: "Lighthouse & Promontory",
    description: "Iconic lookout point with uninterrupted 360-degree ocean views.",
    distance: "22 km",
    image: images.lighthouse,
  },
];

export default function LocationDetail() {
  const { slug = "lonavala" } = useLocalSearchParams<{ slug: string }>();
  const location = getLocation(slug) || getLocation("lonavala")!;
  const { items } = usePropertyCatalogue();
  const [saved, setSaved] = useState(false);
  const isDesktop = useIsDesktop();

  const stays = useMemo(
    () => items.filter((property) => property.locationSlug === location.slug),
    [items, location.slug]
  );

  const isBeach = location.category === "Beach Destination";
  const isLake = location.category === "Lake Destination";

  // Curated 4-image showcase for modern widescreen presentation
  const galleryItems = useMemo(() => {
    if (location.slug === "lonavala") {
      return [
        { image: images.hills, isVideo: true, title: "Misty Sahyadri Valleys", tag: "VIDEO TOUR" },
        { image: images.waterfall, isVideo: false, title: "Monsoon Cascades", tag: "SCENIC" },
        { image: images.lake, isVideo: false, title: "Pawna Lakefront", tag: "LAKESIDE" },
        { image: images.villa2, isVideo: false, title: "Luxury Private Stays", tag: "STAYS" },
      ];
    }
    if (isBeach) {
      return [
        { image: location.image, isVideo: true, title: `${location.name} Shoreline`, tag: "VIDEO TOUR" },
        { image: images.beach2, isVideo: false, title: "Golden Hour Coast", tag: "BEACH" },
        { image: images.fort, isVideo: false, title: "Coastal Forts", tag: "HERITAGE" },
        { image: images.lighthouse, isVideo: false, title: "Sunset Promontory", tag: "LOOKOUT" },
      ];
    }
    return [
      { image: location.image, isVideo: true, title: `${location.name} Landscape`, tag: "VIDEO TOUR" },
      { image: images.valley, isVideo: false, title: "Scenic Horizons", tag: "NATURE" },
      { image: images.lake, isVideo: false, title: "Water Bodies", tag: "LAKESIDE" },
      { image: images.villa1, isVideo: false, title: "Exclusive Villas", tag: "STAYS" },
    ];
  }, [isBeach, location]);

  const nearbyPlaces = location.slug === "lonavala" ? lonavalaNearby : generalNearby;

  const experiences = isBeach
    ? [
        { title: "Golden Sand Beaches", desc: "Clean shores perfect for sunset strolls & watersports", Icon: Waves },
        { title: "Coastal Forts & Heritage", desc: "Centuries-old sea fortresses with rich history", Icon: Sparkles },
        { title: "Fresh Konkani Dining", desc: "Authentic local seafood and coastal delicacies", Icon: Sun },
        { title: "Private Beachside Villas", desc: "Handpicked luxury villas with direct beach access", Icon: Palmtree },
      ]
    : [
        { title: "Misty Valleys & Treks", desc: "Scenic mountain passes and lush Sahyadri trails", Icon: Compass },
        { title: "Monsoon Waterfalls", desc: "Breathtaking cascades during rainy and winter months", Icon: Waves },
        { title: "Lakeside Relaxation", desc: "Calm water viewpoints and serene bonfire camping", Icon: Wind },
        { title: "Luxury Hillside Villas", desc: "Secluded private pool estates with panoramic views", Icon: Sparkles },
      ];

  const openDirections = (name: string) => {
    void Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${location.district}, Maharashtra`)}`
    );
  };

  const handleShare = () => {
    void Share.share({
      title: `${location.name} Guide — BookStayX`,
      message: `Discover ${location.name} in ${location.district} on BookStayX: ${location.tagline}`,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    });
  };

  return (
    <AppScreen
      contentContainerStyle={[styles.screen, isDesktop && styles.screenDesktop]}
    >
      {/* Hero Section */}
      <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
        <Image source={location.image} contentFit="cover" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={["rgba(5,7,9,0.35)", "rgba(5,7,9,0.72)", "rgba(5,7,9,0.96)"]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Top Navigation & Action Row */}
        <View style={[styles.topbar, isDesktop && styles.topbarDesktop]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to locations"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
              Platform.select({
                web: { cursor: "pointer", outlineStyle: "none" } as any,
                default: {},
              }),
            ]}
          >
            <ArrowLeft size={16} color={colors.gold} />
            <Text style={styles.backButtonText}>Locations Guide</Text>
          </Pressable>

          <View style={styles.topActions}>
            <CircleButton
              label={saved ? "Remove saved location" : "Save location"}
              onPress={() => setSaved(!saved)}
            >
              <Heart
                size={18}
                color={saved ? "#E11D48" : colors.text}
                fill={saved ? "#E11D48" : "transparent"}
              />
            </CircleButton>
            <CircleButton label="Share location" onPress={handleShare}>
              <Share2 size={18} color={colors.text} />
            </CircleButton>
          </View>
        </View>

        {/* Main Hero Content Area */}
        <View style={[styles.heroContent, isDesktop && styles.heroContentDesktop]}>
          <View style={[styles.heroGrid, isDesktop && styles.heroGridDesktop]}>
            
            {/* Left Hero Column: Headline & Intro */}
            <View style={[styles.heroLeftCol, isDesktop && styles.heroLeftColDesktop]}>
              <View style={styles.regionBadge}>
                <MapPin size={12} color={colors.gold} />
                <Text style={styles.regionText}>
                  {location.region.toUpperCase()} • {location.district.toUpperCase()}
                </Text>
              </View>

              <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>
                {location.name}
              </Text>

              <Text style={[styles.heroTagline, isDesktop && styles.heroTaglineDesktop]}>
                {location.tagline}
              </Text>

              <Text style={[styles.heroDescription, isDesktop && styles.heroDescriptionDesktop]}>
                Known for its pristine natural surroundings, peaceful atmosphere, and breathtaking sunsets, {location.name} is one of Maharashtra's premier getaway destinations for couples, families, and nature seekers.
              </Text>

              {/* Quick Action Row */}
              <View style={styles.heroActionRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    const staysEl = typeof document !== "undefined" ? document.getElementById("location-stays") : null;
                    if (staysEl) {
                      staysEl.scrollIntoView({ behavior: "smooth" });
                    } else {
                      router.push(`/properties?location=${location.slug}`);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.primaryHeroBtn,
                    pressed && styles.pressed,
                    Platform.select({
                      web: { cursor: "pointer", outlineStyle: "none" } as any,
                      default: {},
                    }),
                  ]}
                >
                  <Text style={styles.primaryHeroBtnText}>Explore Available Stays</Text>
                  <ArrowRight size={15} color="#120e06" strokeWidth={2.5} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => openDirections(location.name)}
                  style={({ pressed }) => [
                    styles.secondaryHeroBtn,
                    pressed && styles.pressed,
                    Platform.select({
                      web: { cursor: "pointer", outlineStyle: "none" } as any,
                      default: {},
                    }),
                  ]}
                >
                  <Navigation size={14} color={colors.gold} />
                  <Text style={styles.secondaryHeroBtnText}>Get Directions</Text>
                </Pressable>
              </View>
            </View>

            {/* Right Hero Column: Overview Glass Card (Desktop) */}
            <View style={[styles.heroOverviewCard, isDesktop && styles.heroOverviewCardDesktop]}>
              <View style={styles.overviewTop}>
                <View style={styles.ratingBadgeLarge}>
                  <Star size={16} fill={colors.gold} color={colors.gold} />
                  <Text style={styles.ratingValueLarge}>{location.rating.toFixed(1)}</Text>
                  <Text style={styles.ratingReviewsLarge}>({location.reviews})</Text>
                </View>
                <View style={styles.topDestBadge}>
                  <Sparkles size={11} color={colors.gold} />
                  <Text style={styles.topDestText}>TOP DESTINATION</Text>
                </View>
              </View>

              <View style={styles.overviewDivider} />

              <View style={styles.overviewStats}>
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewLabel}>Category</Text>
                  <Text style={styles.overviewValue}>{location.category}</Text>
                </View>
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewLabel}>Best Season</Text>
                  <Text style={styles.overviewValue}>
                    {isBeach ? "Oct – May (Sunny)" : "Jun – Feb (Monsoon & Winter)"}
                  </Text>
                </View>
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewLabel}>Travel Distance</Text>
                  <Text style={styles.overviewValue}>
                    {location.slug === "lonavala"
                      ? "65 km from Pune • 85 km from Mumbai"
                      : "Convenient highway access from Pune & Mumbai"}
                  </Text>
                </View>
              </View>

              <View style={styles.overviewHighlightPills}>
                <View style={styles.overviewPill}>
                  <CheckCircle2 size={12} color={colors.gold} />
                  <Text style={styles.overviewPillText}>Verified Stays</Text>
                </View>
                <View style={styles.overviewPill}>
                  <CheckCircle2 size={12} color={colors.gold} />
                  <Text style={styles.overviewPillText}>Family Friendly</Text>
                </View>
                <View style={styles.overviewPill}>
                  <CheckCircle2 size={12} color={colors.gold} />
                  <Text style={styles.overviewPillText}>Scenic Views</Text>
                </View>
              </View>
            </View>

          </View>
        </View>
      </View>

      {/* Modern Quick Stats Strip */}
      <View style={[styles.statsStrip, isDesktop && styles.statsStripDesktop]}>
        <View style={styles.statItem}>
          <View style={styles.statIconCircle}>
            {isBeach ? <Palmtree size={18} color={colors.gold} /> : <Compass size={18} color={colors.gold} />}
          </View>
          <View>
            <Text style={styles.statLabel}>DESTINATION TYPE</Text>
            <Text style={styles.statValue}>{location.category}</Text>
          </View>
        </View>

        <View style={[styles.statItem, styles.statDivider]}>
          <View style={styles.statIconCircle}>
            <CalendarDays size={18} color={colors.gold} />
          </View>
          <View>
            <Text style={styles.statLabel}>BEST TIME TO VISIT</Text>
            <Text style={styles.statValue}>
              {isBeach ? "Oct – May (Clear Sky)" : "Jun – Feb (Misty & Cool)"}
            </Text>
          </View>
        </View>

        <View style={[styles.statItem, styles.statDivider]}>
          <View style={styles.statIconCircle}>
            <Car size={18} color={colors.gold} />
          </View>
          <View>
            <Text style={styles.statLabel}>ACCESSIBILITY</Text>
            <Text style={styles.statValue}>Scenic Expressway & Road Access</Text>
          </View>
        </View>

        <View style={[styles.statItem, styles.statDivider]}>
          <View style={styles.statIconCircle}>
            <Star size={18} color={colors.gold} />
          </View>
          <View>
            <Text style={styles.statLabel}>TRAVELER RATING</Text>
            <Text style={styles.statValue}>{location.rating.toFixed(1)} / 5.0 Star Rated</Text>
          </View>
        </View>
      </View>

      {/* Content Container (Center Aligned on Desktop) */}
      <View style={[styles.bodyContent, isDesktop && styles.bodyContentDesktop]}>

        {/* Glimpses & Media Showcase */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionBadge}>PHOTO & VIDEO SHOWCASE</Text>
              <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>
                Glimpses of {location.name}
              </Text>
              <Text style={styles.sectionSubtitle}>
                Take a visual journey through the scenic landscapes, misty trails, and serene views.
              </Text>
            </View>
          </View>

          <View style={[styles.galleryGrid, isDesktop && styles.galleryGridDesktop]}>
            {galleryItems.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.galleryCard,
                  isDesktop ? styles.galleryCardDesktop : styles.galleryCardMobile,
                ]}
              >
                <Image source={item.image} contentFit="cover" style={StyleSheet.absoluteFill} />
                <LinearGradient
                  colors={["transparent", "rgba(5,7,9,0.2)", "rgba(5,7,9,0.85)"]}
                  locations={[0, 0.5, 1]}
                  style={StyleSheet.absoluteFill}
                />

                <View style={styles.galleryTagBadge}>
                  <Text style={styles.galleryTagText}>{item.tag}</Text>
                </View>

                {item.isVideo ? (
                  <View style={styles.playOverlay}>
                    <View style={styles.playButtonCircle}>
                      <Play size={20} color="#fff" fill="#fff" />
                    </View>
                  </View>
                ) : null}

                <View style={styles.galleryTitleBox}>
                  <Text numberOfLines={1} style={styles.galleryCardTitle}>
                    {item.title}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* About & Experiences Section */}
        <View style={[styles.aboutCard, isDesktop && styles.aboutCardDesktop]}>
          <View style={styles.aboutHeader}>
            <View style={styles.aboutBadge}>
              <Sparkles size={12} color={colors.gold} />
              <Text style={styles.aboutBadgeText}>LOCAL EXPERIENCES</Text>
            </View>
            <Text style={[styles.aboutTitle, isDesktop && styles.aboutTitleDesktop]}>
              Why Visit {location.name}?
            </Text>
            <Text style={styles.aboutCopy}>
              Situated in the {location.region} region of Maharashtra, {location.name} is famous for its crisp mountain air, panoramic viewpoints, serene water bodies, and laid-back vibe. Whether you are seeking a peaceful weekend retreat away from city bustle or an adventurous road trip with friends, {location.name} provides the ideal balance of nature, luxury stays, and memorable experiences.
            </Text>
          </View>

          <View style={[styles.experienceGrid, isDesktop && styles.experienceGridDesktop]}>
            {experiences.map((exp) => (
              <View key={exp.title} style={[styles.experienceCard, isDesktop && styles.experienceCardDesktop]}>
                <View style={styles.expIconCircle}>
                  <exp.Icon size={18} color={colors.gold} />
                </View>
                <View style={styles.expCopy}>
                  <Text style={styles.expTitle}>{exp.title}</Text>
                  <Text style={styles.expDesc}>{exp.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Best Places to Visit Near Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionBadge}>ATTRACTIONS & SIGHTSEEING</Text>
              <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>
                Best Places to Visit Near {location.name}
              </Text>
              <Text style={styles.sectionSubtitle}>
                Must-visit spots, viewpoints, and landmarks within driving distance of your stay.
              </Text>
            </View>
          </View>

          <View style={[styles.nearbyGrid, isDesktop && styles.nearbyGridDesktop]}>
            {nearbyPlaces.map((place) => (
              <Pressable
                key={place.name}
                accessibilityRole="button"
                accessibilityLabel={`Open directions to ${place.name}`}
                onPress={() => openDirections(place.name)}
                style={({ pressed }) => [
                  styles.nearbyCard,
                  isDesktop && styles.nearbyCardDesktop,
                  pressed && styles.pressed,
                  Platform.select({
                    web: {
                      cursor: "pointer",
                      outlineStyle: "none",
                      transition: "transform 0.2s ease, border-color 0.2s ease",
                    } as any,
                    default: {},
                  }),
                ]}
              >
                <Image source={place.image} contentFit="cover" style={styles.nearbyThumb} />
                <View style={styles.nearbyBody}>
                  <View style={styles.nearbyHeaderRow}>
                    <Text numberOfLines={1} style={styles.nearbyName}>
                      {place.name}
                    </Text>
                    <View style={styles.nearbyDistancePill}>
                      <MapPin size={10} color={colors.gold} />
                      <Text style={styles.nearbyDistanceText}>{place.distance}</Text>
                    </View>
                  </View>
                  <Text numberOfLines={2} style={styles.nearbyDesc}>
                    {place.description}
                  </Text>
                  <View style={styles.directionsActionRow}>
                    <Text style={styles.directionsText}>Get Directions</Text>
                    <Navigation size={12} color={colors.gold} />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* CTA Banner */}
        <View style={[styles.ctaBanner, isDesktop && styles.ctaBannerDesktop]}>
          <LinearGradient
            colors={["rgba(224, 184, 74, 0.18)", "rgba(18, 22, 28, 0.95)", "rgba(11, 14, 18, 0.98)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.ctaContent}>
            <View style={styles.ctaLeft}>
              <View style={styles.ctaBadge}>
                <Sparkles size={11} color={colors.gold} />
                <Text style={styles.ctaBadgeText}>EXCLUSIVE GETAWAYS</Text>
              </View>
              <Text style={[styles.ctaTitle, isDesktop && styles.ctaTitleDesktop]}>
                Ready for your getaway to {location.name}?
              </Text>
              <Text style={styles.ctaSubtitle}>
                Discover private pool villas, cozy lakeside cottages, and hillside retreats with guaranteed best prices.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/properties?location=${location.slug}`)}
              style={({ pressed }) => [
                styles.ctaActionBtn,
                pressed && styles.pressed,
                Platform.select({
                  web: { cursor: "pointer", outlineStyle: "none" } as any,
                  default: {},
                }),
              ]}
            >
              <Text style={styles.ctaActionBtnText}>Browse All Stays</Text>
              <ArrowRight size={16} color="#120e06" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>

        {/* Available Properties Grid */}
        <View id="location-stays" style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionBadge}>CURATED STAYS</Text>
              <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>
                Available Properties Near {location.name}
              </Text>
              <Text style={styles.sectionSubtitle}>
                Handpicked villas, cottages, and nature retreats in and around {location.name}.
              </Text>
            </View>
          </View>

          {stays.length ? (
            <View style={[styles.propertiesGrid, isDesktop && styles.propertiesGridDesktop]}>
              {stays.map((property) => (
                <PropertyCard key={property.id} property={property} grid />
              ))}
            </View>
          ) : (
            <View style={styles.emptyStaysCard}>
              <Compass size={36} color={colors.gold} strokeWidth={1.5} />
              <Text style={styles.emptyStaysTitle}>Properties coming soon</Text>
              <Text style={styles.emptyStaysDesc}>
                We are currently curating the finest private villas and boutique stays in {location.name}. Check back soon or explore neighboring regions.
              </Text>
              <Pressable
                onPress={() => router.push("/properties")}
                style={({ pressed }) => [
                  styles.emptyBrowseBtn,
                  pressed && styles.pressed,
                  Platform.select({
                    web: { cursor: "pointer", outlineStyle: "none" } as any,
                    default: {},
                  }),
                ]}
              >
                <Text style={styles.emptyBrowseBtnText}>Explore All Maharashtra Stays</Text>
              </Pressable>
            </View>
          )}
        </View>

      </View>
    </AppScreen>
  );
}

function CircleButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.circleBtn,
        pressed && styles.pressed,
        Platform.select({
          web: { cursor: "pointer", outlineStyle: "none" } as any,
          default: {},
        }),
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  screen: {
    paddingBottom: layout.bottomChromeReserve + 20,
  },
  screenDesktop: {
    paddingBottom: layout.desktopBottomReserve + 24,
  },

  // Hero Section
  hero: {
    minHeight: 520,
    overflow: "hidden",
    position: "relative",
    justifyContent: "space-between",
  },
  heroDesktop: {
    minHeight: 580,
  },
  topbar: {
    paddingTop: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  topbarDesktop: {
    paddingTop: 24,
    paddingHorizontal: 40,
    maxWidth: 1360,
    alignSelf: "center",
    width: "100%",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: "rgba(11, 14, 18, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
    ...Platform.select({
      web: { backdropFilter: "blur(8px)" } as any,
      default: {},
    }),
  },
  backButtonText: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12.5,
  },
  topActions: {
    flexDirection: "row",
    gap: 10,
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    backgroundColor: "rgba(11, 14, 18, 0.75)",
    ...Platform.select({
      web: { backdropFilter: "blur(8px)" } as any,
      default: {},
    }),
  },

  heroContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  heroContentDesktop: {
    paddingHorizontal: 40,
    paddingBottom: 44,
    maxWidth: 1360,
    alignSelf: "center",
    width: "100%",
  },
  heroGrid: {
    gap: 24,
  },
  heroGridDesktop: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 40,
  },
  heroLeftCol: {
    flex: 1,
  },
  heroLeftColDesktop: {
    maxWidth: 780,
  },
  regionBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.4)",
    marginBottom: 12,
  },
  regionText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 10.5,
    letterSpacing: 1.1,
  },
  heroTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  heroTitleDesktop: {
    fontSize: 50,
    lineHeight: 56,
  },
  heroTagline: {
    marginTop: 8,
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 15,
    lineHeight: 22,
  },
  heroTaglineDesktop: {
    fontSize: 17,
    lineHeight: 24,
  },
  heroDescription: {
    marginTop: 12,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13.5,
    lineHeight: 22,
    maxWidth: 700,
  },
  heroDescriptionDesktop: {
    fontSize: 14.5,
    lineHeight: 23,
  },
  heroActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 22,
    alignItems: "center",
  },
  primaryHeroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.gold,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: radii.pill,
  },
  primaryHeroBtnText: {
    color: "#120e06",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13.5,
  },
  secondaryHeroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radii.pill,
    backgroundColor: "rgba(11, 14, 18, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
  },
  secondaryHeroBtnText: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
  },

  // Overview Glass Card on Desktop
  heroOverviewCard: {
    backgroundColor: "rgba(13, 17, 23, 0.85)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.28)",
    padding: 22,
    ...Platform.select({
      web: {
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45)",
      } as any,
      default: {},
    }),
  },
  heroOverviewCardDesktop: {
    width: 360,
    alignSelf: "flex-end",
  },
  overviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ratingBadgeLarge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingValueLarge: {
    color: colors.text,
    fontFamily: fontFamilies.sansBold,
    fontSize: 18,
  },
  ratingReviewsLarge: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
  },
  topDestBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
  },
  topDestText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  overviewDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginVertical: 14,
  },
  overviewStats: {
    gap: 10,
  },
  overviewItem: {
    flexDirection: "column",
    gap: 2,
  },
  overviewLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 10.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  overviewValue: {
    color: colors.text,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 13,
  },
  overviewHighlightPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  overviewPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  overviewPillText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
  },

  // Stats Strip
  statsStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "rgba(14, 18, 24, 0.95)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.15)",
    gap: 16,
  },
  statsStripDesktop: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    justifyContent: "space-between",
    maxWidth: 1360,
    alignSelf: "center",
    width: "100%",
    borderRadius: 16,
    marginTop: -20,
    zIndex: 20,
    borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)" } as any,
      default: {},
    }),
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 180,
    flex: 1,
  },
  statDivider: {
    borderLeftWidth: 0,
    ...Platform.select({
      web: { borderLeftWidth: 1, borderLeftColor: "rgba(255, 255, 255, 0.08)", paddingLeft: 16 } as any,
      default: {},
    }),
  },
  statIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 9,
    letterSpacing: 1,
  },
  statValue: {
    marginTop: 2,
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12.5,
  },

  // Body Content Container
  bodyContent: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  bodyContentDesktop: {
    paddingHorizontal: 40,
    maxWidth: 1360,
    alignSelf: "center",
    width: "100%",
    marginTop: 36,
  },

  // Sections
  section: {
    marginTop: 36,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 18,
  },
  sectionBadge: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 24,
    lineHeight: 30,
  },
  sectionTitleDesktop: {
    fontSize: 28,
    lineHeight: 34,
  },
  sectionSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
  },

  // Gallery Grid
  galleryGrid: {
    gap: 12,
  },
  galleryGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  galleryCard: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.16)",
    position: "relative",
  },
  galleryCardMobile: {
    aspectRatio: 16 / 9,
  },
  galleryCardDesktop: {
    width: "23.8%",
    aspectRatio: 16 / 11,
    ...Platform.select({
      web: {
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "pointer",
        boxShadow: "0 4px 18px rgba(0, 0, 0, 0.3)",
      } as any,
      default: {},
    }),
  },
  galleryTagBadge: {
    position: "absolute",
    left: 10,
    top: 10,
    backgroundColor: "rgba(11, 14, 18, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
  },
  galleryTagText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 8.5,
    letterSpacing: 0.8,
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  playButtonCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(11, 14, 18, 0.75)",
    borderWidth: 1.5,
    borderColor: "rgba(224, 184, 74, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 3,
  },
  galleryTitleBox: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 10,
  },
  galleryCardTitle: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
  },

  // About Card & Experience Grid
  aboutCard: {
    marginTop: 36,
    backgroundColor: "rgba(14, 18, 24, 0.95)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.2)",
    padding: 22,
  },
  aboutCardDesktop: {
    padding: 32,
  },
  aboutHeader: {
    marginBottom: 22,
  },
  aboutBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  aboutBadgeText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  aboutTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 22,
    lineHeight: 28,
  },
  aboutTitleDesktop: {
    fontSize: 26,
    lineHeight: 32,
  },
  aboutCopy: {
    marginTop: 8,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13.5,
    lineHeight: 22,
    maxWidth: 960,
  },
  experienceGrid: {
    gap: 12,
  },
  experienceGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  experienceCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(18, 24, 32, 0.7)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  experienceCardDesktop: {
    width: "48.8%",
  },
  expIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  expCopy: {
    flex: 1,
  },
  expTitle: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13.5,
  },
  expDesc: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
    lineHeight: 16,
  },

  // Best Places Near Location
  nearbyGrid: {
    gap: 12,
  },
  nearbyGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  nearbyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 18, 24, 0.95)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.14)",
    overflow: "hidden",
    minHeight: 100,
  },
  nearbyCardDesktop: {
    width: "48.8%",
    ...Platform.select({
      web: {
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
      } as any,
      default: {},
    }),
  },
  nearbyThumb: {
    width: 110,
    alignSelf: "stretch",
  },
  nearbyBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
  },
  nearbyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  nearbyName: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 14.5,
    flex: 1,
  },
  nearbyDistancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
  },
  nearbyDistanceText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 10,
  },
  nearbyDesc: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
    lineHeight: 16,
  },
  directionsActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  directionsText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },

  // CTA Banner
  ctaBanner: {
    marginTop: 40,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    overflow: "hidden",
    position: "relative",
    padding: 24,
  },
  ctaBannerDesktop: {
    padding: 36,
  },
  ctaContent: {
    flexDirection: "column",
    gap: 18,
  },
  ctaLeft: {
    flex: 1,
  },
  ctaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  ctaBadgeText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 9.5,
    letterSpacing: 1.1,
  },
  ctaTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 22,
    lineHeight: 28,
  },
  ctaTitleDesktop: {
    fontSize: 28,
    lineHeight: 34,
  },
  ctaSubtitle: {
    marginTop: 6,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 680,
  },
  ctaActionBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.gold,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.pill,
  },
  ctaActionBtnText: {
    color: "#120e06",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13.5,
  },

  // Properties Grid
  propertiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  propertiesGridDesktop: {
    gap: 16,
  },
  emptyStaysCard: {
    paddingVertical: 50,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(14, 18, 24, 0.8)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.15)",
  },
  emptyStaysTitle: {
    marginTop: 12,
    color: colors.text,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 18,
  },
  emptyStaysDesc: {
    marginTop: 6,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    textAlign: "center",
    maxWidth: 440,
    lineHeight: 19,
  },
  emptyBrowseBtn: {
    marginTop: 18,
    backgroundColor: colors.gold,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  emptyBrowseBtnText: {
    color: "#120e06",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
  },
});
