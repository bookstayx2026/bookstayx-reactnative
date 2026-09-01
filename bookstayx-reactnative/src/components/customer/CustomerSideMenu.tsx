import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { SlideInRight } from "react-native-reanimated";
import { Image } from "expo-image";
import { usePathname, useRouter, type Href } from "expo-router";
import { Building2, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "@/components/foundation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
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
  const { menuOpen, closeMenu } = useCustomerChrome();

  const select = (href: string) => {
    closeMenu();
    router.push(href as Href);
  };

  return (
    <Modal transparent visible={menuOpen} animationType="fade" onRequestClose={closeMenu} statusBarTranslucent>
      <View style={styles.modalRoot}>
        <View style={styles.modalStage}>
          <View style={styles.scrim}>
            <Pressable accessibilityLabel="Close menu" onPress={closeMenu} style={StyleSheet.absoluteFill} />
          </View>

          <Animated.View
            accessibilityRole="menu"
            accessibilityLabel="Main menu"
            entering={SlideInRight.duration(reducedMotion ? 0 : motion.drawerMs)}
            style={[
              styles.sheet,
              {
                paddingTop: Math.max(10, insets.top),
                paddingBottom: 80 + Math.max(10, insets.bottom),
              },
            ]}
          >
            <View style={styles.sheetHighlight} />
            <View style={styles.sheetHeader}>
              <Image
                source={require("../../../assets/images/bookstayx-logo.png")}
                contentFit="contain"
                style={styles.menuLogo}
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
                <PressableScale accessibilityLabel="Open owner login" onPress={() => select("/owner-login")} style={[styles.row, styles.logoutRow]}>
                  <View style={styles.rowInner}>
                    <View style={[styles.rowIcon, styles.logoutIcon]}>
                      <Building2 color={colors.gold} size={15} strokeWidth={1.7} />
                    </View>
                    <Text style={[styles.rowLabel, styles.logoutLabel]}>Owner Portal</Text>
                  </View>
                </PressableScale>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, backgroundColor: colors.transparent, alignItems: "center" },
  modalStage: { flex: 1, width: "100%", maxWidth: layout.sourceMaxWidth, overflow: "hidden" },
  scrim: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.scrim },
  sheet: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "86%",
    maxWidth: 300,
    overflow: "hidden",
    borderBottomLeftRadius: 22,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(8,10,13,0.98)",
    ...Platform.select({
      web: { boxShadow: "-20px 0 50px rgba(0, 0, 0, 0.45)" },
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: -20, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 50,
      },
      default: { elevation: 24 },
    }),
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
    minHeight: 54,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  menuLogo: { width: 132, height: 38 },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  closeInner: { flex: 1, alignItems: "center", justifyContent: "center" },
  menuContent: { paddingHorizontal: 10, paddingVertical: spacing.md, flexGrow: 1 },
  sectionLabel: {
    paddingHorizontal: spacing.sm,
    marginBottom: 5,
    color: colors.textMuted,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  rows: { gap: 3 },
  row: { minHeight: 43, borderRadius: 10, overflow: "hidden" },
  rowActive: { backgroundColor: "rgba(224,184,74,0.16)" },
  rowInner: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 9 },
  rowIcon: {
    width: 29,
    height: 29,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  rowIconActive: { borderColor: colors.hairline, backgroundColor: "rgba(224,184,74,0.1)" },
  rowLabel: { color: colors.textSecondary, fontFamily: fontFamilies.sansSemiBold, fontSize: 13, lineHeight: 17 },
  rowLabelActive: { color: colors.gold },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: 9 },
  menuBottom: { marginTop: spacing.xxl, gap: 5 },
  logoutRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    backgroundColor: "rgba(224,184,74,0.08)",
  },
  logoutIcon: { borderColor: colors.hairline, backgroundColor: "rgba(224,184,74,0.1)" },
  logoutLabel: { color: colors.gold },
});
