import { useEffect, useState } from "react";
import { Slot, usePathname, useRouter, type Href } from "expo-router";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck2,
  DollarSign,
  Menu,
  Share2,
  ShieldCheck,
  Bell,
} from "lucide-react-native";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fontFamilies, radii } from "@/theme";
import { OwnerSidebar } from "./OwnerSidebar";
import { OwnerTopHeader } from "./OwnerTopHeader";
import { OwnerMoreSheet } from "./OwnerMoreSheet";
import { getOwnerBookingRequests, getOwnerNotifications } from "../../services/api/owner-modules";

export function OwnerShell() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Responsive Breakpoint Rule:
  // Mobile: < 768px (Clean 5-item bottom nav + more sheet)
  // Tablet: 768px - 1023px (CRM sidebar, starts collapsed)
  // Desktop: >= 1024px (CRM sidebar, starts expanded)
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(isTablet);
  const [moreSheetVisible, setMoreSheetVisible] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Sync default collapse state when crossing tablet / desktop threshold
  useEffect(() => {
    if (isTablet) {
      setSidebarCollapsed(true);
    } else if (isDesktop) {
      setSidebarCollapsed(false);
    }
  }, [isDesktop, isTablet]);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const [reqs, notifs] = await Promise.all([
          getOwnerBookingRequests(),
          getOwnerNotifications(),
        ]);
        const pending = reqs.filter((r) => r.status === "Pending").length;
        const unread = notifs.filter((n) => !n.isRead).length;
        setPendingRequestsCount(pending);
        setUnreadNotificationsCount(unread);
      } catch {}
    }
    loadMetrics();
  }, [pathname]);

  const isNavActive = (href: string) => {
    if (href === "/owner") {
      return pathname === "/owner" || pathname === "/owner/";
    }
    return pathname.startsWith(href);
  };

  const isMoreActive =
    !isNavActive("/owner") &&
    !isNavActive("/owner/calendar") &&
    !isNavActive("/owner/bookings") &&
    !isNavActive("/owner/revenue");

  // =========================================================================
  // 1. MOBILE VIEW (< 768px): 5-ITEM BOTTOM NAV + MORE SHEET
  // =========================================================================
  if (isMobile) {
    return (
      <View style={styles.mobileRoot}>
        {/* Mobile Top Header */}
        <View
          style={[
            styles.mobileHeader,
            { paddingTop: Math.max(10, insets.top) },
          ]}
        >
          <View style={styles.mobileHeaderInner}>
            {/* Brand & Portal Badge */}
            <View style={styles.brandRow}>
              <Pressable
                onPress={() => router.push("/owner" as Href)}
                style={({ pressed }) => [
                  styles.brand,
                  pressed && styles.pressed,
                  Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                ]}
              >
                <Image
                  source={require("../../../assets/images/bookstayx-logo.png")}
                  contentFit="contain"
                  contentPosition="left center"
                  style={styles.mobileLogo}
                />
              </Pressable>
              <View style={styles.portalBadge}>
                <ShieldCheck size={12} color={colors.gold} />
                <Text style={styles.portalBadgeText}>OWNER CRM</Text>
              </View>
            </View>

            {/* Mobile Header Quick Actions */}
            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/owner/notifications" as Href)}
                style={({ pressed }) => [
                  styles.mobileNotifBtn,
                  pressed && styles.pressed,
                  Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                ]}
              >
                <Bell size={15} color={unreadNotificationsCount > 0 ? colors.gold : colors.textSecondary} />
                {unreadNotificationsCount > 0 && (
                  <View style={styles.mobileNotifDot} />
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/owner/referrals" as Href)}
                style={({ pressed }) => [
                  styles.chip,
                  pressed && styles.pressed,
                  Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                ]}
              >
                <Share2 size={13} color={colors.gold} />
                <Text style={styles.chipText}>Referral</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Mobile Main Content */}
        <View style={styles.mobileContent}>
          <Slot />
        </View>

        {/* Mobile Bottom Floating Navigation Bar (5 Items) */}
        <View style={[styles.navWrap, { paddingBottom: Math.max(12, insets.bottom) }]}>
          <View accessibilityRole="tablist" style={styles.nav}>
            {/* Tab 1: Dashboard */}
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: pathname === "/owner" || pathname === "/owner/" }}
              onPress={() => router.push("/owner" as Href)}
              style={[styles.navItem, (pathname === "/owner" || pathname === "/owner/") && styles.navActive]}
            >
              <LayoutDashboard
                size={17}
                strokeWidth={1.8}
                color={(pathname === "/owner" || pathname === "/owner/") ? colors.gold : colors.textSubtle}
              />
              <Text style={[styles.navLabel, (pathname === "/owner" || pathname === "/owner/") && styles.navLabelActive]}>
                Dashboard
              </Text>
            </Pressable>

            {/* Tab 2: Availability */}
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: isNavActive("/owner/calendar") }}
              onPress={() => router.push("/owner/calendar" as Href)}
              style={[styles.navItem, isNavActive("/owner/calendar") && styles.navActive]}
            >
              <CalendarDays
                size={17}
                strokeWidth={1.8}
                color={isNavActive("/owner/calendar") ? colors.gold : colors.textSubtle}
              />
              <Text style={[styles.navLabel, isNavActive("/owner/calendar") && styles.navLabelActive]}>
                Availability
              </Text>
            </Pressable>

            {/* Tab 3: Bookings */}
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: isNavActive("/owner/bookings") }}
              onPress={() => router.push("/owner/bookings" as Href)}
              style={[styles.navItem, isNavActive("/owner/bookings") && styles.navActive]}
            >
              <CalendarCheck2
                size={17}
                strokeWidth={1.8}
                color={isNavActive("/owner/bookings") ? colors.gold : colors.textSubtle}
              />
              <Text style={[styles.navLabel, isNavActive("/owner/bookings") && styles.navLabelActive]}>
                Bookings
              </Text>
            </Pressable>

            {/* Tab 4: Revenue */}
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: isNavActive("/owner/revenue") }}
              onPress={() => router.push("/owner/revenue" as Href)}
              style={[styles.navItem, isNavActive("/owner/revenue") && styles.navActive]}
            >
              <DollarSign
                size={17}
                strokeWidth={1.8}
                color={isNavActive("/owner/revenue") ? colors.gold : colors.textSubtle}
              />
              <Text style={[styles.navLabel, isNavActive("/owner/revenue") && styles.navLabelActive]}>
                Revenue
              </Text>
            </Pressable>

            {/* Tab 5: More (Modal Sheet) */}
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: isMoreActive }}
              onPress={() => setMoreSheetVisible(true)}
              style={[styles.navItem, isMoreActive && styles.navActive]}
            >
              <Menu
                size={17}
                strokeWidth={1.8}
                color={isMoreActive ? colors.gold : colors.textSubtle}
              />
              <Text style={[styles.navLabel, isMoreActive && styles.navLabelActive]}>
                More
              </Text>
              {(pendingRequestsCount > 0 || unreadNotificationsCount > 0) && (
                <View style={styles.moreDotBadge} />
              )}
            </Pressable>
          </View>
        </View>

        {/* More Bottom Sheet */}
        <OwnerMoreSheet
          visible={moreSheetVisible}
          onClose={() => setMoreSheetVisible(false)}
          requestCount={pendingRequestsCount}
          unreadCount={unreadNotificationsCount}
        />
      </View>
    );
  }


  // =========================================================================
  // 2. TABLET & DESKTOP CRM DASHBOARD (>= 768px)
  // =========================================================================
  return (
    <View style={styles.crmRoot}>
      {/* CRM Left Collapsible Sidebar */}
      <OwnerSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* CRM Main Working Area */}
      <View style={styles.crmMain}>
        {/* CRM Top Header */}
        <OwnerTopHeader />

        {/* CRM Scrollable Content Viewport */}
        <View style={styles.crmContent}>
          <Slot />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },

  // ===================================================
  // TABLET & DESKTOP CRM STYLES (>= 768px)
  // ===================================================
  crmRoot: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#07080A",
    height: "100%",
    width: "100%",
    overflow: "hidden",
  },
  crmMain: {
    flex: 1,
    flexDirection: "column",
    minWidth: 0,
    height: "100%",
    backgroundColor: "#07080A",
  },
  crmContent: {
    flex: 1,
    minWidth: 0,
    height: "100%",
  },

  // ===================================================
  // MOBILE STYLES (< 768px) - 100% PRESERVED AS-IS
  // ===================================================
  mobileRoot: {
    flex: 1,
    backgroundColor: "#07080A",
  },
  mobileContent: {
    flex: 1,
  },
  mobileHeader: {
    zIndex: 20,
    width: "100%",
    minHeight: 68,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(224, 184, 74, 0.16)",
    backgroundColor: "rgba(7, 9, 12, 0.96)",
    ...Platform.select({
      web: {
        position: "sticky",
        top: 0,
        backdropFilter: "blur(14px)",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.45)",
      } as any,
      default: { elevation: 12 },
    }),
  },
  mobileHeaderInner: {
    width: "100%",
    maxWidth: 1440,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brand: {
    height: 42,
    justifyContent: "center",
  },
  mobileLogo: {
    width: 140,
    height: 38,
  },
  portalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4.5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
  },
  portalBadgeText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chip: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.4)",
    backgroundColor: "rgba(224, 184, 74, 0.08)",
  },
  chipText: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11.5,
    color: colors.gold,
  },

  // Mobile Bottom Navigation Bar
  navWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  nav: {
    width: "100%",
    maxWidth: 440,
    minHeight: 64,
    padding: 5,
    flexDirection: "row",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
    backgroundColor: "rgba(11, 14, 18, 0.97)",
    ...Platform.select({
      web: {
        backdropFilter: "blur(16px)",
        boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.5)",
      } as any,
      default: { elevation: 16 },
    }),
  },
  navItem: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: 14,
  },
  navActive: {
    backgroundColor: "rgba(224, 184, 74, 0.15)",
  },
  navLabel: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 9.5,
    color: colors.textSubtle,
  },
  navLabelActive: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
  },
  mobileNotifBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  mobileNotifDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.gold,
  },
  moreDotBadge: {
    position: "absolute",
    top: 8,
    right: 18,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
});

