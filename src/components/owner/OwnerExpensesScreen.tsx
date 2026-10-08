import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import {
  DollarSign,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  ArrowDownRight,
  TrendingDown,
  TrendingUp,
  X,
  Check,
  Building,
  Tag,
  CreditCard,
  User,
} from "lucide-react-native";
import {
  getOwnerExpenses,
  saveOwnerExpense,
  deleteOwnerExpense,
  getOwnerBookings,
  getOwnerUnits,
  ExpenseRecord,
  ExpenseCategory,
} from "../../services/api/owner-modules";
import { OwnerLedgerEntry, OwnerUnit } from "../../services/api/owner";


const CATEGORIES: ExpenseCategory[] = [
  "Cleaning",
  "Electricity",
  "Staff",
  "Repairs",
  "Food",
  "Maintenance",
  "Miscellaneous",
];

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Cleaning: "#38BDF8",
  Electricity: "#FBBF24",
  Staff: "#A78BFA",
  Repairs: "#F87171",
  Food: "#34D399",
  Maintenance: "#FB923C",
  Miscellaneous: "#94A3B8",
};

export const OwnerExpensesScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [bookings, setBookings] = useState<OwnerLedgerEntry[]>([]);
  const [units, setUnits] = useState<OwnerUnit[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formCategory, setFormCategory] = useState<ExpenseCategory>("Cleaning");
  const [formAmount, setFormAmount] = useState("");
  const [formVilla, setFormVilla] = useState("");
  const [formPaidTo, setFormPaidTo] = useState("");
  const [formPaymentMethod, setFormPaymentMethod] = useState("UPI");
  const [formDescription, setFormDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [expData, bkData, unData] = await Promise.all([
        getOwnerExpenses(),
        getOwnerBookings(),
        getOwnerUnits(),
      ]);
      setExpenses(expData);
      setBookings(bkData);
      setUnits(unData);
    } catch (err) {
      console.error("Failed to load expenses data", err);
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

  // Calculations
  const metrics = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const thisMonthExpenses = expenses
      .filter((item) => item.date.startsWith(currentMonthPrefix))
      .reduce((sum, item) => sum + (item.amount || 0), 0);

    const totalCollectedRevenue = bookings
      .filter((b) => b.booking_status !== "cancelled")
      .reduce((sum, b) => sum + (Number(b.advance_amount) || 0), 0);

    const netEarnings = totalCollectedRevenue - totalExpenses;

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    CATEGORIES.forEach((c) => (categoryTotals[c] = 0));
    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    return {
      totalExpenses,
      thisMonthExpenses,
      totalCollectedRevenue,
      netEarnings,
      categoryTotals,
    };
  }, [expenses, bookings]);

  // Filtered List
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.description.toLowerCase().includes(q) ||
        (item.paidTo && item.paidTo.toLowerCase().includes(q)) ||
        (item.villaUnitName && item.villaUnitName.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [expenses, selectedCategory, searchQuery]);

  const openAddModal = () => {
    setEditingExpense(null);
    setFormDate(new Date().toISOString().split("T")[0] || "2026-09-25");
    setFormCategory("Cleaning");
    setFormAmount("");
    setFormVilla(units[0]?.name || "All Units");
    setFormPaidTo("");
    setFormPaymentMethod("UPI");
    setFormDescription("");
    setModalVisible(true);
  };

  const openEditModal = (item: ExpenseRecord) => {
    setEditingExpense(item);
    setFormDate(item.date);
    setFormCategory(item.category);
    setFormAmount(item.amount.toString());
    setFormVilla(item.villaUnitName || "All Units");
    setFormPaidTo(item.paidTo || "");
    setFormPaymentMethod(item.paymentMethod || "UPI");
    setFormDescription(item.description || "");
    setModalVisible(true);
  };

  const handleSave = async () => {
    const parsedAmount = parseFloat(formAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid expense amount.");
      return;
    }
    if (!formDescription.trim()) {
      Alert.alert("Missing Description", "Please provide a short description for this expense.");
      return;
    }

    try {
      setSaving(true);
      await saveOwnerExpense({
        id: editingExpense?.id,
        date: formDate || new Date().toISOString().split("T")[0] || "2026-09-25",
        category: formCategory,
        amount: parsedAmount,
        villaUnitName: formVilla,
        paidTo: formPaidTo,
        paymentMethod: formPaymentMethod,
        description: formDescription.trim(),
      });
      setModalVisible(false);
      await loadData();
    } catch (err) {
      console.error("Error saving expense:", err);
      Alert.alert("Error", "Failed to save expense record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: ExpenseRecord) => {
    const doDelete = async () => {
      try {
        await deleteOwnerExpense(item.id);
        await loadData();
      } catch (err) {
        console.error("Error deleting expense:", err);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Delete expense "${item.description}" (₹${item.amount.toLocaleString("en-IN")})?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        "Delete Expense",
        `Are you sure you want to delete ${item.description} (₹${item.amount.toLocaleString("en-IN")})?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: doDelete },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E0B84A" />
        <Text style={styles.loadingText}>Loading expenses & financial outflows...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Expenses & Outflows</Text>
          <Text style={styles.headerSubtitle}>
            Track operational spending, maintenance, bills & compute net property earnings
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={16} color="#A0AEC0" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Plus size={16} color="#000" />
            <Text style={styles.addButtonText}>Record Expense</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Metric Cards Row */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}>
            <TrendingDown size={20} color="#F87171" />
          </View>
          <Text style={styles.metricLabel}>Total Recorded Expenses</Text>
          <Text style={[styles.metricValue, { color: "#F87171" }]}>
            ₹{metrics.totalExpenses.toLocaleString("en-IN")}
          </Text>
          <Text style={styles.metricSub}>All-time logged property costs</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}>
            <Calendar size={20} color="#FBBF24" />
          </View>
          <Text style={styles.metricLabel}>This Month's Spending</Text>
          <Text style={styles.metricValue}>
            ₹{metrics.thisMonthExpenses.toLocaleString("en-IN")}
          </Text>
          <Text style={styles.metricSub}>Current calendar month</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}>
            <DollarSign size={20} color="#34D399" />
          </View>
          <Text style={styles.metricLabel}>Collected Booking Revenue</Text>
          <Text style={[styles.metricValue, { color: "#34D399" }]}>
            ₹{metrics.totalCollectedRevenue.toLocaleString("en-IN")}
          </Text>
          <Text style={styles.metricSub}>Advances & collections</Text>
        </View>

        <View style={[styles.metricCard, styles.netEarningsCard]}>
          <View style={styles.metricIconWrap}>
            <TrendingUp size={20} color="#E0B84A" />
          </View>
          <Text style={styles.metricLabel}>Net Operational Earnings</Text>
          <Text
            style={[
              styles.metricValue,
              { color: metrics.netEarnings >= 0 ? "#E0B84A" : "#F87171" },
            ]}
          >
            ₹{metrics.netEarnings.toLocaleString("en-IN")}
          </Text>
          <Text style={styles.metricSub}>Collected Revenue − Logged Expenses</Text>
        </View>
      </View>

      {/* Category Spend Distribution */}
      <View style={styles.categoryCard}>
        <Text style={styles.cardTitle}>Spending by Category</Text>
        <View style={styles.categoryProgressRow}>
          {CATEGORIES.map((cat) => {
            const amount = metrics.categoryTotals[cat] || 0;
            const pct = metrics.totalExpenses > 0 ? (amount / metrics.totalExpenses) * 100 : 0;
            if (pct <= 0) return null;
            return (
              <View
                key={cat}
                style={[
                  styles.categoryProgressBarSegment,
                  { flex: pct, backgroundColor: CATEGORY_COLORS[cat] },
                ]}
              />
            );
          })}
        </View>
        <View style={styles.categoryPillsContainer}>
          {CATEGORIES.map((cat) => {
            const amount = metrics.categoryTotals[cat] || 0;
            const pct = metrics.totalExpenses > 0 ? (amount / metrics.totalExpenses) * 100 : 0;
            return (
              <View key={cat} style={styles.categoryStatItem}>
                <View
                  style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[cat] }]}
                />
                <Text style={styles.categoryStatName}>{cat}:</Text>
                <Text style={styles.categoryStatAmount}>
                  ₹{amount.toLocaleString("en-IN")} ({pct.toFixed(0)}%)
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Filters & Search */}
      <View style={styles.controlsRow}>
        <View style={styles.searchBox}>
          <Search size={16} color="#718096" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by description, vendor, unit..."
            placeholderTextColor="#718096"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color="#718096" />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContainer}
        >
          <TouchableOpacity
            style={[styles.filterPill, selectedCategory === "all" && styles.filterPillActive]}
            onPress={() => setSelectedCategory("all")}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedCategory === "all" && styles.filterPillTextActive,
              ]}
            >
              All Categories ({expenses.length})
            </Text>
          </TouchableOpacity>

          {CATEGORIES.map((cat) => {
            const count = expenses.filter((e) => e.category === cat).length;
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <View
                  style={[
                    styles.filterDot,
                    { backgroundColor: CATEGORY_COLORS[cat] },
                  ]}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    isActive && styles.filterPillTextActive,
                  ]}
                >
                  {cat} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Expenses Table / List */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Expense Records ({filteredExpenses.length})
          </Text>
        </View>

        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Layers size={36} color="#4A5568" />
            <Text style={styles.emptyTitle}>No expense records found</Text>
            <Text style={styles.emptySub}>
              {searchQuery || selectedCategory !== "all"
                ? "Try clearing your search or category filters."
                : "Click 'Record Expense' above to log property costs."}
            </Text>
          </View>
        ) : (
          filteredExpenses.map((item) => {
            const catColor = CATEGORY_COLORS[item.category] || "#94A3B8";
            return (
              <View key={item.id} style={styles.expenseItem}>
                <View style={styles.expenseLeft}>
                  <View style={styles.expenseTopRow}>
                    <View style={[styles.catBadge, { backgroundColor: `${catColor}22` }]}>
                      <Text style={[styles.catBadgeText, { color: catColor }]}>
                        {item.category}
                      </Text>
                    </View>
                    <Text style={styles.expenseDate}>{item.date}</Text>
                    {item.villaUnitName ? (
                      <View style={styles.unitBadge}>
                        <Building size={11} color="#94A3B8" />
                        <Text style={styles.unitBadgeText}>{item.villaUnitName}</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.expenseDesc}>{item.description}</Text>

                  <View style={styles.expenseMetaRow}>
                    {item.paidTo ? (
                      <View style={styles.metaItem}>
                        <User size={12} color="#718096" />
                        <Text style={styles.metaText}>Paid to: {item.paidTo}</Text>
                      </View>
                    ) : null}
                    {item.paymentMethod ? (
                      <View style={styles.metaItem}>
                        <CreditCard size={12} color="#718096" />
                        <Text style={styles.metaText}>{item.paymentMethod}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.metaId}>#{item.id}</Text>
                  </View>
                </View>

                <View style={styles.expenseRight}>
                  <Text style={styles.expenseAmount}>
                    -₹{item.amount.toLocaleString("en-IN")}
                  </Text>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => openEditModal(item)}
                    >
                      <Edit2 size={14} color="#A0AEC0" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => handleDelete(item)}
                    >
                      <Trash2 size={14} color="#F87171" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingExpense ? "Edit Expense" : "Record Property Expense"}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#A0AEC0" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Category selector */}
              <Text style={styles.formLabel}>Expense Category *</Text>
              <View style={styles.categorySelectGrid}>
                {CATEGORIES.map((cat) => {
                  const isSel = formCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catChoice,
                        isSel && { borderColor: CATEGORY_COLORS[cat], backgroundColor: `${CATEGORY_COLORS[cat]}20` },
                      ]}
                      onPress={() => setFormCategory(cat)}
                    >
                      <View
                        style={[
                          styles.catChoiceDot,
                          { backgroundColor: CATEGORY_COLORS[cat] },
                        ]}
                      />
                      <Text
                        style={[
                          styles.catChoiceText,
                          isSel && { color: "#FFF", fontWeight: "700" },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Amount & Date */}
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Amount (₹) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 2500"
                    placeholderTextColor="#718096"
                    keyboardType="numeric"
                    value={formAmount}
                    onChangeText={setFormAmount}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#718096"
                    value={formDate}
                    onChangeText={setFormDate}
                  />
                </View>
              </View>

              {/* Assigned Unit */}
              <Text style={styles.formLabel}>Villa / Unit (Optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Lakeview Villa Main or All Units"
                placeholderTextColor="#718096"
                value={formVilla}
                onChangeText={setFormVilla}
              />

              {/* Paid To & Payment Method */}
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Paid To (Vendor/Staff)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. MSEDCL, Sunita Caretaker"
                    placeholderTextColor="#718096"
                    value={formPaidTo}
                    onChangeText={setFormPaidTo}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Payment Method</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="UPI / Cash / NetBanking"
                    placeholderTextColor="#718096"
                    value={formPaymentMethod}
                    onChangeText={setFormPaymentMethod}
                  />
                </View>
              </View>

              {/* Description */}
              <Text style={styles.formLabel}>Description / Notes *</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="Details of the expenditure..."
                placeholderTextColor="#718096"
                multiline
                numberOfLines={3}
                value={formDescription}
                onChangeText={setFormDescription}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Check size={16} color="#000" />
                    <Text style={styles.submitBtnText}>
                      {editingExpense ? "Update Expense" : "Save Expense"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0B84A",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 13,
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
  netEarningsCard: {
    borderColor: "rgba(224, 184, 74, 0.4)",
    backgroundColor: "rgba(224, 184, 74, 0.03)",
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
  categoryCard: {
    backgroundColor: "#0D1117",
    borderWidth: 1,
    borderColor: "#1E2633",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  categoryProgressRow: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#1E2633",
    marginBottom: 12,
  },
  categoryProgressBarSegment: {
    height: "100%",
  },
  categoryPillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryStatName: {
    color: "#94A3B8",
    fontSize: 11,
  },
  categoryStatAmount: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "600",
  },
  controlsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  searchBox: {
    flex: 1,
    minWidth: 260,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1117",
    borderWidth: 1,
    borderColor: "#1E2633",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 13,
    paddingVertical: 0,
  },
  filtersScroll: {
    flexGrow: 0,
  },
  filtersContainer: {
    flexDirection: "row",
    gap: 8,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#0D1117",
    borderWidth: 1,
    borderColor: "#1E2633",
  },
  filterPillActive: {
    borderColor: "#E0B84A",
    backgroundColor: "rgba(224, 184, 74, 0.12)",
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
  listContainer: {
    backgroundColor: "#0D1117",
    borderWidth: 1,
    borderColor: "#1E2633",
    borderRadius: 12,
    overflow: "hidden",
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E2633",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
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
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#141A23",
  },
  expenseLeft: {
    flex: 1,
    marginRight: 16,
  },
  expenseTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  expenseDate: {
    color: "#718096",
    fontSize: 11,
  },
  unitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#161D27",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unitBadgeText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "500",
  },
  expenseDesc: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  expenseMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: "#718096",
    fontSize: 11,
  },
  metaId: {
    color: "#4A5568",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  expenseRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  expenseAmount: {
    color: "#F87171",
    fontSize: 16,
    fontWeight: "700",
  },
  itemActions: {
    flexDirection: "row",
    gap: 6,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#161D27",
    borderWidth: 1,
    borderColor: "#1E2633",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtn: {
    borderColor: "rgba(248, 113, 113, 0.3)",
    backgroundColor: "rgba(248, 113, 113, 0.08)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 540,
    maxHeight: "90%",
    backgroundColor: "#0D1117",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E2633",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E2633",
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 18,
  },
  formLabel: {
    color: "#A0AEC0",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 10,
  },
  categorySelectGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  catChoice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#161D27",
    borderWidth: 1,
    borderColor: "#1E2633",
  },
  catChoiceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  catChoiceText: {
    color: "#94A3B8",
    fontSize: 11,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  formCol: {
    flex: 1,
  },
  formInput: {
    backgroundColor: "#161D27",
    borderWidth: 1,
    borderColor: "#1E2633",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#FFF",
    fontSize: 13,
  },
  formTextArea: {
    minHeight: 64,
    textAlignVertical: "top",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#1E2633",
    backgroundColor: "#090C10",
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#1E2633",
  },
  cancelBtnText: {
    color: "#A0AEC0",
    fontSize: 12,
    fontWeight: "600",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0B84A",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  submitBtnText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "700",
  },
});
