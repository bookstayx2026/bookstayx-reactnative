import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import {
  Bell,
  CalendarCheck2,
  CheckCheck,
  CircleDollarSign,
  Gift,
  Info,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";
import { AppScreen } from "@/components/foundation";
import { useCustomerChrome } from "@/components/customer";
import { useAuth } from "@/components/auth";
import {
  loadCustomerNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type CustomerNotification,
} from "@/services/api/notifications";
import { colors, fontFamilies, layout, radii } from "@/theme";
import { useIsDesktop } from "@/hooks/use-window-class";

type DisplayNotification = {
  id: string;
  type: "booking" | "payment" | "referral" | "offer" | "system";
  title: string;
  body: string;
  time: string;
  Icon: typeof CalendarCheck2;
  unread: boolean;
  tone: string;
  toneBg: string;
  toneBorder: string;
};

const defaultSeed: DisplayNotification[] = [
  {
    id: "seed-1",
    type: "system",
    title: "Welcome to BookStayX",
    body: "Explore handpicked luxury villas, beachfront cottages, and lakeside tents across Maharashtra.",
    time: "Just now",
    Icon: Sparkles,
    unread: true,
    tone: colors.gold,
    toneBg: "rgba(224, 184, 74, 0.12)",
    toneBorder: "rgba(224, 184, 74, 0.35)",
  },
  {
    id: "seed-2",
    type: "referral",
    title: "Partner Referral Program Active",
    body: "Share your personal invite code to earn up to 25% cash rewards on every completed booking.",
    time: "1d ago",
    Icon: Gift,
    unread: false,
    tone: colors.gold,
    toneBg: "rgba(224, 184, 74, 0.12)",
    toneBorder: "rgba(224, 184, 74, 0.35)",
  },
];

const resolveIconAndTone = (type: string) => {
  switch (type) {
    case "booking":
      return {
        type: "booking" as const,
        Icon: CalendarCheck2,
        tone: "#4ADE80",
        toneBg: "rgba(34, 197, 94, 0.12)",
        toneBorder: "rgba(34, 197, 94, 0.35)",
      };
    case "payment":
      return {
        type: "payment" as const,
        Icon: Info,
        tone: "#60A5FA",
        toneBg: "rgba(59, 130, 246, 0.12)",
        toneBorder: "rgba(59, 130, 246, 0.35)",
      };
    case "referral":
    case "offer":
      return {
        type: "referral" as const,
        Icon: CircleDollarSign,
        tone: colors.gold,
        toneBg: "rgba(224, 184, 74, 0.12)",
        toneBorder: "rgba(224, 184, 74, 0.35)",
      };
    default:
      return {
        type: "system" as const,
        Icon: Sparkles,
        tone: colors.gold,
        toneBg: "rgba(224, 184, 74, 0.12)",
        toneBorder: "rgba(224, 184, 74, 0.35)",
      };
  }
};

const formatTimeAgo = (dateStr: string) => {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  } catch {
    return "Recently";
  }
};

const filterTabs = [
  { id: "all", label: "All Alerts" },
  { id: "booking", label: "Bookings" },
  { id: "referral", label: "Rewards & Offers" },
  { id: "system", label: "System" },
];

export default function NotificationsScreen() {
  const { onScroll } = useCustomerChrome();
  const { session } = useAuth();
  const [items, setItems] = useState<DisplayNotification[]>(defaultSeed);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const isDesktop = useIsDesktop();

  const token = session?.role === "customer" ? session.tokens.accessToken : null;

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setItems(defaultSeed);
      return;
    }

    try {
      setLoading(true);
      const res = await loadCustomerNotifications(token);
      if (res.success && res.notifications && res.notifications.length > 0) {
        const mapped: DisplayNotification[] = res.notifications.map((n: CustomerNotification) => {
          const { type, Icon, tone, toneBg, toneBorder } = resolveIconAndTone(n.type);
          return {
            id: String(n.id),
            type,
            title: n.title,
            body: n.message,
            time: formatTimeAgo(n.created_at),
            Icon,
            unread: !n.is_read,
            tone,
            toneBg,
            toneBorder,
          };
        });
        setItems(mapped);
      } else {
        setItems(defaultSeed);
      }
    } catch {
      setItems(defaultSeed);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    setItems((list) => list.map((n) => ({ ...n, unread: false })));
    if (token) {
      await markAllNotificationsAsRead(token);
    }
  };

  const handleMarkOne = async (id: string) => {
    setItems((list) => list.map((x) => (x.id === id ? { ...x, unread: false } : x)));
    if (token && !id.startsWith("seed-")) {
      await markNotificationAsRead(token, id);
    }
  };

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items;
    return items.filter((i) => i.type === activeFilter || (activeFilter === "referral" && i.type === "offer"));
  }, [activeFilter, items]);

  const unreadCount = items.filter((n) => n.unread).length;

  return (
    <AppScreen
      contentContainerStyle={[styles.screen, isDesktop && styles.screenDesktop]}
      scrollProps={{ onScroll, scrollEventThrottle: 16 }}
    >
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        
        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Sparkles size={11} color={colors.gold} />
              <Text style={styles.badgeText}>ACTIVITY & ALERTS</Text>
            </View>
          </View>
          <Text style={[styles.title, isDesktop && styles.titleDesktop]}>
            Notifications
          </Text>
          <Text style={styles.subtitle}>
            Stay updated on booking confirmations, payment status, and partner rewards.
          </Text>
        </View>

        {/* Filter Pills & Actions Row */}
        <View style={[styles.filterBar, isDesktop && styles.filterBarDesktop]}>
          <View style={styles.pillsList}>
            {filterTabs.map((tab) => {
              const active = activeFilter === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveFilter(tab.id)}
                  style={({ pressed }) => [
                    styles.filterPill,
                    active && styles.filterPillActive,
                    pressed && styles.pressed,
                    Platform.select({
                      web: { cursor: "pointer", outlineStyle: "none" } as any,
                      default: {},
                    }),
                  ]}
                >
                  <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actionsRight}>
            <View style={styles.unreadCountBadge}>
              <Text style={styles.unreadCountText}>{unreadCount} unread</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={handleMarkAllAsRead}
              disabled={!unreadCount}
              style={({ pressed }) => [
                styles.markAllBtn,
                !unreadCount && { opacity: 0.4 },
                pressed && styles.pressed,
                Platform.select({
                  web: { cursor: "pointer", outlineStyle: "none" } as any,
                  default: {},
                }),
              ]}
            >
              <CheckCheck size={14} color={colors.gold} />
              <Text style={styles.markAllText}>Mark all as read</Text>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.gold} size="small" />
            <Text style={styles.loadingText}>Updating notifications...</Text>
          </View>
        ) : null}

        {/* Notifications Feed */}
        <View style={styles.feedList}>
          {filteredItems.map((n) => (
            <Pressable
              key={n.id}
              accessibilityRole="button"
              onPress={() => handleMarkOne(n.id)}
              style={({ pressed }) => [
                styles.itemCard,
                n.unread && styles.itemCardUnread,
                pressed && styles.pressed,
                Platform.select({
                  web: {
                    cursor: "pointer",
                    outlineStyle: "none",
                    transition: "transform 0.2s ease, border-color 0.2s ease",
                  } as any,
                  default: {},
                }),
              ]}
            >
              <View style={[styles.itemIconCircle, { backgroundColor: n.toneBg, borderColor: n.toneBorder }]}>
                <n.Icon size={18} color={n.tone} />
              </View>

              <View style={styles.itemBody}>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemTitle}>{n.title}</Text>
                  <View style={styles.itemRightMeta}>
                    <Text style={styles.itemTime}>{n.time}</Text>
                    {n.unread ? <View style={styles.unreadDot} /> : null}
                  </View>
                </View>

                <Text style={styles.itemDesc}>{n.body}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {!loading && filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bell size={32} color={colors.gold} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              You have no new alerts in this category right now.
            </Text>
          </View>
        ) : null}

      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  screen: {
    paddingTop: 72,
    paddingBottom: layout.bottomChromeReserve + 20,
    backgroundColor: colors.surface,
  },
  screenDesktop: {
    paddingTop: 88,
    paddingBottom: layout.desktopBottomReserve + 24,
  },
  container: {
    paddingHorizontal: 20,
    gap: 16,
  },
  containerDesktop: {
    maxWidth: 920,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 0,
  },

  // Header Banner
  headerBanner: {
    paddingTop: 14,
    paddingBottom: 4,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
  },
  badgeText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 9.5,
    letterSpacing: 1.1,
  },
  title: {
    color: colors.text,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 28,
    lineHeight: 34,
  },
  titleDesktop: {
    fontSize: 36,
    lineHeight: 44,
  },
  subtitle: {
    marginTop: 6,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 20,
  },

  // Filter Bar
  filterBar: {
    gap: 12,
    marginTop: 6,
  },
  filterBarDesktop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pillsList: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  filterPillActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(224, 184, 74, 0.15)",
  },
  filterPillText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },
  filterPillTextActive: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
  },
  actionsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  unreadCountBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  unreadCountText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
  },
  markAllText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11.5,
  },

  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  loadingText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
  },

  // Feed List
  feedList: {
    gap: 10,
    marginTop: 6,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    backgroundColor: "rgba(14, 18, 24, 0.95)",
    ...Platform.select({
      web: {
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
      } as any,
      default: {},
    }),
  },
  itemCardUnread: {
    borderColor: "rgba(224, 184, 74, 0.35)",
    backgroundColor: "rgba(18, 24, 32, 0.95)",
  },
  itemIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  itemBody: {
    flex: 1,
  },
  itemHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  itemTitle: {
    color: colors.text,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 14.5,
  },
  itemRightMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemTime: {
    color: "#6B7280",
    fontFamily: fontFamilies.sans,
    fontSize: 11,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.gold,
  },
  itemDesc: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12.5,
    lineHeight: 18,
  },

  // Empty State
  emptyContainer: {
    marginTop: 40,
    paddingVertical: 50,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.15)",
    backgroundColor: "rgba(14, 18, 24, 0.8)",
  },
  emptyTitle: {
    marginTop: 12,
    color: colors.text,
    fontFamily: fontFamilies.displayMedium,
    fontSize: 18,
  },
  emptySubtitle: {
    marginTop: 6,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12.5,
    textAlign: "center",
  },
});
