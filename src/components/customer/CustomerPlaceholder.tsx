import type { LucideIcon } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { AppScreen, BrandText } from "@/components/foundation";
import { colors, layout, radii, spacing } from "@/theme";

type CustomerPlaceholderProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function CustomerPlaceholder({ title, description, icon: Icon }: CustomerPlaceholderProps) {
  return (
    <AppScreen contentContainerStyle={styles.screen}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Icon color={colors.gold} size={24} strokeWidth={1.6} />
        </View>
        <BrandText variant="display" style={styles.title}>{title}</BrandText>
        <BrandText style={styles.description}>{description}</BrandText>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 112, paddingBottom: layout.bottomChromeReserve },
  content: { paddingHorizontal: spacing.xl, paddingTop: 56, alignItems: "center" },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    backgroundColor: "rgba(224,184,74,0.08)",
  },
  title: { marginTop: spacing.lg, textAlign: "center" },
  description: { marginTop: spacing.sm, maxWidth: 310, textAlign: "center" },
});
