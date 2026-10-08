import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Heart, Sparkles, Compass } from "lucide-react-native";
import { router } from "expo-router";
import { AppScreen } from "@/components/foundation";
import {
  EmptyState,
  useCustomerChrome,
  useCustomerData,
} from "@/components/customer";
import { PropertyCard } from "@/components/discovery";
import { getProperty, type Property, type PropertyCategory } from "@/data/discovery";
import { usePropertyCatalogue } from "@/hooks/use-property-catalogue";
import { colors, fontFamilies, layout, radii } from "@/theme";
import { useIsDesktop } from "@/hooks/use-window-class";

const categories: ["all" | PropertyCategory, string][] = [
  ["all", "All Stays"],
  ["villa", "Villa"],
  ["camping_cottages", "Camping & Cottages"],
  ["resort", "Resort"],
  ["homestay", "Homestay"],
];

export default function SavedScreen() {
  const { onScroll } = useCustomerChrome();
  const { items } = usePropertyCatalogue();
  const { savedIds, toggleSaved } = useCustomerData();
  const [category, setCategory] = useState<"all" | PropertyCategory>("all");
  const isDesktop = useIsDesktop();

  const saved = useMemo(() => {
    const list: Property[] = [];
    const seen = new Set<string>();

    for (const p of items) {
      if (savedIds.includes(p.id) && (category === "all" || p.category === category)) {
        list.push(p);
        seen.add(p.id);
      }
    }

    for (const id of savedIds) {
      if (!seen.has(id)) {
        const fallback = getProperty(id);
        if (fallback && (category === "all" || fallback.category === category)) {
          list.push(fallback);
          seen.add(fallback.id);
        }
      }
    }

    return list;
  }, [items, savedIds, category]);

  return (
    <AppScreen
      contentContainerStyle={[styles.screen, isDesktop && styles.screenDesktop]}
      scrollProps={{ onScroll, scrollEventThrottle: 16 }}
    >
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        
        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Sparkles size={11} color={colors.gold} />
              <Text style={styles.badgeText}>YOUR WISHLIST</Text>
            </View>
          </View>
          <Text style={[styles.title, isDesktop && styles.titleDesktop]}>
            Saved <Text style={styles.goldText}>Stays</Text>
          </Text>
          <Text style={styles.subtitle}>
            Your favourite handpicked escapes, all in one place.
          </Text>
        </View>

        {/* Category Filter Pills */}
        <View style={[styles.chipsRow, isDesktop && styles.chipsRowDesktop]}>
          {categories.map(([id, label]) => {
            const active = category === id;
            return (
              <Pressable
                key={id}
                onPress={() => setCategory(id)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && styles.pressed,
                  Platform.select({
                    web: { cursor: "pointer", outlineStyle: "none" } as any,
                    default: {},
                  }),
                ]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Count Bar */}
        <View style={styles.countBar}>
          <Text style={styles.countText}>
            SHOWING <Text style={styles.goldText}>{saved.length}</Text> SAVED PROPERTIES
          </Text>
        </View>

        {/* Properties Grid */}
        {saved.length ? (
          <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
            {saved.map((p) => (
              <PropertyCard key={p.id} property={p} grid />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Heart size={34} color={colors.gold} />
            </View>
            <Text style={styles.emptyTitle}>No saved stays yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the heart icon on any villa, cottage, or resort card to save it to your wishlist for later.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/properties")}
              style={({ pressed }) => [
                styles.emptyBtn,
                pressed && styles.pressed,
                Platform.select({
                  web: { cursor: "pointer", outlineStyle: "none" } as any,
                  default: {},
                }),
              ]}
            >
              <Compass size={16} color="#120e06" />
              <Text style={styles.emptyBtnText}>Explore All Stays</Text>
            </Pressable>
          </View>
        )}

      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  screen: {
    paddingTop: 72,
    paddingBottom: layout.bottomChromeReserve + 20,
    backgroundColor: colors.surface,
  },
  screenDesktop: {
    paddingTop: 88,
    paddingBottom: layout.desktopBottomReserve + 24,
  },
  container: {
    paddingHorizontal: 20,
    gap: 16,
  },
  containerDesktop: {
    maxWidth: 1320,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 36,
  },

  // Header
  headerBanner: {
    paddingTop: 14,
    paddingBottom: 4,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
  },
  badgeText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 9.5,
    letterSpacing: 1.1,
  },
  title: {
    color: colors.text,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 28,
    lineHeight: 34,
  },
  titleDesktop: {
    fontSize: 36,
    lineHeight: 44,
  },
  goldText: {
    color: colors.gold,
  },
  subtitle: {
    marginTop: 6,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 700,
  },

  // Chips
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 6,
  },
  chipsRowDesktop: {
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8.5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  chipActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(224, 184, 74, 0.15)",
  },
  chipText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },
  chipTextActive: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
  },

  // Count Bar
  countBar: {
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  countText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansBold,
    fontSize: 10.5,
    letterSpacing: 0.8,
  },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 10,
  },
  gridDesktop: {
    gap: 16,
  },

  // Empty State
  emptyContainer: {
    marginTop: 40,
    paddingVertical: 56,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.18)",
    backgroundColor: "rgba(14, 18, 24, 0.9)",
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 20,
  },
  emptySubtitle: {
    marginTop: 8,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    textAlign: "center",
    maxWidth: 420,
    lineHeight: 19,
  },
  emptyBtn: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.gold,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: radii.pill,
  },
  emptyBtnText: {
    color: "#120e06",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
  },
});
