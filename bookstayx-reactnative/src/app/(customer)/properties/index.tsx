import { useMemo, useRef, useState } from "react";
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Building2,
  Check,
  ChevronDown,
  Compass,
  Gem,
  Home,
  LayoutGrid,
  MapPin,
  RotateCcw,
  Search,
  Sparkles,
  Tent,
  Trees,
  X,
} from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppScreen } from "@/components/foundation";
import { CustomerFooter, useCustomerChrome } from "@/components/customer";
import { PropertyCard } from "@/components/discovery";
import {
  getLocation,
  locations,
  type Location,
  type Property,
  type PropertyCategory,
  type PropertyTier,
} from "@/data/discovery";
import { usePropertyCatalogue } from "@/hooks/use-property-catalogue";
import { colors, fontFamilies, layout, radii, spacing } from "@/theme";
import { useIsDesktop, useIsTablet } from "@/hooks/use-window-class";

const categories = [
  { id: "all", label: "All Properties", shortLabel: "All", Icon: LayoutGrid },
  { id: "villa", label: "Villa", shortLabel: "Villa", Icon: Building2 },
  { id: "camping_cottages", label: "Camping & Cottages", shortLabel: "Camping & Cottages", Icon: Tent },
  { id: "resort", label: "Resort", shortLabel: "Resort", Icon: Sparkles },
  { id: "homestay", label: "Homestay", shortLabel: "Homestay", Icon: Home },
] as const;

const tiers: [PropertyTier, string][] = [
  ["affordable", "Affordable"],
  ["premium", "Premium"],
  ["luxury", "Luxury"],
];

const DISTRICTS = [
  { id: "Pune District", label: "Pune District", short: "Pune", region: "Maval Region & Hills" },
  { id: "Raigad District", label: "Raigad District", short: "Raigad", region: "Alibaug & Coastal Hubs" },
  { id: "Ratnagiri District", label: "Ratnagiri District", short: "Ratnagiri", region: "Central Konkan" },
  { id: "Sindhudurg District", label: "Sindhudurg District", short: "Sindhudurg", region: "Southern Konkan" },
] as const;

function getPropertyDistrict(p: Property): string | null {
  const loc = getLocation(p.locationSlug);
  if (loc?.district) return loc.district;
  const lower = ((p.locationLabel || "") + " " + (p.name || "")).toLowerCase();
  if (lower.includes("pune") || lower.includes("lonavala") || lower.includes("pawna") || lower.includes("khandala")) {
    return "Pune District";
  }
  if (
    lower.includes("raigad") ||
    lower.includes("alib") ||
    lower.includes("kashid") ||
    lower.includes("murud") ||
    lower.includes("diveagar") ||
    lower.includes("karjat") ||
    lower.includes("kihim") ||
    lower.includes("varsoli") ||
    lower.includes("nagaon") ||
    lower.includes("akshi") ||
    lower.includes("shrivardhan") ||
    lower.includes("harihareshwar")
  ) {
    return "Raigad District";
  }
  if (
    lower.includes("ratnagiri") ||
    lower.includes("ganpatipule") ||
    lower.includes("guhagar") ||
    lower.includes("harnai") ||
    lower.includes("karde") ||
    lower.includes("anjarle") ||
    lower.includes("kelshi") ||
    lower.includes("velas")
  ) {
    return "Ratnagiri District";
  }
  if (
    lower.includes("sindhudurg") ||
    lower.includes("tarkarli") ||
    lower.includes("devgad") ||
    lower.includes("kunkeshwar") ||
    lower.includes("chivla") ||
    lower.includes("bhogwe") ||
    lower.includes("nivati") ||
    lower.includes("vengurla") ||
    lower.includes("redi")
  ) {
    return "Sindhudurg District";
  }
  return null;
}

function matchesSublocation(p: Property, sublocationSlug: string): boolean {
  if (p.locationSlug === sublocationSlug) return true;
  const loc = getLocation(sublocationSlug);
  if (loc && p.locationLabel.toLowerCase().includes(loc.name.toLowerCase())) return true;
  if (p.locationLabel.toLowerCase().includes(sublocationSlug.replace(/-/g, " "))) return true;
  return false;
}

export default function PropertiesScreen() {
  const { onScroll } = useCustomerChrome();
  const { location: locationParam } = useLocalSearchParams<{ location?: string }>();
  const { items } = usePropertyCatalogue();
  const [category, setCategory] = useState<"all" | PropertyCategory>("all");
  const [tier, setTier] = useState<PropertyTier | null>(null);

  // District & Sublocation filter state
  const initialLoc = locationParam ? getLocation(locationParam) : null;
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(
    initialLoc ? initialLoc.district : null
  );
  const [selectedSublocation, setSelectedSublocation] = useState<string | null>(
    locationParam || null
  );

  // Dropdown modal state
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [sublocationDropdownOpen, setSublocationDropdownOpen] = useState(false);
  const [sublocationSearch, setSublocationSearch] = useState("");

  // Sticky filter on scroll up
  const [showStickyFilter, setShowStickyFilter] = useState(false);
  const lastScrollY = useRef(0);

  const isDesktop = useIsDesktop();
  const isTablet = useIsTablet();
  const wide = isDesktop || isTablet;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    onScroll(event);
    const currentY = event.nativeEvent.contentOffset.y;
    const delta = currentY - lastScrollY.current;

    if (currentY > 120) {
      if (delta < -3) {
        // User is scrolling UP -> reveal the sticky filter toolbar under header
        setShowStickyFilter(true);
      } else if (delta > 3) {
        // User is scrolling DOWN -> hide sticky toolbar to maximize stay list view
        setShowStickyFilter(false);
      }
    } else {
      setShowStickyFilter(false);
    }

    lastScrollY.current = currentY;
  };

  // Available sublocations under currently selected district (or all if no district)
  const availableSublocations = useMemo(() => {
    if (!selectedDistrict) return locations;
    return locations.filter((loc) => loc.district === selectedDistrict);
  }, [selectedDistrict]);

  // Filtered sublocations inside modal based on search text
  const searchedSublocations = useMemo(() => {
    const q = sublocationSearch.trim().toLowerCase();
    if (!q) return availableSublocations;
    return availableSublocations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.district.toLowerCase().includes(q) ||
        loc.region.toLowerCase().includes(q)
    );
  }, [availableSublocations, sublocationSearch]);

  const hasActiveFilters =
    category !== "all" ||
    tier !== null ||
    selectedDistrict !== null ||
    selectedSublocation !== null ||
    Boolean(locationParam);

  const resetFilters = () => {
    setCategory("all");
    setTier(null);
    setSelectedDistrict(null);
    setSelectedSublocation(null);
    if (locationParam) {
      router.setParams({ location: undefined });
    }
  };

  const handleSelectDistrict = (distId: string | null) => {
    setSelectedDistrict(distId);
    setSelectedSublocation(null);
    setDistrictDropdownOpen(false);
    if (locationParam) {
      router.setParams({ location: undefined });
    }
  };

  const handleSelectSublocation = (loc: Location | null) => {
    if (loc) {
      setSelectedSublocation(loc.slug);
      setSelectedDistrict(loc.district);
      router.setParams({ location: loc.slug });
    } else {
      setSelectedSublocation(null);
      if (locationParam) {
        router.setParams({ location: undefined });
      }
    }
    setSublocationDropdownOpen(false);
    setSublocationSearch("");
  };

  const list = useMemo(() => {
    return items.filter((p) => {
      // 1. Sublocation filter
      if (selectedSublocation) {
        if (!matchesSublocation(p, selectedSublocation)) return false;
      } else if (selectedDistrict) {
        // 2. District filter (when no specific sublocation chosen)
        if (getPropertyDistrict(p) !== selectedDistrict) return false;
      } else if (locationParam) {
        if (!matchesSublocation(p, locationParam)) return false;
      }

      // 3. Category filter
      if (category !== "all" && p.category !== category) return false;

      // 4. Budget Tier filter
      if (tier && p.tier !== tier) return false;

      return true;
    });
  }, [items, selectedSublocation, selectedDistrict, locationParam, category, tier]);

  // Selected labels
  const selectedLocationObj = selectedSublocation ? getLocation(selectedSublocation) : null;
  const locationLabelText = selectedLocationObj
    ? selectedLocationObj.name
    : selectedSublocation
      ? selectedSublocation.replace(/-/g, " ")
      : null;

  // Reusable Filter Bar Body
  const renderFilterControls = (isStickyMode = false) => (
    <>
      {/* 1. Category Pills */}
      <View style={styles.categoriesContainer}>
        {wide ? (
          <View style={styles.categoriesWrap}>
            {categories.map(({ id, label, Icon }) => {
              const active = category === id;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => setCategory(id)}
                  style={({ pressed }) => [
                    styles.chip,
                    styles.chipLarge,
                    active && styles.activeChip,
                    pressed && styles.chipPressed,
                    Platform.select({
                      web: { cursor: "pointer", outlineStyle: "none" } as any,
                      default: {},
                    }),
                  ]}
                >
                  <Icon
                    size={15}
                    color={active ? colors.actionInk : colors.gold}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      styles.chipTextLarge,
                      active && styles.chipTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mobileCategoriesScroll}
          >
            {categories.map(({ id, shortLabel, Icon }) => {
              const active = category === id;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => setCategory(id)}
                  style={({ pressed }) => [
                    styles.mobileChip,
                    active && styles.activeChip,
                    pressed && styles.chipPressed,
                  ]}
                >
                  <Icon size={12} color={active ? colors.actionInk : colors.gold} />
                  <Text style={[styles.mobileChipText, active && styles.chipTextActive]}>
                    {shortLabel}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* 2. Location & Budget Controls */}
      {wide ? (
        /* Widescreen / Tablet: Elegant Unified 2nd Row */
        <View style={styles.wideFilterBarSecondRow}>
          {/* Left: District & Sublocation Dropdown Controls */}
          <View style={styles.wideLocationGroup}>
            {/* District Dropdown Button */}
            <Pressable
              accessibilityLabel="Filter by District"
              onPress={() => setDistrictDropdownOpen(true)}
              style={({ pressed }) => [
                styles.dropdownTrigger,
                styles.wideDropdownTrigger,
                selectedDistrict && styles.dropdownTriggerActive,
                pressed && styles.chipPressed,
                Platform.select({
                  web: { cursor: "pointer", outlineStyle: "none" } as any,
                  default: {},
                }),
              ]}
            >
              <MapPin
                size={13}
                color={selectedDistrict ? colors.actionInk : colors.gold}
              />
              <View style={styles.dropdownTriggerTextWrap}>
                <Text
                  style={[
                    styles.dropdownTriggerLabel,
                    selectedDistrict && styles.dropdownTriggerLabelActive,
                  ]}
                >
                  DISTRICT
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.dropdownTriggerValue,
                    selectedDistrict && styles.dropdownTriggerValueActive,
                  ]}
                >
                  {selectedDistrict
                    ? selectedDistrict.replace(" District", "")
                    : "All Districts"}
                </Text>
              </View>
              <ChevronDown
                size={14}
                color={selectedDistrict ? colors.actionInk : colors.textMuted}
              />
            </Pressable>

            {/* Sublocation Dropdown Button */}
            <Pressable
              accessibilityLabel="Filter by Sublocation"
              onPress={() => setSublocationDropdownOpen(true)}
              style={({ pressed }) => [
                styles.dropdownTrigger,
                styles.wideDropdownTrigger,
                selectedSublocation && styles.dropdownTriggerActive,
                pressed && styles.chipPressed,
                Platform.select({
                  web: { cursor: "pointer", outlineStyle: "none" } as any,
                  default: {},
                }),
              ]}
            >
              <Compass
                size={13}
                color={selectedSublocation ? colors.actionInk : colors.gold}
              />
              <View style={styles.dropdownTriggerTextWrap}>
                <Text
                  style={[
                    styles.dropdownTriggerLabel,
                    selectedSublocation && styles.dropdownTriggerLabelActive,
                  ]}
                >
                  SUB-LOCATION
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.dropdownTriggerValue,
                    selectedSublocation && styles.dropdownTriggerValueActive,
                  ]}
                >
                  {locationLabelText || "All Sub-locations"}
                </Text>
              </View>
              <ChevronDown
                size={14}
                color={selectedSublocation ? colors.actionInk : colors.textMuted}
              />
            </Pressable>
          </View>

          {/* Vertical Divider */}
          <View style={styles.wideDivider} />

          {/* Center-Right: Budget Tier & Active Filters */}
          <View style={styles.wideTierGroup}>
            <Text style={styles.filterLabel}>Budget:</Text>
            <View style={styles.tierPills}>
              <Pressable
                onPress={() => setTier(null)}
                style={({ pressed }) => [
                  styles.tierPill,
                  tier === null && styles.tierPillActive,
                  pressed && styles.chipPressed,
                  Platform.select({
                    web: { cursor: "pointer", outlineStyle: "none" } as any,
                    default: {},
                  }),
                ]}
              >
                <Text
                  style={[
                    styles.tierPillText,
                    tier === null && styles.tierPillTextActive,
                  ]}
                >
                  All
                </Text>
              </Pressable>
              {tiers.map(([id, label]) => {
                const active = tier === id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => setTier(tier === id ? null : id)}
                    style={({ pressed }) => [
                      styles.tierPill,
                      active && styles.tierPillActive,
                      pressed && styles.chipPressed,
                      Platform.select({
                        web: { cursor: "pointer", outlineStyle: "none" } as any,
                        default: {},
                      }),
                    ]}
                  >
                    <Gem
                      size={10}
                      color={active ? colors.actionInk : colors.gold}
                    />
                    <Text
                      style={[
                        styles.tierPillText,
                        active && styles.tierPillTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Active Location Chip (if selected) */}
            {selectedSublocation || selectedDistrict || locationParam ? (
              <Pressable
                accessibilityLabel="Clear location filter"
                onPress={() => {
                  setSelectedDistrict(null);
                  setSelectedSublocation(null);
                  if (locationParam) router.setParams({ location: undefined });
                }}
                style={styles.locationChip}
              >
                <Text style={styles.locationChipText} numberOfLines={1}>
                  📍 {locationLabelText || selectedDistrict || locationParam?.replace(/-/g, " ")}
                </Text>
                <X size={11} color={colors.gold} />
              </Pressable>
            ) : null}

            {/* Reset Button */}
            {hasActiveFilters ? (
              <Pressable
                accessibilityRole="button"
                onPress={resetFilters}
                style={({ pressed }) => [
                  styles.resetBtn,
                  pressed && styles.chipPressed,
                  Platform.select({
                    web: { cursor: "pointer", outlineStyle: "none" } as any,
                    default: {},
                  }),
                ]}
              >
                <RotateCcw size={11} color={colors.gold} />
                <Text style={styles.resetBtnText}>Reset</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Far Right: Showing Stays count */}
          <View style={styles.wideResultCountBox}>
            <View style={styles.resultDot} />
            <Text style={styles.resultCount}>
              Showing <Text style={styles.resultCountBold}>{list.length}</Text> Stays
            </Text>
          </View>
        </View>
      ) : (
        /* Mobile: Compact stacked rows */
        <>
          {/* Side-by-Side District & Sublocation Dropdowns */}
          <View style={styles.mobileLocationRow}>
            {/* District Dropdown Button */}
            <Pressable
              accessibilityLabel="Filter by District"
              onPress={() => setDistrictDropdownOpen(true)}
              style={({ pressed }) => [
                styles.dropdownTrigger,
                styles.mobileDropdownTrigger,
                selectedDistrict && styles.dropdownTriggerActive,
                pressed && styles.chipPressed,
              ]}
            >
              <MapPin
                size={11}
                color={selectedDistrict ? colors.actionInk : colors.gold}
              />
              <View style={styles.dropdownTriggerTextWrap}>
                <Text
                  style={[
                    styles.dropdownTriggerLabel,
                    styles.mobileDropdownTriggerLabel,
                    selectedDistrict && styles.dropdownTriggerLabelActive,
                  ]}
                >
                  DISTRICT
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.dropdownTriggerValue,
                    styles.mobileDropdownTriggerValue,
                    selectedDistrict && styles.dropdownTriggerValueActive,
                  ]}
                >
                  {selectedDistrict
                    ? selectedDistrict.replace(" District", "")
                    : "All Districts"}
                </Text>
              </View>
              <ChevronDown
                size={11}
                color={selectedDistrict ? colors.actionInk : colors.textMuted}
              />
            </Pressable>

            {/* Sublocation Dropdown Button */}
            <Pressable
              accessibilityLabel="Filter by Sublocation"
              onPress={() => setSublocationDropdownOpen(true)}
              style={({ pressed }) => [
                styles.dropdownTrigger,
                styles.mobileDropdownTrigger,
                selectedSublocation && styles.dropdownTriggerActive,
                pressed && styles.chipPressed,
              ]}
            >
              <Compass
                size={11}
                color={selectedSublocation ? colors.actionInk : colors.gold}
              />
              <View style={styles.dropdownTriggerTextWrap}>
                <Text
                  style={[
                    styles.dropdownTriggerLabel,
                    styles.mobileDropdownTriggerLabel,
                    selectedSublocation && styles.dropdownTriggerLabelActive,
                  ]}
                >
                  SUB-LOCATION
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.dropdownTriggerValue,
                    styles.mobileDropdownTriggerValue,
                    selectedSublocation && styles.dropdownTriggerValueActive,
                  ]}
                >
                  {locationLabelText || "All Sub-locations"}
                </Text>
              </View>
              <ChevronDown
                size={11}
                color={selectedSublocation ? colors.actionInk : colors.textMuted}
              />
            </Pressable>
          </View>

          {/* Budget Tier & Active Reset Row */}
          <View style={styles.secondaryControlsRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mobileTierGroup}
            >
              <Text style={styles.filterLabel}>Budget:</Text>
              <View style={styles.tierPills}>
                <Pressable
                  onPress={() => setTier(null)}
                  style={({ pressed }) => [
                    styles.tierPill,
                    styles.mobileTierPill,
                    tier === null && styles.tierPillActive,
                    pressed && styles.chipPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.tierPillText,
                      styles.mobileTierPillText,
                      tier === null && styles.tierPillTextActive,
                    ]}
                  >
                    All
                  </Text>
                </Pressable>
                {tiers.map(([id, label]) => {
                  const active = tier === id;
                  return (
                    <Pressable
                      key={id}
                      onPress={() => setTier(tier === id ? null : id)}
                      style={({ pressed }) => [
                        styles.tierPill,
                        styles.mobileTierPill,
                        active && styles.tierPillActive,
                        pressed && styles.chipPressed,
                      ]}
                    >
                      <Gem
                        size={10}
                        color={active ? colors.actionInk : colors.gold}
                      />
                      <Text
                        style={[
                          styles.tierPillText,
                          styles.mobileTierPillText,
                          active && styles.tierPillTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Active Location Chip */}
              {selectedSublocation || selectedDistrict || locationParam ? (
                <Pressable
                  accessibilityLabel="Clear location filter"
                  onPress={() => {
                    setSelectedDistrict(null);
                    setSelectedSublocation(null);
                    if (locationParam) router.setParams({ location: undefined });
                  }}
                  style={[styles.locationChip, styles.mobileLocationChip]}
                >
                  <Text style={[styles.locationChipText, { fontSize: 10.5 }]} numberOfLines={1}>
                    📍 {locationLabelText || selectedDistrict || locationParam?.replace(/-/g, " ")}
                  </Text>
                  <X size={11} color={colors.gold} />
                </Pressable>
              ) : null}

              {/* Reset Button */}
              {hasActiveFilters ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={resetFilters}
                  style={({ pressed }) => [
                    styles.resetBtn,
                    styles.mobileResetBtn,
                    pressed && styles.chipPressed,
                  ]}
                >
                  <RotateCcw size={11} color={colors.gold} />
                  <Text style={[styles.resetBtnText, { fontSize: 10.5 }]}>Reset</Text>
                </Pressable>
              ) : null}
            </ScrollView>
          </View>

          {/* Results Status Header */}
          {!isStickyMode ? (
            <View style={styles.mobileResultsBar}>
              <View style={styles.resultIndicator}>
                <View style={styles.resultDot} />
                <Text style={styles.mobileResultCount}>
                  Showing <Text style={styles.resultCountBold}>{list.length}</Text>{" "}
                  {list.length === 1 ? "Curated Stay" : "Curated Stays"}
                  {selectedDistrict
                    ? ` in ${selectedDistrict}${locationLabelText ? ` (${locationLabelText})` : ""}`
                    : locationLabelText
                      ? ` in ${locationLabelText}`
                      : ""}
                </Text>
              </View>
            </View>
          ) : null}
        </>
      )}
    </>
  );

  return (
    <View style={styles.root}>
      {/* Smart Sticky Floating Filter Toolbar: Appears below header when scrolling up */}
      {showStickyFilter ? (
        <View style={[styles.floatingFilterBar, wide && styles.floatingFilterBarWide]}>
          {renderFilterControls(true)}
        </View>
      ) : null}

      <AppScreen
        fullWidth
        contentContainerStyle={[styles.screen, wide && styles.screenLarge]}
        scrollProps={{ onScroll: handleScroll, scrollEventThrottle: 16 }}
      >
        <View
          style={[
            styles.mainContainer,
            isTablet && styles.mainContainerTablet,
            isDesktop && styles.mainContainerDesktop,
          ]}
        >
          {/* In-Flow Luxury Filter Toolbar at Top */}
          <View style={[styles.filterBar, wide && styles.filterBarLarge]}>
            {renderFilterControls(false)}
          </View>

          {/* Properties Grid */}
          <View
            style={[
              styles.grid,
              isTablet && styles.gridTablet,
              isDesktop && styles.gridDesktop,
            ]}
          >
            {list.map((p) => (
              <PropertyCard key={p.id} property={p} grid />
            ))}
          </View>

          {/* Empty State */}
          {!list.length ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Compass size={36} color={colors.gold} />
              </View>
              <Text style={styles.emptyTitle}>No Stays Match Your Filters</Text>
              <Text style={styles.emptyDescription}>
                We couldn't find any properties matching the selected location, category, and budget tier.
                Try clearing filters to view all available luxury escapes.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={resetFilters}
                style={({ pressed }) => [
                  styles.emptyActionBtn,
                  pressed && styles.chipPressed,
                  Platform.select({
                    web: { cursor: "pointer", outlineStyle: "none" } as any,
                    default: {},
                  }),
                ]}
              >
                <Sparkles size={14} color={colors.actionInk} />
                <Text style={styles.emptyActionBtnText}>Explore All Stays</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* District Dropdown Modal */}
        <Modal
          visible={districtDropdownOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setDistrictDropdownOpen(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setDistrictDropdownOpen(false)}
          >
            <Pressable
              style={[styles.modalCard, wide && styles.modalCardDesktop]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderTitleRow}>
                  <MapPin size={18} color={colors.gold} />
                  <View>
                    <Text style={styles.modalTitle}>Filter by District</Text>
                    <Text style={styles.modalSubtitle}>
                      Select a region across Maharashtra
                    </Text>
                  </View>
                </View>
                <Pressable
                  accessibilityLabel="Close"
                  onPress={() => setDistrictDropdownOpen(false)}
                  style={styles.modalCloseBtn}
                >
                  <X size={18} color={colors.text} />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.modalOptionsList}
                contentContainerStyle={styles.modalOptionsContainer}
              >
                {/* All Districts Option */}
                <Pressable
                  onPress={() => handleSelectDistrict(null)}
                  style={[
                    styles.optionRow,
                    selectedDistrict === null && styles.optionRowActive,
                  ]}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.optionIconBox,
                        selectedDistrict === null && styles.optionIconBoxActive,
                      ]}
                    >
                      <LayoutGrid
                        size={16}
                        color={selectedDistrict === null ? colors.actionInk : colors.gold}
                      />
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.optionLabel,
                          selectedDistrict === null && styles.optionLabelActive,
                        ]}
                      >
                        All Districts
                      </Text>
                      <Text style={styles.optionSub}>
                        Show stays from all available regions ({items.length} stays)
                      </Text>
                    </View>
                  </View>
                  {selectedDistrict === null ? (
                    <Check size={18} color={colors.gold} />
                  ) : null}
                </Pressable>

                {/* Specific Districts */}
                {DISTRICTS.map((dist) => {
                  const isSelected = selectedDistrict === dist.id;
                  const stayCount = items.filter(
                    (p) => getPropertyDistrict(p) === dist.id
                  ).length;
                  const locCount = locations.filter(
                    (loc) => loc.district === dist.id
                  ).length;

                  return (
                    <Pressable
                      key={dist.id}
                      onPress={() => handleSelectDistrict(dist.id)}
                      style={[
                        styles.optionRow,
                        isSelected && styles.optionRowActive,
                      ]}
                    >
                      <View style={styles.optionLeft}>
                        <View
                          style={[
                            styles.optionIconBox,
                            isSelected && styles.optionIconBoxActive,
                          ]}
                        >
                          <MapPin
                            size={16}
                            color={isSelected ? colors.actionInk : colors.gold}
                          />
                        </View>
                        <View style={{ flexShrink: 1 }}>
                          <Text
                            style={[
                              styles.optionLabel,
                              isSelected && styles.optionLabelActive,
                            ]}
                          >
                            {dist.label}
                          </Text>
                          <Text style={styles.optionSub}>
                            {dist.region} • {locCount} locations
                          </Text>
                        </View>
                      </View>
                      <View style={styles.optionRight}>
                        <View style={styles.countPill}>
                          <Text style={styles.countPillText}>
                            {stayCount} {stayCount === 1 ? "Stay" : "Stays"}
                          </Text>
                        </View>
                        {isSelected ? (
                          <Check size={18} color={colors.gold} />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Sublocation Dropdown Modal */}
        <Modal
          visible={sublocationDropdownOpen}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setSublocationDropdownOpen(false);
            setSublocationSearch("");
          }}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              setSublocationDropdownOpen(false);
              setSublocationSearch("");
            }}
          >
            <Pressable
              style={[styles.modalCard, wide && styles.modalCardDesktop]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderTitleRow}>
                  <Compass size={18} color={colors.gold} />
                  <View>
                    <Text style={styles.modalTitle}>
                      {selectedDistrict
                        ? `Sub-locations in ${selectedDistrict}`
                        : "Filter by Sub-location"}
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      {selectedDistrict
                        ? `Showing destinations in ${selectedDistrict}`
                        : "Select a specific town or beach"}
                    </Text>
                  </View>
                </View>
                <Pressable
                  accessibilityLabel="Close"
                  onPress={() => {
                    setSublocationDropdownOpen(false);
                    setSublocationSearch("");
                  }}
                  style={styles.modalCloseBtn}
                >
                  <X size={18} color={colors.text} />
                </Pressable>
              </View>

              {/* Quick Search */}
              <View style={styles.modalSearchRow}>
                <Search size={15} color={colors.textSecondary} />
                <TextInput
                  accessibilityLabel="Search sublocations"
                  value={sublocationSearch}
                  onChangeText={setSublocationSearch}
                  placeholder="Search sublocations (e.g. Alibaug, Pawna, Lonavala)..."
                  placeholderTextColor={colors.textMuted}
                  style={styles.modalSearchInput}
                />
                {sublocationSearch ? (
                  <Pressable onPress={() => setSublocationSearch("")}>
                    <X size={14} color={colors.textMuted} />
                  </Pressable>
                ) : null}
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.modalOptionsList}
                contentContainerStyle={styles.modalOptionsContainer}
              >
                {/* All in District / All Sublocations Option */}
                <Pressable
                  onPress={() => handleSelectSublocation(null)}
                  style={[
                    styles.optionRow,
                    selectedSublocation === null && styles.optionRowActive,
                  ]}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.optionIconBox,
                        selectedSublocation === null && styles.optionIconBoxActive,
                      ]}
                    >
                      <LayoutGrid
                        size={16}
                        color={selectedSublocation === null ? colors.actionInk : colors.gold}
                      />
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.optionLabel,
                          selectedSublocation === null && styles.optionLabelActive,
                        ]}
                      >
                        {selectedDistrict
                          ? `All in ${selectedDistrict}`
                          : "All Sub-locations"}
                      </Text>
                      <Text style={styles.optionSub}>
                        Show all stays across {selectedDistrict || "all locations"}
                      </Text>
                    </View>
                  </View>
                  {selectedSublocation === null ? (
                    <Check size={18} color={colors.gold} />
                  ) : null}
                </Pressable>

                {/* Sublocation Items */}
                {searchedSublocations.map((loc) => {
                  const isSelected = selectedSublocation === loc.slug;
                  const stayCount = items.filter((p) =>
                    matchesSublocation(p, loc.slug)
                  ).length;

                  return (
                    <Pressable
                      key={loc.slug}
                      onPress={() => handleSelectSublocation(loc)}
                      style={[
                        styles.optionRow,
                        isSelected && styles.optionRowActive,
                      ]}
                    >
                      <View style={styles.optionLeft}>
                        <View
                          style={[
                            styles.optionIconBox,
                            isSelected && styles.optionIconBoxActive,
                          ]}
                        >
                          <MapPin
                            size={16}
                            color={isSelected ? colors.actionInk : colors.gold}
                          />
                        </View>
                        <View style={{ flexShrink: 1 }}>
                          <Text
                            style={[
                              styles.optionLabel,
                              isSelected && styles.optionLabelActive,
                            ]}
                          >
                            {loc.name}
                          </Text>
                          <Text style={styles.optionSub}>
                            {loc.district} • {loc.category}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.optionRight}>
                        {stayCount > 0 ? (
                          <View style={styles.countPill}>
                            <Text style={styles.countPillText}>
                              {stayCount} {stayCount === 1 ? "Stay" : "Stays"}
                            </Text>
                          </View>
                        ) : (
                          <View style={[styles.countPill, { backgroundColor: "rgba(255,255,255,0.05)" }]}>
                            <Text style={[styles.countPillText, { color: colors.textMuted }]}>
                              0 Stays
                            </Text>
                          </View>
                        )}
                        {isSelected ? (
                          <Check size={18} color={colors.gold} />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}

                {!searchedSublocations.length ? (
                  <View style={styles.modalEmpty}>
                    <Text style={styles.modalEmptyText}>
                      No sublocations match "{sublocationSearch}".
                    </Text>
                  </View>
                ) : null}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        <CustomerFooter />
      </AppScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    paddingTop: 68,
    paddingBottom: layout.bottomChromeReserve,
    backgroundColor: colors.background,
    width: "100%",
  },
  screenLarge: {
    paddingTop: 96,
    paddingBottom: layout.desktopBottomReserve,
  },
  mainContainer: {
    width: "100%",
    maxWidth: layout.expandedContentMaxWidth,
    alignSelf: "center",
    paddingHorizontal: 12,
  },
  mainContainerTablet: {
    paddingHorizontal: 28,
  },
  mainContainerDesktop: {
    paddingHorizontal: 36,
  },
  headerSection: {
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: "center",
  },
  headerSectionDesktop: {
    paddingTop: 24,
    paddingBottom: 36,
  },
  filterBar: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.16)",
    backgroundColor: "rgba(12, 16, 22, 0.94)",
    padding: 10,
    gap: 8,
    ...Platform.select({
      web: {
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
      } as any,
      default: {},
    }),
  },
  filterBarLarge: {
    padding: 20,
    borderRadius: 24,
    borderColor: "rgba(224, 184, 74, 0.22)",
    gap: 12,
  },
  floatingFilterBar: {
    position: "absolute",
    top: 66,
    left: 10,
    right: 10,
    zIndex: 90,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    backgroundColor: "rgba(10, 14, 20, 0.97)",
    padding: 8,
    gap: 6,
    ...Platform.select({
      web: {
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(20px)",
      } as any,
      default: { elevation: 12 },
    }),
  },
  floatingFilterBarWide: {
    top: 86,
    maxWidth: layout.expandedContentMaxWidth,
    alignSelf: "center",
    left: 24,
    right: 24,
    padding: 12,
  },
  categoriesContainer: {
    width: "100%",
  },
  categoriesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  mobileCategoriesScroll: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 1,
  },
  chip: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  chipLarge: {
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  mobileChip: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  mobileChipText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11.5,
  },
  activeChip: {
    borderColor: colors.goldAction,
    backgroundColor: colors.goldAction,
    ...Platform.select({
      web: {
        boxShadow: "0 2px 10px rgba(217, 165, 42, 0.28)",
      } as any,
      default: {},
    }),
  },
  chipPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  chipText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  chipTextLarge: {
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.actionInk,
    fontFamily: fontFamilies.sansBold,
  },
  wideFilterBarSecondRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.07)",
  },
  wideLocationGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  wideDropdownTrigger: {
    minHeight: 38,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  wideDivider: {
    width: 1,
    height: 26,
    backgroundColor: "rgba(224, 184, 74, 0.22)",
    marginHorizontal: 4,
  },
  wideTierGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    flex: 1,
  },
  wideResultCountBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.18)",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  mobileLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: "100%",
  },
  dropdownTrigger: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  mobileDropdownTrigger: {
    flex: 1,
    minHeight: 35,
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 5,
  },
  dropdownTriggerActive: {
    borderColor: colors.goldAction,
    backgroundColor: colors.goldAction,
    ...Platform.select({
      web: {
        boxShadow: "0 2px 8px rgba(217, 165, 42, 0.24)",
      } as any,
      default: {},
    }),
  },
  dropdownTriggerTextWrap: {
    flexDirection: "column",
    justifyContent: "center",
    flex: 1,
  },
  dropdownTriggerLabel: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 9,
    letterSpacing: 0.6,
  },
  mobileDropdownTriggerLabel: {
    fontSize: 7.5,
    letterSpacing: 0.4,
  },
  dropdownTriggerValue: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11.5,
  },
  mobileDropdownTriggerValue: {
    fontSize: 10.5,
  },
  dropdownTriggerLabelActive: {
    color: colors.actionInk,
    opacity: 0.85,
  },
  dropdownTriggerValueActive: {
    color: colors.actionInk,
    fontFamily: fontFamilies.sansBold,
  },
  secondaryControlsRow: {
    marginTop: 2,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  secondaryControlsRowLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginTop: 4,
    paddingTop: 12,
  },
  tierGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  mobileTierGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 1,
  },
  filterLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    marginRight: 2,
  },
  tierPills: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  tierPill: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  mobileTierPill: {
    minHeight: 27,
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 3,
  },
  tierPillActive: {
    borderColor: colors.goldAction,
    backgroundColor: colors.goldAction,
  },
  tierPillText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11.5,
  },
  mobileTierPillText: {
    fontSize: 10.5,
  },
  tierPillTextActive: {
    color: colors.actionInk,
    fontFamily: fontFamilies.sansBold,
  },
  locationChip: {
    minHeight: 28,
    maxWidth: 180,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.45)",
    backgroundColor: "rgba(224, 184, 74, 0.12)",
  },
  mobileLocationChip: {
    minHeight: 27,
    paddingHorizontal: 8,
  },
  locationChipText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
  },
  resetBtn: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
    backgroundColor: "rgba(5, 7, 9, 0.6)",
  },
  mobileResetBtn: {
    minHeight: 27,
    paddingHorizontal: 8,
  },
  resetBtnText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
  },
  resultsBar: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mobileResultsBar: {
    marginTop: 2,
    paddingTop: 4,
  },
  resultIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resultDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  resultCount: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
  },
  mobileResultCount: {
    fontSize: 11,
  },
  resultCountBold: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
  },
  grid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  gridTablet: {
    marginTop: 20,
    justifyContent: "flex-start",
    gap: 16,
  },
  gridDesktop: {
    marginTop: 24,
    justifyContent: "flex-start",
    gap: 20,
  },
  emptyCard: {
    marginTop: 28,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.2)",
    backgroundColor: "rgba(12, 16, 22, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    maxWidth: 520,
    width: "100%",
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 20,
    textAlign: "center",
  },
  emptyDescription: {
    marginTop: 6,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
  },
  emptyActionBtn: {
    marginTop: 16,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.goldAction,
  },
  emptyActionBtnText: {
    color: colors.actionInk,
    fontFamily: fontFamilies.sansBold,
    fontSize: 12.5,
  },

  /* Dropdown Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(5, 7, 9, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "80%",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
    backgroundColor: "rgba(14, 18, 26, 0.98)",
    padding: 20,
    ...Platform.select({
      web: {
        boxShadow: "0 20px 48px rgba(0, 0, 0, 0.6)",
      } as any,
      default: {},
    }),
  },
  modalCardDesktop: {
    maxWidth: 480,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  modalHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    color: colors.text,
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 18,
  },
  modalSubtitle: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
    marginBottom: 6,
  },
  modalSearchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    padding: 0,
    ...Platform.select({
      web: { outlineStyle: "none" } as any,
      default: {},
    }),
  },
  modalOptionsList: {
    marginTop: 10,
  },
  modalOptionsContainer: {
    paddingVertical: 4,
    gap: 6,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  optionRowActive: {
    borderColor: "rgba(224, 184, 74, 0.45)",
    backgroundColor: "rgba(224, 184, 74, 0.1)",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  optionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconBoxActive: {
    backgroundColor: colors.goldAction,
  },
  optionLabel: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13.5,
  },
  optionLabelActive: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
  },
  optionSub: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
    marginTop: 1,
  },
  optionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: "rgba(224, 184, 74, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
  },
  countPillText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 10.5,
  },
  modalEmpty: {
    paddingVertical: 24,
    alignItems: "center",
  },
  modalEmptyText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
  },
});
