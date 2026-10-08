import { useEffect, useState } from "react";
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { ArrowRight, Download, Heart, Home, Leaf, RefreshCw, Sparkles, Star } from "lucide-react-native";
import { AppScreen } from "@/components/foundation";
import { CustomerFooter, useCustomerChrome } from "@/components/customer";
import { DiscoveryHeader, LocationCard, PropertyCard } from "@/components/discovery";
import { popularLocations } from "@/data/discovery";
import { usePropertyCatalogue } from "@/hooks/use-property-catalogue";
import { colors, fontFamilies, layout, motion, radii, spacing } from "@/theme";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { focusRingProps, useFinePointer } from "@/hooks/use-fine-pointer";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useIsDesktop, useIsTablet } from "@/hooks/use-window-class";

const heroes = [
  require("../../../assets/images/hero-1.jpg"),
  require("../../../assets/images/hero-2.jpg"),
  require("../../../assets/images/hero-3.jpg"),
  require("../../../assets/images/hero-4.jpg"),
];

const stats = [
  { Icon: Home, value: "50+", label: "Luxury\nProperties" },
  { Icon: Star, value: "4.6", label: "Guest\nRating" },
  { Icon: Heart, value: "10K+", label: "Happy\nGuests" },
  { Icon: Leaf, value: "100%", label: "Nature\nScenery" },
];

const webPress = Platform.select({
  web: {
    cursor: "pointer",
    transitionProperty: "transform, opacity, background-color, border-color",
    transitionDuration: "160ms",
    transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
  } as object,
  default: {},
});

export default function HomeScreen() {
  const router = useRouter();
  const { onScroll } = useCustomerChrome();
  const { canShow, install } = usePwaInstall();
  const { items } = usePropertyCatalogue();
  const [hero, setHero] = useState(0);
  const [veil, setVeil] = useState<number | null>(null);
  const [cover] = useState(() => new Animated.Value(0));
  const [tab, setTab] = useState<"top" | "recommended">("top");
  const isDesktop = useIsDesktop();
  const isTablet = useIsTablet();
  const reducedMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const { width } = useWindowDimensions();
  const propertyWidth = isTablet
    ? Math.min(320, Math.max(240, width - 48))
    : Math.min(290, Math.max(220, width - 28));

  const filteredProperties = items.filter((p) => p.tab === tab);

  const selectHero = (next: number, animate: boolean) => {
    const index = (next + heroes.length) % heroes.length;
    if (index === hero) return;
    if (animate && !reducedMotion) setVeil((current) => current ?? hero);
    else setVeil(null);
    setHero(index);
  };

  useEffect(() => {
    if (veil == null) return;
    cover.setValue(1);
    const anim = Animated.timing(cover, {
      toValue: 0,
      duration: motion.standardMs,
      easing: Easing.bezier(motion.easeOut[0], motion.easeOut[1], motion.easeOut[2], motion.easeOut[3]),
      useNativeDriver: Platform.OS !== "web",
    });
    anim.start(({ finished }) => {
      if (finished) setVeil(null);
    });
    return () => anim.stop();
  }, [cover, hero, veil]);

  const pressStyle = (pressed: boolean, hovered: boolean) => [
    pressed ? (reducedMotion ? styles.actionPressedStill : styles.actionPressed) : null,
    finePointer && hovered && !pressed && !reducedMotion ? styles.actionHover : null,
  ];

  return (
    <AppScreen
      fullWidth
      contentContainerStyle={[styles.screen, isDesktop && styles.screenDesktop]}
      scrollProps={{ onScroll, scrollEventThrottle: 16 }}
    >
      <View style={[styles.hero, isTablet && styles.heroTablet, isDesktop && styles.heroDesktop]}>
        <Image source={heroes[hero]} contentFit="cover" style={StyleSheet.absoluteFill} />
        {veil != null ? (
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: cover }]}>
            <Image source={heroes[veil]} contentFit="cover" style={StyleSheet.absoluteFill} />
          </Animated.View>
        ) : null}
        <LinearGradient
          colors={["rgba(5,7,9,0.35)", "rgba(5,7,9,0.45)", "rgba(5,7,9,0.98)"]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View accessibilityRole="tablist" style={[styles.dots, isTablet && styles.dotsTablet, isDesktop && styles.dotsDesktop]}>
          {heroes.map((_, i) => (
            <Pressable
              key={i}
              accessibilityRole="tab"
              accessibilityLabel={`Show destination photo ${i + 1} of ${heroes.length}`}
              accessibilityState={{ selected: i === hero }}
              hitSlop={{ top: 16, bottom: 16, left: 5, right: 5 }}
              onPress={() => selectHero(i, true)}
              {...focusRingProps({
                "aria-selected": i === hero,
                onKeyDown: (event: { key: string; preventDefault: () => void }) => {
                  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                  event.preventDefault();
                  selectHero(hero + (event.key === "ArrowRight" ? 1 : -1), false);
                },
              })}
              style={(state) => [
                styles.dotHit,
                i === hero ? styles.dotHitActive : styles.dotHitIdle,
                webPress,
                pressStyle(state.pressed, state.hovered),
              ]}
            >
              <View style={[styles.dot, i === hero && styles.dotActive]} />
            </Pressable>
          ))}
        </View>
        <View style={[styles.heroContainer, isDesktop && styles.heroContainerDesktop]}>
          <View style={[styles.heroCopy, isTablet && styles.heroCopyTablet, isDesktop && styles.heroCopyDesktop]}>
            <View style={styles.premium}>
              <Star size={13} fill={colors.gold} color={colors.gold} />
              <Text style={styles.premiumText}>Premium Luxury Stays</Text>
            </View>
            <Text style={[styles.heroTitle, isTablet && styles.heroTitleTablet, isDesktop && styles.heroTitleDesktop]}>
              Experience Extraordinary Escapes —{" "}
              <Text style={styles.heroAccent}>Pawna to Konkan.</Text>
            </Text>
            <Text style={[styles.heroBody, isTablet && styles.heroBodyTablet, isDesktop && styles.heroBodyDesktop]}>
              Discover handpicked luxury glamping domes, hillside villas, and lakeside cottages near Pawna
              Lake, Lonavala, and across the entire Konkan coast — from Alibagh to Diveagar.
            </Text>
            <View style={[styles.heroActions, isDesktop && styles.heroActionsDesktop]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Show the next destination photo"
                {...focusRingProps()}
                onPress={() => selectHero(hero + 1, true)}
                style={({ pressed, hovered }) => [styles.switch, webPress, pressStyle(pressed, hovered)]}
              >
                <RefreshCw size={16} color={colors.actionInk} />
                <Text style={styles.switchText}>Switch</Text>
              </Pressable>
              {canShow ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Install BookStayX app"
                  {...focusRingProps()}
                  onPress={() => void install()}
                  style={({ pressed, hovered }) => [styles.install, webPress, pressStyle(pressed, hovered)]}
                >
                  <Download size={16} color={colors.gold} />
                  <Text style={styles.installText}>Install App</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <View style={[styles.stats, isTablet && styles.statsTablet, isDesktop && styles.statsDesktop]}>
          {stats.map(({ Icon, value, label }, i) => (
            <View key={value} style={[styles.stat, width < 360 && styles.statNarrow, i > 0 && styles.statBorder]}>
              <Icon size={isDesktop ? 22 : isTablet ? 20 : 18} color={colors.gold} />
              <View style={styles.statCopy}>
                <Text style={[styles.statValue, isTablet && styles.statValueTablet, isDesktop && styles.statValueDesktop]}>{value}</Text>
                <Text style={[styles.statLabel, isTablet && styles.statLabelTablet, isDesktop && styles.statLabelDesktop]}>{label}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.section, isTablet && styles.sectionTablet, isDesktop && styles.sectionDesktop]}>
          <DiscoveryHeader
            label="Popular Locations"
            lead="Popular"
            accent="Locations"
            copy="Explore our curated destinations, offering unique experiences and breathtaking landscapes, from serene lakes to the Arabian Sea."
          />
          <View style={[styles.locationGrid, isDesktop && styles.locationGridDesktop]}>
            {popularLocations.map((l) => (
              <LocationCard key={l.slug} location={l} compact />
            ))}
          </View>
          <View style={[styles.seeAllWrapper, isDesktop && styles.seeAllWrapperDesktop]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="See all locations"
              {...focusRingProps()}
              onPress={() => router.push("/locations" as Href)}
              style={({ pressed, hovered }) => [
                styles.seeAllBtn,
                webPress,
                pressStyle(pressed, hovered),
                pressed && styles.seeAllBtnPressed,
              ]}
            >
              <Text style={styles.seeAllText}>See All Locations</Text>
              <ArrowRight size={15} color={colors.gold} strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.properties, isTablet && styles.propertiesTablet, isDesktop && styles.propertiesDesktop]}>
          <DiscoveryHeader lead="Explore Our" accent="Properties" />
          <View accessibilityRole="tablist" style={[styles.tabs, isDesktop && styles.tabsDesktop]}>
            {[
              { id: "top" as const, label: "Top Rated", Icon: Star },
              { id: "recommended" as const, label: "Recommended", Icon: Sparkles },
            ].map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => setTab(id)}
                  {...focusRingProps({
                    "aria-selected": active,
                    onKeyDown: (event: { key: string; preventDefault: () => void }) => {
                      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                      event.preventDefault();
                      setTab(id === "top" ? "recommended" : "top");
                    },
                  })}
                  style={({ pressed, hovered }) => [
                    styles.tab,
                    webPress,
                    active && styles.tabActive,
                    pressStyle(pressed, hovered),
                    pressed && styles.tabPressed,
                  ]}
                >
                  <Icon
                    size={13}
                    color={active ? colors.actionInk : colors.textMuted}
                    fill={active && id === "top" ? colors.actionInk : "none"}
                    strokeWidth={2}
                  />
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {isDesktop ? (
            <View style={styles.desktopPropertyGrid}>
              {filteredProperties.map((p) => (
                <PropertyCard key={p.id} property={p} grid />
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              directionalLockEnabled
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsHorizontalScrollIndicator={false}
              snapToInterval={propertyWidth + 12}
              decelerationRate="fast"
              contentContainerStyle={styles.propertyRow}
            >
              {filteredProperties.map((p) => (
                <PropertyCard key={p.id} property={p} style={{ width: propertyWidth }} />
              ))}
            </ScrollView>
          )}
        </View>
      </View>
      <CustomerFooter />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: layout.bottomChromeReserve, width: "100%" },
  screenDesktop: { paddingBottom: layout.desktopBottomReserve },
  mainContainer: {
    width: "100%",
    maxWidth: layout.expandedContentMaxWidth,
    alignSelf: "center",
    paddingHorizontal: 14,
  },
  hero: { minHeight: 620, paddingTop: 120, justifyContent: "flex-end", overflow: "hidden", width: "100%" },
  heroTablet: { minHeight: 680 },
  heroDesktop: { minHeight: 720 },
  heroContainer: {
    width: "100%",
    justifyContent: "flex-end",
  },
  heroContainerDesktop: {
    maxWidth: layout.headerMaxWidth,
    alignSelf: "center",
  },
  dots: {
    position: "absolute",
    top: 66,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dotsTablet: { top: 76 },
  dotsDesktop: { top: 84 },
  dotHit: { height: 28, alignItems: "center", justifyContent: "center" },
  dotHitIdle: { width: 22, marginHorizontal: -8 },
  dotHitActive: { minWidth: 24 },
  dot: { width: 6, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,.35)" },
  dotActive: { width: 24, backgroundColor: colors.gold },
  heroCopy: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  heroCopyTablet: { paddingHorizontal: 32, paddingBottom: 52, maxWidth: 720 },
  heroCopyDesktop: { paddingHorizontal: 44, paddingBottom: 64, maxWidth: 960 },
  premium: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(224,184,74,.4)",
    backgroundColor: "rgba(0,0,0,.35)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  premiumText: { color: colors.goldPale, fontFamily: fontFamilies.sansMedium, fontSize: 11.5 },
  heroTitle: {
    maxWidth: 330,
    marginTop: 16,
    color: colors.text,
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 32,
    lineHeight: 36,
  },
  heroTitleTablet: {
    maxWidth: 560,
    fontSize: 40,
    lineHeight: 46,
  },
  heroTitleDesktop: {
    maxWidth: 860,
    fontSize: 56,
    lineHeight: 64,
  },
  heroAccent: { color: colors.gold, fontFamily: fontFamilies.displayItalic },
  heroBody: {
    maxWidth: 350,
    marginTop: 10,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 21,
  },
  heroBodyTablet: {
    maxWidth: 540,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 12,
  },
  heroBodyDesktop: {
    maxWidth: 720,
    fontSize: 16.5,
    lineHeight: 27,
    marginTop: 16,
  },
  heroActions: {
    marginTop: 20,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  heroActionsDesktop: { marginTop: 28 },
  switch: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 99,
    backgroundColor: colors.goldAction,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  switchText: { color: colors.actionInk, fontFamily: fontFamilies.sansSemiBold, fontSize: 13 },
  install: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(224,184,74,.72)",
    backgroundColor: "rgba(5,7,9,.72)",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  installText: { color: colors.gold, fontFamily: fontFamilies.sansSemiBold, fontSize: 13 },
  actionPressed: { opacity: 0.78, transform: [{ scale: motion.pressScale }] },
  actionPressedStill: { opacity: 0.84 },
  actionHover: { transform: [{ scale: 1.015 }] },
  stats: {
    marginHorizontal: 0,
    marginTop: 18,
    flexDirection: "row",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: "#0c1014",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  statsTablet: {
    marginTop: 24,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  statsDesktop: {
    marginHorizontal: 0,
    marginTop: 32,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: "rgba(12, 16, 20, 0.92)",
    borderColor: "rgba(224, 184, 74, 0.18)",
  },
  stat: { width: "25%", minHeight: 35, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  statNarrow: { gap: 4 },
  statCopy: { flexShrink: 1 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: colors.hairline },
  statValue: { color: colors.text, fontFamily: fontFamilies.sansBold, fontSize: 14 },
  statValueTablet: { fontSize: 16 },
  statValueDesktop: { fontSize: 20 },
  statLabel: { marginTop: 3, color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 8.5, lineHeight: 11 },
  statLabelTablet: { fontSize: 10, lineHeight: 13 },
  statLabelDesktop: { fontSize: 12, lineHeight: 15 },
  section: { marginTop: 36, paddingHorizontal: 0 },
  sectionTablet: { marginTop: 48 },
  sectionDesktop: { marginTop: 64, paddingHorizontal: 0 },
  locationGrid: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "flex-start",
  },
  locationGridDesktop: {
    marginTop: 26,
    gap: 16,
  },
  seeAllWrapper: {
    alignItems: "center",
    marginTop: 20,
  },
  seeAllWrapperDesktop: {
    marginTop: 28,
  },
  seeAllBtn: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    ...Platform.select({
      web: {
        boxShadow: "0 4px 18px rgba(0, 0, 0, 0.35)",
      } as object,
      default: {},
    }),
  },
  seeAllBtnPressed: {
    opacity: 0.8,
    backgroundColor: "rgba(224, 184, 74, 0.16)",
    transform: [{ scale: 0.98 }],
  },
  seeAllText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  properties: { marginTop: 40, width: "100%" },
  propertiesTablet: { marginTop: 52 },
  propertiesDesktop: { marginTop: 68, paddingHorizontal: 0 },
  tabs: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 320,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.2)",
    backgroundColor: "rgba(12, 16, 20, 0.95)",
  },
  tabsDesktop: {
    marginTop: 24,
    maxWidth: 340,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
  },
  tabActive: {
    backgroundColor: colors.goldAction,
    ...Platform.select({
      web: {
        boxShadow: "0 2px 10px rgba(217, 165, 42, 0.28)",
      } as any,
      default: {},
    }),
  },
  tabPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  tabText: {
    flexShrink: 1,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12.5,
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: colors.actionInk,
    fontFamily: fontFamilies.sansBold,
  },
  propertyRow: { gap: 12, paddingHorizontal: 0, paddingTop: 16, paddingBottom: 6 },
  desktopPropertyGrid: {
    marginTop: 26,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
});
