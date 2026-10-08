import { Platform } from "react-native";

export const colors = {
  background: "#050709",
  surface: "#0B0E11",
  surfaceRaised: "#12161C",
  surfaceStrong: "#14181F",
  surfaceSoft: "#0C1014",
  gold: "#E0B84A",
  goldAction: "#D9A52A",
  goldPale: "#F0D078",
  goldDeep: "#9A7020",
  actionInk: "#141007",
  text: "#E8ECF2",
  textSecondary: "#C9CDD4",
  textMuted: "#8B93A0",
  textSubtle: "#9AA1AB",
  hairline: "rgba(224, 184, 74, 0.25)",
  success: "#3DFF8A",
  successStandard: "#22C55E",
  info: "#60A5FA",
  danger: "#EF4444",
  scrim: "rgba(0, 0, 0, 0.45)",
  transparent: "transparent",
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
} as const;

export const radii = {
  xs: 5,
  sm: 8,
  md: 10,
  compactCard: 12,
  card: 14,
  largeCard: 16,
  panel: 18,
  largePanel: 20,
  sheet: 24,
  dialog: 28,
  pill: 999,
} as const;

export const fontFamilies = {
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemiBold: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
  display: "CormorantGaramond_400Regular",
  displayMedium: "CormorantGaramond_500Medium",
  displaySemiBold: "CormorantGaramond_600SemiBold",
  displayBold: "CormorantGaramond_700Bold",
  displayItalic: "CormorantGaramond_500Medium_Italic",
} as const;

export const fontSizes = {
  micro: 10,
  caption: 11,
  captionLarge: 12,
  bodyCompact: 13,
  body: 14,
  bodyLarge: 16,
  titleSmall: 18,
  title: 24,
  displaySmall: 28,
  display: 32,
  displayLarge: 36,
} as const;

export const motion = {
  pressScale: 0.975,
  pressMs: 160,
  smallMs: 180,
  standardMs: 240,
  drawerMs: 360,
} as const;

export const layout = {
  sourceMaxWidth: 480,
  tabletContentMaxWidth: 920,
  expandedContentMaxWidth: 1520,
  headerMaxWidth: 1640,
  screenInset: 20,
  bottomChromeReserve: 108,
  desktopBottomReserve: 36,
  minimumTouchTarget: Platform.select({ ios: 44, default: 48 }),
  compactMaxWidth: 639,
  mediumMaxWidth: 1023,
} as const;

export const shadows = {
  card: Platform.select({
    web: { boxShadow: "0 8px 22px rgba(0, 0, 0, 0.32)" },
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.32,
      shadowRadius: 22,
    },
    default: { elevation: 8 },
  }),
  goldAction: Platform.select({
    web: { boxShadow: "0 10px 18px rgba(217, 165, 42, 0.32)" },
    ios: {
      shadowColor: colors.goldAction,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.32,
      shadowRadius: 18,
    },
    default: { elevation: 7 },
  }),
} as const;
