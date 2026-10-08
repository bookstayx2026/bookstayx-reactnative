import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { usePathname, useRouter, type Href } from "expo-router";
import {
  ExternalLink,
  Share2,
  ShieldCheck,
  Sparkles,
  User,
  Bell,
} from "lucide-react-native";
import { colors, fontFamilies, radii } from "@/theme";
import { useAuth } from "@/components/auth";
import { getOwnerNotifications } from "../../services/api/owner-modules";

export function OwnerTopHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const identity = session?.identity as { name?: string; email?: string | null; mobile?: string } | undefined;
  const ownerName = identity?.name || (identity?.mobile ? `Owner (+91 ${identity.mobile.slice(-4)})` : "Property Owner");

  useEffect(() => {
    async function checkNotifs() {
      try {
        const notifs = await getOwnerNotifications();
        const unread = notifs.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      } catch {}
    }
    checkNotifs();
  }, [pathname]);

  const getHeaderContext = () => {
    if (pathname === "/owner" || pathname === "/owner/") {
      return {
        title: "Dashboard Overview",
        subtitle: "Operations cockpit, real-time occupancy metrics, check-in alerts & performance",
        badge: "DASHBOARD",
      };
    }
    if (pathname.startsWith("/owner/calendar")) {
      return {
        title: "Availability & Rates",
        subtitle: "Manage villa pricing, availability calendar and special seasonal rates",
        badge: "RATES & CALENDAR",
      };
    }
    if (pathname.startsWith("/owner/requests")) {
      return {
        title: "Booking Requests & Enquiries",
        subtitle: "Review incoming reservations, WhatsApp inquiries and manual bookings",
        badge: "REQUESTS",
      };
    }
    if (pathname.startsWith("/owner/revenue")) {
      return {
        title: "Revenue & Payments",
        subtitle: "Track advance deposits, pending collections, and financial ledgers",
        badge: "FINANCE",
      };
    }
    if (pathname.startsWith("/owner/expenses")) {
      return {
        title: "Expenses & Outflows",
        subtitle: "Record operational costs, maintenance, utilities, and calculate net property earnings",
        badge: "EXPENSES",
      };
    }
    if (pathname.startsWith("/owner/staff")) {
      return {
        title: "Housekeeping & Staff",
        subtitle: "Manage staff directory, daily attendance rosters, and monthly wage disbursements",
        badge: "STAFF & ROSTER",
      };
    }
    if (pathname.startsWith("/owner/reports")) {
      return {
        title: "Reports & Analytics",
        subtitle: "Revenue trends, Average Daily Rate (ADR), cancellation insights & attribution",
        badge: "ANALYTICS",
      };
    }
    if (pathname.startsWith("/owner/bookings")) {
      return {
        title: "Bookings Ledger",
        subtitle: "Complete guest reservation ledger, payment records and advance logs",
        badge: "RESERVATIONS",
      };
    }
    if (pathname.startsWith("/owner/units")) {
      return {
        title: "Villa Units",
        subtitle: "Configure villa inventory, guest capacities and unit amenities",
        badge: "INVENTORY",
      };
    }
    if (pathname.startsWith("/owner/b2b")) {
      return {
        title: "B2B Partner Network",
        subtitle: "Manage travel agents, corporate promoters and custom partner rates",
        badge: "PARTNER NETWORK",
      };
    }
    if (pathname.startsWith("/owner/profile")) {
      return {
        title: "Property Profile",
        subtitle: "Update property information, house rules, photos and amenities",
        badge: "PROPERTY PROFILE",
      };
    }
    if (pathname.startsWith("/owner/referrals")) {
      return {
        title: "Referral & Rewards Portal",
        subtitle: "Promote BookStayX, track partner leaderboards, commissions and referral earnings",
        badge: "PARTNER REWARDS",
      };
    }
    if (pathname.startsWith("/owner/notifications")) {
      return {
        title: "Notifications Feed",
        subtitle: "Real-time updates on bookings, payments, inquiries, and property events",
        badge: "ALERTS",
      };
    }
    if (pathname.startsWith("/owner/settings")) {
      return {
        title: "Owner Settings & Configuration",
        subtitle: "Contact preferences, booking automation rules, and verified communication channels",
        badge: "SYSTEM SETTINGS",
      };
    }
    return {
      title: "Owner Portal",
      subtitle: "Property Management System & Operations",
      badge: "OVERVIEW",
    };
  };

  const context = getHeaderContext();

  return (
    <View style={styles.header}>
      {/* Left: Dynamic Title & Context */}
      <View style={styles.left}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Sparkles size={10} color={colors.gold} />
            <Text style={styles.badgeText}>{context.badge}</Text>
          </View>
        </View>
        <Text numberOfLines={1} style={styles.title}>
          {context.title}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {context.subtitle}
        </Text>
      </View>

      {/* Right: Quick Actions & Owner Profile */}
      <View style={styles.right}>
        {/* Referral Portal Quick Chip */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/owner/referrals" as Href)}
          style={({ pressed }) => [
            styles.chip,
            pressed && styles.pressed,
            Platform.select({ web: { cursor: "pointer", outlineStyle: "none" } as any, default: {} }),
          ]}
        >
          <Share2 size={13} color={colors.gold} />
          <Text style={styles.chipText}>Referral Portal</Text>
        </Pressable>

        {/* Customer Site Preview Chip */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/")}
          style={({ pressed }) => [
            styles.chip,
            styles.publicSiteChip,
            pressed && styles.pressed,
            Platform.select({ web: { cursor: "pointer", outlineStyle: "none" } as any, default: {} }),
          ]}
        >
          <ExternalLink size={13} color={colors.textSecondary} />
          <Text style={styles.publicSiteText}>Customer Site</Text>
        </Pressable>

        {/* Notifications Icon Button */}
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => router.push("/owner/notifications" as Href)}
        >
          <Bell size={16} color={unreadCount > 0 ? colors.gold : colors.textSecondary} />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Owner Identity Pill */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/owner/profile" as Href)}
          style={({ pressed }) => [
            styles.profilePill,
            pressed && styles.pressed,
            Platform.select({ web: { cursor: "pointer", outlineStyle: "none" } as any, default: {} }),
          ]}
        >
          <View style={styles.avatarCircle}>
            <User size={13} color={colors.gold} strokeWidth={2.2} />
          </View>
          <View style={styles.profileTextWrap}>
            <Text numberOfLines={1} style={styles.profileName}>
              {ownerName}
            </Text>
            <View style={styles.verifiedRow}>
              <ShieldCheck size={10} color="#34D399" />
              <Text style={styles.verifiedText}>Verified Owner</Text>
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },

  header: {
    height: 72,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(224, 184, 74, 0.14)",
    backgroundColor: "rgba(10, 13, 18, 0.96)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 20,
    ...Platform.select({
      web: {
        position: "sticky",
        top: 0,
        backdropFilter: "blur(14px)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.35)",
        userSelect: "none",
      } as any,
      default: { elevation: 10 },
    }),
  },

  // Left Context
  left: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.28)",
  },
  badgeText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 8.5,
    letterSpacing: 0.8,
  },
  title: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.displayMedium,
    fontSize: 20,
    lineHeight: 24,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
    marginTop: 1,
  },

  // Right Actions
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 16,
  },
  chip: {
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    backgroundColor: "rgba(224, 184, 74, 0.08)",
  },
  chipText: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
    color: colors.gold,
  },
  publicSiteChip: {
    borderColor: "rgba(255, 255, 255, 0.14)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  publicSiteText: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Profile Pill
  profilePill: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 4,
    paddingRight: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.22)",
    backgroundColor: "rgba(18, 22, 28, 0.85)",
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(224, 184, 74, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileTextWrap: {
    flexDirection: "column",
  },
  profileName: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
    maxWidth: 130,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  verifiedText: {
    color: "#34D399",
    fontFamily: fontFamilies.sans,
    fontSize: 9.5,
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notifBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingHorizontal: 4.5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadgeText: {
    color: "#000",
    fontFamily: fontFamilies.sansBold,
    fontSize: 9,
  },
});

