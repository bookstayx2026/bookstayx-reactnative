import type { PropsWithChildren } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { colors, radii, shadows, spacing } from "@/theme";

export function Surface({ children, style, ...props }: PropsWithChildren<ViewProps>) {
  return (
    <View {...props} style={[styles.surface, shadows.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderRadius: radii.largeCard,
    backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    padding: spacing.lg,
  },
});
