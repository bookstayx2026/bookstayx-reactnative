import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { SlideInRight } from "react-native-reanimated";
import { Image } from "expo-image";
import { usePathname, useRouter, type Href } from "expo-router";
import { Building2, LogOut, User, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "@/components/foundation";
import { useIsDesktop } from "@/hooks/use-window-class";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useAuth } from "@/components/auth";
import { colors, fontFamilies, layout, motion, radii, spacing } from "@/theme";
import { useCustomerChrome } from "./CustomerChromeContext";
import {
  customerMenuItems,
  isCustomerRouteActive,
  notificationNavItem,
  policyNavItems,
  type CustomerNavItem,
} from "./customer-navigation";

function MenuRow({ item, onSelect }: { item: CustomerNavItem; onSelect: (href: string) => void }) {
  const pathname = usePathname();
  const active = isCustomerRouteActive(pathname, item);
  const Icon = item.icon;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={() => onSelect(item.href)}
      style={[styles.row, active && styles.rowActive]}
    >
      <View style={styles.rowInner}>
        <View style={[styles.rowIcon, active && styles.rowIconActive]}>
          <Icon color={active ? colors.gold : colors.textSecondary} size={15} strokeWidth={1.7} />
        </View>
        <Text style={[styles.rowLabel, active && styles.rowLabelActive]}>{item.label}</Text>
      </View>
    </PressableScale>
  );
}

export function CustomerSideMenu() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const isDesktop = useIsDesktop();
  const { menuOpen, closeMenu } = useCustomerChrome();
  const { session, signOut } = useAuth();
  const isCustomer = session?.role === "customer";
  const isOwner = session?.role === "owner" || session?.role === "admin";

  const select = (href: string) => {
    closeMenu();
    router.push(href as Href);
  };

  if (isDesktop) {
    return null;
  }

  return (
    <Modal transparent visible={menuOpen} animationType="fade" onRequestClose={closeMenu} statusBarTranslucent>
      <View style={styles.modalRoot}>
        <Pressable accessibilityLabel="Close menu" onPress={closeMenu} style={styles.scrim} />

        <Animated.View
          accessibilityRole="menu"
          accessibilityLabel="Main menu"
          entering={SlideInRight.duration(reducedMotion ? 0 : motion.drawerMs)}
          style={[
            styles.sheet,
            isDesktop && styles.sheetDesktop,
            {
              paddingTop: Math.max(isDesktop ? 16 : 10, insets.top),
              paddingBottom: (isDesktop ? 28 : 80) + Math.max(10, insets.bottom),
            },
          ]}
        >
          <View style={styles.sheetHighlight} />
          <View style={[styles.sheetHeader, isDesktop && styles.sheetHeaderDesktop]}>
            <Image
              source={require("../../../assets/images/bookstayx-logo.png")}
              contentFit="contain"
              style={isDesktop ? styles.menuLogoDesktop : styles.menuLogo}
            />
            <PressableScale accessibilityLabel="Close" onPress={closeMenu} style={styles.closeButton}>
              <View style={styles.closeInner}>
                <X color={colors.text} size={17} strokeWidth={1.8} />
              </View>
            </PressableScale>
          </View>

          <ScrollView
            contentContainerStyle={styles.menuContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={styles.sectionLabel}>Explore</Text>
            <View style={styles.rows}>
              {customerMenuItems.map((item) => (
                <MenuRow key={item.href} item={item} onSelect={select} />
              ))}
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>Policies</Text>
            <View style={styles.rows}>
              {policyNavItems.map((item) => (
                <MenuRow key={item.href} item={item} onSelect={select} />
              ))}
            </View>

            <View style={styles.menuBottom}>
              <MenuRow item={notificationNavItem} onSelect={select} />

              {isCustomer ? (
                <PressableScale
                  accessibilityLabel="Sign out"
                  onPress={async () => {
                    closeMenu();
                    await signOut();
                    router.push("/");
                  }}
                  style={[styles.row, styles.logoutRow]}
                >
                  <View style={styles.rowInner}>
                    <View style={[styles.rowIcon, styles.logoutIcon]}>
                      <LogOut color="#EF4444" size={15} strokeWidth={1.7} />
                    </View>
                    <Text style={[styles.rowLabel, styles.logoutLabel]}>Sign Out</Text>
                  </View>
                </PressableScale>
              ) : isOwner ? (
                <PressableScale
                  accessibilityLabel="Open owner portal"
                  onPress={() => select("/owner")}
                  style={[styles.row, styles.ownerRow]}
                >
                  <View style={styles.rowInner}>
                    <View style={[styles.rowIcon, styles.ownerIcon]}>
                      <Building2 color={colors.gold} size={15} strokeWidth={1.7} />
                    </View>
                    <Text style={[styles.rowLabel, styles.ownerLabel]}>Owner Portal</Text>
                  </View>
                </PressableScale>
              ) : (
                <PressableScale
                  accessibilityLabel="Sign in"
                  onPress={() => select("/login")}
                  style={[styles.row, styles.signInRow]}
                >
                  <View style={styles.rowInner}>
                    <View style={[styles.rowIcon, styles.signInIcon]}>
                      <User color={colors.gold} size={15} strokeWidth={1.7} />
                    </View>
                    <Text style={[styles.rowLabel, styles.signInLabel]}>Customer Sign In</Text>
                  </View>
                </PressableScale>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
  },
  scrim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
  },
  sheet: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "86%",
    maxWidth: 320,
    overflow: "hidden",
    borderBottomLeftRadius: 22,
    borderTopLeftRadius: 22,
    borderLeftWidth: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(224, 184, 74, 0.25)",
    backgroundColor: "rgba(10, 13, 17, 0.98)",
    ...Platform.select({
      web: {
        boxShadow: "-16px 0 50px rgba(0, 0, 0, 0.7)",
      },
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: -16, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 50,
      },
      default: { elevation: 24 },
    }),
  },
  sheetDesktop: {
    width: 360,
    maxWidth: 380,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  sheetHighlight: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(255,255,255,0.025)",
    pointerEvents: "none",
  },
  sheetHeader: {
    minHeight: 56,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  sheetHeaderDesktop: {
    minHeight: 64,
    paddingHorizontal: spacing.lg,
  },
  menuLogo: { width: 132, height: 38 },
  menuLogoDesktop: { width: 148, height: 42 },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  closeInner: { flex: 1, alignItems: "center", justifyContent: "center" },
  menuContent: { paddingHorizontal: 12, paddingVertical: spacing.md, flexGrow: 1 },
  sectionLabel: {
    paddingHorizontal: spacing.sm,
    marginBottom: 5,
    color: colors.textMuted,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  rows: { gap: 4 },
  row: { minHeight: 44, borderRadius: 10, overflow: "hidden" },
  rowActive: { backgroundColor: "rgba(224,184,74,0.16)" },
  rowInner: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 10 },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  rowIconActive: { borderColor: colors.hairline, backgroundColor: "rgba(224,184,74,0.12)" },
  rowLabel: { color: colors.textSecondary, fontFamily: fontFamilies.sansSemiBold, fontSize: 13.5, lineHeight: 17 },
  rowLabelActive: { color: colors.gold },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: 10 },
  menuBottom: { marginTop: spacing.xxl, gap: 6 },
  logoutRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239, 68, 68, 0.25)",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  logoutIcon: { borderColor: "rgba(239, 68, 68, 0.3)", backgroundColor: "rgba(239, 68, 68, 0.12)" },
  logoutLabel: { color: "#EF4444" },
  ownerRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    backgroundColor: "rgba(224,184,74,0.08)",
  },
  ownerIcon: { borderColor: colors.hairline, backgroundColor: "rgba(224,184,74,0.1)" },
  ownerLabel: { color: colors.gold },
  signInRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  signInIcon: { borderColor: "rgba(255, 255, 255, 0.15)", backgroundColor: "rgba(255, 255, 255, 0.08)" },
  signInLabel: { color: colors.textSecondary },
});
