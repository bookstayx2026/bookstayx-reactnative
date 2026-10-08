import type { PropsWithChildren } from "react";
import { StyleSheet, Text, type TextProps } from "react-native";
import { colors, fontFamilies, fontSizes } from "@/theme";

type BrandTextVariant =
  | "display"
  | "displayItalic"
  | "title"
  | "body"
  | "bodyStrong"
  | "caption"
  | "label";

type BrandTextProps = PropsWithChildren<
  TextProps & {
    variant?: BrandTextVariant;
    color?: string;
  }
>;

export function BrandText({
  children,
  variant = "body",
  color,
  style,
  maxFontSizeMultiplier,
  ...props
}: BrandTextProps) {
  return (
    <Text
      {...props}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? 1.35}
      style={[styles.base, styles[variant], color ? { color } : null, style]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: { color: colors.text, fontFamily: fontFamilies.sans },
  display: {
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: fontSizes.display,
    lineHeight: 36,
  },
  displayItalic: {
    color: colors.gold,
    fontFamily: fontFamilies.displayItalic,
    fontSize: fontSizes.display,
    lineHeight: 36,
  },
  title: {
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: fontSizes.title,
    lineHeight: 29,
  },
  body: {
    color: colors.textSecondary,
    fontSize: fontSizes.body,
    lineHeight: 22,
  },
  bodyStrong: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: fontSizes.body,
    lineHeight: 21,
  },
  caption: {
    color: colors.textMuted,
    fontSize: fontSizes.captionLarge,
    lineHeight: 18,
  },
  label: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: fontSizes.caption,
    lineHeight: 16,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
});
