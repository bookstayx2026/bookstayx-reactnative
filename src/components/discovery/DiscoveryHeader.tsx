import { StyleSheet, Text, View } from "react-native";
import { colors, fontFamilies } from "@/theme";
import { useIsDesktop, useIsTablet } from "@/hooks/use-window-class";

export function DiscoveryHeader({
  label,
  lead,
  accent,
  copy,
}: {
  label?: string;
  lead: string;
  accent: string;
  copy?: string;
}) {
  const isDesktop = useIsDesktop();
  const isTablet = useIsTablet();

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, isTablet && styles.labelTablet, isDesktop && styles.labelDesktop]}>{label}</Text> : null}
      <Text style={[styles.title, isTablet && styles.titleTablet, isDesktop && styles.titleDesktop]}>
        {lead} <Text style={styles.accent}>{accent}</Text>
      </Text>
      {copy ? <Text style={[styles.copy, isTablet && styles.copyTablet, isDesktop && styles.copyDesktop]}>{copy}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  label: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 10.5,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  labelTablet: { fontSize: 11, letterSpacing: 2.2 },
  labelDesktop: {
    fontSize: 12,
    letterSpacing: 2.5,
  },
  title: {
    marginTop: 5,
    color: colors.text,
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 32,
    lineHeight: 38,
    textAlign: "center",
  },
  titleTablet: { fontSize: 36, lineHeight: 42, marginTop: 6 },
  titleDesktop: {
    fontSize: 42,
    lineHeight: 48,
    marginTop: 8,
  },
  accent: { color: colors.gold, fontFamily: fontFamilies.displayItalic },
  copy: {
    maxWidth: 360,
    marginTop: 8,
    textAlign: "center",
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 21,
  },
  copyTablet: { maxWidth: 520, fontSize: 14, lineHeight: 22, marginTop: 10 },
  copyDesktop: {
    maxWidth: 680,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 12,
  },
});

