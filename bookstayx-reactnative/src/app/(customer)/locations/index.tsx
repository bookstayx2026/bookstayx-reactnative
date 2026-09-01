import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ArrowRight, Search, SlidersHorizontal, X } from "lucide-react-native";
import { AppScreen } from "@/components/foundation";
import { LocationCard } from "@/components/discovery";
import { useCustomerChrome } from "@/components/customer";
import { locationGroups, locations } from "@/data/discovery";
import { colors, fontFamilies, layout } from "@/theme";

const districts = ["Pune District", "Raigad District", "Ratnagiri District", "Sindhudurg District"];
const types = ["Beach Destination", "Lake Destination", "Hill Station", "Nature Escape"];
const bestFor = ["Couples", "Families", "Groups", "Adventure", "Relaxation"];

export default function LocationsScreen() {
  const { onScroll } = useCustomerChrome();
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [district, setDistrict] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return locations.filter((location) => {
      const matchesSearch = !search || [location.name, location.district, location.region, location.category].some((value) => value.toLowerCase().includes(search));
      return matchesSearch && (!district || location.region === district || location.district === district) && (!type || location.category === type);
    });
  }, [district, query, type]);
  const isFiltering = Boolean(query.trim() || district || type);
  const showGroup = (title: string) => {
    const normalized = title.replace(/ \(.+\)/, "");
    setDistrict(normalized === "Karjat District" ? "Raigad District" : normalized);
  };

  return <>
    <AppScreen contentContainerStyle={styles.screen} scrollProps={{ onScroll, scrollEventThrottle: 16 }}>
      <View style={styles.searchRow}>
        <View style={styles.search}><Search size={17} color={colors.textSecondary} /><TextInput accessibilityLabel="Search locations" value={query} onChangeText={setQuery} placeholder="Search locations..." placeholderTextColor={colors.textMuted} style={styles.input} /></View>
        <Pressable accessibilityLabel="Open location filters" onPress={() => setFiltersOpen(true)} style={[styles.filter, (district || type) && styles.filterActive]}><SlidersHorizontal size={17} color={district || type ? colors.gold : colors.text} />{district || type ? <View style={styles.filterDot} /> : null}</Pressable>
      </View>
      {isFiltering ? <View style={styles.result}><Text style={styles.count}>{filtered.length} destinations found</Text><View style={styles.grid}>{filtered.map((location, index) => <LocationCard key={location.slug} location={location} compact rank={index + 1} />)}</View>{!filtered.length ? <Text style={styles.empty}>No destinations match your search.</Text> : null}</View> : locationGroups.map((group, groupIndex) => {
        const items = group.slugs.map((slug) => locations.find((location) => location.slug === slug)).filter(Boolean);
        return <View key={group.title} style={styles.group}><View style={styles.heading}><Text style={styles.title}><Text style={styles.number}>{groupIndex + 1}.</Text> {group.title}</Text><Pressable accessibilityRole="button" onPress={() => showGroup(group.title)} style={styles.view}><Text style={styles.viewText}>View all</Text><ArrowRight size={14} color={colors.gold} /></Pressable></View><View style={styles.grid}>{items.map((location, index) => <LocationCard key={location!.slug} location={location!} compact rank={groupIndex < 2 ? undefined : index + 1} />)}</View></View>;
      })}
    </AppScreen>
    <Modal visible={filtersOpen} transparent animationType="slide" onRequestClose={() => setFiltersOpen(false)}><View style={styles.modalRoot}><Pressable accessibilityLabel="Close filters" onPress={() => setFiltersOpen(false)} style={StyleSheet.absoluteFill} /><View style={styles.sheet}><View style={styles.handle} /><View style={styles.sheetHeading}><Text style={styles.sheetTitle}>Filters</Text><Pressable accessibilityLabel="Close filters" onPress={() => setFiltersOpen(false)} style={styles.close}><X size={18} color={colors.text} /></Pressable></View><FilterGroup title="District" options={districts} value={district} onChange={setDistrict} /><FilterGroup title="Destination Type" options={types} value={type} onChange={setType} /><FilterGroup title="Best For" options={bestFor} value={null} onChange={() => {}} /><View style={styles.actions}><Pressable onPress={() => { setDistrict(null); setType(null); }} style={styles.reset}><Text style={styles.resetText}>Reset</Text></Pressable><Pressable onPress={() => setFiltersOpen(false)} style={styles.apply}><Text style={styles.applyText}>Show results</Text></Pressable></View></View></View></Modal>
  </>;
}

function FilterGroup({ title, options, value, onChange }: { title: string; options: string[]; value: string | null; onChange: (value: string | null) => void }) {
  return <View style={styles.filterGroup}><Text style={styles.filterLabel}>{title}</Text><View style={styles.chips}>{options.map((option) => <Pressable key={option} onPress={() => onChange(value === option ? null : option)} style={[styles.chip, value === option && styles.chipActive]}><Text style={[styles.chipText, value === option && styles.chipTextActive]}>{option}</Text></Pressable>)}</View></View>;
}

const styles = StyleSheet.create({
  screen: { paddingTop: 76, paddingBottom: layout.bottomChromeReserve }, searchRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingVertical: 12 },
  search: { height: 46, flex: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, borderRadius: 99, borderWidth: 1, borderColor: "rgba(255,255,255,.2)", backgroundColor: "rgba(255,255,255,.08)" },
  input: { flex: 1, color: colors.text, fontFamily: fontFamilies.sans, fontSize: 13.5, outlineStyle: "none" as never }, filter: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,.2)", backgroundColor: "rgba(255,255,255,.08)" },
  filterActive: { borderColor: colors.gold, backgroundColor: "rgba(224,184,74,.12)" }, filterDot: { position: "absolute", right: 8, top: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold },
  result: { paddingHorizontal: 20, paddingTop: 4 }, count: { color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 12 }, empty: { paddingVertical: 42, textAlign: "center", color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 13 },
  group: { paddingHorizontal: 20, marginTop: 20 }, heading: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }, title: { flex: 1, color: colors.text, fontFamily: fontFamilies.sansSemiBold, fontSize: 14.5, lineHeight: 20 }, number: { color: colors.gold }, view: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 2 }, viewText: { color: colors.gold, fontFamily: fontFamilies.sansMedium, fontSize: 12.5 }, grid: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 7 },
  modalRoot: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,.7)" }, sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: colors.hairline, backgroundColor: "#0b0e12", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 }, handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,.15)", marginBottom: 16 },
  sheetHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, sheetTitle: { color: colors.text, fontFamily: fontFamilies.displaySemiBold, fontSize: 22 }, close: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.hairline }, filterGroup: { marginTop: 20 }, filterLabel: { color: colors.gold, fontFamily: fontFamilies.sansSemiBold, fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }, chip: { borderRadius: 99, borderWidth: 1, borderColor: colors.hairline, backgroundColor: "#11151a", paddingHorizontal: 14, paddingVertical: 9 }, chipActive: { borderColor: colors.gold, backgroundColor: "rgba(224,184,74,.15)" }, chipText: { color: colors.textSecondary, fontFamily: fontFamilies.sans, fontSize: 12.5 }, chipTextActive: { color: colors.gold },
  actions: { flexDirection: "row", gap: 12, marginTop: 24 }, reset: { flex: 1, alignItems: "center", borderRadius: 14, borderWidth: 1, borderColor: colors.hairline, paddingVertical: 13 }, resetText: { color: colors.textSecondary, fontFamily: fontFamilies.sansMedium, fontSize: 13.5 }, apply: { flex: 1, alignItems: "center", borderRadius: 14, backgroundColor: colors.gold, paddingVertical: 13 }, applyText: { color: "#141007", fontFamily: fontFamilies.sansSemiBold, fontSize: 13.5 },
});
