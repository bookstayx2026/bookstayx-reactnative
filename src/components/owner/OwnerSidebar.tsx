import React, { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { usePathname, useRouter, type Href } from "expo-router";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck2,
  Inbox,
  DollarSign,
  CreditCard,
  Users,
  Building2,
  BarChart3,
  Store,
  UserRound,
  Share2,
  ExternalLink,
  Bell,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  type LucideIcon,
} from "lucide-react-native";
import { colors, fontFamilies, radii } from "@/theme";
import { useAuth } from "@/components/auth";
import { useOwnerDashboard } from "@/hooks/use-owner-dashboard";
import { getCategoryConfig } from "@/config/property-categories";
import { getOwnerBookingRequests, getOwnerNotifications } from "../../services/api/owner-modules";

export interface OwnerSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  badge?: number;
  badgeColor?: string;
  isExternal?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function OwnerSidebar({ collapsed, onToggleCollapse }: OwnerSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { data } = useOwnerDashboard();
  const categoryConfig = getCategoryConfig(data?.property?.category);

  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    async function loadBadges() {
      try {
        const [reqs, notifs] = await Promise.all([
          getOwnerBookingRequests(),
          getOwnerNotifications(),
        ]);
        const pending = reqs.filter((r) => r.status === "Pending").length;
        const unread = notifs.filter((n) => !n.isRead).length;
        setPendingRequestsCount(pending);
        setUnreadNotificationsCount(unread);
      } catch (err) {
        // quiet fallback
      }
    }
    loadBadges();
  }, [pathname]);

  const navSections: NavSection[] = [
    {
      title: "OVERVIEW",
      items: [
        { href: "/owner", label: "Dashboard", Icon: LayoutDashboard },
      ],
    },
    {
      title: "BOOKINGS",
      items: [
        { href: "/owner/calendar", label: "Availability & Rates", Icon: CalendarDays },
        { href: "/owner/bookings", label: "Bookings Ledger", Icon: CalendarCheck2 },
        {
          href: "/owner/requests",
          label: "Booking Requests",
          Icon: Inbox,
          badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
          badgeColor: "#E0B84A",
        },
      ],
    },
    {
      title: "FINANCE",
      items: [
        { href: "/owner/revenue", label: "Revenue & Payments", Icon: DollarSign },
        { href: "/owner/expenses", label: "Expenses", Icon: CreditCard },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        { href: "/owner/staff", label: "Housekeeping & Staff", Icon: Users },
        { href: "/owner/units", label: categoryConfig.pluralUnitLabel, Icon: Building2 },
      ],
    },
    {
      title: "INSIGHTS",
      items: [
        { href: "/owner/reports", label: "Reports & Analytics", Icon: BarChart3 },
      ],
    },
    {
      title: "NETWORK & PROPERTY",
      items: [
        { href: "/owner/b2b", label: "B2B Network", Icon: Store },
        { href: "/owner/profile", label: "Property Profile", Icon: UserRound },
      ],
    },
    {
      title: "PORTALS",
      items: [
        { href: "/owner/referrals", label: "Referral Portal", Icon: Share2 },
        { href: "/", label: "Customer Site", Icon: ExternalLink, isExternal: true },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        {
          href: "/owner/notifications",
          label: "Notifications",
          Icon: Bell,
          badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
          badgeColor: "#E0B84A",
        },
        { href: "/owner/settings", label: "Settings", Icon: Settings },
      ],
    },
  ];

  const isNavActive = (href: string) => {
    if (href === "/owner") {
      return pathname === "/owner" || pathname === "/owner/";
    }
    return pathname.startsWith(href);
  };

  const handleNav = (href: string) => {
    router.push(href as Href);
  };

  return (
    <View
      style={[
        styles.sidebar,
        collapsed ? styles.sidebarCollapsed : styles.sidebarExpanded,
        Platform.select({
          web: {
            transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
          } as any,
          default: {},
        }),
      ]}
    >
      {/* 1. Brand & Header Area */}
      <View style={[styles.header, collapsed && styles.headerCollapsed]}>
        <Pressable
          onPress={() => router.push("/owner" as Href)}
          style={({ pressed }) => [
            styles.brandBtn,
            pressed && styles.pressed,
            Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
          ]}
        >
          {collapsed ? (
            <View style={styles.collapsedLogoBadge}>
              <Text style={styles.collapsedLogoText}>BX</Text>
              <View style={styles.collapsedShield}>
                <ShieldCheck size={11} color={colors.gold} />
              </View>
            </View>
          ) : (
            <View style={styles.expandedBrandWrap}>
              <Image
                source={require("../../../assets/images/bookstayx-logo.png")}
                contentFit="contain"
                contentPosition="left center"
                style={styles.logo}
              />
              <View style={styles.portalBadge}>
                <ShieldCheck size={10} color={colors.gold} />
                <Text style={styles.portalBadgeText}>OWNER CRM</Text>
              </View>
            </View>
          )}
        </Pressable>
      </View>

      {/* 2. Navigation Content */}
      <ScrollView
        style={styles.navScroll}
        contentContainerStyle={styles.navContainer}
        showsVerticalScrollIndicator={false}
      >
        {navSections.map((section, sIdx) => (
          <View key={sIdx} style={styles.sectionBlock}>
            {!collapsed ? (
              <View style={styles.sectionLabelWrap}>
                <Text style={styles.sectionLabel}>{section.title}</Text>
              </View>
            ) : null}

            <View style={styles.navList}>
              {section.items.map((item) => {
                const active = isNavActive(item.href);
                return (
                  <SidebarItem
                    key={item.href}
                    item={item}
                    active={active}
                    collapsed={collapsed}
                    onPress={() => handleNav(item.href)}
                  />
                );
              })}
            </View>

            {sIdx < navSections.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </ScrollView>

      {/* 3. Footer Actions (Logout & Collapse Toggle) */}
      <View style={styles.footer}>
        {/* Sign Out Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign Out"
          onPress={() => void signOut().then(() => router.replace("/login"))}
          style={({ pressed }) => [
            styles.logoutRow,
            collapsed && styles.logoutRowCollapsed,
            pressed && styles.pressed,
            Platform.select({
              web: {
                cursor: "pointer",
                outlineStyle: "none",
                title: "Sign Out",
              } as any,
              default: {},
            }),
          ]}
        >
          <LogOut size={16} color="#F87171" strokeWidth={2} />
          {!collapsed ? <Text style={styles.logoutLabel}>Sign Out</Text> : null}
        </Pressable>

        {/* Collapse / Expand Toggle Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onPress={onToggleCollapse}
          style={({ pressed }) => [
            styles.collapseBtn,
            collapsed && styles.collapseBtnCollapsed,
            pressed && styles.pressed,
            Platform.select({
              web: {
                cursor: "pointer",
                outlineStyle: "none",
                title: collapsed ? "Expand Sidebar" : "Collapse Sidebar",
                transition: "all 0.15s ease",
              } as any,
              default: {},
            }),
          ]}
        >
          {collapsed ? (
            <ChevronRight size={17} color={colors.gold} strokeWidth={2.2} />
          ) : (
            <>
              <ChevronLeft size={16} color={colors.textSecondary} strokeWidth={2} />
              <Text style={styles.collapseLabel}>Collapse Sidebar</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function SidebarItem({
  item,
  active,
  collapsed,
  onPress,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onPress: () => void;
}) {
  const { label, Icon, badge, badgeColor } = item;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.navItem,
        collapsed ? styles.navItemCollapsed : styles.navItemExpanded,
        active && styles.navItemActive,
        pressed && styles.pressed,
        Platform.select({
          web: {
            cursor: "pointer",
            outlineStyle: "none",
            title: label,
            transition: "all 0.15s ease",
          } as any,
          default: {},
        }),
      ]}
    >
      {/* Active Left Indicator Bar */}
      {active && !collapsed ? <View style={styles.activePill} /> : null}

      {/* Nav Icon */}
      <View style={[styles.iconContainer, active && styles.iconContainerActive]}>
        <Icon
          size={18}
          strokeWidth={active ? 2.2 : 1.8}
          color={active ? colors.gold : colors.textMuted}
        />
      </View>

      {/* Nav Text (Expanded Only) */}
      {!collapsed ? (
        <View style={styles.labelBadgeRow}>
          <Text numberOfLines={1} style={[styles.navLabel, active && styles.navLabelActive]}>
            {label}
          </Text>
          {badge !== undefined && (
            <View style={[styles.sidebarBadge, { backgroundColor: badgeColor || colors.gold }]}>
              <Text style={styles.sidebarBadgeText}>{badge}</Text>
            </View>
          )}
        </View>
      ) : badge !== undefined ? (
        <View style={styles.collapsedBadgeDot} />
      ) : null}
    </Pressable>
  );
}


const styles = StyleSheet.create({
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },

  sidebar: {
    height: "100%",
    backgroundColor: "#0A0D12",
    borderRightWidth: 1,
    borderRightColor: "rgba(224, 184, 74, 0.14)",
    flexDirection: "column",
    justifyContent: "space-between",
    zIndex: 25,
    ...Platform.select({
      web: {
        position: "sticky",
        top: 0,
        boxShadow: "4px 0 24px rgba(0, 0, 0, 0.4)",
        userSelect: "none",
      } as any,
      default: {},
    }),
  },
  sidebarExpanded: {
    width: 260,
  },
  sidebarCollapsed: {
    width: 76,
    alignItems: "center",
  },

  // 1. Header
  header: {
    height: 72,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  headerCollapsed: {
    paddingHorizontal: 0,
    alignItems: "center",
  },
  brandBtn: {
    justifyContent: "center",
  },
  expandedBrandWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  logo: {
    width: 124,
    height: 34,
  },
  portalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
    paddingHorizontal: 6.5,
    paddingVertical: 2.5,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
  },
  portalBadgeText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 8.5,
    letterSpacing: 0.8,
  },
  collapsedLogoBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  collapsedLogoText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  collapsedShield: {
    position: "absolute",
    right: -4,
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#0A0D12",
    alignItems: "center",
    justifyContent: "center",
  },

  // 2. Nav Content
  navScroll: {
    flex: 1,
  },
  navContainer: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 2,
  },
  sectionBlock: {
    marginBottom: 4,
  },
  sectionLabelWrap: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionLabel: {
    color: "#606B7B",
    fontFamily: fontFamilies.sansBold,
    fontSize: 9.5,
    letterSpacing: 1.1,
  },
  navList: {
    gap: 2,
  },
  labelBadgeRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sidebarBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    marginLeft: 6,
  },
  sidebarBadgeText: {
    color: "#000",
    fontFamily: fontFamilies.sansBold,
    fontSize: 10,
  },
  collapsedBadgeDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    position: "relative",
  },
  navItemExpanded: {
    height: 44,
    paddingHorizontal: 12,
    gap: 12,
  },
  navItemCollapsed: {
    height: 46,
    width: 46,
    justifyContent: "center",
    alignSelf: "center",
    borderRadius: 14,
  },
  navItemActive: {
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    borderColor: "rgba(224, 184, 74, 0.28)",
  },
  activePill: {
    position: "absolute",
    left: -10,
    top: 8,
    bottom: 8,
    width: 3.5,
    borderRadius: 2,
    backgroundColor: colors.gold,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerActive: {
    transform: [{ scale: 1.05 }],
  },
  navLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 13,
    letterSpacing: 0.1,
  },
  navLabelActive: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginVertical: 10,
    marginHorizontal: 8,
  },

  // 3. Footer
  footer: {
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    gap: 8,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    gap: 10,
  },
  logoutRowCollapsed: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignSelf: "center",
    paddingHorizontal: 0,
    borderRadius: 12,
  },
  logoutLabel: {
    color: "#F87171",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12.5,
  },
  collapseBtn: {
    flexDirection: "row",
    alignItems: "center",
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 8,
  },
  collapseBtnCollapsed: {
    width: 44,
    height: 38,
    justifyContent: "center",
    alignSelf: "center",
    paddingHorizontal: 0,
  },
  collapseLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
  },
});
