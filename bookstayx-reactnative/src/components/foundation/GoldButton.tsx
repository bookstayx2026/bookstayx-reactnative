import type { ComponentProps, ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BrandText } from "./BrandText";
import { PressableScale } from "./PressableScale";
import { colors, layout, radii, shadows, spacing } from "@/theme";

type GoldButtonProps = Omit<ComponentProps<typeof PressableScale>, "children"> & {
  label: string;
  icon?: ReactNode;
};

export function GoldButton({ label, icon, style, ...props }: GoldButtonProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      style={[styles.pressable, shadows.goldAction, style]}
      {...props}
    >
      <LinearGradient
        colors={[colors.goldPale, colors.goldAction, colors.goldDeep]}
        locations={[0, 0.48, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {icon}
          <BrandText variant="bodyStrong" color={colors.actionInk}>
            {label}
          </BrandText>
        </View>
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pressable: {
    minHeight: layout.minimumTouchTarget,
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  gradient: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.xl },
  content: {
    minHeight: layout.minimumTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
});
