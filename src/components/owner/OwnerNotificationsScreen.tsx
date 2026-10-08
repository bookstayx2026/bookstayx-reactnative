import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  Bell,
  CheckCheck,
  Calendar,
  CreditCard,
  AlertTriangle,
  Info,
  RefreshCw,
  CheckCircle,
  Clock,
  Sparkles,
  Layers,
} from "lucide-react-native";
import {
  getOwnerNotifications,
  markOwnerNotificationRead,
  markAllOwnerNotificationsRead,
  OwnerNotificationItem,
} from "../../services/api/owner-modules";

export const OwnerNotificationsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<OwnerNotificationItem[]>([]);
  const [filterType, setFilterType] = useState<"all" | "unread" | "booking" | "payment">("all");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getOwnerNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllOwnerNotificationsRead();
      const updated = await getOwnerNotifications();
      setNotifications(updated);
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleMarkItemRead = async (id: string) => {
    try {
      await markOwnerNotificationRead(id);
      const updated = await getOwnerNotifications();
      setNotifications(updated);
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filterType === "unread") return !n.isRead;
      if (filterType === "booking") return n.type === "new_booking" || n.type === "request_update" || n.type === "cancellation";
      if (filterType === "payment") return n.type === "payment";
      return true;
    });
  }, [notifications, filterType]);

  const getNotificationIcon = (type: OwnerNotificationItem["type"]) => {
    switch (type) {
      case "new_booking":
        return <Calendar size={18} color="#34D399" />;
      case "payment":
        return <CreditCard size={18} color="#E0B84A" />;
      case "request_update":
        return <Clock size={18} color="#38BDF8" />;
      case "cancellation":
        return <AlertTriangle size={18} color="#F87171" />;
      default:
        return <Info size={18} color="#94A3B8" />;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E0B84A" />
        <Text style={styles.loadingText}>Loading notification feed...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications & Alerts</Text>
          <Text style={styles.headerSubtitle}>
            Real-time feed of booking confirmations, payments, inquiries, and property events
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh} disabled={refreshing}>
            <RefreshCw size={16} color="#A0AEC0" />
          </TouchableOpacity>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
              <CheckCheck size={16} color="#000" />
              <Text style={styles.markAllBtnText}>Mark All Read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={[styles.filterPill, filterType === "all" && styles.filterPillActive]}
          onPress={() => setFilterType("all")}
        >
          <Text style={[styles.filterPillText, filterType === "all" && styles.filterPillTextActive]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, filterType === "unread" && styles.filterPillActive]}
          onPress={() => setFilterType("unread")}
        >
          <Text style={[styles.filterPillText, filterType === "unread" && styles.filterPillTextActive]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, filterType === "booking" && styles.filterPillActive]}
          onPress={() => setFilterType("booking")}
        >
          <Text style={[styles.filterPillText, filterType === "booking" && styles.filterPillTextActive]}>
            Bookings & Enquiries
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, filterType === "payment" && styles.filterPillActive]}
          onPress={() => setFilterType("payment")}
        >
          <Text style={[styles.filterPillText, filterType === "payment" && styles.filterPillTextActive]}>
            Payments
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <View style={styles.listCard}>
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bell size={36} color="#4A5568" />
            <Text style={styles.emptyTitle}>No notifications in this filter</Text>
            <Text style={styles.emptySub}>You are completely up-to-date with all property events.</Text>
          </View>
        ) : (
          filteredNotifications.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.notifItem, !item.isRead && styles.notifItemUnread]}
              onPress={() => handleMarkItemRead(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.notifIconBox}>{getNotificationIcon(item.type)}</View>

              <View style={styles.notifContent}>
                <View style={styles.notifHeaderRow}>
                  <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}>
                    {item.title}
                  </Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.notifMessage}>{item.message}</Text>

                <View style={styles.notifMetaRow}>
                  <Text style={styles.notifTime}>
                    {new Date(item.timestamp).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  {item.referenceId ? (
                    <Text style={styles.notifRef}>Ref: {item.referenceId}</Text>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07080A",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#07080A",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    color: "#A0AEC0",
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#10141B",
    borderWidth: 1,
    borderColor: "#1E2633",
    justifyContent: "center",
    alignItems: "center",
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0B84A",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  markAllBtnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 12,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#0D1117",
    borderWidth: 1,
    borderColor: "#1E2633",
  },
  filterPillActive: {
    borderColor: "#E0B84A",
    backgroundColor: "rgba(224, 184, 74, 0.12)",
  },
  filterPillText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "500",
  },
  filterPillTextActive: {
    color: "#E0B84A",
    fontWeight: "700",
  },
  listCard: {
    backgroundColor: "#0D1117",
    borderWidth: 1,
    borderColor: "#1E2633",
    borderRadius: 12,
    overflow: "hidden",
  },
  emptyContainer: {
    padding: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySub: {
    color: "#718096",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  notifItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#141A23",
    alignItems: "flex-start",
    gap: 14,
  },
  notifItemUnread: {
    backgroundColor: "rgba(224, 184, 74, 0.03)",
  },
  notifIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#161D27",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  notifContent: {
    flex: 1,
  },
  notifHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notifTitle: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "600",
  },
  notifTitleUnread: {
    color: "#FFF",
    fontWeight: "700",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0B84A",
  },
  notifMessage: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  notifMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notifTime: {
    color: "#64748B",
    fontSize: 11,
  },
  notifRef: {
    color: "#E0B84A",
    fontSize: 11,
    fontWeight: "600",
  },
});
