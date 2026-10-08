import { router, type Href } from "expo-router";
import { ArrowRight, ShieldCheck } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fontFamilies, radii, spacing } from "@/theme";
import type { AdminSection } from "./admin-navigation";

export function AdminModulePlaceholder({ section }: { section: AdminSection }) {
  const Icon = section.icon;
  return <ScrollView contentContainerStyle={styles.page}><View style={styles.heading}><View style={styles.icon}><Icon size={24} color={colors.gold} /></View><View style={styles.headingCopy}><Text style={styles.title}>{section.label}</Text><Text style={styles.subtitle}>{section.description}</Text></View></View><View style={styles.foundation}><View style={styles.foundationHead}><ShieldCheck size={18} color={colors.success} /><Text style={styles.foundationTitle}>Route foundation is ready</Text></View><Text style={styles.body}>This protected web route is connected to the admin shell. Its legacy API workflows will be implemented in Phase {section.phase}.</Text><Pressable accessibilityRole="link" onPress={() => router.push("/admin" as Href)} style={styles.back}><Text style={styles.backText}>Return to overview</Text><ArrowRight size={15} color={colors.gold} /></Pressable></View></ScrollView>;
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: spacing.xxl, paddingBottom: 64 }, heading: { flexDirection: "row", alignItems: "center", gap: spacing.md }, icon: { width: 48, height: 48, borderRadius: radii.card, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(224,184,74,.1)" }, headingCopy: { flex: 1 }, title: { color: colors.text, fontFamily: fontFamilies.displaySemiBold, fontSize: 30, lineHeight: 34 }, subtitle: { marginTop: 3, color: colors.textMuted, fontFamily: fontFamilies.sans, fontSize: 12 },
  foundation: { maxWidth: 620, marginTop: 40, padding: spacing.xxl, borderRadius: radii.largeCard, backgroundColor: colors.surfaceRaised }, foundationHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm }, foundationTitle: { color: colors.text, fontFamily: fontFamilies.sansSemiBold, fontSize: 14 }, body: { marginTop: spacing.md, color: colors.textSecondary, fontFamily: fontFamilies.sans, fontSize: 12, lineHeight: 19 }, back: { alignSelf: "flex-start", minHeight: 44, marginTop: spacing.xl, flexDirection: "row", alignItems: "center", gap: spacing.sm }, backText: { color: colors.gold, fontFamily: fontFamilies.sansSemiBold, fontSize: 12 },
});
