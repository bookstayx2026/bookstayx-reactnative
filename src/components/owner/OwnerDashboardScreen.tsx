import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter, type Href } from "expo-router";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Calendar,
  CalendarCheck2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock,
  CreditCard,
  DoorClosed,
  DoorOpen,
  Eye,
  ExternalLink,
  Info,
  Phone,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react-native";
import { useAuth } from "@/components/auth";
import { colors, fontFamilies, radii } from "@/theme";
import { useIsWideScreen } from "@/hooks/use-window-class";
import { ticketIdForDisplay } from "@/utils/ticket-id";
import {
  getOwnerBookingRequests,
  getOwnerExpenses,
  getProtectedOwnerCalendar,
  getProtectedOwnerDashboard,
  getProtectedOwnerLedger,
  updateBookingRequestStatus,
  createProtectedLedgerEntry,
  type BookingRequestRecord,
  type ExpenseRecord,
  type OwnerCalendarDay,
  type OwnerDashboard,
  type OwnerLedgerEntry,
  type OwnerUnit,
} from "@/services/api";

const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

type DashboardModalType =
  | "checkins"
  | "checkouts"
  | "requests"
  | "accepted_requests"
  | "dues"
  | "recent_reservations"
  | "upcoming_checkins"
  | "booking_detail"
  | null;

type ViewMode = "daily" | "monthly" | "yearly";

function localDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateString(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMonthString(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function OwnerDashboardScreen() {
  const router = useRouter();
  const isWide = useIsWideScreen();
  const { session } = useAuth();
  const token = session?.role === "owner" ? session.tokens.accessToken : "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<OwnerDashboard | null>(null);
  const [ledger, setLedger] = useState<OwnerLedgerEntry[]>([]);
  const [calendarDays, setCalendarDays] = useState<OwnerCalendarDay[]>([]);
  const [requests, setRequests] = useState<BookingRequestRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  // Toolbar Filter & Selection States (Single Unit Selected)
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarCursor, setCalendarCursor] = useState<Date>(new Date());

  // Modals & Inspector
  const [activeModal, setActiveModal] = useState<DashboardModalType>(null);
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<OwnerLedgerEntry | null>(null);
  const [datePickerModalOpen, setDatePickerModalOpen] = useState(false);
  const [unitPickerModalOpen, setUnitPickerModalOpen] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [modalFeedback, setModalFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedDateIso = useMemo(() => localDateIso(selectedDate), [selectedDate]);
  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth() + 1;
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => localDateIso(today), [today]);
  const isSelectedDateToday = selectedDateIso === todayIso;
  const isSelectedMonthCurrent = selectedYear === today.getFullYear() && selectedMonth === today.getMonth() + 1;
  const isSelectedYearCurrent = selectedYear === today.getFullYear();

  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [dashData, ledgerData, requestsData, expensesData] = await Promise.all([
        getProtectedOwnerDashboard(token),
        getProtectedOwnerLedger(token, selectedYear, selectedMonth, selectedUnitId ? selectedUnitId : "all"),
        getOwnerBookingRequests(token),
        getOwnerExpenses(),
      ]);
      setDashboard(dashData);
      setLedger(ledgerData.data || []);
      setRequests(requestsData || []);
      setExpenses(expensesData || []);

      // Auto select first unit if none or invalid
      const unitsList = dashData.units || [];
      const firstUnitId = unitsList[0]?.id ?? null;
      if (unitsList.length > 0 && firstUnitId !== null) {
        setSelectedUnitId((curr) => (curr && unitsList.some((u) => u.id === curr) ? curr : firstUnitId));
      }

      // If unit available, fetch current month calendar
      const targetUnitId = selectedUnitId || dashData.units?.[0]?.id;
      if (targetUnitId) {
        const start = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
        const end =
          new Date(selectedYear, selectedMonth, 0).toISOString().split("T")[0] ||
          `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-28`;
        try {
          const calData = await getProtectedOwnerCalendar(token, targetUnitId, start, end);
          setCalendarDays(calData.data || []);
        } catch {
          // fallback
        }
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedUnitId, selectedYear, token]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Unit-filtered data sets (Single Unit enforced)
  const activeUnitId = selectedUnitId || dashboard?.units?.[0]?.id || null;

  const filteredLedger = useMemo(() => {
    if (!activeUnitId) return ledger;
    return ledger.filter((item) => item.unit_id === activeUnitId);
  }, [activeUnitId, ledger]);

  const filteredRequests = useMemo(() => {
    if (!activeUnitId) return requests;
    return requests.filter((r) => r.villaUnitId === activeUnitId || !r.villaUnitId);
  }, [activeUnitId, requests]);

  // Operational Metrics calculated dynamically for selected Date / View Mode (Daily, Monthly, Yearly)
  const activeCheckIns = useMemo(() => {
    return filteredLedger.filter((item) => {
      if (item.booking_status === "CANCELLED" || item.booking_status === "DELETED") return false;
      const inDate = String(item.check_in || "").split("T")[0] || "";
      if (viewMode === "daily") {
        return inDate === selectedDateIso;
      }
      const [y, m] = inDate.split("-");
      if (viewMode === "monthly") {
        return Number(y) === selectedYear && Number(m) === selectedMonth;
      }
      // yearly mode: match year
      return Number(y) === selectedYear;
    });
  }, [filteredLedger, selectedDateIso, selectedMonth, selectedYear, viewMode]);

  const activeCheckOuts = useMemo(() => {
    return filteredLedger.filter((item) => {
      if (item.booking_status === "CANCELLED" || item.booking_status === "DELETED") return false;
      const outDate = String(item.check_out || "").split("T")[0] || "";
      if (viewMode === "daily") {
        return outDate === selectedDateIso;
      }
      const [y, m] = outDate.split("-");
      if (viewMode === "monthly") {
        return Number(y) === selectedYear && Number(m) === selectedMonth;
      }
      // yearly mode: match year
      return Number(y) === selectedYear;
    });
  }, [filteredLedger, selectedDateIso, selectedMonth, selectedYear, viewMode]);

  const upcomingBookings = useMemo(() => {
    return filteredLedger
      .filter((item) => {
        const inDate = String(item.check_in || "").split("T")[0] || "";
        const statusLower = String(item.booking_status || "").toLowerCase();
        const isCancelled = [
          "cancelled",
          "cancelled_by_owner",
          "owner_cancelled",
          "rejected",
          "deleted",
        ].includes(statusLower);
        return Boolean(inDate >= selectedDateIso && !isCancelled);
      })
      .sort((a, b) => {
        const dateA = String(a.check_in || "").split("T")[0] || "";
        const dateB = String(b.check_in || "").split("T")[0] || "";
        return dateA.localeCompare(dateB);
      });
  }, [filteredLedger, selectedDateIso]);

  // 1. TODAY'S REVENUE CALCULATION
  const todayRevenue = useMemo(() => {
    return filteredLedger
      .filter((item) => {
        const inDate = String(item.check_in || "").split("T")[0] || "";
        return inDate === todayIso && item.booking_status !== "CANCELLED" && item.booking_status !== "DELETED";
      })
      .reduce((sum, item) => {
        const advance = Number(item.advance_amount || 0);
        const total = Number(item.amount || item.total_amount || 0);
        return sum + (advance > 0 ? advance : total);
      }, 0);
  }, [filteredLedger, todayIso]);

  // 2. MONTHLY REVENUE CALCULATION
  const monthlyRevenue = useMemo(() => {
    return filteredLedger
      .filter((item) => {
        if (item.booking_status === "CANCELLED" || item.booking_status === "DELETED") return false;
        const inDate = String(item.check_in || "").split("T")[0] || "";
        const [y, m] = inDate.split("-");
        return Number(y) === selectedYear && Number(m) === selectedMonth;
      })
      .reduce((sum, item) => sum + Number(item.amount || item.total_amount || 0), 0);
  }, [filteredLedger, selectedMonth, selectedYear]);

  const monthlyCollected = useMemo(() => {
    return filteredLedger
      .filter((item) => {
        if (item.booking_status === "CANCELLED" || item.booking_status === "DELETED") return false;
        const inDate = String(item.check_in || "").split("T")[0] || "";
        const [y, m] = inDate.split("-");
        return Number(y) === selectedYear && Number(m) === selectedMonth;
      })
      .reduce((sum, item) => {
        const advance = Number(item.advance_amount || 0);
        const total = Number(item.amount || item.total_amount || 0);
        return sum + (advance > 0 ? advance : total);
      }, 0);
  }, [filteredLedger, selectedMonth, selectedYear]);

  // 3. YEARLY REVENUE CALCULATION
  const yearlyRevenue = useMemo(() => {
    return filteredLedger
      .filter((item) => {
        if (item.booking_status === "CANCELLED" || item.booking_status === "DELETED") return false;
        const inDate = String(item.check_in || "").split("T")[0] || "";
        const [y] = inDate.split("-");
        return Number(y) === selectedYear;
      })
      .reduce((sum, item) => sum + Number(item.amount || item.total_amount || 0), 0);
  }, [filteredLedger, selectedYear]);

  const yearlyCollected = useMemo(() => {
    return filteredLedger
      .filter((item) => {
        if (item.booking_status === "CANCELLED" || item.booking_status === "DELETED") return false;
        const inDate = String(item.check_in || "").split("T")[0] || "";
        const [y] = inDate.split("-");
        return Number(y) === selectedYear;
      })
      .reduce((sum, item) => {
        const advance = Number(item.advance_amount || 0);
        const total = Number(item.amount || item.total_amount || 0);
        return sum + (advance > 0 ? advance : total);
      }, 0);
  }, [filteredLedger, selectedYear]);

  const pendingPayments = useMemo(() => {
    const totalRev = viewMode === "yearly" ? yearlyRevenue : monthlyRevenue;
    const totalCol = viewMode === "yearly" ? yearlyCollected : monthlyCollected;
    return Math.max(0, totalRev - totalCol);
  }, [monthlyCollected, monthlyRevenue, viewMode, yearlyCollected, yearlyRevenue]);

  const pendingRequestsList = useMemo(() => {
    return filteredRequests.filter((r) => r.status === "Pending");
  }, [filteredRequests]);

  const pendingRequestsCount = pendingRequestsList.length;

  const acceptedRequestsList = useMemo(() => {
    return filteredRequests.filter((r) => r.status === "Accepted");
  }, [filteredRequests]);

  const acceptedRequestsCount = acceptedRequestsList.length;

  const pendingDuesList = useMemo(() => {
    return filteredLedger
      .filter((item) => {
        if (item.booking_status === "CANCELLED" || item.booking_status === "DELETED") return false;
        const total = Number(item.amount || item.total_amount || 0);
        const advance = Number(item.advance_amount || 0);
        const due = Math.max(0, total - advance);
        return due > 0;
      })
      .map((item) => {
        const total = Number(item.amount || item.total_amount || 0);
        const advance = Number(item.advance_amount || 0);
        const due = Math.max(0, total - advance);
        return {
          ...item,
          totalAmount: total,
          advanceAmount: advance,
          dueAmount: due,
        };
      });
  }, [filteredLedger]);

  const recentBookings = useMemo(() => {
    return [...filteredLedger]
      .sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : a.id;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : b.id;
        return timeB - timeA;
      })
      .slice(0, 12);
  }, [filteredLedger]);

  // Date Navigation Handlers (supports Daily, Monthly, and Yearly)
  const handlePrevDate = () => {
    if (viewMode === "daily") {
      setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1));
    } else if (viewMode === "monthly") {
      setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else {
      setSelectedDate((prev) => new Date(prev.getFullYear() - 1, prev.getMonth(), 1));
    }
  };

  const handleNextDate = () => {
    if (viewMode === "daily") {
      setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1));
    } else if (viewMode === "monthly") {
      setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    } else {
      setSelectedDate((prev) => new Date(prev.getFullYear() + 1, prev.getMonth(), 1));
    }
  };

  // Quick Action handlers for requests inside modal
  const handleAcceptRequest = async (req: BookingRequestRecord) => {
    if (!token) return;
    setActionBusyId(req.id);
    setModalFeedback(null);
    try {
      const updated = await updateBookingRequestStatus(req.id, "Accepted", token);
      if (updated) {
        setRequests((prev) => prev.map((item) => (item.id === req.id ? updated : item)));
      }

      // If it is an offline enquiry from owner_booking_requests, ensure offline ledger sync
      if (req.requestSource?.toLowerCase() === "offline") {
        const defaultUnitId = dashboard?.units?.[0]?.id || 1;
        await createProtectedLedgerEntry(token, {
          customer_name: req.guestName,
          check_in: req.checkIn,
          check_out: req.checkOut,
          persons: req.guestsCount,
          unit_id: req.villaUnitId || defaultUnitId,
          amount: req.totalAmount,
          payment_mode: "offline",
          note: `Accepted Request #${req.id}: ${req.notes || ""}`,
        }).catch(() => undefined);
      }

      setModalFeedback({ type: "success", text: `Booking request from ${req.guestName} accepted!` });
      await loadAll();
    } catch (err) {
      setModalFeedback({ type: "error", text: err instanceof Error ? err.message : "Failed to accept request." });
    } finally {
      setActionBusyId(null);
    }
  };

  const handleRejectRequest = async (req: BookingRequestRecord) => {
    if (!token) return;
    setActionBusyId(req.id);
    setModalFeedback(null);
    try {
      const updated = await updateBookingRequestStatus(req.id, "Rejected", token);
      if (updated) {
        setRequests((prev) => prev.map((item) => (item.id === req.id ? updated : item)));
      }
      setModalFeedback({ type: "success", text: `Request #${req.id} rejected.` });
      await loadAll();
    } catch (err) {
      setModalFeedback({ type: "error", text: err instanceof Error ? err.message : "Failed to reject request." });
    } finally {
      setActionBusyId(null);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedBookingDetail(null);
    setModalFeedback(null);
  };

  const openBookingDetail = (entry: OwnerLedgerEntry) => {
    setSelectedBookingDetail(entry);
    setActiveModal("booking_detail");
  };

  // Calendar Picker Grid Calculation
  const calYear = calendarCursor.getFullYear();
  const calMonth = calendarCursor.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const startDayOfWeek = new Date(calYear, calMonth, 1).getDay(); // 0 = Sun

  const calendarMatrix = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [daysInMonth, startDayOfWeek]);

  const selectedUnitName = useMemo(() => {
    const activeId = selectedUnitId || dashboard?.units?.[0]?.id;
    if (!activeId) return "Select Villa Unit";
    return dashboard?.units?.find((u) => u.id === activeId)?.name || dashboard?.units?.[0]?.name || "Selected Unit";
  }, [dashboard?.units, selectedUnitId]);

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]}
    >
      <View style={[styles.container, isWide && styles.containerWide]}>
        {/* Top Header / Welcome Banner with Controls */}
        <View style={[styles.welcomeBanner, isWide && styles.welcomeBannerWide]}>
          {/* Top Row: Welcome Info & Action Buttons */}
          <View style={[styles.welcomeTopRow, isWide && styles.welcomeTopRowWide]}>
            <View style={styles.welcomeLeft}>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Sparkles size={11} color={colors.gold} />
                  <Text style={styles.badgeText}>OPERATIONS COCKPIT</Text>
                </View>
                <View style={[styles.badge, styles.liveBadge]}>
                  <View style={styles.greenDot} />
                  <Text style={styles.liveBadgeText}>Property Online</Text>
                </View>
              </View>

              <Text style={[styles.welcomeTitle, isWide && styles.welcomeTitleWide]}>
                Welcome, <Text style={styles.goldText}>{dashboard?.owner?.name || "BookStayX Developer"}</Text>
              </Text>
              <Text style={styles.welcomeSubtitle}>
                {dashboard?.property?.title || "BookStayX Luxury Villa"} &bull; {dashboard?.property?.location || "Maharashtra"}
              </Text>
            </View>

            {/* Top Action Controls: 3 Revenue Cards (Today's, Monthly, Yearly) + Manage Calendar + Refresh */}
            <View style={[styles.topActionsGroup, isWide && styles.topActionsGroupWide]}>
              {/* 3 Revenue Display Cards Row */}
              <View style={styles.revenueCardsRow}>
                {/* 1. Today's Revenue Card */}
                <View style={styles.headerRevenueCard}>
                  <View style={styles.headerRevenueTop}>
                    <Wallet size={12} color={colors.gold} />
                    <Text style={styles.headerRevenueLabel}>Today's Revenue</Text>
                  </View>
                  <Text style={styles.headerRevenueValue}>{money(todayRevenue)}</Text>
                  <Text style={styles.headerRevenueSub}>Today's earnings</Text>
                </View>

                {/* 2. Monthly Revenue Card */}
                <View style={styles.headerRevenueCard}>
                  <View style={styles.headerRevenueTop}>
                    <Calendar size={12} color="#38BDF8" />
                    <Text style={styles.headerRevenueLabel}>Monthly Revenue</Text>
                  </View>
                  <Text style={[styles.headerRevenueValue, { color: "#38BDF8" }]}>
                    {money(monthlyRevenue)}
                  </Text>
                  <Text style={styles.headerRevenueSub}>{money(monthlyCollected)} collected</Text>
                </View>

                {/* 3. Yearly Revenue Card */}
                <View style={styles.headerRevenueCard}>
                  <View style={styles.headerRevenueTop}>
                    <TrendingUp size={12} color="#34D399" />
                    <Text style={styles.headerRevenueLabel}>Yearly Revenue</Text>
                  </View>
                  <Text style={[styles.headerRevenueValue, { color: "#34D399" }]}>
                    {money(yearlyRevenue)}
                  </Text>
                  <Text style={styles.headerRevenueSub}>{money(yearlyCollected)} collected</Text>
                </View>
              </View>

              {/* Action Buttons: Manage Calendar + Refresh */}
              <View style={styles.ctaBtnsRow}>
                {/* Manage Calendar Button */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/owner/calendar" as Href)}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.actionBtnGold,
                    pressed && styles.pressed,
                    Platform.select({ web: { cursor: "pointer", outlineStyle: "none" } as any, default: {} }),
                  ]}
                >
                  <CalendarDays size={15} color="#120e06" strokeWidth={2.2} />
                  <Text style={styles.actionBtnGoldText}>Manage Calendar</Text>
                </Pressable>

                {/* Refresh Button */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void loadAll()}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.actionBtnSecondary,
                    pressed && styles.pressed,
                    Platform.select({ web: { cursor: "pointer", outlineStyle: "none" } as any, default: {} }),
                  ]}
                >
                  <RefreshCw size={14} color={colors.textSecondary} />
                  <Text style={styles.actionBtnSecondaryText}>Refresh</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* ── TOOLBAR / CONTROL SECTION ── */}
          <View style={[styles.dashboardToolbar, isWide && styles.dashboardToolbarWide]}>
            {/* Left Toolbar Group: Villa Unit Selector & Daily/Monthly/Yearly Toggle */}
            <View style={styles.toolbarLeftGroup}>
              {/* Villa Unit Selector Button */}
              <Pressable
                accessibilityRole="button"
                onPress={() => setUnitPickerModalOpen(true)}
                style={({ pressed }) => [
                  styles.toolbarSelectorBtn,
                  pressed && styles.pressed,
                  Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                ]}
              >
                <Building2 size={14} color={colors.gold} />
                <View style={styles.toolbarSelectorTextWrap}>
                  <Text style={styles.toolbarSelectorLabel}>Villa Unit</Text>
                  <Text numberOfLines={1} style={styles.toolbarSelectorValue}>
                    {selectedUnitName}
                  </Text>
                </View>
                <ChevronDown size={13} color={colors.textSecondary} />
              </Pressable>

              {/* Daily vs Monthly vs Yearly Toggle */}
              <View style={styles.viewModeSegment}>
                <Pressable
                  onPress={() => setViewMode("daily")}
                  style={[
                    styles.viewModeBtn,
                    viewMode === "daily" && styles.viewModeBtnActive,
                    Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                  ]}
                >
                  <Text
                    style={[
                      styles.viewModeBtnText,
                      viewMode === "daily" && styles.viewModeBtnTextActive,
                    ]}
                  >
                    Daily
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setViewMode("monthly")}
                  style={[
                    styles.viewModeBtn,
                    viewMode === "monthly" && styles.viewModeBtnActive,
                    Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                  ]}
                >
                  <Text
                    style={[
                      styles.viewModeBtnText,
                      viewMode === "monthly" && styles.viewModeBtnTextActive,
                    ]}
                  >
                    Monthly
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setViewMode("yearly")}
                  style={[
                    styles.viewModeBtn,
                    viewMode === "yearly" && styles.viewModeBtnActive,
                    Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                  ]}
                >
                  <Text
                    style={[
                      styles.viewModeBtnText,
                      viewMode === "yearly" && styles.viewModeBtnTextActive,
                    ]}
                  >
                    Yearly
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Right Toolbar Group: Date Selector, Navigator & Quick Reset */}
            <View style={styles.toolbarRightGroup}>
              {/* Prev Date Button */}
              <Pressable
                accessibilityRole="button"
                onPress={handlePrevDate}
                style={({ pressed }) => [
                  styles.dateNavArrowBtn,
                  pressed && styles.pressed,
                  Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                ]}
              >
                <ChevronLeft size={16} color={colors.textSecondary} />
              </Pressable>

              {/* Date / Month / Year Picker Trigger */}
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setCalendarCursor(new Date(selectedDate));
                  setDatePickerModalOpen(true);
                }}
                style={({ pressed }) => [
                  styles.datePickerTriggerBtn,
                  pressed && styles.pressed,
                  Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                ]}
              >
                <Calendar size={14} color={colors.gold} />
                <Text style={styles.datePickerTriggerText}>
                  {viewMode === "daily"
                    ? isSelectedDateToday
                      ? `${formatDateString(selectedDate)} (Today)`
                      : formatDateString(selectedDate)
                    : viewMode === "monthly"
                    ? formatMonthString(selectedDate)
                    : `Year ${selectedYear}`}
                </Text>
                <ChevronDown size={13} color={colors.textSecondary} />
              </Pressable>

              {/* Next Date Button */}
              <Pressable
                accessibilityRole="button"
                onPress={handleNextDate}
                style={({ pressed }) => [
                  styles.dateNavArrowBtn,
                  pressed && styles.pressed,
                  Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                ]}
              >
                <ChevronRight size={16} color={colors.textSecondary} />
              </Pressable>

              {/* Quick Jump: Today / Current Month / Current Year */}
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedDate(new Date())}
                style={({ pressed }) => [
                  styles.todayQuickBtn,
                  (viewMode === "daily"
                    ? isSelectedDateToday
                    : viewMode === "monthly"
                    ? isSelectedMonthCurrent
                    : isSelectedYearCurrent) && styles.todayQuickBtnActive,
                  pressed && styles.pressed,
                  Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                ]}
              >
                <Text
                  style={[
                    styles.todayQuickBtnText,
                    (viewMode === "daily"
                      ? isSelectedDateToday
                      : viewMode === "monthly"
                      ? isSelectedMonthCurrent
                      : isSelectedYearCurrent) && styles.todayQuickBtnTextActive,
                  ]}
                >
                  {viewMode === "daily" ? "Today" : viewMode === "monthly" ? "Current Month" : "Current Year"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <CircleAlert size={16} color="#F87171" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={styles.loadingText}>Syncing live property metrics...</Text>
          </View>
        ) : (
          <>
            {/* 1. KEY OPERATIONAL METRICS (FIRST ROW - 4 CLICKABLE CARDS) */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionEyebrow}>LIVE PERFORMANCE &bull; {selectedUnitName.toUpperCase()}</Text>
                <Text style={styles.sectionTitle}>
                  {viewMode === "daily"
                    ? `Operational Metrics (${formatDateString(selectedDate)})`
                    : viewMode === "monthly"
                    ? `Monthly Metrics (${formatMonthString(selectedDate)})`
                    : `Yearly Metrics (${selectedYear})`}
                </Text>
              </View>

              <View style={[styles.kpiGrid, isWide && styles.kpiGridWide]}>
                {/* 1. Check-ins Card */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setActiveModal("checkins")}
                  style={({ pressed }) => [
                    styles.kpiCard,
                    isWide && styles.kpiCardWide,
                    pressed && styles.pressed,
                    Platform.select({ web: { cursor: "pointer", outlineStyle: "none" } as any, default: {} }),
                  ]}
                >
                  <View style={styles.kpiTop}>
                    <Text style={styles.kpiLabel}>
                      {viewMode === "daily"
                        ? isSelectedDateToday
                          ? "Today's Check-ins"
                          : "Check-ins"
                        : viewMode === "monthly"
                        ? "Month Check-ins"
                        : "Year Check-ins"}
                    </Text>
                    <View style={[styles.kpiIconWrap, { backgroundColor: "rgba(52, 211, 153, 0.12)" }]}>
                      <DoorOpen size={18} color="#34D399" />
                    </View>
                  </View>
                  <Text style={styles.kpiValue}>{activeCheckIns.length}</Text>
                  <View style={styles.kpiBottomRow}>
                    <Text style={styles.kpiSub}>
                      {activeCheckIns.length > 0
                        ? `${activeCheckIns.length} arriving guests`
                        : "No check-ins scheduled"}
                    </Text>
                    <ArrowUpRight size={13} color={colors.gold} />
                  </View>
                </Pressable>

                {/* 2. Check-outs Card */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setActiveModal("checkouts")}
                  style={({ pressed }) => [
                    styles.kpiCard,
                    isWide && styles.kpiCardWide,
                    pressed && styles.pressed,
                    Platform.select({ web: { cursor: "pointer", outlineStyle: "none" } as any, default: {} }),
                  ]}
                >
                  <View style={styles.kpiTop}>
                    <Text style={styles.kpiLabel}>
                      {viewMode === "daily"
                        ? isSelectedDateToday
                          ? "Today's Check-outs"
                          : "Check-outs"
                        : viewMode === "monthly"
                        ? "Month Check-outs"
                        : "Year Check-outs"}
                    </Text>
                    <View style={[styles.kpiIconWrap, { backgroundColor: "rgba(239, 68, 68, 0.12)" }]}>
                      <DoorClosed size={18} color="#F87171" />
                    </View>
                  </View>
                  <Text style={styles.kpiValue}>{activeCheckOuts.length}</Text>
                  <View style={styles.kpiBottomRow}>
                    <Text style={styles.kpiSub}>
                      {activeCheckOuts.length > 0
                        ? `${activeCheckOuts.length} departures scheduled`
                        : "No departures scheduled"}
                    </Text>
                    <ArrowUpRight size={13} color={colors.gold} />
                  </View>
                </Pressable>

                {/* 3. Pending Booking Requests */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setActiveModal("requests")}
                  style={({ pressed }) => [
                    styles.kpiCard,
                    isWide && styles.kpiCardWide,
                    pressed && styles.pressed,
                    Platform.select({ web: { cursor: "pointer", outlineStyle: "none" } as any, default: {} }),
                  ]}
                >
                  <View style={styles.kpiTop}>
                    <Text style={styles.kpiLabel}>Pending Booking Requests</Text>
                    <View style={[styles.kpiIconWrap, { backgroundColor: "rgba(224, 184, 74, 0.14)" }]}>
                      <Clock size={18} color={colors.gold} />
                    </View>
                  </View>
                  <Text style={[styles.kpiValue, pendingRequestsCount > 0 && { color: colors.gold }]}>
                    {pendingRequestsCount}
                  </Text>
                  <View style={styles.kpiBottomRow}>
                    <Text style={styles.kpiSub}>
                      {pendingRequestsCount > 0 ? `${pendingRequestsCount} new enquiries` : "All requests handled"}
                    </Text>
                    <ArrowUpRight size={13} color={colors.gold} />
                  </View>
                </Pressable>

                {/* 4. Accepted Booking Requests */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setActiveModal("accepted_requests")}
                  style={({ pressed }) => [
                    styles.kpiCard,
                    isWide && styles.kpiCardWide,
                    pressed && styles.pressed,
                    Platform.select({ web: { cursor: "pointer", outlineStyle: "none" } as any, default: {} }),
                  ]}
                >
                  <View style={styles.kpiTop}>
                    <Text style={styles.kpiLabel}>Accepted Booking Requests</Text>
                    <View style={[styles.kpiIconWrap, { backgroundColor: "rgba(52, 211, 153, 0.14)" }]}>
                      <CheckCircle2 size={18} color="#34D399" />
                    </View>
                  </View>
                  <Text style={[styles.kpiValue, acceptedRequestsCount > 0 && { color: colors.gold }]}>
                    {acceptedRequestsCount}
                  </Text>
                  <View style={styles.kpiBottomRow}>
                    <Text style={styles.kpiSub}>
                      {acceptedRequestsCount > 0
                        ? `${acceptedRequestsCount} request${acceptedRequestsCount === 1 ? "" : "s"} accepted`
                        : "No accepted requests yet"}
                    </Text>
                    <ArrowUpRight size={13} color={colors.gold} />
                  </View>
                </Pressable>
              </View>
            </View>

            {/* 2. TOP DUAL GRID: PENDING BOOKINGS & UPCOMING CHECK-INS */}
            <View style={[styles.dualGrid, isWide && styles.dualGridWide]}>
              {/* Pending Bookings Panel (Left) */}
              <View style={[styles.panel, isWide && styles.panelWide]}>
                <Pressable
                  onPress={() => setActiveModal("requests")}
                  style={styles.panelHeader}
                >
                  <View style={styles.panelTitleRow}>
                    <Clock size={18} color={colors.gold} />
                    <Text style={styles.panelTitle}>Pending Bookings</Text>
                  </View>
                  <Pressable
                    onPress={() => setActiveModal("requests")}
                    style={({ pressed }) => [
                      styles.viewAllBtn,
                      pressed && styles.pressed,
                      Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                    ]}
                  >
                    <Text style={styles.viewAllText}>View All ({pendingRequestsList.length})</Text>
                    <ArrowRight size={13} color={colors.gold} />
                  </Pressable>
                </Pressable>

                {pendingRequestsList.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <CheckCircle2 size={28} color="#34D399" />
                    <Text style={styles.emptyTitle}>No pending booking requests</Text>
                    <Text style={styles.emptySub}>New bookings & enquiries requiring confirmation will appear here.</Text>
                  </View>
                ) : (
                  <View style={styles.bookingList}>
                    {pendingRequestsList.slice(0, 5).map((req, idx) => {
                      const amount = Number(req.totalAmount || 0);
                      const isBusy = actionBusyId === req.id;
                      const checkIn = String(req.checkIn || "").split("T")[0];
                      const checkOut = String(req.checkOut || "").split("T")[0];
                      return (
                        <View
                          key={`pending-${req.id}-${idx}`}
                          style={styles.pendingCardWrapper}
                        >
                          <Pressable
                            onPress={() => setActiveModal("requests")}
                            style={({ pressed }) => [
                              styles.bookingCard,
                              { borderColor: "rgba(245, 158, 11, 0.35)", backgroundColor: "rgba(245, 158, 11, 0.04)" },
                              pressed && styles.pressed,
                              Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                            ]}
                          >
                            <View style={styles.bookingCardLeft}>
                              <View style={[styles.guestAvatarCircle, { backgroundColor: "rgba(245, 158, 11, 0.15)", borderColor: "rgba(245, 158, 11, 0.35)" }]}>
                                <User size={14} color="#F59E0B" />
                              </View>
                              <View style={styles.bookingMeta}>
                                <Text numberOfLines={1} style={styles.guestName}>
                                  {req.guestName || "Guest Request"}
                                </Text>
                                <Text style={styles.stayDates}>
                                  {checkIn} &rarr; {checkOut} &bull; {req.villaUnitName || "Unit"} &bull; {req.guestsCount || 1} Guests
                                </Text>
                              </View>
                            </View>

                            <View style={styles.bookingCardRight}>
                              <Text style={[styles.bookingAmount, { color: colors.gold }]}>{money(amount)}</Text>
                              <View style={[styles.statusTag, { backgroundColor: "rgba(245, 158, 11, 0.15)", borderColor: "rgba(245, 158, 11, 0.4)" }]}>
                                <Text style={{ color: "#F59E0B", fontFamily: fontFamilies.sansBold, fontSize: 9.5 }}>
                                  Pending
                                </Text>
                              </View>
                            </View>
                          </Pressable>

                          {/* Quick Actions */}
                          <View style={styles.pendingQuickActions}>
                            <Pressable
                              disabled={isBusy}
                              onPress={() => void handleAcceptRequest(req)}
                              style={({ pressed }) => [
                                styles.quickAcceptBtn,
                                pressed && styles.pressed,
                                isBusy && styles.disabledBtn,
                              ]}
                            >
                              {isBusy ? (
                                <ActivityIndicator size="small" color="#120e06" />
                              ) : (
                                <>
                                  <Check size={12} color="#120e06" strokeWidth={2.4} />
                                  <Text style={styles.quickAcceptBtnText}>Accept</Text>
                                </>
                              )}
                            </Pressable>

                            <Pressable
                              disabled={isBusy}
                              onPress={() => void handleRejectRequest(req)}
                              style={({ pressed }) => [
                                styles.quickRejectBtn,
                                pressed && styles.pressed,
                                isBusy && styles.disabledBtn,
                              ]}
                            >
                              <X size={12} color="#F87171" />
                              <Text style={styles.quickRejectBtnText}>Decline</Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Recent Reservations Panel (Right) */}
              <View style={[styles.panel, isWide && styles.panelWide]}>
                <Pressable
                  onPress={() => setActiveModal("recent_reservations")}
                  style={styles.panelHeader}
                >
                  <View style={styles.panelTitleRow}>
                    <CalendarCheck2 size={18} color={colors.gold} />
                    <Text style={styles.panelTitle}>Recent Reservations</Text>
                  </View>
                  <Pressable
                    onPress={() => setActiveModal("recent_reservations")}
                    style={({ pressed }) => [
                      styles.viewAllBtn,
                      pressed && styles.pressed,
                      Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                    ]}
                  >
                    <Text style={styles.viewAllText}>View All ({recentBookings.length})</Text>
                    <ArrowRight size={13} color={colors.gold} />
                  </Pressable>
                </Pressable>

                {recentBookings.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <CalendarDays size={28} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>No reservations for this selection</Text>
                    <Text style={styles.emptySub}>Guest stays will automatically appear here.</Text>
                  </View>
                ) : (
                  <View style={styles.bookingList}>
                    {recentBookings.slice(0, 5).map((b, idx) => {
                      const amount = Number(b.amount || b.total_amount || 0);
                      const isOffline = b.source === "offline";
                      const checkIn = String(b.check_in || "").split("T")[0];
                      const checkOut = String(b.check_out || "").split("T")[0];
                      const statusLower = String(b.booking_status || "").toLowerCase();
                      const isCancelled = ["cancelled", "cancelled_by_owner", "owner_cancelled", "rejected", "deleted"].includes(statusLower);

                      return (
                        <Pressable
                          key={`recent-${b.id}-${idx}`}
                          onPress={() => openBookingDetail(b)}
                          style={({ pressed }) => [
                            styles.bookingCard,
                            isCancelled && { borderColor: "rgba(239, 68, 68, 0.35)", opacity: 0.8 },
                            pressed && styles.pressed,
                            Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                          ]}
                        >
                          <View style={styles.bookingCardLeft}>
                            <View style={[styles.guestAvatarCircle, isCancelled && { backgroundColor: "rgba(239, 68, 68, 0.12)", borderColor: "rgba(239, 68, 68, 0.35)" }]}>
                              <User size={14} color={isCancelled ? "#EF4444" : colors.gold} />
                            </View>
                            <View style={styles.bookingMeta}>
                              <Text numberOfLines={1} style={[styles.guestName, isCancelled && { color: colors.textSecondary }]}>
                                {b.customer_name || "Guest Stay"}
                              </Text>
                              <Text style={styles.stayDates}>
                                {checkIn} &rarr; {checkOut} &bull; {b.unit_name || "Villa"}
                              </Text>
                              {b.source === "website" && b.booking_id ? (
                                <Text style={styles.dashboardTicketId}>TICKET ID: {ticketIdForDisplay(b.ticket_id, b.booking_id)}</Text>
                              ) : null}
                            </View>
                          </View>

                          <View style={styles.bookingCardRight}>
                            <Text style={[styles.bookingAmount, isCancelled && { color: colors.textMuted, textDecorationLine: "line-through" }]}>
                              {money(amount)}
                            </Text>
                            <View style={[styles.statusTag, isCancelled ? { backgroundColor: "rgba(239, 68, 68, 0.12)", borderColor: "rgba(239, 68, 68, 0.35)" } : isOffline ? styles.offlineTag : styles.onlineTag]}>
                              <Text style={isCancelled ? { color: "#F87171", fontFamily: fontFamilies.sansBold, fontSize: 9.5 } : isOffline ? styles.offlineTagText : styles.onlineTagText}>
                                {isCancelled ? "Cancelled" : isOffline ? "Offline" : "Website"}
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>

            {/* 3. UPCOMING CHECK-INS (BELOW THE TWO TOP CARDS) */}
            <View style={[styles.panel, { width: "100%", marginTop: 14 }]}>
              <Pressable
                onPress={() => setActiveModal("upcoming_checkins")}
                style={styles.panelHeader}
              >
                <View style={styles.panelTitleRow}>
                  <DoorOpen size={18} color={colors.gold} />
                  <Text style={styles.panelTitle}>Upcoming Check-ins</Text>
                </View>
                <Pressable
                  onPress={() => setActiveModal("upcoming_checkins")}
                  style={({ pressed }) => [
                    styles.viewAllBtn,
                    pressed && styles.pressed,
                    Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                  ]}
                >
                  <Text style={styles.viewAllText}>View All ({upcomingBookings.length})</Text>
                  <ArrowRight size={13} color={colors.gold} />
                </Pressable>
              </Pressable>

              {upcomingBookings.length === 0 ? (
                <View style={styles.emptyCard}>
                  <DoorOpen size={28} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>No upcoming check-ins scheduled</Text>
                  <Text style={styles.emptySub}>All confirmed upcoming arrivals will be listed here.</Text>
                </View>
              ) : (
                <View style={[styles.bookingList, isWide && { flexDirection: "row", flexWrap: "wrap", gap: 12 }]}>
                  {upcomingBookings.slice(0, 6).map((b, idx) => {
                    const checkIn = String(b.check_in || "").split("T")[0] || "";
                    return (
                      <Pressable
                        key={`up-${b.id}-${idx}`}
                        onPress={() => openBookingDetail(b)}
                        style={({ pressed }) => [
                          styles.upcomingRow,
                          isWide && { width: "49%" },
                          pressed && styles.pressed,
                          Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                        ]}
                      >
                        <View style={styles.upcomingDateBadge}>
                          <Text style={styles.upcomingDateDay}>{checkIn.split("-")[2] || "01"}</Text>
                          <Text style={styles.upcomingDateMonth}>
                            {new Date(checkIn || Date.now()).toLocaleString("en-US", { month: "short" }).toUpperCase()}
                          </Text>
                        </View>

                        <View style={styles.upcomingInfo}>
                          <Text numberOfLines={1} style={styles.upcomingGuest}>
                            {b.customer_name || "Guest"}
                          </Text>
                          <Text style={styles.upcomingUnit}>
                            {b.unit_name || "Villa Unit"} &bull; {b.persons || 2} Guests
                          </Text>
                          {b.source === "website" && b.booking_id ? (
                            <Text style={styles.dashboardTicketId}>TICKET ID: {ticketIdForDisplay(b.ticket_id, b.booking_id)}</Text>
                          ) : null}
                        </View>

                        <View style={styles.upcomingStatus}>
                          <CheckCircle2 size={15} color="#34D399" />
                          <Text style={styles.upcomingConfirmed}>Confirmed</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}
      </View>

      {/* ========================================================================= */}
      {/* MODAL 0A: VILLA UNIT PICKER POPUP */}
      {/* ========================================================================= */}
      <Modal
        visible={unitPickerModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setUnitPickerModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isWide && styles.modalCardWide, { maxWidth: 480 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalIconWrap, { backgroundColor: "rgba(224, 184, 74, 0.14)" }]}>
                  <Building2 size={18} color={colors.gold} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Select Villa Unit</Text>
                  <Text style={styles.modalSubtitle}>Filter dashboard metrics by specific unit</Text>
                </View>
              </View>
              <Pressable
                onPress={() => setUnitPickerModalOpen(false)}
                style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.pressed]}
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.unitList}>
                {dashboard?.units && dashboard.units.length > 0 ? (
                  dashboard.units.map((u) => {
                    const isSelected = (selectedUnitId || dashboard.units?.[0]?.id) === u.id;
                    return (
                      <Pressable
                        key={`unit-${u.id}`}
                        onPress={() => {
                          setSelectedUnitId(u.id);
                          setUnitPickerModalOpen(false);
                        }}
                        style={({ pressed }) => [
                          styles.unitItemCard,
                          isSelected && styles.unitItemCardActive,
                          pressed && styles.pressed,
                          Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                        ]}
                      >
                        <View style={styles.unitItemLeft}>
                          <Building2 size={16} color={isSelected ? colors.gold : colors.textSecondary} />
                          <View>
                            <Text style={[styles.unitItemTitle, isSelected && { color: colors.gold }]}>
                              {u.name}
                            </Text>
                            <Text style={styles.unitItemSub}>
                              Capacity: {u.total_persons || u.available_persons || 4} Guests &bull; ID: #{u.id}
                            </Text>
                          </View>
                        </View>
                        {isSelected ? <Check size={16} color={colors.gold} /> : null}
                      </Pressable>
                    );
                  })
                ) : (
                  <View style={styles.modalEmptyBox}>
                    <Building2 size={36} color={colors.textMuted} />
                    <Text style={styles.modalEmptyTitle}>No Villa Units Found</Text>
                    <Text style={styles.modalEmptySub}>Create your first villa unit to get started.</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Modal Footer with Add Unit Action */}
            <View style={styles.modalFooter}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setUnitPickerModalOpen(false);
                  router.push("/owner/units" as Href);
                }}
                style={({ pressed }) => [
                  styles.addUnitModalBtn,
                  pressed && styles.pressed,
                  Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                ]}
              >
                <Plus size={15} color="#120e06" strokeWidth={2.4} />
                <Text style={styles.addUnitModalBtnText}>Add Unit</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => setUnitPickerModalOpen(false)}
                style={({ pressed }) => [
                  styles.modalPrimaryBtn,
                  pressed && styles.pressed,
                  Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                ]}
              >
                <Text style={styles.modalPrimaryBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 0B: CALENDAR DATE / MONTH / YEAR PICKER POPUP */}
      {/* ========================================================================= */}
      <Modal
        visible={datePickerModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDatePickerModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isWide && styles.modalCardWide, { maxWidth: 460 }]}>
            {/* Calendar Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalIconWrap, { backgroundColor: "rgba(224, 184, 74, 0.14)" }]}>
                  <Calendar size={18} color={colors.gold} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    {viewMode === "daily" ? "Select Date" : viewMode === "monthly" ? "Select Month" : "Select Year"}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {viewMode === "daily"
                      ? "Pick a date to inspect operational data"
                      : viewMode === "monthly"
                      ? "Pick a month for monthly metrics"
                      : "Pick a year for annual metrics"}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setDatePickerModalOpen(false)}
                style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.pressed]}
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* YEARLY PICKER VIEW */}
            {viewMode === "yearly" ? (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.yearGrid}>
                  {[selectedYear - 2, selectedYear - 1, selectedYear, selectedYear + 1, selectedYear + 2].map((yr) => {
                    const isYrSelected = yr === selectedYear;
                    const isYrCurrent = yr === today.getFullYear();
                    return (
                      <Pressable
                        key={`year-${yr}`}
                        onPress={() => {
                          setSelectedDate(new Date(yr, 0, 1));
                          setDatePickerModalOpen(false);
                        }}
                        style={({ pressed }) => [
                          styles.yearGridCard,
                          isYrSelected && styles.yearGridCardSelected,
                          isYrCurrent && !isYrSelected && styles.yearGridCardCurrent,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.yearGridText,
                            isYrSelected && styles.yearGridTextSelected,
                            isYrCurrent && !isYrSelected && styles.yearGridTextCurrent,
                          ]}
                        >
                          {yr}
                        </Text>
                        {isYrCurrent ? (
                          <Text style={[styles.yearGridSub, isYrSelected && { color: "#120e06" }]}>
                            Current Year
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            ) : viewMode === "monthly" ? (
              /* MONTHLY PICKER VIEW (12 Months Grid) */
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.calNavRow}>
                  <Pressable
                    onPress={() => setCalendarCursor(new Date(calYear - 1, calMonth, 1))}
                    style={({ pressed }) => [styles.calNavArrow, pressed && styles.pressed]}
                  >
                    <ChevronLeft size={18} color={colors.gold} />
                  </Pressable>
                  <Text style={styles.calNavTitle}>{calYear}</Text>
                  <Pressable
                    onPress={() => setCalendarCursor(new Date(calYear + 1, calMonth, 1))}
                    style={({ pressed }) => [styles.calNavArrow, pressed && styles.pressed]}
                  >
                    <ChevronRight size={18} color={colors.gold} />
                  </Pressable>
                </View>

                <View style={styles.monthGrid}>
                  {MONTH_NAMES.map((mName, mIdx) => {
                    const isMSelected = selectedYear === calYear && selectedMonth === mIdx + 1;
                    const isMCurrent = today.getFullYear() === calYear && today.getMonth() === mIdx;
                    return (
                      <Pressable
                        key={mName}
                        onPress={() => {
                          setSelectedDate(new Date(calYear, mIdx, 1));
                          setDatePickerModalOpen(false);
                        }}
                        style={({ pressed }) => [
                          styles.monthGridCell,
                          isMSelected && styles.monthGridCellSelected,
                          isMCurrent && !isMSelected && styles.monthGridCellCurrent,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.monthGridCellText,
                            isMSelected && styles.monthGridCellTextSelected,
                            isMCurrent && !isMSelected && styles.monthGridCellTextCurrent,
                          ]}
                        >
                          {mName.slice(0, 3)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            ) : (
              /* DAILY PICKER VIEW (Full Calendar Grid) */
              <View>
                {/* Calendar Month Navigation Header */}
                <View style={styles.calNavRow}>
                  <Pressable
                    onPress={() => setCalendarCursor(new Date(calYear, calMonth - 1, 1))}
                    style={({ pressed }) => [styles.calNavArrow, pressed && styles.pressed]}
                  >
                    <ChevronLeft size={18} color={colors.gold} />
                  </Pressable>

                  <Text style={styles.calNavTitle}>{formatMonthString(calendarCursor)}</Text>

                  <Pressable
                    onPress={() => setCalendarCursor(new Date(calYear, calMonth + 1, 1))}
                    style={({ pressed }) => [styles.calNavArrow, pressed && styles.pressed]}
                  >
                    <ChevronRight size={18} color={colors.gold} />
                  </Pressable>
                </View>

                {/* Days Grid (Sun-Sat) */}
                <View style={styles.calWeekdayRow}>
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                    <Text key={d} style={styles.calWeekdayText}>
                      {d}
                    </Text>
                  ))}
                </View>

                <View style={styles.calGrid}>
                  {calendarMatrix.map((dayNum, idx) => {
                    if (dayNum === null) {
                      return <View key={`blank-${idx}`} style={styles.calCellEmpty} />;
                    }
                    const cellDate = new Date(calYear, calMonth, dayNum);
                    const cellDateIso = localDateIso(cellDate);
                    const isSelected = selectedDateIso === cellDateIso;
                    const isTodayCell = todayIso === cellDateIso;

                    return (
                      <Pressable
                        key={`day-${dayNum}`}
                        onPress={() => {
                          setSelectedDate(cellDate);
                          setDatePickerModalOpen(false);
                        }}
                        style={({ pressed }) => [
                          styles.calCell,
                          isSelected && styles.calCellSelected,
                          isTodayCell && !isSelected && styles.calCellToday,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.calCellText,
                            isSelected && styles.calCellTextSelected,
                            isTodayCell && !isSelected && styles.calCellTextToday,
                          ]}
                        >
                          {dayNum}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Modal Actions */}
            <View style={styles.calFooterActions}>
              <Pressable
                onPress={() => {
                  setSelectedDate(new Date());
                  setDatePickerModalOpen(false);
                }}
                style={({ pressed }) => [styles.calActionTodayBtn, pressed && styles.pressed]}
              >
                <Text style={styles.calActionTodayBtnText}>
                  {viewMode === "daily" ? "Select Today" : viewMode === "monthly" ? "This Month" : "This Year"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setDatePickerModalOpen(false)}
                style={({ pressed }) => [styles.modalPrimaryBtn, pressed && styles.pressed]}
              >
                <Text style={styles.modalPrimaryBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 1: CHECK-INS POPUP */}
      {/* ========================================================================= */}
      <Modal
        visible={activeModal === "checkins"}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isWide && styles.modalCardWide]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalIconWrap, { backgroundColor: "rgba(52, 211, 153, 0.12)" }]}>
                  <DoorOpen size={18} color="#34D399" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    {viewMode === "daily"
                      ? `Check-ins (${formatDateString(selectedDate)})`
                      : viewMode === "monthly"
                      ? `Month Check-ins (${formatMonthString(selectedDate)})`
                      : `Year Check-ins (${selectedYear})`}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {activeCheckIns.length} guest{activeCheckIns.length === 1 ? "" : "s"} arriving &bull; {selectedUnitName}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={closeModal}
                style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.pressed]}
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {activeCheckIns.length === 0 ? (
                <View style={styles.modalEmptyBox}>
                  <DoorOpen size={36} color={colors.textMuted} />
                  <Text style={styles.modalEmptyTitle}>No Check-ins Scheduled</Text>
                  <Text style={styles.modalEmptySub}>
                    There are no guest arrivals on{" "}
                    {viewMode === "daily"
                      ? formatDateString(selectedDate)
                      : viewMode === "monthly"
                      ? formatMonthString(selectedDate)
                      : selectedYear}
                    .
                  </Text>
                </View>
              ) : (
                <View style={styles.modalItemList}>
                  {activeCheckIns.map((item, idx) => {
                    const amount = Number(item.amount || item.total_amount || 0);
                    const advance = Number(item.advance_amount || 0);
                    const isFullyPaid = advance >= amount;
                    return (
                      <Pressable
                        key={`checkin-${item.id}-${idx}`}
                        onPress={() => openBookingDetail(item)}
                        style={({ pressed }) => [
                          styles.modalItemCard,
                          pressed && styles.pressed,
                          Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                        ]}
                      >
                        <View style={styles.modalItemTop}>
                          <View style={styles.modalItemUserRow}>
                            <View style={styles.guestAvatarCircle}>
                              <User size={15} color={colors.gold} />
                            </View>
                            <View>
                              <Text style={styles.modalItemTitle}>{item.customer_name || "Guest Arrival"}</Text>
                              <Text style={styles.modalItemPhone}>{item.unit_name || "Villa Stay"}</Text>
                            </View>
                          </View>
                          <View style={[styles.statusTag, isFullyPaid ? styles.paidTag : styles.partialTag]}>
                            <Text style={isFullyPaid ? styles.paidTagText : styles.partialTagText}>
                              {isFullyPaid ? "Paid" : `Pending ${money(amount - advance)}`}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.modalDetailGrid}>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Unit</Text>
                            <Text style={styles.modalDetailValue}>{item.unit_name || "Villa Unit"}</Text>
                          </View>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Guests</Text>
                            <Text style={styles.modalDetailValue}>{item.persons || 2} Persons</Text>
                          </View>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Check-out Date</Text>
                            <Text style={styles.modalDetailValue}>{String(item.check_out || "").split("T")[0]}</Text>
                          </View>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Total Tariff</Text>
                            <Text style={[styles.modalDetailValue, { color: colors.gold }]}>{money(amount)}</Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => {
                  closeModal();
                  router.push("/owner/bookings" as Href);
                }}
                style={({ pressed }) => [styles.modalFooterLink, pressed && styles.pressed]}
              >
                <Text style={styles.modalFooterLinkText}>Open Full Bookings Ledger</Text>
                <ExternalLink size={13} color={colors.gold} />
              </Pressable>
              <Pressable
                onPress={closeModal}
                style={({ pressed }) => [styles.modalPrimaryBtn, pressed && styles.pressed]}
              >
                <Text style={styles.modalPrimaryBtnText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: CHECK-OUTS POPUP */}
      {/* ========================================================================= */}
      <Modal
        visible={activeModal === "checkouts"}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isWide && styles.modalCardWide]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalIconWrap, { backgroundColor: "rgba(239, 68, 68, 0.12)" }]}>
                  <DoorClosed size={18} color="#F87171" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    {viewMode === "daily"
                      ? `Check-outs (${formatDateString(selectedDate)})`
                      : viewMode === "monthly"
                      ? `Month Check-outs (${formatMonthString(selectedDate)})`
                      : `Year Check-outs (${selectedYear})`}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {activeCheckOuts.length} departure{activeCheckOuts.length === 1 ? "" : "s"} &bull; {selectedUnitName}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={closeModal}
                style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.pressed]}
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {activeCheckOuts.length === 0 ? (
                <View style={styles.modalEmptyBox}>
                  <DoorClosed size={36} color={colors.textMuted} />
                  <Text style={styles.modalEmptyTitle}>No Departures Scheduled</Text>
                  <Text style={styles.modalEmptySub}>
                    No guests are checking out on{" "}
                    {viewMode === "daily"
                      ? formatDateString(selectedDate)
                      : viewMode === "monthly"
                      ? formatMonthString(selectedDate)
                      : selectedYear}
                    .
                  </Text>
                </View>
              ) : (
                <View style={styles.modalItemList}>
                  {activeCheckOuts.map((item, idx) => {
                    const amount = Number(item.amount || item.total_amount || 0);
                    return (
                      <Pressable
                        key={`checkout-${item.id}-${idx}`}
                        onPress={() => openBookingDetail(item)}
                        style={({ pressed }) => [
                          styles.modalItemCard,
                          pressed && styles.pressed,
                          Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                        ]}
                      >
                        <View style={styles.modalItemTop}>
                          <View style={styles.modalItemUserRow}>
                            <View style={styles.guestAvatarCircle}>
                              <User size={15} color={colors.gold} />
                            </View>
                            <View>
                              <Text style={styles.modalItemTitle}>{item.customer_name || "Departing Guest"}</Text>
                              <Text style={styles.modalItemPhone}>{item.unit_name || "Villa Stay"}</Text>
                            </View>
                          </View>
                          <View style={[styles.statusTag, styles.checkoutReadyTag]}>
                            <Text style={styles.checkoutReadyText}>Turnaround Required</Text>
                          </View>
                        </View>

                        <View style={styles.modalDetailGrid}>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Unit</Text>
                            <Text style={styles.modalDetailValue}>{item.unit_name || "Villa Unit"}</Text>
                          </View>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Stay Period</Text>
                            <Text style={styles.modalDetailValue}>
                              {String(item.check_in || "").split("T")[0]} &rarr; {String(item.check_out || "").split("T")[0]}
                            </Text>
                          </View>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Guests</Text>
                            <Text style={styles.modalDetailValue}>{item.persons || 2} Persons</Text>
                          </View>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Total Settled</Text>
                            <Text style={[styles.modalDetailValue, { color: colors.gold }]}>{money(amount)}</Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => {
                  closeModal();
                  router.push("/owner/staff" as Href);
                }}
                style={({ pressed }) => [styles.modalFooterLink, pressed && styles.pressed]}
              >
                <Text style={styles.modalFooterLinkText}>Assign Housekeeping Staff</Text>
                <ExternalLink size={13} color={colors.gold} />
              </Pressable>
              <Pressable
                onPress={closeModal}
                style={({ pressed }) => [styles.modalPrimaryBtn, pressed && styles.pressed]}
              >
                <Text style={styles.modalPrimaryBtnText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: PENDING REQUESTS POPUP */}
      {/* ========================================================================= */}
      <Modal
        visible={activeModal === "requests"}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isWide && styles.modalCardWide]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalIconWrap, { backgroundColor: "rgba(224, 184, 74, 0.14)" }]}>
                  <Clock size={18} color={colors.gold} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Pending Booking Requests</Text>
                  <Text style={styles.modalSubtitle}>
                    {pendingRequestsCount} new enquir{pendingRequestsCount === 1 ? "y" : "ies"} &bull; {selectedUnitName}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={closeModal}
                style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.pressed]}
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {modalFeedback ? (
              <View
                style={[
                  styles.feedbackBanner,
                  modalFeedback.type === "success" ? styles.successBanner : styles.errorBanner,
                ]}
              >
                {modalFeedback.type === "success" ? (
                  <CheckCircle2 size={15} color="#34D399" />
                ) : (
                  <AlertCircle size={15} color="#F87171" />
                )}
                <Text
                  style={[
                    styles.feedbackText,
                    modalFeedback.type === "success" ? styles.successText : styles.errorText,
                  ]}
                >
                  {modalFeedback.text}
                </Text>
              </View>
            ) : null}

            {/* Modal Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {pendingRequestsList.length === 0 ? (
                <View style={styles.modalEmptyBox}>
                  <CheckCircle2 size={36} color="#34D399" />
                  <Text style={styles.modalEmptyTitle}>All Enquiries Handled</Text>
                  <Text style={styles.modalEmptySub}>
                    There are no pending booking requests right now.
                  </Text>
                </View>
              ) : (
                <View style={styles.modalItemList}>
                  {pendingRequestsList.map((req) => {
                    const isBusy = actionBusyId === req.id;
                    return (
                      <View key={`req-pop-${req.id}`} style={styles.modalItemCard}>
                        <View style={styles.modalItemTop}>
                          <View style={styles.modalItemUserRow}>
                            <View style={styles.guestAvatarCircle}>
                              <User size={15} color={colors.gold} />
                            </View>
                            <View>
                              <Text style={styles.modalItemTitle}>{req.guestName}</Text>
                              <Text style={styles.modalItemPhone}>{req.guestPhone}</Text>
                            </View>
                          </View>
                          <Text style={styles.modalRequestAmount}>{money(req.totalAmount)}</Text>
                        </View>

                        <View style={styles.modalDetailGrid}>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Unit</Text>
                            <Text style={styles.modalDetailValue}>{req.villaUnitName}</Text>
                          </View>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Stay Dates</Text>
                            <Text style={styles.modalDetailValue}>
                              {req.checkIn} &rarr; {req.checkOut}
                            </Text>
                          </View>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Persons</Text>
                            <Text style={styles.modalDetailValue}>{req.guestsCount} Guests</Text>
                          </View>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Enquiry ID</Text>
                            <Text style={styles.modalDetailValue}>#{req.id}</Text>
                          </View>
                        </View>

                        {req.notes ? (
                          <View style={styles.reqNotesBox}>
                            <Text style={styles.reqNotesLabel}>Guest Note: </Text>
                            <Text style={styles.reqNotesText}>{req.notes}</Text>
                          </View>
                        ) : null}

                        {/* Action Buttons */}
                        <View style={styles.modalActionRow}>
                          <Pressable
                            disabled={isBusy}
                            onPress={() => void handleAcceptRequest(req)}
                            style={({ pressed }) => [
                              styles.acceptActionBtn,
                              pressed && styles.pressed,
                              isBusy && styles.disabledBtn,
                            ]}
                          >
                            {isBusy ? (
                              <ActivityIndicator size="small" color="#120e06" />
                            ) : (
                              <>
                                <Check size={14} color="#120e06" strokeWidth={2.4} />
                                <Text style={styles.acceptActionBtnText}>Accept Booking</Text>
                              </>
                            )}
                          </Pressable>

                          <Pressable
                            disabled={isBusy}
                            onPress={() => void handleRejectRequest(req)}
                            style={({ pressed }) => [
                              styles.rejectActionBtn,
                              pressed && styles.pressed,
                              isBusy && styles.disabledBtn,
                            ]}
                          >
                            <X size={14} color="#F87171" />
                            <Text style={styles.rejectActionBtnText}>Decline</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => {
                  closeModal();
                  router.push("/owner/requests" as Href);
                }}
                style={({ pressed }) => [styles.modalFooterLink, pressed && styles.pressed]}
              >
                <Text style={styles.modalFooterLinkText}>Go to Booking Requests Page</Text>
                <ExternalLink size={13} color={colors.gold} />
              </Pressable>
              <Pressable
                onPress={closeModal}
                style={({ pressed }) => [styles.modalPrimaryBtn, pressed && styles.pressed]}
              >
                <Text style={styles.modalPrimaryBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3B: ACCEPTED BOOKING REQUESTS POPUP */}
      {/* ========================================================================= */}
      <Modal
        visible={activeModal === "accepted_requests"}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isWide && styles.modalCardWide]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalIconWrap, { backgroundColor: "rgba(52, 211, 153, 0.14)" }]}>
                  <CheckCircle2 size={18} color="#34D399" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Accepted Booking Requests</Text>
                  <Text style={styles.modalSubtitle}>
                    {acceptedRequestsCount} confirmed request{acceptedRequestsCount === 1 ? "" : "s"} &bull; {selectedUnitName}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={closeModal}
                style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.pressed]}
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {acceptedRequestsList.length === 0 ? (
                <View style={styles.modalEmptyBox}>
                  <CheckCircle2 size={36} color="#34D399" />
                  <Text style={styles.modalEmptyTitle}>No Accepted Requests</Text>
                  <Text style={styles.modalEmptySub}>
                    Accepted booking requests will appear here once confirmed.
                  </Text>
                </View>
              ) : (
                <View style={styles.modalItemList}>
                  {acceptedRequestsList.map((req) => {
                    return (
                      <View key={`acc-req-${req.id}`} style={styles.modalItemCard}>
                        <View style={styles.modalItemTop}>
                          <View style={styles.modalItemUserRow}>
                            <View style={styles.guestAvatarCircle}>
                              <User size={15} color={colors.gold} />
                            </View>
                            <View>
                              <Text style={styles.modalItemTitle}>{req.guestName}</Text>
                              <Text style={styles.modalItemPhone}>{req.guestPhone}</Text>
                            </View>
                          </View>
                          <View style={{ alignItems: "flex-end", gap: 4 }}>
                            <Text style={styles.modalRequestAmount}>{money(req.totalAmount)}</Text>
                            <View style={{ backgroundColor: "rgba(52, 211, 153, 0.15)", borderWidth: 1, borderColor: "rgba(52, 211, 153, 0.3)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                              <Text style={{ fontSize: 10, fontWeight: "700", color: "#34D399", letterSpacing: 0.5 }}>ACCEPTED</Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.modalDetailGrid}>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Unit</Text>
                            <Text style={styles.modalDetailValue}>{req.villaUnitName}</Text>
                          </View>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Stay Dates</Text>
                            <Text style={styles.modalDetailValue}>
                              {req.checkIn} &rarr; {req.checkOut}
                            </Text>
                          </View>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Guests</Text>
                            <Text style={styles.modalDetailValue}>{req.guestsCount} Guests</Text>
                          </View>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Ticket ID</Text>
                            <Text style={[styles.modalDetailValue, { color: colors.gold, fontWeight: "700" }]}>
                              {req.ticketId || `#${req.id}`}
                            </Text>
                          </View>
                        </View>

                        {/* Demographics & Meals */}
                        {(req.maleGuestCount || req.femaleGuestCount || req.vegGuestCount || req.nonVegGuestCount) ? (
                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" }}>
                            {(req.maleGuestCount !== undefined || req.femaleGuestCount !== undefined) && (
                              <View style={{ backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                                  👨 {req.maleGuestCount ?? 0}M • 👩 {req.femaleGuestCount ?? 0}F
                                </Text>
                              </View>
                            )}
                            {(req.vegGuestCount !== undefined || req.nonVegGuestCount !== undefined) && (
                              <View style={{ backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                                  🥗 {req.vegGuestCount ?? 0} Veg • 🍗 {req.nonVegGuestCount ?? 0} Non-Veg
                                </Text>
                              </View>
                            )}
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => {
                  closeModal();
                  router.push("/owner/requests" as Href);
                }}
                style={({ pressed }) => [styles.modalFooterLink, pressed && styles.pressed]}
              >
                <Text style={styles.modalFooterLinkText}>Go to Booking Requests Page</Text>
                <ExternalLink size={13} color={colors.gold} />
              </Pressable>
              <Pressable
                onPress={closeModal}
                style={({ pressed }) => [styles.modalPrimaryBtn, pressed && styles.pressed]}
              >
                <Text style={styles.modalPrimaryBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: PENDING DUES POPUP */}
      {/* ========================================================================= */}
      <Modal
        visible={activeModal === "dues"}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isWide && styles.modalCardWide]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalIconWrap, { backgroundColor: "rgba(245, 158, 11, 0.14)" }]}>
                  <CreditCard size={18} color="#F59E0B" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Pending Dues & Balances</Text>
                  <Text style={styles.modalSubtitle}>
                    Total Outstanding: {money(pendingPayments)} &bull; {pendingDuesList.length} reservation{pendingDuesList.length === 1 ? "" : "s"}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={closeModal}
                style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.pressed]}
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {pendingDuesList.length === 0 ? (
                <View style={styles.modalEmptyBox}>
                  <CheckCircle2 size={36} color="#34D399" />
                  <Text style={styles.modalEmptyTitle}>All Guest Payments Settled</Text>
                  <Text style={styles.modalEmptySub}>
                    There are no pending dues or uncollected balances for this property.
                  </Text>
                </View>
              ) : (
                <View style={styles.modalItemList}>
                  {pendingDuesList.map((item, idx) => {
                    const checkIn = String(item.check_in || "").split("T")[0];
                    const checkOut = String(item.check_out || "").split("T")[0];
                    return (
                      <Pressable
                        key={`due-${item.id}-${idx}`}
                        onPress={() => openBookingDetail(item)}
                        style={({ pressed }) => [
                          styles.modalItemCard,
                          pressed && styles.pressed,
                          Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                        ]}
                      >
                        <View style={styles.modalItemTop}>
                          <View style={styles.modalItemUserRow}>
                            <View style={styles.guestAvatarCircle}>
                              <User size={15} color={colors.gold} />
                            </View>
                            <View>
                              <Text style={styles.modalItemTitle}>{item.customer_name || "Guest Booking"}</Text>
                              <Text style={styles.modalItemPhone}>{item.unit_name || "Villa Stay"}</Text>
                            </View>
                          </View>
                          <View style={styles.dueBadge}>
                            <Text style={styles.dueBadgeLabel}>Due:</Text>
                            <Text style={styles.dueBadgeValue}>{money(item.dueAmount)}</Text>
                          </View>
                        </View>

                        <View style={styles.modalDetailGrid}>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Unit</Text>
                            <Text style={styles.modalDetailValue}>{item.unit_name || "Villa Unit"}</Text>
                          </View>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Stay Dates</Text>
                            <Text style={styles.modalDetailValue}>
                              {checkIn} &rarr; {checkOut}
                            </Text>
                          </View>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Total Booked</Text>
                            <Text style={styles.modalDetailValue}>{money(item.totalAmount)}</Text>
                          </View>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Advance Collected</Text>
                            <Text style={[styles.modalDetailValue, { color: "#34D399" }]}>
                              {money(item.advanceAmount)}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => {
                  closeModal();
                  router.push("/owner/revenue" as Href);
                }}
                style={({ pressed }) => [styles.modalFooterLink, pressed && styles.pressed]}
              >
                <Text style={styles.modalFooterLinkText}>Go to Revenue & Payments</Text>
                <ExternalLink size={13} color={colors.gold} />
              </Pressable>
              <Pressable
                onPress={closeModal}
                style={({ pressed }) => [styles.modalPrimaryBtn, pressed && styles.pressed]}
              >
                <Text style={styles.modalPrimaryBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: RECENT RESERVATIONS FULL LIST POPUP */}
      {/* ========================================================================= */}
      <Modal
        visible={activeModal === "recent_reservations"}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isWide && styles.modalCardWide]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalIconWrap, { backgroundColor: "rgba(224, 184, 74, 0.14)" }]}>
                  <CalendarCheck2 size={18} color={colors.gold} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Recent Reservations</Text>
                  <Text style={styles.modalSubtitle}>
                    {recentBookings.length} booking record{recentBookings.length === 1 ? "" : "s"} &bull; {selectedUnitName}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={closeModal}
                style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.pressed]}
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {recentBookings.length === 0 ? (
                <View style={styles.modalEmptyBox}>
                  <CalendarDays size={36} color={colors.textMuted} />
                  <Text style={styles.modalEmptyTitle}>No Reservations Found</Text>
                  <Text style={styles.modalEmptySub}>No bookings recorded for this selection.</Text>
                </View>
              ) : (
                <View style={styles.modalItemList}>
                  {recentBookings.map((b, idx) => {
                    const amount = Number(b.amount || b.total_amount || 0);
                    const isOffline = b.source === "offline";
                    const checkIn = String(b.check_in || "").split("T")[0];
                    const checkOut = String(b.check_out || "").split("T")[0];
                    return (
                      <Pressable
                        key={`modal-rec-${b.id}-${idx}`}
                        onPress={() => openBookingDetail(b)}
                        style={({ pressed }) => [
                          styles.modalItemCard,
                          pressed && styles.pressed,
                          Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                        ]}
                      >
                        <View style={styles.modalItemTop}>
                          <View style={styles.modalItemUserRow}>
                            <View style={styles.guestAvatarCircle}>
                              <User size={15} color={colors.gold} />
                            </View>
                            <View>
                              <Text style={styles.modalItemTitle}>{b.customer_name || "Guest Booking"}</Text>
                              <Text style={styles.modalItemPhone}>{b.unit_name || "Villa Stay"}</Text>
                            </View>
                          </View>
                          <View style={styles.bookingCardRight}>
                            <Text style={styles.bookingAmount}>{money(amount)}</Text>
                            <View style={[styles.statusTag, isOffline ? styles.offlineTag : styles.onlineTag]}>
                              <Text style={isOffline ? styles.offlineTagText : styles.onlineTagText}>
                                {isOffline ? "Offline" : "Website"}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.modalDetailGrid}>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Dates</Text>
                            <Text style={styles.modalDetailValue}>
                              {checkIn} &rarr; {checkOut}
                            </Text>
                          </View>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Guests</Text>
                            <Text style={styles.modalDetailValue}>{b.persons || 2} Persons</Text>
                          </View>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Payment Mode</Text>
                            <Text style={styles.modalDetailValue}>{(b.payment_mode || "Online").toUpperCase()}</Text>
                          </View>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Action</Text>
                            <Text style={[styles.modalDetailValue, { color: colors.gold }]}>View Details &rarr;</Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => {
                  closeModal();
                  router.push("/owner/bookings" as Href);
                }}
                style={({ pressed }) => [styles.modalFooterLink, pressed && styles.pressed]}
              >
                <Text style={styles.modalFooterLinkText}>Open Full Bookings Ledger</Text>
                <ExternalLink size={13} color={colors.gold} />
              </Pressable>
              <Pressable
                onPress={closeModal}
                style={({ pressed }) => [styles.modalPrimaryBtn, pressed && styles.pressed]}
              >
                <Text style={styles.modalPrimaryBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 6: UPCOMING CHECK-INS FULL LIST POPUP */}
      {/* ========================================================================= */}
      <Modal
        visible={activeModal === "upcoming_checkins"}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isWide && styles.modalCardWide]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalIconWrap, { backgroundColor: "rgba(52, 211, 153, 0.12)" }]}>
                  <Clock size={18} color="#34D399" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Upcoming Check-ins</Text>
                  <Text style={styles.modalSubtitle}>
                    {upcomingBookings.length} confirmed upcoming arrival{upcomingBookings.length === 1 ? "" : "s"}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={closeModal}
                style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.pressed]}
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {upcomingBookings.length === 0 ? (
                <View style={styles.modalEmptyBox}>
                  <DoorOpen size={36} color={colors.textMuted} />
                  <Text style={styles.modalEmptyTitle}>No Upcoming Arrivals</Text>
                  <Text style={styles.modalEmptySub}>No future check-ins found for this property.</Text>
                </View>
              ) : (
                <View style={styles.modalItemList}>
                  {upcomingBookings.map((b, idx) => {
                    const checkIn = String(b.check_in || "").split("T")[0] || "";
                    const checkOut = String(b.check_out || "").split("T")[0] || "";
                    const amount = Number(b.amount || b.total_amount || 0);
                    return (
                      <Pressable
                        key={`modal-up-${b.id}-${idx}`}
                        onPress={() => openBookingDetail(b)}
                        style={({ pressed }) => [
                          styles.modalItemCard,
                          pressed && styles.pressed,
                          Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                        ]}
                      >
                        <View style={styles.modalItemTop}>
                          <View style={styles.modalItemUserRow}>
                            <View style={styles.upcomingDateBadge}>
                              <Text style={styles.upcomingDateDay}>{checkIn.split("-")[2] || "01"}</Text>
                              <Text style={styles.upcomingDateMonth}>
                                {new Date(checkIn || Date.now()).toLocaleString("en-US", { month: "short" }).toUpperCase()}
                              </Text>
                            </View>
                            <View>
                              <Text style={styles.modalItemTitle}>{b.customer_name || "Guest Arrival"}</Text>
                              <Text style={styles.modalItemPhone}>
                                {b.unit_name || "Villa Unit"} &bull; {b.persons || 2} Persons
                              </Text>
                            </View>
                          </View>
                          <View style={styles.upcomingStatus}>
                            <CheckCircle2 size={15} color="#34D399" />
                            <Text style={styles.upcomingConfirmed}>Confirmed</Text>
                          </View>
                        </View>

                        <View style={styles.modalDetailGrid}>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Check-in &rarr; Check-out</Text>
                            <Text style={styles.modalDetailValue}>
                              {checkIn} &rarr; {checkOut}
                            </Text>
                          </View>
                          <View style={styles.modalDetailCol}>
                            <Text style={styles.modalDetailLabel}>Tariff</Text>
                            <Text style={[styles.modalDetailValue, { color: colors.gold }]}>{money(amount)}</Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => {
                  closeModal();
                  router.push("/owner/calendar" as Href);
                }}
                style={({ pressed }) => [styles.modalFooterLink, pressed && styles.pressed]}
              >
                <Text style={styles.modalFooterLinkText}>Manage Availability Calendar</Text>
                <ExternalLink size={13} color={colors.gold} />
              </Pressable>
              <Pressable
                onPress={closeModal}
                style={({ pressed }) => [styles.modalPrimaryBtn, pressed && styles.pressed]}
              >
                <Text style={styles.modalPrimaryBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 7: INDIVIDUAL BOOKING DETAIL INSPECTOR POPUP */}
      {/* ========================================================================= */}
      <Modal
        visible={activeModal === "booking_detail" && Boolean(selectedBookingDetail)}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isWide && styles.modalCardWide, { maxWidth: 520 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalIconWrap, { backgroundColor: "rgba(224, 184, 74, 0.14)" }]}>
                  <Info size={18} color={colors.gold} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Reservation Details</Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedBookingDetail?.source === "offline" ? `Booking #${selectedBookingDetail?.id || "N/A"} • Offline Booking` : "Website Direct Booking"}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={closeModal}
                style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.pressed]}
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {selectedBookingDetail ? (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.bookingDetailCard}>
                  {selectedBookingDetail.source === "website" && selectedBookingDetail.booking_id ? (
                    <View style={{ marginBottom: 16, paddingHorizontal: 13, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: "rgba(224,184,74,.55)", backgroundColor: "rgba(224,184,74,.13)" }}>
                      <Text style={{ color: colors.textMuted, fontFamily: fontFamilies.sansBold, fontSize: 10, letterSpacing: 1.3 }}>CUSTOMER TICKET ID</Text>
                      <Text selectable style={{ marginTop: 4, color: colors.gold, fontFamily: fontFamilies.sansBold, fontSize: 17 }}>{ticketIdForDisplay(selectedBookingDetail.ticket_id, selectedBookingDetail.booking_id)}</Text>
                    </View>
                  ) : null}
                  {/* Guest Identity */}
                  <View style={styles.detailIdentityRow}>
                    <View style={styles.guestAvatarCircleLarge}>
                      <User size={20} color={colors.gold} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailGuestName}>{selectedBookingDetail.customer_name}</Text>
                      <Text style={styles.detailUnitName}>
                        {selectedBookingDetail.unit_name || "Villa Unit"} &bull; {selectedBookingDetail.persons || 2} Guests
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusTag,
                        selectedBookingDetail.source === "offline" ? styles.offlineTag : styles.onlineTag,
                      ]}
                    >
                      <Text
                        style={
                          selectedBookingDetail.source === "offline" ? styles.offlineTagText : styles.onlineTagText
                        }
                      >
                        {(selectedBookingDetail.source || "Website").toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Stay Duration */}
                  <View style={styles.detailSectionBox}>
                    <Text style={styles.detailSectionTitle}>STAY SCHEDULE</Text>
                    <View style={styles.detailScheduleRow}>
                      <View style={styles.scheduleBlock}>
                        <Text style={styles.scheduleLabel}>Check-In</Text>
                        <Text style={styles.scheduleDate}>
                          {String(selectedBookingDetail.check_in || "").split("T")[0]}
                        </Text>
                        <Text style={{ color: colors.gold, fontFamily: fontFamilies.sansSemiBold, fontSize: 12, marginTop: 2 }}>
                          {selectedBookingDetail.check_in_time || "02:00 PM"}
                        </Text>
                      </View>
                      <ArrowRight size={16} color={colors.gold} />
                      <View style={styles.scheduleBlock}>
                        <Text style={styles.scheduleLabel}>Check-Out</Text>
                        <Text style={styles.scheduleDate}>
                          {String(selectedBookingDetail.check_out || "").split("T")[0]}
                        </Text>
                        <Text style={{ color: colors.gold, fontFamily: fontFamilies.sansSemiBold, fontSize: 12, marginTop: 2 }}>
                          {selectedBookingDetail.check_out_time || "11:00 AM"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Guest Demographics & Meal Preferences */}
                  <View style={styles.detailSectionBox}>
                    <Text style={styles.detailSectionTitle}>GUEST & MEAL PREFERENCES</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
                      <View style={{ flex: 1, minWidth: 140, padding: 10, borderRadius: 8, backgroundColor: "rgba(59, 130, 246, 0.08)", borderWidth: 1, borderColor: "rgba(59, 130, 246, 0.2)" }}>
                        <Text style={{ color: "#60A5FA", fontFamily: fontFamilies.sansBold, fontSize: 10, letterSpacing: 1 }}>GUESTS DEMOGRAPHICS</Text>
                        <Text style={{ color: colors.text, fontFamily: fontFamilies.sansBold, fontSize: 14, marginTop: 4 }}>
                          👨 {selectedBookingDetail.male_guest_count ?? selectedBookingDetail.persons ?? 1} Male &bull; 👩 {selectedBookingDetail.female_guest_count ?? 0} Female
                        </Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 140, padding: 10, borderRadius: 8, backgroundColor: "rgba(16, 185, 129, 0.08)", borderWidth: 1, borderColor: "rgba(16, 185, 129, 0.2)" }}>
                        <Text style={{ color: "#34D399", fontFamily: fontFamilies.sansBold, fontSize: 10, letterSpacing: 1 }}>MEAL PREFERENCES</Text>
                        <Text style={{ color: colors.text, fontFamily: fontFamilies.sansBold, fontSize: 14, marginTop: 4 }}>
                          🥗 {selectedBookingDetail.veg_guest_count ?? selectedBookingDetail.persons ?? 1} Veg &bull; 🍗 {selectedBookingDetail.nonveg_guest_count ?? 0} Non-Veg
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Financial Breakdown */}
                  <View style={styles.detailSectionBox}>
                    <Text style={styles.detailSectionTitle}>PAYMENT BREAKDOWN</Text>
                    <View style={styles.detailFinanceGrid}>
                      <View style={styles.detailFinanceCol}>
                        <Text style={styles.financeLabel}>Total Tariff</Text>
                        <Text style={[styles.financeValue, { color: colors.gold }]}>
                          {money(Number(selectedBookingDetail.amount || selectedBookingDetail.total_amount || 0))}
                        </Text>
                      </View>
                      <View style={styles.detailFinanceCol}>
                        <Text style={styles.financeLabel}>Advance Paid</Text>
                        <Text style={[styles.financeValue, { color: "#34D399" }]}>
                          {money(Number(selectedBookingDetail.advance_amount || 0))}
                        </Text>
                      </View>
                      <View style={styles.detailFinanceCol}>
                        <Text style={styles.financeLabel}>Balance Due</Text>
                        <Text style={[styles.financeValue, { color: "#F59E0B" }]}>
                          {money(
                            Math.max(
                              0,
                              Number(selectedBookingDetail.amount || selectedBookingDetail.total_amount || 0) -
                                Number(selectedBookingDetail.advance_amount || 0)
                            )
                          )}
                        </Text>
                      </View>
                      <View style={styles.detailFinanceCol}>
                        <Text style={styles.financeLabel}>Payment Mode</Text>
                        <Text style={styles.financeValue}>
                          {(selectedBookingDetail.payment_mode || "Online").toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Notes if any */}
                  {selectedBookingDetail.note ? (
                    <View style={styles.reqNotesBox}>
                      <Text style={styles.reqNotesLabel}>Note: </Text>
                      <Text style={styles.reqNotesText}>{selectedBookingDetail.note}</Text>
                    </View>
                  ) : null}
                </View>
              </ScrollView>
            ) : null}

            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => {
                  closeModal();
                  router.push("/owner/bookings" as Href);
                }}
                style={({ pressed }) => [styles.modalFooterLink, pressed && styles.pressed]}
              >
                <Text style={styles.modalFooterLinkText}>Open in Bookings Ledger</Text>
                <ExternalLink size={13} color={colors.gold} />
              </Pressable>
              <Pressable
                onPress={closeModal}
                style={({ pressed }) => [styles.modalPrimaryBtn, pressed && styles.pressed]}
              >
                <Text style={styles.modalPrimaryBtnText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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

  // Welcome Banner
  welcomeBanner: {
    backgroundColor: "rgba(14, 18, 24, 0.95)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.2)",
    padding: 18,
    gap: 16,
    ...Platform.select({
      web: { boxShadow: "0 8px 30px rgba(0,0,0,0.35)" } as any,
      default: {},
    }),
  },
  welcomeBannerWide: {
    padding: 22,
    gap: 20,
  },
  welcomeTopRow: {
    flexDirection: "column",
    gap: 16,
  },
  welcomeTopRowWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  welcomeLeft: {
    flex: 1,
    gap: 6,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  liveBadge: {
    backgroundColor: "rgba(52, 211, 153, 0.1)",
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
  },
  liveBadgeText: {
    color: "#34D399",
    fontFamily: fontFamilies.sansBold,
    fontSize: 9,
  },
  welcomeTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.displayMedium,
    fontSize: 22,
  },
  welcomeTitleWide: {
    fontSize: 28,
  },
  goldText: {
    color: colors.gold,
  },
  welcomeSubtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
  },
  topActionsGroup: {
    flexDirection: "column",
    gap: 12,
  },
  topActionsGroupWide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  // 3 Revenue Display Cards Row
  revenueCardsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  ctaBtnsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerRevenueCard: {
    backgroundColor: "rgba(22, 28, 36, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    justifyContent: "center",
    minWidth: 114,
  },
  headerRevenueTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  headerRevenueLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
  },
  headerRevenueValue: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 14,
    marginTop: 1,
  },
  headerRevenueSub: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 9,
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
  },
  actionBtnGold: {
    backgroundColor: colors.gold,
  },
  actionBtnGoldText: {
    color: "#120e06",
    fontFamily: fontFamilies.sansBold,
    fontSize: 12,
  },
  actionBtnSecondary: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  actionBtnSecondaryText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },

  // ── DASHBOARD TOOLBAR SECTION ──
  dashboardToolbar: {
    flexDirection: "column",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: 14,
  },
  dashboardToolbarWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toolbarLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  toolbarRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  // Villa Unit Selector
  toolbarSelectorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(22, 28, 36, 0.9)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
    paddingHorizontal: 12,
    height: 38,
  },
  toolbarSelectorTextWrap: {
    maxWidth: 160,
  },
  toolbarSelectorLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 8.5,
    textTransform: "uppercase",
  },
  toolbarSelectorValue: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 11.5,
  },

  // View Mode Segment (Daily / Monthly / Yearly)
  viewModeSegment: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  viewModeBtn: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  viewModeBtnActive: {
    backgroundColor: "rgba(224, 184, 74, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.4)",
  },
  viewModeBtnText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11.5,
  },
  viewModeBtnTextActive: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
  },

  // Date Navigation & Picker
  dateNavArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: "rgba(22, 28, 36, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  datePickerTriggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(22, 28, 36, 0.9)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
    paddingHorizontal: 12,
    height: 36,
  },
  datePickerTriggerText: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 12,
  },
  todayQuickBtn: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 9,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  todayQuickBtnActive: {
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    borderColor: "rgba(224, 184, 74, 0.35)",
  },
  todayQuickBtnText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },
  todayQuickBtnTextActive: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
  },

  // Loading & Errors
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
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  errorText: {
    color: "#F87171",
    fontFamily: fontFamilies.sans,
    fontSize: 13,
  },

  // Section Header
  sectionWrap: {
    gap: 14,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionEyebrow: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 18,
  },

  // First Row KPI Grid
  kpiGrid: {
    gap: 12,
  },
  kpiGridWide: {
    flexDirection: "row",
    gap: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "rgba(14, 18, 24, 0.8)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.16)",
    padding: 18,
    gap: 8,
    ...Platform.select({
      web: {
        transition: "transform 0.15s ease, border-color 0.15s ease",
      } as any,
      default: {},
    }),
  },
  kpiCardWide: {
    padding: 20,
  },
  kpiTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kpiLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12.5,
  },
  kpiIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiValue: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.displayMedium,
    fontSize: 26,
  },
  kpiBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  kpiSub: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
    flex: 1,
  },

  // Dual Grid (Recent + Upcoming)
  dualGrid: {
    gap: 16,
  },
  dualGridWide: {
    flexDirection: "row",
    gap: 20,
  },
  panel: {
    flex: 1,
    backgroundColor: "rgba(14, 18, 24, 0.8)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.14)",
    padding: 18,
    gap: 14,
  },
  panelWide: {
    padding: 22,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    paddingBottom: 12,
  },
  panelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  panelTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 15,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },

  // Booking list
  bookingList: {
    gap: 10,
  },
  bookingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(22, 28, 36, 0.6)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    padding: 12,
  },
  bookingCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  guestAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  guestAvatarCircleLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  bookingMeta: {
    flex: 1,
  },
  dashboardTicketId: {
    marginTop: 4,
    color: "#FDE68A",
    fontFamily: fontFamilies.sansBold,
    fontSize: 10.5,
    lineHeight: 15,
  },
  guestName: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13.5,
  },
  stayDates: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    marginTop: 2,
  },
  bookingCardRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  bookingAmount: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 13.5,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  onlineTag: {
    backgroundColor: "rgba(56, 189, 248, 0.12)",
  },
  onlineTagText: {
    color: "#38BDF8",
    fontSize: 9.5,
    fontFamily: fontFamilies.sansBold,
  },
  offlineTag: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
  },
  offlineTagText: {
    color: "#F59E0B",
    fontSize: 9.5,
    fontFamily: fontFamilies.sansBold,
  },
  paidTag: {
    backgroundColor: "rgba(52, 211, 153, 0.12)",
  },
  paidTagText: {
    color: "#34D399",
    fontSize: 10,
    fontFamily: fontFamilies.sansBold,
  },
  partialTag: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
  },
  partialTagText: {
    color: "#F59E0B",
    fontSize: 10,
    fontFamily: fontFamilies.sansBold,
  },
  checkoutReadyTag: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },
  checkoutReadyText: {
    color: "#F87171",
    fontSize: 10,
    fontFamily: fontFamilies.sansBold,
  },

  // Pending Cards & Quick Actions
  pendingCardWrapper: {
    gap: 6,
  },
  pendingQuickActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: -2,
    marginBottom: 4,
    paddingRight: 4,
  },
  quickAcceptBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#34D399",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  quickAcceptBtnText: {
    color: "#0F172A",
    fontFamily: fontFamilies.sansBold,
    fontSize: 11,
  },
  quickRejectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(239, 68, 68, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  quickRejectBtnText: {
    color: "#F87171",
    fontFamily: fontFamilies.sansBold,
    fontSize: 11,
  },
  disabledBtn: {
    opacity: 0.5,
  },

  // Upcoming Row
  upcomingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(22, 28, 36, 0.5)",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
  },
  upcomingDateBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  upcomingDateDay: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 14,
    lineHeight: 16,
  },
  upcomingDateMonth: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansBold,
    fontSize: 8.5,
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingGuest: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
  },
  upcomingUnit: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    marginTop: 1,
  },
  upcomingStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  upcomingConfirmed: {
    color: "#34D399",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },

  // Empty Card
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 6,
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansBold,
    fontSize: 13.5,
  },
  emptySub: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
    textAlign: "center",
  },

  // =========================================================================
  // MODAL POPUP STYLES
  // =========================================================================
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 580,
    maxHeight: "85%",
    backgroundColor: "#0E1218",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
    padding: 20,
    gap: 16,
    ...Platform.select({
      web: { boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6)" } as any,
      default: {},
    }),
  },
  modalCardWide: {
    padding: 24,
    maxWidth: 650,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    paddingBottom: 14,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  modalIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 16.5,
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    flexGrow: 0,
  },
  modalItemList: {
    gap: 12,
    paddingVertical: 4,
  },
  modalItemCard: {
    backgroundColor: "rgba(22, 28, 36, 0.7)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    padding: 14,
    gap: 12,
  },
  modalItemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalItemUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  modalItemTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 14,
  },
  modalItemPhone: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
  },
  modalRequestAmount: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 15,
  },
  modalDetailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "rgba(10, 14, 20, 0.5)",
    borderRadius: 10,
    padding: 10,
    gap: 12,
  },
  modalDetailCol: {
    minWidth: "42%",
    flex: 1,
    gap: 2,
  },
  modalDetailLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    textTransform: "uppercase",
  },
  modalDetailValue: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },
  reqNotesBox: {
    flexDirection: "row",
    backgroundColor: "rgba(224, 184, 74, 0.06)",
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    marginTop: 4,
  },
  reqNotesLabel: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 11,
  },
  reqNotesText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    flex: 1,
  },
  modalActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  acceptActionBtn: {
    flex: 1,
    height: 38,
    backgroundColor: colors.gold,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  acceptActionBtnText: {
    color: "#120e06",
    fontFamily: fontFamilies.sansBold,
    fontSize: 12,
  },
  rejectActionBtn: {
    flex: 1,
    height: 38,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  rejectActionBtnText: {
    color: "#F87171",
    fontFamily: fontFamilies.sansBold,
    fontSize: 12,
  },
  dueBadge: {
    alignItems: "flex-end",
  },
  dueBadgeLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10,
  },
  dueBadgeValue: {
    color: "#F59E0B",
    fontFamily: fontFamilies.sansBold,
    fontSize: 14,
  },
  modalEmptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    gap: 8,
  },
  modalEmptyTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 14.5,
  },
  modalEmptySub: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    textAlign: "center",
  },
  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: 14,
  },
  modalFooterLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modalFooterLinkText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12.5,
  },
  modalPrimaryBtn: {
    paddingHorizontal: 18,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryBtnText: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 12,
  },
  feedbackBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  successBanner: {
    backgroundColor: "rgba(52, 211, 153, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  feedbackText: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    flex: 1,
  },
  successText: {
    color: "#34D399",
  },

  // ── UNIT PICKER LIST STYLES ──
  unitList: {
    gap: 10,
    paddingVertical: 6,
  },
  unitItemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(22, 28, 36, 0.7)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 14,
  },
  unitItemCardActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
  },
  unitItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  unitItemTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13.5,
  },
  unitItemSub: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    marginTop: 2,
  },
  addUnitModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.gold,
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 8,
    justifyContent: "center",
  },
  addUnitModalBtnText: {
    color: "#120e06",
    fontFamily: fontFamilies.sansBold,
    fontSize: 12.5,
  },

  // ── CALENDAR DATE PICKER STYLES ──
  calNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  calNavTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 15,
  },
  calNavArrow: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  calWeekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  calWeekdayText: {
    width: 36,
    textAlign: "center",
    color: colors.textMuted,
    fontFamily: fontFamilies.sansBold,
    fontSize: 10,
  },
  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
    paddingVertical: 10,
  },
  calCellEmpty: {
    width: 36,
    height: 36,
  },
  calCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  calCellSelected: {
    backgroundColor: colors.gold,
  },
  calCellToday: {
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
  },
  calCellText: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12.5,
  },
  calCellTextSelected: {
    color: "#120e06",
    fontFamily: fontFamilies.sansBold,
  },
  calCellTextToday: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
  },
  calFooterActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: 12,
  },
  calActionTodayBtn: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  calActionTodayBtnText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 12,
  },

  // ── MONTH GRID STYLES (MONTH PICKER) ──
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 12,
  },
  monthGridCell: {
    width: "30%",
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  monthGridCellSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  monthGridCellCurrent: {
    borderColor: colors.gold,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
  },
  monthGridCellText: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 13,
  },
  monthGridCellTextSelected: {
    color: "#120e06",
    fontFamily: fontFamilies.sansBold,
  },
  monthGridCellTextCurrent: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
  },

  // ── YEAR GRID STYLES (YEAR PICKER) ──
  yearGrid: {
    gap: 10,
    paddingVertical: 10,
  },
  yearGridCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(22, 28, 36, 0.7)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 18,
    height: 48,
  },
  yearGridCardSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  yearGridCardCurrent: {
    borderColor: colors.gold,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
  },
  yearGridText: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 15,
  },
  yearGridTextSelected: {
    color: "#120e06",
  },
  yearGridTextCurrent: {
    color: colors.gold,
  },
  yearGridSub: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },

  // ── BOOKING DETAIL INSPECTOR STYLES ──
  bookingDetailCard: {
    gap: 16,
    paddingVertical: 4,
  },
  detailIdentityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(22, 28, 36, 0.8)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  detailGuestName: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 16,
  },
  detailUnitName: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    marginTop: 2,
  },
  detailSectionBox: {
    backgroundColor: "rgba(16, 20, 26, 0.6)",
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  detailSectionTitle: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  detailScheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scheduleBlock: {
    gap: 2,
  },
  scheduleLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    textTransform: "uppercase",
  },
  scheduleDate: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 14,
  },
  detailFinanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  detailFinanceCol: {
    minWidth: "42%",
    flex: 1,
    gap: 2,
  },
  financeLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    textTransform: "uppercase",
  },
  financeValue: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13.5,
  },
});
