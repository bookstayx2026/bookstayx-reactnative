import { Platform, StyleSheet, Text, View } from "react-native";
import { usePathname, useRouter, type Href } from "expo-router";
import { CalendarDays, Heart, Home, Hotel, IndianRupee, MapPin, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "@/components/foundation";
import { colors, fontFamilies } from "@/theme";
import { isCustomerRouteActive, type CustomerNavItem } from "./customer-navigation";
import { useAuth } from "@/components/auth";
import { useIsMobile } from "@/hooks/use-window-class";

const mobileBottomNavItems: CustomerNavItem[] = [
  { href: "/", label: "Home", shortLabel: "Home", icon: Home, exact: true },
  { href: "/locations", label: "Locations", shortLabel: "Places", icon: MapPin },
  { href: "/properties", label: "Properties", shortLabel: "Stays", icon: Hotel },
  { href: "/referrals", label: "Referral", shortLabel: "Referral", icon: IndianRupee },
  { href: "/bookings", label: "Bookings", shortLabel: "Bookings", icon: CalendarDays },
  { href: "/saved", label: "Saved", shortLabel: "Saved", icon: Heart },
  { href: "/profile", label: "Profile", shortLabel: "Profile", icon: User },
];

function NavItem({ item }: { item: CustomerNavItem }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useAuth();
  const profileLogin = item.href === "/profile" && pathname === "/login";
  const active = profileLogin || isCustomerRouteActive(pathname, item);
  const Icon = item.icon;
  const referral = item.href === "/referrals";

  return (
    <PressableScale
      accessibilityLabel={item.label}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={() => {
        const href = item.href === "/profile" && !session ? "/login" : item.href;
        router.push(href as Href);
      }}
      style={styles.navItem}
    >
      <View style={[styles.navContent, referral && styles.referralContent]}>
        {referral ? (
          <View style={[styles.referralOrb, active && styles.referralOrbActive]}>
            <IndianRupee color={colors.success} size={15} strokeWidth={2.4} />
          </View>
        ) : (
          <Icon
            color={active ? colors.gold : "rgba(255, 255, 255, 0.45)"}
            size={16}
            strokeWidth={active ? 2 : 1.6}
          />
        )}
        <Text
          numberOfLines={1}
          style={[
            styles.navLabel,
            { color: referral ? colors.success : active ? colors.gold : "rgba(255, 255, 255, 0.5)" },
            active && styles.navLabelActive,
          ]}
        >
          {item.shortLabel}
        </Text>
      </View>
    </PressableScale>
  );
}

export function CustomerBottomNav() {
  const insets = useSafeAreaInsets();
  const isMobile = useIsMobile();

  // Hidden on Tablet (tab view) and Desktop screens
  if (!isMobile) {
    return null;
  }

  return (
    <View style={[styles.fixed, { paddingBottom: Math.max(6, insets.bottom) }]}>
      <View style={styles.bar}>
        <View accessibilityRole="tablist" style={styles.items}>
          {mobileBottomNavItems.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fixed: {
    position: "absolute",
    zIndex: 100,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingHorizontal: 8,
    pointerEvents: "box-none",
  },
  bar: {
    width: "100%",
    maxWidth: 440,
    height: 58,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.22)",
    backgroundColor: "rgba(10, 14, 20, 0.98)",
    justifyContent: "center",
    ...Platform.select({
      web: {
        boxShadow: "0 -4px 28px rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(20px)",
      } as any,
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
      },
      default: { elevation: 20 },
    }),
  },
  items: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  navItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  navContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  referralContent: {
    justifyContent: "center",
  },
  referralOrb: {
    width: 34,
    height: 34,
    marginTop: -10,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: colors.success,
    backgroundColor: "#061B12",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: { boxShadow: "0 0 14px rgba(61, 255, 138, 0.55)" },
      ios: { shadowColor: colors.success, shadowOpacity: 0.55, shadowRadius: 14 },
      default: { elevation: 12 },
    }),
  },
  referralOrbActive: Platform.select({
    web: { boxShadow: "0 0 20px rgba(61, 255, 138, 0.85)" },
    ios: { shadowOpacity: 0.85, shadowRadius: 20 },
    default: { elevation: 14 },
  }),
  navLabel: {
    maxWidth: "100%",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 8.5,
    lineHeight: 10,
    textAlign: "center",
  },
  navLabelActive: {
    fontFamily: fontFamilies.sansBold,
  },
});
