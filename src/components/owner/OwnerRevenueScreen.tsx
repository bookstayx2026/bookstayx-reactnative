import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Coins,
  CreditCard,
  Download,
  Filter,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react-native";
import { useAuth } from "@/components/auth";
import { colors, fontFamilies, radii } from "@/theme";
import { useIsWideScreen } from "@/hooks/use-window-class";
import {
  getProtectedOwnerDashboard,
  getProtectedOwnerLedger,
  type OwnerDashboard,
  type OwnerLedgerEntry,
} from "@/services/api";

const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export function OwnerRevenueScreen() {
  const router = useRouter();
  const isWide = useIsWideScreen();
  const { session } = useAuth();
  const token = session?.role === "owner" ? session.tokens.accessToken : "";

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [unitFilter, setUnitFilter] = useState<number | "all">("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"All" | "Paid" | "Partial" | "Pending">("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<OwnerDashboard | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<OwnerLedgerEntry[]>([]);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [dashData, ledgerData] = await Promise.all([
        getProtectedOwnerDashboard(token),
        getProtectedOwnerLedger(token, selectedYear, selectedMonth, unitFilter),
      ]);
      setDashboard(dashData);
      setLedgerEntries(ledgerData.data || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load revenue data.");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, token, unitFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Derived Financial Records
  const formattedLedger = useMemo(() => {
    return ledgerEntries
      .filter((item) => item.booking_status !== "CANCELLED" && item.booking_status !== "DELETED")
      .map((item) => {
        const total = Number(item.amount || item.total_amount || 0);
        const advance = Number(item.advance_amount || 0);
        const paid = advance > 0 ? advance : total;
        const balance = Math.max(0, total - paid);

        let pStatus: "Paid" | "Partial" | "Pending" = "Paid";
        if (balance === 0 && total > 0) {
          pStatus = "Paid";
        } else if (paid > 0 && balance > 0) {
          pStatus = "Partial";
        } else if (paid === 0 && total > 0) {
          pStatus = "Pending";
        }

        return {
          ...item,
          numericTotal: total,
          numericPaid: paid,
          numericBalance: balance,
          derivedPaymentStatus: pStatus,
        };
      });
  }, [ledgerEntries]);

  // Calculations for Summary
  const totalRevenue = useMemo(() => {
    return formattedLedger.reduce((sum, item) => sum + item.numericTotal, 0);
  }, [formattedLedger]);

  const totalCollected = useMemo(() => {
    return formattedLedger.reduce((sum, item) => sum + item.numericPaid, 0);
  }, [formattedLedger]);

  const totalPending = useMemo(() => {
    return formattedLedger.reduce((sum, item) => sum + item.numericBalance, 0);
  }, [formattedLedger]);

  const filteredItems = useMemo(() => {
    return formattedLedger.filter((item) => {
      const matchStatus =
        paymentStatusFilter === "All" ? true : item.derivedPaymentStatus === paymentStatusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q
        ? true
        : item.customer_name.toLowerCase().includes(q) ||
          (item.booking_id && item.booking_id.toLowerCase().includes(q)) ||
          (item.unit_name && item.unit_name.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [formattedLedger, paymentStatusFilter, searchQuery]);

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]}
    >
      <View style={[styles.container, isWide && styles.containerWide]}>
        {/* Header Section */}
        <View style={[styles.headerBox, isWide && styles.headerBoxWide]}>
          <View style={styles.headerLeft}>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Sparkles size={10} color={colors.gold} />
                <Text style={styles.badgeText}>FINANCIAL OVERVIEW</Text>
              </View>
            </View>
            <Text style={[styles.title, isWide && styles.titleWide]}>Revenue & Payments</Text>
            <Text style={styles.subtitle}>
              Monitor gross booking turnover, advance collections, and pending balance dues across stays.
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => void loadData()}
              style={({ pressed }) => [
                styles.refreshBtn,
                pressed && styles.pressed,
                Platform.select({ web: { cursor: "pointer", outlineStyle: "none" } as any, default: {} }),
              ]}
            >
              <RefreshCw size={14} color={colors.textSecondary} />
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </Pressable>
          </View>
        </View>

        {error ? (
          <View style={styles.alertBox}>
            <CircleAlert size={16} color="#F87171" />
            <Text style={styles.alertText}>{error}</Text>
          </View>
        ) : null}

        {/* 1. TOP FINANCIAL SUMMARY CARDS */}
        <View style={[styles.summaryGrid, isWide && styles.summaryGridWide]}>
          {/* Total Booking Revenue */}
          <View style={[styles.summaryCard, isWide && styles.summaryCardWide]}>
            <View style={styles.summaryTop}>
              <Text style={styles.summaryLabel}>Total Booking Revenue</Text>
              <View style={[styles.iconWrap, { backgroundColor: "rgba(224, 184, 74, 0.12)" }]}>
                <Wallet size={18} color={colors.gold} />
              </View>
            </View>
            <Text style={[styles.summaryAmount, { color: colors.gold }]}>{money(totalRevenue)}</Text>
            <Text style={styles.summarySub}>Gross booked stay volume</Text>
          </View>

          {/* Amount Collected */}
          <View style={[styles.summaryCard, isWide && styles.summaryCardWide]}>
            <View style={styles.summaryTop}>
              <Text style={styles.summaryLabel}>Amount Collected</Text>
              <View style={[styles.iconWrap, { backgroundColor: "rgba(52, 211, 153, 0.12)" }]}>
                <Coins size={18} color="#34D399" />
              </View>
            </View>
            <Text style={[styles.summaryAmount, { color: "#34D399" }]}>{money(totalCollected)}</Text>
            <Text style={styles.summarySub}>Advance & online receipts cleared</Text>
          </View>

          {/* Pending Amount */}
          <View style={[styles.summaryCard, isWide && styles.summaryCardWide]}>
            <View style={styles.summaryTop}>
              <Text style={styles.summaryLabel}>Pending Balance Due</Text>
              <View style={[styles.iconWrap, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}>
                <CreditCard size={18} color="#F59E0B" />
              </View>
            </View>
            <Text style={[styles.summaryAmount, { color: "#F59E0B" }]}>{money(totalPending)}</Text>
            <Text style={styles.summarySub}>Payable at check-in</Text>
          </View>
        </View>

        {/* 2. FILTERS & CONTROLS */}
        <View style={styles.filterSection}>
          <View style={[styles.filterControlsRow, isWide && styles.filterControlsRowWide]}>
            {/* Search Input */}
            <View style={styles.searchWrap}>
              <Search size={15} color={colors.textMuted} />
              <TextInput
                placeholder="Search guest or booking reference..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
            </View>

            {/* Villa Unit Selector */}
            <View style={styles.unitFilterRow}>
              <Pressable
                onPress={() => setUnitFilter("all")}
                style={[styles.unitFilterPill, unitFilter === "all" && styles.unitFilterPillActive]}
              >
                <Text style={[styles.unitFilterText, unitFilter === "all" && styles.unitFilterTextActive]}>
                  All Units
                </Text>
              </Pressable>
              {(dashboard?.units || []).map((u) => (
                <Pressable
                  key={u.id}
                  onPress={() => setUnitFilter(u.id)}
                  style={[styles.unitFilterPill, unitFilter === u.id && styles.unitFilterPillActive]}
                >
                  <Text style={[styles.unitFilterText, unitFilter === u.id && styles.unitFilterTextActive]}>
                    {u.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Status Tabs */}
          <View style={styles.statusTabsRow}>
            {(["All", "Paid", "Partial", "Pending"] as const).map((st) => {
              const active = paymentStatusFilter === st;
              return (
                <Pressable
                  key={st}
                  onPress={() => setPaymentStatusFilter(st)}
                  style={[styles.statusTabBtn, active && styles.statusTabBtnActive]}
                >
                  <Text style={[styles.statusTabText, active && styles.statusTabTextActive]}>{st}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 3. PAYMENT / BOOKING LEDGER */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={styles.loadingText}>Compiling payment ledger...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <CreditCard size={32} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No payment records found</Text>
            <Text style={styles.emptySub}>No bookings match the selected date or payment criteria.</Text>
          </View>
        ) : (
          <View style={styles.ledgerList}>
            {filteredItems.map((item, idx) => {
              const isPaid = item.derivedPaymentStatus === "Paid";
              const isPartial = item.derivedPaymentStatus === "Partial";
              const isPending = item.derivedPaymentStatus === "Pending";

              return (
                <View key={`${item.id}-${idx}`} style={[styles.ledgerRowCard, isWide && styles.ledgerRowCardWide]}>
                  {/* Left: Guest & Villa Details */}
                  <View style={styles.ledgerLeft}>
                    <View style={styles.avatarCircle}>
                      <User size={15} color={colors.gold} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.guestTitle}>{item.customer_name}</Text>
                      <Text style={styles.guestSub}>
                        {item.unit_name || "Villa Unit"} &bull; {String(item.check_in || "").split("T")[0]} &rarr;{" "}
                        {String(item.check_out || "").split("T")[0]}
                      </Text>
                      {item.booking_id ? (
                        <Text style={styles.bookingRef}>Ref: #{item.booking_id}</Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Center: Financial Split */}
                  <View style={styles.ledgerCenter}>
                    <View style={styles.amountPill}>
                      <Text style={styles.amountLabel}>Total</Text>
                      <Text style={styles.amountValue}>{money(item.numericTotal)}</Text>
                    </View>
                    <View style={styles.amountPill}>
                      <Text style={styles.amountLabel}>Paid</Text>
                      <Text style={[styles.amountValue, { color: "#34D399" }]}>{money(item.numericPaid)}</Text>
                    </View>
                    <View style={styles.amountPill}>
                      <Text style={styles.amountLabel}>Balance</Text>
                      <Text style={[styles.amountValue, { color: isPaid ? colors.textMuted : "#F59E0B" }]}>
                        {money(item.numericBalance)}
                      </Text>
                    </View>
                  </View>

                  {/* Right: Payment Status Badge */}
                  <View style={styles.ledgerRight}>
                    <View
                      style={[
                        styles.paymentStatusBadge,
                        isPaid && styles.statusBadgePaid,
                        isPartial && styles.statusBadgePartial,
                        isPending && styles.statusBadgePending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.paymentStatusText,
                          isPaid && styles.statusTextPaid,
                          isPartial && styles.statusTextPartial,
                          isPending && styles.statusTextPending,
                        ]}
                      >
                        {item.derivedPaymentStatus}
                      </Text>
                    </View>
                    <Text style={styles.paymentMethod}>
                      {item.payment_mode ? item.payment_mode.toUpperCase() : "ONLINE"}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  scroll: {
    flexGrow: 1,
    backgroundColor: "#07080A",
    paddingTop: 16,
    paddingBottom: 48,
    alignItems: "center",
  },
  scrollWide: {
    paddingTop: 24,
    paddingBottom: 56,
  },
  container: {
    width: "100%",
    paddingHorizontal: 16,
    gap: 20,
  },
  containerWide: {
    maxWidth: 1380,
    paddingHorizontal: 28,
    gap: 24,
  },

  // Header Box
  headerBox: {
    backgroundColor: "rgba(14, 18, 24, 0.95)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.2)",
    padding: 18,
    gap: 16,
  },
  headerBoxWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
  },
  badgeText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  title: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.displayMedium,
    fontSize: 22,
  },
  titleWide: {
    fontSize: 28,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  refreshBtnText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12.5,
  },

  // Alert
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  alertText: {
    color: "#F87171",
    fontFamily: fontFamilies.sans,
    fontSize: 13,
  },

  // Summary Grid
  summaryGrid: {
    gap: 12,
  },
  summaryGridWide: {
    flexDirection: "row",
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "rgba(14, 18, 24, 0.85)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.16)",
    padding: 18,
    gap: 8,
  },
  summaryCardWide: {
    padding: 22,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12.5,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryAmount: {
    fontFamily: fontFamilies.displayMedium,
    fontSize: 26,
  },
  summarySub: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
  },

  // Filter Section
  filterSection: {
    gap: 12,
  },
  filterControlsRow: {
    gap: 12,
  },
  filterControlsRowWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(18, 22, 28, 0.8)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 14,
    height: 42,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontFamily: fontFamilies.sans,
    fontSize: 13,
  },
  unitFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  unitFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  unitFilterPillActive: {
    backgroundColor: "rgba(224, 184, 74, 0.14)",
    borderColor: "rgba(224, 184, 74, 0.35)",
  },
  unitFilterText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },
  unitFilterTextActive: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
  },
  statusTabsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusTabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "rgba(18, 22, 28, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  statusTabBtnActive: {
    backgroundColor: "rgba(224, 184, 74, 0.14)",
    borderColor: "rgba(224, 184, 74, 0.35)",
  },
  statusTabText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },
  statusTabTextActive: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
  },

  // Loading & Empty
  loadingBox: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: "rgba(14, 18, 24, 0.6)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 15,
  },
  emptySub: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
  },

  // Ledger List
  ledgerList: {
    gap: 10,
  },
  ledgerRowCard: {
    backgroundColor: "rgba(14, 18, 24, 0.8)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.14)",
    padding: 16,
    gap: 12,
  },
  ledgerRowCardWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  ledgerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  guestTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 14,
  },
  guestSub: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
    marginTop: 2,
  },
  bookingRef: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10.5,
    marginTop: 1,
  },
  ledgerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  amountPill: {
    gap: 2,
    minWidth: 70,
  },
  amountLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10.5,
  },
  amountValue: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
  },
  ledgerRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgePaid: {
    backgroundColor: "rgba(52, 211, 153, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  statusBadgePartial: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  statusBadgePending: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  paymentStatusText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansBold,
  },
  statusTextPaid: { color: "#34D399" },
  statusTextPartial: { color: "#F59E0B" },
  statusTextPending: { color: "#F87171" },
  paymentMethod: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
