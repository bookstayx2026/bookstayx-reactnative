import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  CalendarCheck2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  History,
  Search,
  Sparkles,
  X,
  XCircle,
} from "lucide-react-native";
import { router } from "expo-router";
import { AppScreen } from "@/components/foundation";
import { useAuth } from "@/components/auth";
import {
  BookingCard,
  EmptyState,
  useCustomerChrome,
  useCustomerData,
} from "@/components/customer";
import { colors, fontFamilies, layout, radii } from "@/theme";
import { confirmMockPayment, initiatePayment } from "@/services/api";
import { useIsDesktop } from "@/hooks/use-window-class";

const PAGE_SIZE = 5;

export default function BookingsScreen() {
  const { onScroll } = useCustomerChrome();
  const { session } = useAuth();
  const { bookings, bookingsLoading, bookingsError, refreshBookings } = useCustomerData();
  const [tab, setTab] = useState<"live" | "pending" | "cancelled" | "history">("live");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [paying, setPaying] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState("");
  const isDesktop = useIsDesktop();

  // Instant refresh when user changes tabs or mounts page
  useEffect(() => {
    void refreshBookings();
  }, [refreshBookings, tab]);

  const handleTabChange = (nextTab: "live" | "pending" | "cancelled" | "history") => {
    setTab(nextTab);
    setPage(1);
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    setPage(1);
  };

  const confirmedBookings = useMemo(
    () => bookings.filter((b) => b.status === "confirmed"),
    [bookings]
  );
  const pendingBookings = useMemo(
    () => bookings.filter((b) => b.status === "pending"),
    [bookings]
  );
  const cancelledBookings = useMemo(
    () => bookings.filter((b) => b.status === "cancelled"),
    [bookings]
  );
  const completedBookings = useMemo(
    () => bookings.filter((b) => b.status === "completed"),
    [bookings]
  );

  const displayedList = useMemo(() => {
    let base = confirmedBookings;
    if (tab === "pending") base = pendingBookings;
    else if (tab === "cancelled") base = cancelledBookings;
    else if (tab === "history") base = completedBookings;

    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q) ||
        b.bookingCode.toLowerCase().includes(q)
    );
  }, [cancelledBookings, completedBookings, confirmedBookings, pendingBookings, query, tab]);

  const totalPages = Math.max(1, Math.ceil(displayedList.length / PAGE_SIZE));
  const paginatedList = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return displayedList.slice(start, start + PAGE_SIZE);
  }, [displayedList, page]);

  const pay = async (booking: (typeof bookings)[number]) => {
    if (!session?.tokens?.accessToken) return router.push("/login");
    setPaying(booking.id);
    setPaymentError("");
    try {
      const result = await initiatePayment(session.tokens.accessToken, booking.bookingCode);
      if (result.already_paid) {
        await refreshBookings();
        return;
      }
      if (result.mock && result.mock_token) {
        await confirmMockPayment(session.tokens.accessToken, result.mock_token);
        await refreshBookings();
        router.push({
          pathname: "/ticket",
          params: { booking_id: booking.bookingCode, payment_result: "success" },
        });
        return;
      }
      if (!result.checkout_url) throw new Error("Razorpay Checkout link was not returned.");
      await Linking.openURL(result.checkout_url);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Unable to open payment.");
    } finally {
      setPaying(null);
    }
  };

  return (
    <AppScreen
      contentContainerStyle={[styles.screen, isDesktop && styles.screenDesktop]}
      scrollProps={{ onScroll, scrollEventThrottle: 16 }}
    >
      {/* Page Header */}
      <View style={[styles.headerBanner, isDesktop && styles.headerBannerDesktop]}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Sparkles size={11} color={colors.gold} />
            <Text style={styles.badgeText}>TRIPS & RESERVATIONS</Text>
          </View>
        </View>

        <Text style={[styles.title, isDesktop && styles.titleDesktop]}>
          My <Text style={styles.goldText}>Bookings</Text>
        </Text>
        <Text style={[styles.subtitle, isDesktop && styles.subtitleDesktop]}>
          Manage your upcoming getaways, complete pending payments, and view stay tickets.
        </Text>
      </View>

      {/* KPI Summary Cards */}
      <View style={[styles.summaryGrid, isDesktop && styles.summaryGridDesktop]}>
        <SummaryTile
          Icon={CalendarCheck2}
          value={confirmedBookings.length}
          label="Confirmed Trips"
          color="#4ADE80"
          active={tab === "live"}
          onPress={() => handleTabChange("live")}
        />
        <SummaryTile
          Icon={CalendarClock}
          value={pendingBookings.length}
          label="Pending Bookings"
          color="#FACC15"
          active={tab === "pending"}
          onPress={() => handleTabChange("pending")}
        />
        <SummaryTile
          Icon={XCircle}
          value={cancelledBookings.length}
          label="Cancelled"
          color="#F87171"
          active={tab === "cancelled"}
          onPress={() => handleTabChange("cancelled")}
        />
        <SummaryTile
          Icon={History}
          value={completedBookings.length}
          label="Completed Stays"
          color="#60A5FA"
          active={tab === "history"}
          onPress={() => handleTabChange("history")}
        />
      </View>

      {/* Navigation & Search Row */}
      <View style={[styles.controlsRow, isDesktop && styles.controlsRowDesktop]}>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === "live" }}
            onPress={() => handleTabChange("live")}
            style={({ pressed }) => [
              styles.tab,
              tab === "live" && styles.tabActive,
              pressed && styles.pressed,
              Platform.select({
                web: { cursor: "pointer", outlineStyle: "none" } as any,
                default: {},
              }),
            ]}
          >
            <CalendarCheck2 size={15} color={tab === "live" ? colors.gold : colors.textMuted} />
            <Text style={[styles.tabText, tab === "live" && styles.tabTextActive]}>
              Confirmed ({confirmedBookings.length})
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === "pending" }}
            onPress={() => handleTabChange("pending")}
            style={({ pressed }) => [
              styles.tab,
              tab === "pending" && [styles.tabActive, { borderColor: "rgba(245, 158, 11, 0.5)", backgroundColor: "rgba(245, 158, 11, 0.12)" }],
              pressed && styles.pressed,
              Platform.select({
                web: { cursor: "pointer", outlineStyle: "none" } as any,
                default: {},
              }),
            ]}
          >
            <CalendarClock size={15} color={tab === "pending" ? "#FACC15" : colors.textMuted} />
            <Text style={[styles.tabText, tab === "pending" && { color: "#FACC15", fontFamily: fontFamilies.sansBold }]}>
              Pending Bookings ({pendingBookings.length})
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === "cancelled" }}
            onPress={() => handleTabChange("cancelled")}
            style={({ pressed }) => [
              styles.tab,
              tab === "cancelled" && [styles.tabActive, { borderColor: "rgba(239, 68, 68, 0.5)", backgroundColor: "rgba(239, 68, 68, 0.12)" }],
              pressed && styles.pressed,
              Platform.select({
                web: { cursor: "pointer", outlineStyle: "none" } as any,
                default: {},
              }),
            ]}
          >
            <XCircle size={15} color={tab === "cancelled" ? "#F87171" : colors.textMuted} />
            <Text style={[styles.tabText, tab === "cancelled" && { color: "#F87171", fontFamily: fontFamilies.sansBold }]}>
              Cancelled ({cancelledBookings.length})
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === "history" }}
            onPress={() => handleTabChange("history")}
            style={({ pressed }) => [
              styles.tab,
              tab === "history" && styles.tabActive,
              pressed && styles.pressed,
              Platform.select({
                web: { cursor: "pointer", outlineStyle: "none" } as any,
                default: {},
              }),
            ]}
          >
            <History size={15} color={tab === "history" ? colors.gold : colors.textMuted} />
            <Text style={[styles.tabText, tab === "history" && styles.tabTextActive]}>
              Completed History ({completedBookings.length})
            </Text>
          </Pressable>
        </View>

        {/* Search Input on Desktop */}
        {bookings.length > 0 ? (
          <View style={[styles.searchBox, isDesktop && styles.searchBoxDesktop]}>
            <Search size={15} color={colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Search by property, ID or place..."
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
            />
            {query ? (
              <Pressable onPress={() => handleQueryChange("")} style={styles.clearBtn}>
                <X size={12} color={colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Loading & Error Indicators */}
      {bookingsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Text style={styles.loadingText}>Fetching your reservations...</Text>
        </View>
      ) : null}

      {bookingsError ? (
        <Pressable onPress={() => void refreshBookings()} style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{bookingsError} (Tap to retry)</Text>
        </Pressable>
      ) : null}

      {paymentError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{paymentError}</Text>
        </View>
      ) : null}

      {/* Bookings List (Listed View) */}
      <View style={[styles.listContainer, isDesktop && styles.listContainerDesktop]}>
        {paginatedList.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            paying={paying === booking.id}
            onPayment={(item) => void pay(item)}
          />
        ))}
      </View>

      {/* Pagination Bar */}
      {!bookingsLoading && displayedList.length > 0 ? (
        <View style={[styles.paginationContainer, isDesktop && styles.paginationContainerDesktop]}>
          <View style={styles.paginationInfo}>
            <Text style={styles.paginationText}>
              Showing{" "}
              <Text style={styles.paginationHighlight}>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, displayedList.length)}
              </Text>{" "}
              of <Text style={styles.paginationHighlight}>{displayedList.length}</Text> bookings
            </Text>
          </View>

          {totalPages > 1 ? (
            <View style={styles.paginationControls}>
              {/* Previous Button */}
              <Pressable
                disabled={page === 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                style={({ pressed }) => [
                  styles.pageBtn,
                  page === 1 && styles.pageBtnDisabled,
                  pressed && styles.pressed,
                  Platform.select({
                    web: { cursor: page === 1 ? "default" : "pointer", outlineStyle: "none" } as any,
                    default: {},
                  }),
                ]}
              >
                <ChevronLeft size={15} color={page === 1 ? colors.textMuted : colors.gold} />
                <Text style={[styles.pageBtnText, page === 1 && styles.pageBtnTextDisabled]}>Previous</Text>
              </Pressable>

              {/* Page Numbers */}
              <View style={styles.pageNumbersRow}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Pressable
                    key={pageNum}
                    onPress={() => setPage(pageNum)}
                    style={({ pressed }) => [
                      styles.pageNumBtn,
                      page === pageNum && styles.pageNumBtnActive,
                      pressed && styles.pressed,
                      Platform.select({
                        web: { cursor: "pointer", outlineStyle: "none" } as any,
                        default: {},
                      }),
                    ]}
                  >
                    <Text style={[styles.pageNumText, page === pageNum && styles.pageNumTextActive]}>
                      {pageNum}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Next Button */}
              <Pressable
                disabled={page === totalPages}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={({ pressed }) => [
                  styles.pageBtn,
                  page === totalPages && styles.pageBtnDisabled,
                  pressed && styles.pressed,
                  Platform.select({
                    web: { cursor: page === totalPages ? "default" : "pointer", outlineStyle: "none" } as any,
                    default: {},
                  }),
                ]}
              >
                <Text style={[styles.pageBtnText, page === totalPages && styles.pageBtnTextDisabled]}>Next</Text>
                <ChevronRight size={15} color={page === totalPages ? colors.textMuted : colors.gold} />
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Empty State */}
      {!bookingsLoading && displayedList.length === 0 ? (
        <EmptyState
          Icon={
            tab === "pending"
              ? CalendarClock
              : tab === "cancelled"
              ? XCircle
              : tab === "history"
              ? History
              : CalendarCheck2
          }
          title={
            query
              ? "No matching bookings"
              : tab === "pending"
              ? "No pending bookings"
              : tab === "cancelled"
              ? "No cancelled bookings"
              : tab === "history"
              ? "No completed stays yet"
              : "No confirmed upcoming trips"
          }
          copy={
            query
              ? "We couldn't find any reservations matching your search keywords."
              : tab === "pending"
              ? "You don't have any reservations waiting for owner confirmation or payment."
              : tab === "cancelled"
              ? "You don't have any cancelled or declined bookings."
              : tab === "history"
              ? "Your completed vacation getaways and past stays will be archived here."
              : "Explore our collection of private villas, cottages, and beach stays to plan your next vacation."
          }
          action="Explore Properties"
          onAction={() => router.push("/properties")}
        />
      ) : null}
    </AppScreen>
  );
}

function SummaryTile({
  Icon,
  value,
  label,
  color,
  active,
  onPress,
}: {
  Icon: typeof CalendarClock;
  value: string | number;
  label: string;
  color: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        active && styles.tileActive,
        pressed && styles.pressed,
        Platform.select({
          web: { cursor: "pointer", outlineStyle: "none" } as any,
          default: {},
        }),
      ]}
    >
      <View style={[styles.tileIconCircle, { borderColor: `${color}40`, backgroundColor: `${color}15` }]}>
        <Icon size={16} color={color} />
      </View>
      <View>
        <Text style={[styles.tileValue, { color }]}>{value}</Text>
        <Text style={styles.tileLabel}>{label}</Text>
      </View>
    </Pressable>
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
    maxWidth: 1320,
    alignSelf: "center",
    width: "100%",
  },

  // Header Banner
  headerBanner: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerBannerDesktop: {
    paddingHorizontal: 36,
    paddingTop: 20,
    paddingBottom: 20,
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
  goldText: {
    color: colors.gold,
  },
  subtitle: {
    marginTop: 6,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 700,
  },
  subtitleDesktop: {
    fontSize: 14,
    lineHeight: 22,
  },

  // KPI Summary Cards
  summaryGrid: {
    paddingHorizontal: 20,
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryGridDesktop: {
    paddingHorizontal: 36,
    marginTop: 12,
    gap: 16,
  },
  tile: {
    flex: 1,
    minWidth: 140,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.14)",
    backgroundColor: "rgba(14, 18, 24, 0.95)",
    ...Platform.select({
      web: {
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
      } as any,
      default: {},
    }),
  },
  tileActive: {
    borderColor: "rgba(224, 184, 74, 0.35)",
  },
  tileIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tileValue: {
    fontFamily: fontFamilies.sansBold,
    fontSize: 16,
    lineHeight: 20,
  },
  tileLabel: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
  },

  // Controls Row (Tabs + Search)
  controlsRow: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  controlsRowDesktop: {
    paddingHorizontal: 36,
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tabsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  tabActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
  },
  tabText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12.5,
  },
  tabTextActive: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
  },
  searchBox: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(18, 22, 28, 0.9)",
  },
  searchBoxDesktop: {
    width: 320,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: fontFamilies.sans,
    fontSize: 12.5,
    outlineStyle: "none" as never,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Loading & Error
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
  },
  errorBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  errorBannerText: {
    color: "#FCA5A5",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    textAlign: "center",
  },

  // List Layout
  listContainer: {
    paddingHorizontal: 20,
    marginTop: 18,
    gap: 12,
  },
  listContainerDesktop: {
    paddingHorizontal: 36,
    marginTop: 20,
    flexDirection: "column",
    gap: 14,
    width: "100%",
  },

  // Pagination Styles
  paginationContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "column",
    alignItems: "center",
    gap: 14,
  },
  paginationContainerDesktop: {
    paddingHorizontal: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paginationInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  paginationText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12.5,
  },
  paginationHighlight: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
  },
  paginationControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
    backgroundColor: "rgba(224, 184, 74, 0.08)",
  },
  pageBtnDisabled: {
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    opacity: 0.4,
  },
  pageBtnText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
  },
  pageBtnTextDisabled: {
    color: colors.textMuted,
  },
  pageNumbersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pageNumBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  pageNumBtnActive: {
    borderColor: colors.gold,
    backgroundColor: colors.gold,
  },
  pageNumText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansBold,
    fontSize: 12,
  },
  pageNumTextActive: {
    color: "#120e06",
  },
});
