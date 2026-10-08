import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  DimensionValue,
} from "react-native";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  Percent,
  RefreshCw,
  PieChart,
  Building,
  Sparkles,
} from "lucide-react-native";
import { OwnerLedgerEntry, OwnerUnit } from "../../services/api/owner";
import {
  getOwnerBookings,
  getOwnerUnits,
  getOwnerExpenses,
  ExpenseRecord,
} from "../../services/api/owner-modules";

export const OwnerReportsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<OwnerLedgerEntry[]>([]);
  const [units, setUnits] = useState<OwnerUnit[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [bData, uData, eData] = await Promise.all([
        getOwnerBookings(),
        getOwnerUnits(),
        getOwnerExpenses(),
      ]);
      setBookings(bData);
      setUnits(uData);
      setExpenses(eData);
    } catch (err) {
      console.error("Failed to load reports data", err);
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

  // Analytics Computation
  const analytics = useMemo(() => {
    const validBookings = bookings.filter((b) => b.booking_status !== "cancelled");
    const cancelledBookings = bookings.filter((b) => b.booking_status === "cancelled");

    const totalGrossRevenue = validBookings.reduce((sum, b) => {
      const amt = typeof b.total_amount === "number" ? b.total_amount : parseFloat(String(b.total_amount || b.amount || 0)) || 0;
      return sum + amt;
    }, 0);

    const totalCollectedRevenue = validBookings.reduce((sum, b) => {
      const adv = typeof b.advance_amount === "number" ? b.advance_amount : parseFloat(String(b.advance_amount || 0)) || 0;
      return sum + adv;
    }, 0);

    const totalPendingRevenue = Math.max(0, totalGrossRevenue - totalCollectedRevenue);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netOperatingProfit = totalCollectedRevenue - totalExpenses;

    const totalNights = validBookings.reduce((sum, b) => {
      if (b.check_in && b.check_out) {
        const diff = Math.ceil((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / (1000 * 3600 * 24));
        return sum + Math.max(1, isNaN(diff) ? 1 : diff);
      }
      return sum + 1;
    }, 0);

    const totalGuests = validBookings.reduce((sum, b) => sum + (b.persons || 1), 0);

    const adr = totalNights > 0 ? Math.round(totalGrossRevenue / totalNights) : 0;
    const cancellationRate =
      bookings.length > 0 ? ((cancelledBookings.length / bookings.length) * 100).toFixed(1) : "0.0";

    // Sources breakdown
    const sourceMap: Record<string, { count: number; revenue: number }> = {
      Website: { count: 0, revenue: 0 },
      B2B: { count: 0, revenue: 0 },
      Referral: { count: 0, revenue: 0 },
      WhatsApp: { count: 0, revenue: 0 },
      Direct: { count: 0, revenue: 0 },
    };

    validBookings.forEach((b) => {
      const src = b.source === "website" ? "Website" : "Direct";
      const amt = typeof b.total_amount === "number" ? b.total_amount : parseFloat(String(b.total_amount || b.amount || 0)) || 0;

      if (!sourceMap[src]) sourceMap[src] = { count: 0, revenue: 0 };
      sourceMap[src]!.count += 1;
      sourceMap[src]!.revenue += amt;
    });

    // Unit performance
    const unitPerf = units.map((u) => {
      const uBookings = validBookings.filter(
        (b) => b.unit_id === u.id || b.unit_name === u.name
      );
      const uNights = uBookings.reduce((sum, b) => {
        if (b.check_in && b.check_out) {
          const diff = Math.ceil((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / (1000 * 3600 * 24));
          return sum + Math.max(1, isNaN(diff) ? 1 : diff);
        }
        return sum + 1;
      }, 0);
      const uRev = uBookings.reduce((sum, b) => {
        const amt = typeof b.total_amount === "number" ? b.total_amount : parseFloat(String(b.total_amount || b.amount || 0)) || 0;
        return sum + amt;
      }, 0);
      const basePrice = parseInt(u.weekday_price || "7500", 10) || 7500;
      const uAdr = uNights > 0 ? Math.round(uRev / uNights) : basePrice;
      const uOcc = Math.min(100, Math.round((uNights / 30) * 100));

      return {
        unit: u,
        bookingsCount: uBookings.length,
        nights: uNights,
        revenue: uRev,
        adr: uAdr,
        occupancy: uOcc,
      };
    });

    return {
      totalGrossRevenue,
      totalCollectedRevenue,
      totalPendingRevenue,
      totalExpenses,
      netOperatingProfit,
      totalNights,
      totalGuests,
      adr,
      cancellationRate,
      sourceMap,
      unitPerf,
    };
  }, [bookings, units, expenses]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E0B84A" />
        <Text style={styles.loadingText}>Synthesizing property intelligence & reports...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Reports & Analytics</Text>
          <Text style={styles.headerSubtitle}>
            Comprehensive performance metrics, revenue intelligence, and channel attribution
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh} disabled={refreshing}>
            <RefreshCw size={16} color="#A0AEC0" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Top Metric Cards */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}>
            <DollarSign size={20} color="#E0B84A" />
          </View>
          <Text style={styles.metricLabel}>Gross Booked Revenue</Text>
          <Text style={[styles.metricValue, { color: "#E0B84A" }]}>
            ₹{analytics.totalGrossRevenue.toLocaleString("en-IN")}
          </Text>
          <Text style={styles.metricSub}>
            ₹{analytics.totalCollectedRevenue.toLocaleString("en-IN")} collected in bank
          </Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}>
            <TrendingUp size={20} color="#34D399" />
          </View>
          <Text style={styles.metricLabel}>Average Daily Rate (ADR)</Text>
          <Text style={styles.metricValue}>₹{analytics.adr.toLocaleString("en-IN")}</Text>
          <Text style={styles.metricSub}>Revenue per booked night</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}>
            <Calendar size={20} color="#38BDF8" />
          </View>
          <Text style={styles.metricLabel}>Total Nights Booked</Text>
          <Text style={styles.metricValue}>{analytics.totalNights} Nights</Text>
          <Text style={styles.metricSub}>{analytics.totalGuests} Guests hosted</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}>
            <Percent size={20} color="#A78BFA" />
          </View>
          <Text style={styles.metricLabel}>Cancellation Rate</Text>
          <Text style={[styles.metricValue, { color: parseFloat(analytics.cancellationRate) > 15 ? "#F87171" : "#34D399" }]}>
            {analytics.cancellationRate}%
          </Text>
          <Text style={styles.metricSub}>Of all received reservations</Text>
        </View>
      </View>

      {/* Financial Health Summary Banner */}
      <View style={styles.finHealthCard}>
        <View style={styles.finHealthHeader}>
          <View style={styles.finHealthTitleWrap}>
            <Sparkles size={18} color="#E0B84A" />
            <Text style={styles.finHealthTitle}>Operational Profit & Cashflow Matrix</Text>
          </View>
          <View style={styles.finHealthBadge}>
            <Text style={styles.finHealthBadgeText}>Real-Time Ledger Audit</Text>
          </View>
        </View>

        <View style={styles.finMatrixGrid}>
          <View style={styles.finMatrixCol}>
            <Text style={styles.finMatrixLabel}>Collected Advances</Text>
            <Text style={[styles.finMatrixVal, { color: "#34D399" }]}>
              +₹{analytics.totalCollectedRevenue.toLocaleString("en-IN")}
            </Text>
          </View>

          <View style={styles.finMatrixCol}>
            <Text style={styles.finMatrixLabel}>Recorded Expenses</Text>
            <Text style={[styles.finMatrixVal, { color: "#F87171" }]}>
              -₹{analytics.totalExpenses.toLocaleString("en-IN")}
            </Text>
          </View>

          <View style={styles.finMatrixCol}>
            <Text style={styles.finMatrixLabel}>Pending Collections</Text>
            <Text style={[styles.finMatrixVal, { color: "#FBBF24" }]}>
              ₹{analytics.totalPendingRevenue.toLocaleString("en-IN")}
            </Text>
          </View>

          <View style={[styles.finMatrixCol, styles.finMatrixHighlight]}>
            <Text style={styles.finMatrixLabel}>Net Operational Surplus</Text>
            <Text
              style={[
                styles.finMatrixVal,
                { color: analytics.netOperatingProfit >= 0 ? "#E0B84A" : "#F87171" },
              ]}
            >
              ₹{analytics.netOperatingProfit.toLocaleString("en-IN")}
            </Text>
          </View>
        </View>
      </View>

      {/* Performance by Villa Unit */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Building size={18} color="#E0B84A" />
          <Text style={styles.sectionTitle}>Performance by Villa Unit</Text>
        </View>

        <View style={styles.unitTable}>
          <View style={styles.unitHeadRow}>
            <Text style={[styles.unitHeadCol, { flex: 2 }]}>Villa / Unit</Text>
            <Text style={[styles.unitHeadCol, { flex: 1 }]}>Bookings</Text>
            <Text style={[styles.unitHeadCol, { flex: 1 }]}>Nights</Text>
            <Text style={[styles.unitHeadCol, { flex: 1 }]}>Est. ADR</Text>
            <Text style={[styles.unitHeadCol, { flex: 1.5 }]}>Total Revenue</Text>
          </View>

          {analytics.unitPerf.map((item) => (
            <View key={item.unit.id} style={styles.unitItemRow}>
              <View style={{ flex: 2 }}>
                <Text style={styles.unitName}>{item.unit.name}</Text>
                <Text style={styles.unitSub}>
                  Cap: {item.unit.total_persons || item.unit.available_persons || 10} Guests • Base ₹
                  {item.unit.weekday_price || "7,500"}
                </Text>
              </View>
              <Text style={[styles.unitCell, { flex: 1 }]}>{item.bookingsCount}</Text>
              <Text style={[styles.unitCell, { flex: 1 }]}>{item.nights}</Text>
              <Text style={[styles.unitCell, { flex: 1 }]}>
                ₹{item.adr.toLocaleString("en-IN")}
              </Text>
              <Text style={[styles.unitCell, { flex: 1.5, color: "#E0B84A", fontWeight: "700" }]}>
                ₹{item.revenue.toLocaleString("en-IN")}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Channel Attribution & Booking Sources */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <PieChart size={18} color="#38BDF8" />
          <Text style={styles.sectionTitle}>Channel Attribution & Booking Sources</Text>
        </View>

        <View style={styles.sourcesGrid}>
          {Object.entries(analytics.sourceMap).map(([source, data]) => {
            const pct =
              analytics.totalGrossRevenue > 0
                ? ((data.revenue / analytics.totalGrossRevenue) * 100).toFixed(0)
                : "0";
            const widthVal: DimensionValue = `${Math.max(4, parseInt(pct, 10))}%`;

            return (
              <View key={source} style={styles.sourceCard}>
                <View style={styles.sourceCardHeader}>
                  <Text style={styles.sourceName}>{source}</Text>
                  <Text style={styles.sourcePct}>{pct}%</Text>
                </View>

                <View style={styles.sourceProgressBar}>
                  <View
                    style={[
                      styles.sourceProgressFill,
                      {
                        width: widthVal,
                        backgroundColor:
                          source === "Website"
                            ? "#38BDF8"
                            : source === "B2B"
                            ? "#A78BFA"
                            : source === "Referral"
                            ? "#E0B84A"
                            : "#34D399",
                      },
                    ]}
                  />
                </View>

                <View style={styles.sourceStatsRow}>
                  <Text style={styles.sourceCount}>{data.count} bookings</Text>
                  <Text style={styles.sourceRevenue}>
                    ₹{data.revenue.toLocaleString("en-IN")}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
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
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: "#0D1117",
    borderWidth: 1,
    borderColor: "#1E2633",
    borderRadius: 12,
    padding: 16,
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#161D27",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  metricLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  metricValue: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  metricSub: {
    color: "#64748B",
    fontSize: 11,
  },
  finHealthCard: {
    backgroundColor: "#0D1117",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
  },
  finHealthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 10,
  },
  finHealthTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  finHealthTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  finHealthBadge: {
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
  },
  finHealthBadgeText: {
    color: "#E0B84A",
    fontSize: 11,
    fontWeight: "700",
  },
  finMatrixGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  finMatrixCol: {
    flex: 1,
    minWidth: 140,
    backgroundColor: "#161D27",
    padding: 12,
    borderRadius: 8,
  },
  finMatrixHighlight: {
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.4)",
    backgroundColor: "rgba(224, 184, 74, 0.05)",
  },
  finMatrixLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  finMatrixVal: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionCard: {
    backgroundColor: "#0D1117",
    borderWidth: 1,
    borderColor: "#1E2633",
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  unitTable: {
    borderWidth: 1,
    borderColor: "#1E2633",
    borderRadius: 8,
    overflow: "hidden",
  },
  unitHeadRow: {
    flexDirection: "row",
    backgroundColor: "#161D27",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1E2633",
  },
  unitHeadCol: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },
  unitItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#141A23",
  },
  unitName: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  unitSub: {
    color: "#718096",
    fontSize: 10,
    marginTop: 2,
  },
  unitCell: {
    color: "#CBD5E1",
    fontSize: 12,
  },
  sourcesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  sourceCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: "#161D27",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1E2633",
  },
  sourceCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sourceName: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  sourcePct: {
    color: "#E0B84A",
    fontSize: 13,
    fontWeight: "700",
  },
  sourceProgressBar: {
    height: 6,
    backgroundColor: "#0D1117",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  sourceProgressFill: {
    height: "100%",
  },
  sourceStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sourceCount: {
    color: "#94A3B8",
    fontSize: 11,
  },
  sourceRevenue: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
