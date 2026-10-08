import { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { ArrowRight, Download, Heart, Home, Leaf, RefreshCw, Sparkles, Star } from "lucide-react-native";
import { AppScreen } from "@/components/foundation";
import { CustomerFooter, useCustomerChrome } from "@/components/customer";
import { DiscoveryHeader, LocationCard, PropertyCard } from "@/components/discovery";
import { popularLocations } from "@/data/discovery";
import { usePropertyCatalogue } from "@/hooks/use-property-catalogue";
import { colors, fontFamilies, layout, radii, spacing } from "@/theme";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { useIsDesktop, useWindowClass } from "@/hooks/use-window-class";

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

export default function HomeScreen() {
  const router = useRouter();
  const { onScroll } = useCustomerChrome();
  const { canShow, install } = usePwaInstall();
  const { items } = usePropertyCatalogue();
  const [hero, setHero] = useState(0);
  const [tab, setTab] = useState<"top" | "recommended">("top");
  const isDesktop = useIsDesktop();
  const windowClass = useWindowClass();

  const filteredProperties = items.filter((p) => p.tab === tab);

  return (
    <AppScreen
      fullWidth
      contentContainerStyle={[styles.screen, isDesktop && styles.screenDesktop]}
      scrollProps={{ onScroll, scrollEventThrottle: 16 }}
    >
      <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
        <Image source={heroes[hero]} contentFit="cover" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={["rgba(5,7,9,0.35)", "rgba(5,7,9,0.45)", "rgba(5,7,9,0.98)"]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.dots, isDesktop && styles.dotsDesktop]}>
          {heroes.map((_, i) => (
            <View key={i} style={[styles.dot, i === hero && styles.dotActive]} />
          ))}
        </View>
        <View style={[styles.heroContainer, isDesktop && styles.heroContainerDesktop]}>
          <View style={[styles.heroCopy, isDesktop && styles.heroCopyDesktop]}>
            <View style={styles.premium}>
              <Star size={13} fill={colors.gold} color={colors.gold} />
              <Text style={styles.premiumText}>Premium Luxury Stays</Text>
            </View>
            <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>
              Experience Extraordinary Escapes —{" "}
              <Text style={styles.heroAccent}>Pawna to Konkan.</Text>
            </Text>
            <Text style={[styles.heroBody, isDesktop && styles.heroBodyDesktop]}>
              Discover handpicked luxury glamping domes, hillside villas, and lakeside cottages near Pawna
              Lake, Lonavala, and across the entire Konkan coast — from Alibagh to Diveagar.
            </Text>
            <View style={[styles.heroActions, isDesktop && styles.heroActionsDesktop]}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setHero((hero + 1) % heroes.length)}
                style={({ pressed }) => [styles.switch, pressed && styles.actionPressed]}
              >
                <RefreshCw size={16} color={colors.actionInk} />
                <Text style={styles.switchText}>Switch</Text>
              </Pressable>
              {canShow ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Install BookStayX app"
                  onPress={() => void install()}
                  style={({ pressed }) => [styles.install, pressed && styles.actionPressed]}
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
        <View style={[styles.stats, isDesktop && styles.statsDesktop]}>
          {stats.map(({ Icon, value, label }, i) => (
            <View key={value} style={[styles.stat, i > 0 && styles.statBorder]}>
              <Icon size={isDesktop ? 22 : 18} color={colors.gold} />
              <View>
                <Text style={[styles.statValue, isDesktop && styles.statValueDesktop]}>{value}</Text>
                <Text style={[styles.statLabel, isDesktop && styles.statLabelDesktop]}>{label}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
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
              onPress={() => router.push("/locations" as Href)}
              style={({ pressed }) => [
                styles.seeAllBtn,
                pressed && styles.seeAllBtnPressed,
                Platform.select({
                  web: { cursor: "pointer", outlineStyle: "none" } as any,
                  default: {},
                }),
              ]}
            >
              <Text style={styles.seeAllText}>See All Locations</Text>
              <ArrowRight size={15} color={colors.gold} strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.properties, isDesktop && styles.propertiesDesktop]}>
          <DiscoveryHeader lead="Explore Our" accent="Properties" />
          <View style={[styles.tabs, isDesktop && styles.tabsDesktop]}>
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
                  style={({ pressed }) => [
                    styles.tab,
                    active && styles.tabActive,
                    pressed && styles.tabPressed,
                    Platform.select({
                      web: { cursor: "pointer", outlineStyle: "none" } as any,
                      default: {},
                    }),
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
              showsHorizontalScrollIndicator={false}
              snapToInterval={302}
              decelerationRate="fast"
              contentContainerStyle={styles.propertyRow}
            >
              {filteredProperties.map((p) => (
                <PropertyCard key={p.id} property={p} />
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
  hero: { height: 620, justifyContent: "flex-end", overflow: "hidden", width: "100%" },
  heroDesktop: { height: 720 },
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
    top: 78,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dotsDesktop: { top: 96 },
  dot: { width: 6, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,.35)" },
  dotActive: { width: 24, backgroundColor: colors.gold },
  heroCopy: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
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
  actionPressed: { opacity: 0.78, transform: [{ scale: 0.975 }] },
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
  statBorder: { borderLeftWidth: 1, borderLeftColor: colors.hairline },
  statValue: { color: colors.text, fontFamily: fontFamilies.sansBold, fontSize: 14 },
  statValueDesktop: { fontSize: 20 },
  statLabel: { marginTop: 3, color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 8.5, lineHeight: 11 },
  statLabelDesktop: { fontSize: 12, lineHeight: 15 },
  section: { marginTop: 36, paddingHorizontal: 0 },
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
        transition: "all 0.2s ease",
        boxShadow: "0 4px 18px rgba(0, 0, 0, 0.35)",
      } as any,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 16,
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
