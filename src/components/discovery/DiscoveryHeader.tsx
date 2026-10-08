import { StyleSheet, Text, View } from "react-native";
import { colors, fontFamilies } from "@/theme";
import { useIsDesktop } from "@/hooks/use-window-class";

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

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, isDesktop && styles.labelDesktop]}>{label}</Text> : null}
      <Text style={[styles.title, isDesktop && styles.titleDesktop]}>
        {lead} <Text style={styles.accent}>{accent}</Text>
      </Text>
      {copy ? <Text style={[styles.copy, isDesktop && styles.copyDesktop]}>{copy}</Text> : null}
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
  copyDesktop: {
    maxWidth: 680,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 12,
  },
});

