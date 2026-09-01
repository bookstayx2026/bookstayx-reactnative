import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { usePathname, useRouter, type Href } from "expo-router";
import { IndianRupee } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "@/components/foundation";
import { colors, fontFamilies, layout, radii } from "@/theme";
import { customerNavItems, isCustomerRouteActive, type CustomerNavItem } from "./customer-navigation";

const shellFill = "rgba(11, 14, 18, 0.96)";
const shellStroke = "rgba(224, 184, 74, 0.42)";

function BottomShell() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.noPointerEvents]}>
      <View style={[styles.shellSide, styles.shellLeft]} />
      <View style={[styles.shellSide, styles.shellRight]} />
      <Svg width={120} height={70} viewBox="0 0 120 70" style={styles.shellCenter}>
        <Path
          d="M0 14 L12 14 C24 14 30 14 38 9 C46 4 52 2 60 2 C68 2 74 4 82 9 C90 14 96 14 108 14 L120 14 L120 70 L0 70 Z"
          fill={shellFill}
        />
        <Path
          d="M0 14 L12 14 C24 14 30 14 38 9 C46 4 52 2 60 2 C68 2 74 4 82 9 C90 14 96 14 108 14 L120 14"
          fill="none"
          stroke={shellStroke}
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path d="M0 69.4 H120" stroke={shellStroke} strokeWidth={1.2} />
      </Svg>
    </View>
  );
}

function NavItem({ item, compact }: { item: CustomerNavItem; compact: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const active = isCustomerRouteActive(pathname, item);
  const Icon = item.icon;
  const referral = item.href === "/referrals";

  return (
    <PressableScale
      accessibilityLabel={item.label}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={() => router.push(item.href as Href)}
      style={styles.navItem}
    >
      <View style={[styles.navContent, referral && styles.referralContent]}>
        {referral ? (
          <View style={[styles.referralOrb, active && styles.referralOrbActive]}>
            <IndianRupee color={colors.success} size={18} strokeWidth={2.2} />
          </View>
        ) : (
          <Icon color={active ? colors.gold : colors.textMuted} size={18} strokeWidth={1.55} />
        )}
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={1.15}
          style={[
            styles.navLabel,
            { color: referral ? colors.success : active ? colors.gold : colors.textMuted },
          ]}
        >
          {compact ? item.shortLabel : item.label}
        </Text>
      </View>
    </PressableScale>
  );
}

export function CustomerBottomNav() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 390;

  return (
    <View style={[styles.fixed, { paddingBottom: Math.max(10, insets.bottom) }]}>
      <View style={styles.bar}>
        <BottomShell />
        <View accessibilityRole="tablist" style={styles.items}>
          {customerNavItems.map((item) => (
            <NavItem key={item.href} item={item} compact={compact} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fixed: {
    position: "absolute",
    zIndex: 35,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingHorizontal: 10,
    pointerEvents: "box-none",
  },
  bar: {
    width: "100%",
    maxWidth: layout.sourceMaxWidth,
    height: 70,
    ...Platform.select({
      web: { boxShadow: "0 -8px 28px rgba(0, 0, 0, 0.5)" },
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.48,
        shadowRadius: 28,
      },
      default: { elevation: 16 },
    }),
  },
  shellSide: {
    position: "absolute",
    top: 14,
    bottom: 0,
    backgroundColor: shellFill,
    borderColor: shellStroke,
    borderWidth: StyleSheet.hairlineWidth,
  },
  shellLeft: {
    left: 0,
    right: "50%",
    marginRight: 48,
    borderRightWidth: 0,
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
  },
  shellRight: {
    right: 0,
    left: "50%",
    marginLeft: 48,
    borderLeftWidth: 0,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
  },
  shellCenter: { position: "absolute", left: "50%", bottom: 0, marginLeft: -60 },
  items: { zIndex: 1, flex: 1, flexDirection: "row", paddingHorizontal: 4, paddingTop: 14, paddingBottom: 10 },
  navItem: { flex: 1, minWidth: 0, height: "100%" },
  navContent: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 3 },
  referralContent: { justifyContent: "flex-end" },
  referralOrb: {
    width: 38,
    height: 38,
    marginTop: -11,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.success,
    backgroundColor: "#0A0D10",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: { boxShadow: "0 0 14px rgba(61, 255, 138, 0.42)" },
      ios: { shadowColor: colors.success, shadowOpacity: 0.42, shadowRadius: 14 },
      default: { elevation: 10 },
    }),
  },
  referralOrbActive: Platform.select({
    web: { boxShadow: "0 0 20px rgba(61, 255, 138, 0.7)" },
    ios: { shadowOpacity: 0.7, shadowRadius: 20 },
    default: { elevation: 12 },
  }),
  navLabel: { maxWidth: "100%", fontFamily: fontFamilies.sansMedium, fontSize: 8.5, lineHeight: 10 },
  noPointerEvents: { pointerEvents: "none" },
});
