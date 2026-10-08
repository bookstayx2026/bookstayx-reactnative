import { useMemo, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ArrowRight, Compass, MapPin, Search, SlidersHorizontal, Sparkles, X } from "lucide-react-native";
import { AppScreen } from "@/components/foundation";
import { LocationCard } from "@/components/discovery";
import { useCustomerChrome } from "@/components/customer";
import { locationGroups, locations } from "@/data/discovery";
import { colors, fontFamilies, layout, radii } from "@/theme";
import { useIsDesktop } from "@/hooks/use-window-class";

const districtFilters = [
  { id: "all", label: "All Districts", value: null },
  { id: "pune", label: "Pune & Maval", value: "Pune District" },
  { id: "raigad", label: "Raigad & Coast", value: "Raigad District" },
  { id: "ratnagiri", label: "Ratnagiri", value: "Ratnagiri District" },
  { id: "sindhudurg", label: "Sindhudurg", value: "Sindhudurg District" },
];

const categoryFilters = [
  { label: "🏖️ Beaches", value: "Beach Destination" },
  { label: "🏞️ Lakes", value: "Lake Destination" },
  { label: "⛰️ Hill Stations", value: "Hill Station" },
  { label: "🌿 Nature Escapes", value: "Nature Escape" },
];

const districtsModal = ["Pune District", "Raigad District", "Ratnagiri District", "Sindhudurg District"];
const typesModal = ["Beach Destination", "Lake Destination", "Hill Station", "Nature Escape"];
const bestForModal = ["Couples & Romance", "Family Vacations", "Group Getaways", "Adventure & Treks", "Quiet Relaxation"];

export default function LocationsScreen() {
  const { onScroll } = useCustomerChrome();
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [district, setDistrict] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const isDesktop = useIsDesktop();

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return locations.filter((location) => {
      const matchesSearch =
        !search ||
        [location.name, location.district, location.region, location.category].some((value) =>
          value.toLowerCase().includes(search)
        );
      return (
        matchesSearch &&
        (!district || location.district === district || location.region === district) &&
        (!type || location.category === type)
      );
    });
  }, [district, query, type]);

  const isFiltering = Boolean(query.trim() || district || type);

  const resetAllFilters = () => {
    setQuery("");
    setDistrict(null);
    setType(null);
  };

  return (
    <>
      <AppScreen
        contentContainerStyle={[styles.screen, isDesktop && styles.screenDesktop]}
        scrollProps={{ onScroll, scrollEventThrottle: 16 }}
      >
        {/* Hero Discovery Banner */}
        <View style={[styles.heroBanner, isDesktop && styles.heroBannerDesktop]}>
          <View style={styles.badgeRow}>
            <View style={styles.curatedBadge}>
              <Sparkles size={11} color={colors.gold} />
              <Text style={styles.curatedBadgeText}>CURATED DESTINATION GUIDE</Text>
            </View>
          </View>

          <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>
            Explore Destinations in <Text style={styles.goldText}>Maharashtra</Text>
          </Text>

          <Text style={[styles.heroSubtitle, isDesktop && styles.heroSubtitleDesktop]}>
            From tranquil Sahyadri hillside sanctuaries & serene lakes to sun-drenched Konkan coastlines, discover handpicked stays across top getaways.
          </Text>

          {/* Search & Filter Bar */}
          <View style={[styles.searchRow, isDesktop && styles.searchRowDesktop]}>
            <View style={styles.search}>
              <Search size={18} color={colors.gold} />
              <TextInput
                accessibilityLabel="Search locations"
                value={query}
                onChangeText={setQuery}
                placeholder="Search destinations (e.g. Alibaug, Pawna Lake, Lonavala, Kashid)..."
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
              {query.length > 0 ? (
                <Pressable
                  accessibilityLabel="Clear search"
                  onPress={() => setQuery("")}
                  style={styles.clearSearch}
                >
                  <X size={14} color={colors.textSecondary} />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              accessibilityLabel="Open location filters"
              onPress={() => setFiltersOpen(true)}
              style={({ pressed }) => [
                styles.filterBtn,
                (district || type) && styles.filterBtnActive,
                pressed && styles.pressed,
                Platform.select({
                  web: { cursor: "pointer", outlineStyle: "none" } as any,
                  default: {},
                }),
              ]}
            >
              <SlidersHorizontal size={17} color={district || type ? colors.gold : colors.text} />
              <Text style={[styles.filterBtnText, (district || type) && styles.filterBtnTextActive]}>
                Filters
              </Text>
              {district || type ? <View style={styles.filterDot} /> : null}
            </Pressable>
          </View>

          {/* Quick Filter Pills */}
          <View style={styles.quickFiltersContainer}>
            <View style={styles.pillsRow}>
              {districtFilters.map((df) => {
                const active = district === df.value || (!district && df.value === null);
                return (
                  <Pressable
                    key={df.id}
                    accessibilityRole="button"
                    onPress={() => setDistrict(df.value)}
                    style={({ pressed }) => [
                      styles.pill,
                      active && styles.pillActive,
                      pressed && styles.pressed,
                      Platform.select({
                        web: { cursor: "pointer", outlineStyle: "none" } as any,
                        default: {},
                      }),
                    ]}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>
                      {df.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.pillsRow}>
              {categoryFilters.map((cf) => {
                const active = type === cf.value;
                return (
                  <Pressable
                    key={cf.value}
                    accessibilityRole="button"
                    onPress={() => setType(active ? null : cf.value)}
                    style={({ pressed }) => [
                      styles.categoryPill,
                      active && styles.categoryPillActive,
                      pressed && styles.pressed,
                      Platform.select({
                        web: { cursor: "pointer", outlineStyle: "none" } as any,
                        default: {},
                      }),
                    ]}
                  >
                    <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
                      {cf.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Results / District Sections */}
        {isFiltering ? (
          <View style={[styles.resultSection, isDesktop && styles.resultSectionDesktop]}>
            <View style={styles.resultHeader}>
              <View>
                <Text style={styles.resultCount}>
                  Showing <Text style={styles.goldText}>{filtered.length}</Text> destinations
                </Text>
                <Text style={styles.resultSub}>
                  {district ? `Filtered by ${district}` : "All regions"} {type ? `• ${type}` : ""} {query ? `• "${query}"` : ""}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={resetAllFilters}
                style={({ pressed }) => [
                  styles.clearAllBtn,
                  pressed && styles.pressed,
                  Platform.select({
                    web: { cursor: "pointer", outlineStyle: "none" } as any,
                    default: {},
                  }),
                ]}
              >
                <Text style={styles.clearAllText}>Clear all filters</Text>
                <X size={13} color={colors.gold} />
              </Pressable>
            </View>

            <View style={styles.grid}>
              {filtered.map((location, index) => (
                <LocationCard key={location.slug} location={location} rank={index + 1} />
              ))}
            </View>

            {filtered.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Compass size={36} color={colors.gold} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No Destinations Found</Text>
                <Text style={styles.emptyDesc}>
                  We couldn't find any destinations matching your current filters. Try searching with different keywords or reset your filters.
                </Text>
                <Pressable
                  onPress={resetAllFilters}
                  style={({ pressed }) => [
                    styles.resetBtn,
                    pressed && styles.pressed,
                    Platform.select({
                      web: { cursor: "pointer", outlineStyle: "none" } as any,
                      default: {},
                    }),
                  ]}
                >
                  <Text style={styles.resetBtnText}>Reset All Filters</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : (
          locationGroups.map((group) => {
            const items = group.slugs
              .map((slug) => locations.find((location) => location.slug === slug))
              .filter(Boolean);

            return (
              <View key={group.title} style={[styles.districtGroup, isDesktop && styles.districtGroupDesktop]}>
                {/* District Section Header */}
                <View style={styles.districtHeaderCard}>
                  <View style={styles.districtHeaderLeft}>
                    <View style={styles.districtTagBadge}>
                      <MapPin size={10} color={colors.gold} />
                      <Text style={styles.districtTagText}>{group.districtKey.toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.districtTitle, isDesktop && styles.districtTitleDesktop]}>
                      {group.title}
                    </Text>
                    {group.subtitle ? (
                      <Text style={styles.districtSubtitle}>{group.subtitle}</Text>
                    ) : null}
                  </View>

                  <View style={styles.districtHeaderRight}>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{items.length} Places</Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setDistrict(group.districtKey)}
                      style={({ pressed }) => [
                        styles.viewAllDistrictBtn,
                        pressed && styles.pressed,
                        Platform.select({
                          web: { cursor: "pointer", outlineStyle: "none" } as any,
                          default: {},
                        }),
                      ]}
                    >
                      <Text style={styles.viewAllDistrictText}>View all</Text>
                      <ArrowRight size={13} color={colors.gold} />
                    </Pressable>
                  </View>
                </View>

                {/* District Grid of Location Cards */}
                <View style={styles.grid}>
                  {items.map((location, index) => (
                    <LocationCard
                      key={location!.slug}
                      location={location!}
                      rank={index + 1}
                    />
                  ))}
                </View>
              </View>
            );
          })
        )}
      </AppScreen>

      {/* Filter Modal */}
      <Modal
        visible={filtersOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFiltersOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel="Close filters"
            onPress={() => setFiltersOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeading}>
              <Text style={styles.sheetTitle}>Filter Destinations</Text>
              <Pressable
                accessibilityLabel="Close filters"
                onPress={() => setFiltersOpen(false)}
                style={({ pressed }) => [
                  styles.close,
                  pressed && styles.pressed,
                  Platform.select({
                    web: { cursor: "pointer", outlineStyle: "none" } as any,
                    default: {},
                  }),
                ]}
              >
                <X size={18} color={colors.text} />
              </Pressable>
            </View>

            <FilterGroup
              title="District / Region"
              options={districtsModal}
              value={district}
              onChange={setDistrict}
            />
            <FilterGroup
              title="Destination Type"
              options={typesModal}
              value={type}
              onChange={setType}
            />
            <FilterGroup
              title="Ideal For"
              options={bestForModal}
              value={null}
              onChange={() => {}}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setDistrict(null);
                  setType(null);
                }}
                style={({ pressed }) => [
                  styles.modalReset,
                  pressed && styles.pressed,
                  Platform.select({
                    web: { cursor: "pointer", outlineStyle: "none" } as any,
                    default: {},
                  }),
                ]}
              >
                <Text style={styles.modalResetText}>Reset</Text>
              </Pressable>
              <Pressable
                onPress={() => setFiltersOpen(false)}
                style={({ pressed }) => [
                  styles.modalApply,
                  pressed && styles.pressed,
                  Platform.select({
                    web: { cursor: "pointer", outlineStyle: "none" } as any,
                    default: {},
                  }),
                ]}
              >
                <Text style={styles.modalApplyText}>
                  Show {filtered.length} Destinations
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function FilterGroup({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>{title}</Text>
      <View style={styles.chips}>
        {options.map((option) => (
          <Pressable
            key={option}
            onPress={() => onChange(value === option ? null : option)}
            style={({ pressed }) => [
              styles.chip,
              value === option && styles.chipActive,
              pressed && styles.pressed,
              Platform.select({
                web: { cursor: "pointer", outlineStyle: "none" } as any,
                default: {},
              }),
            ]}
          >
            <Text style={[styles.chipText, value === option && styles.chipTextActive]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  screen: {
    paddingTop: 72,
    paddingBottom: layout.bottomChromeReserve,
  },
  screenDesktop: {
    paddingTop: 88,
    paddingBottom: layout.desktopBottomReserve,
    maxWidth: 1320,
    alignSelf: "center",
    width: "100%",
  },

  // Hero discovery banner
  heroBanner: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  heroBannerDesktop: {
    paddingHorizontal: 36,
    paddingTop: 24,
    paddingBottom: 28,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  curatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.28)",
  },
  curatedBadgeText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 9.5,
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  heroTitleDesktop: {
    fontSize: 34,
    lineHeight: 42,
  },
  goldText: {
    color: colors.gold,
  },
  heroSubtitle: {
    marginTop: 8,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13.5,
    lineHeight: 20,
    maxWidth: 820,
  },
  heroSubtitleDesktop: {
    fontSize: 14.5,
    lineHeight: 22,
  },

  // Search Row
  searchRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    alignItems: "center",
  },
  searchRowDesktop: {
    marginTop: 24,
  },
  search: {
    height: 50,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
    backgroundColor: "rgba(18, 22, 28, 0.9)",
    ...Platform.select({
      web: {
        boxShadow: "0 4px 18px rgba(0, 0, 0, 0.35)",
      } as any,
      default: {},
    }),
  },
  input: {
    flex: 1,
    color: colors.text,
    fontFamily: fontFamilies.sans,
    fontSize: 13.5,
    outlineStyle: "none" as never,
  },
  clearSearch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtn: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    backgroundColor: "rgba(18, 22, 28, 0.9)",
  },
  filterBtnActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(224, 184, 74, 0.14)",
  },
  filterBtnText: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
  },
  filterBtnTextActive: {
    color: colors.gold,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },

  // Quick Filter Pills
  quickFiltersContainer: {
    marginTop: 14,
    gap: 8,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  pillActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(224, 184, 74, 0.15)",
  },
  pillText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },
  pillTextActive: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
  },
  categoryPill: {
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(11, 14, 18, 0.6)",
  },
  categoryPillActive: {
    borderColor: "rgba(224, 184, 74, 0.5)",
    backgroundColor: "rgba(224, 184, 74, 0.1)",
  },
  categoryPillText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
  },
  categoryPillTextActive: {
    color: colors.text,
    fontFamily: fontFamilies.sansMedium,
  },

  // Results Section
  resultSection: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  resultSectionDesktop: {
    paddingHorizontal: 36,
    paddingTop: 24,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  resultCount: {
    color: colors.text,
    fontFamily: fontFamilies.sansBold,
    fontSize: 15,
  },
  resultSub: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
  },
  clearAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
  },
  clearAllText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11.5,
  },

  // District Groups
  districtGroup: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  districtGroupDesktop: {
    paddingHorizontal: 36,
    marginTop: 36,
  },
  districtHeaderCard: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(224, 184, 74, 0.15)",
    gap: 16,
  },
  districtHeaderLeft: {
    flex: 1,
  },
  districtTagBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  districtTagText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 9.5,
    letterSpacing: 1.1,
  },
  districtTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 18,
    lineHeight: 24,
  },
  districtTitleDesktop: {
    fontSize: 22,
    lineHeight: 28,
  },
  districtSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12.5,
    lineHeight: 18,
  },
  districtHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  countBadgeText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },
  viewAllDistrictBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
  },
  viewAllDistrictText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11.5,
  },

  // Grid
  grid: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "flex-start",
  },

  // Empty State
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 18,
    marginTop: 14,
  },
  emptyDesc: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 420,
    marginTop: 6,
  },
  resetBtn: {
    marginTop: 18,
    backgroundColor: colors.gold,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  resetBtnText: {
    color: "#120e06",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
  },

  // Filter Modal Sheet
  modalRoot: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,.75)" },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.2)",
    backgroundColor: "#0b0e12",
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 32,
    maxWidth: 580,
    alignSelf: "center",
    width: "100%",
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,.2)",
    marginBottom: 16,
  },
  sheetHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: { color: colors.text, fontFamily: fontFamilies.displayMedium, fontSize: 21 },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  filterGroup: { marginTop: 20 },
  filterLabel: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: "#11151a",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { borderColor: colors.gold, backgroundColor: "rgba(224,184,74,.15)" },
  chipText: { color: colors.textSecondary, fontFamily: fontFamilies.sans, fontSize: 12 },
  chipTextActive: { color: colors.gold, fontFamily: fontFamilies.sansBold },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 26 },
  modalReset: {
    flex: 1,
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingVertical: 13,
  },
  modalResetText: { color: colors.textSecondary, fontFamily: fontFamilies.sansMedium, fontSize: 13.5 },
  modalApply: {
    flex: 1.6,
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: colors.gold,
    paddingVertical: 13,
  },
  modalApplyText: { color: "#141007", fontFamily: fontFamilies.sansBold, fontSize: 13.5 },
});
