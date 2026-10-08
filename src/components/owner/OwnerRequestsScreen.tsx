import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  AlertCircle,
  ArrowRight,
  Ban,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Filter,
  Info,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react-native";
import { useAuth } from "@/components/auth";
import { colors, fontFamilies, radii } from "@/theme";
import { useIsWideScreen } from "@/hooks/use-window-class";
import { ticketIdForDisplay } from "@/utils/ticket-id";
import {
  getAccommodationUnitLabel,
  getPropertyCategoryLabel,
  isBinaryProperty,
  isInventoryProperty,
} from "@/utils/category-mode";
import {
  createProtectedLedgerEntry,
  getOwnerBookingRequests,
  getProtectedOwnerCalendar,
  getProtectedOwnerDashboard,
  updateBookingRequestStatus,
  type BookingRequestRecord,
  type OwnerDashboard,
  type RequestStatus,
} from "@/services/api";

const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export function OwnerRequestsScreen() {
  const router = useRouter();
  const isWide = useIsWideScreen();
  const { session } = useAuth();
  const token = session?.role === "owner" ? session.tokens.accessToken : "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [dashboard, setDashboard] = useState<OwnerDashboard | null>(null);
  const [requests, setRequests] = useState<BookingRequestRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  // Selected request for details modal
  const [selectedRequest, setSelectedRequest] = useState<BookingRequestRecord | null>(null);

  // Offline Booking Modal
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);
  const [offlineGuest, setOfflineGuest] = useState("");
  const [offlinePhone, setOfflinePhone] = useState("");
  const [offlineCheckIn, setOfflineCheckIn] = useState("");
  const [offlineCheckOut, setOfflineCheckOut] = useState("");
  const [offlinePersons, setOfflinePersons] = useState("2");
  const [offlineAmount, setOfflineAmount] = useState("");
  const [offlineNote, setOfflineNote] = useState("");
  const [offlineUnitId, setOfflineUnitId] = useState<number | undefined>(undefined);
  const [offlineSubmitting, setOfflineSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashData, reqsData] = await Promise.all([
        token ? getProtectedOwnerDashboard(token).catch(() => null) : Promise.resolve(null),
        getOwnerBookingRequests(token || undefined),
      ]);
      setDashboard(dashData);
      setRequests(reqsData);
      if (dashData?.units && dashData.units.length > 0 && !offlineUnitId && dashData.units[0]) {
        setOfflineUnitId(dashData.units[0].id);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load booking requests.");
    } finally {
      setLoading(false);
    }
  }, [offlineUnitId, token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const matchStatus = statusFilter === "All" ? true : item.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q
        ? true
        : item.guestName.toLowerCase().includes(q) ||
          item.guestPhone.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.villaUnitName.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [requests, searchQuery, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter((r) => r.status === "Pending").length,
      accepted: requests.filter((r) => r.status === "Accepted").length,
      rejected: requests.filter((r) => r.status === "Rejected").length,
      cancelled: requests.filter((r) => r.status === "Cancelled").length,
      offline: requests.filter((r) => r.status === "Offline").length,
    };
  }, [requests]);

  const handleAcceptRequest = async (req: BookingRequestRecord) => {
    setActionBusyId(req.id);
    setError("");
    setSuccessMessage("");
    try {
      const propertyCategory = req.category || dashboard?.property?.category;
      const isVilla = isBinaryProperty(propertyCategory);

      // Validate availability first with live calendar check excluding this request
      if (token) {
        if (req.items && req.items.length > 0) {
          // Multi-accommodation booking validation
          for (const item of req.items) {
            const cal = await getProtectedOwnerCalendar(token, item.unitId, req.checkIn, req.checkOut, req.id);
            const neededQty = item.unitQuantity || 1;
            for (const d of cal.data || []) {
              const avail = d.available_quantity ?? (d.is_booked ? 0 : 1);
              if (avail < neededQty) {
                const itemLabel = item.unitName || getAccommodationUnitLabel(propertyCategory);
                throw new Error(`Conflict: ${itemLabel} has only ${avail} unit(s) available on ${d.date} (${neededQty} requested).`);
              }
            }
          }
        } else if (req.villaUnitId) {
          // Single-unit validation
          const cal = await getProtectedOwnerCalendar(token, req.villaUnitId, req.checkIn, req.checkOut, req.id);
          for (const d of cal.data || []) {
            const avail = d.available_quantity ?? (d.is_booked ? 0 : 1);
            if (isVilla) {
              if (d.is_booked || avail < 1) {
                throw new Error(`Conflict: Villa is already blocked or booked on requested dates (${req.checkIn} to ${req.checkOut}).`);
              }
            } else {
              if (avail < 1) {
                const unitName = req.villaUnitName || getAccommodationUnitLabel(propertyCategory);
                throw new Error(`Conflict: ${unitName} has only ${avail} unit(s) available on ${d.date} (1 requested).`);
              }
            }
          }
        }
      }

      await updateBookingRequestStatus(req.id, "Accepted", token || undefined);
      setSuccessMessage(`Request ${req.id} for ${req.guestName} accepted successfully.`);
      await loadData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to accept booking request.");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleRejectRequest = async (req: BookingRequestRecord) => {
    setActionBusyId(req.id);
    setError("");
    setSuccessMessage("");
    try {
      await updateBookingRequestStatus(req.id, "Rejected", token || undefined);
      setSuccessMessage(`Request ${req.id} rejected.`);
      await loadData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to reject booking request.");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleCreateOfflineBooking = async () => {
    if (!token || !offlineUnitId) return;
    if (!offlineGuest.trim() || !offlineCheckIn || !offlineCheckOut || !offlineAmount) {
      setError("Please fill all required offline booking fields.");
      return;
    }
    setOfflineSubmitting(true);
    setError("");
    try {
      await createProtectedLedgerEntry(token, {
        unit_id: offlineUnitId,
        customer_name: offlineGuest.trim(),
        persons: Number(offlinePersons) || 2,
        check_in: offlineCheckIn,
        check_out: offlineCheckOut,
        payment_mode: "offline",
        amount: Number(offlineAmount) || 0,
        note: offlineNote.trim() || undefined,
      });

      setOfflineModalOpen(false);
      setOfflineGuest("");
      setOfflinePhone("");
      setOfflineCheckIn("");
      setOfflineCheckOut("");
      setOfflineAmount("");
      setOfflineNote("");
      setSuccessMessage("Offline booking created and calendar updated successfully.");
      await loadData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to record offline booking.");
    } finally {
      setOfflineSubmitting(false);
    }
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]}
    >
      <View style={[styles.container, isWide && styles.containerWide]}>
        {/* Header Bar */}
        <View style={[styles.headerBox, isWide && styles.headerBoxWide]}>
          <View style={styles.headerLeft}>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Sparkles size={10} color={colors.gold} />
                <Text style={styles.badgeText}>ENQUIRIES & DIRECT REQUESTS</Text>
              </View>
            </View>
            <Text style={[styles.title, isWide && styles.titleWide]}>Booking Requests</Text>
            <Text style={styles.subtitle}>
              Review incoming guest stay requests, check calendar availability, and confirm reservations.
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setOfflineModalOpen(true)}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.pressed,
                Platform.select({ web: { cursor: "pointer", outlineStyle: "none" } as any, default: {} }),
              ]}
            >
              <Plus size={15} color="#120e06" strokeWidth={2.5} />
              <Text style={styles.primaryBtnText}>+ Record Offline Booking</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => void loadData()}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && styles.pressed,
                Platform.select({ web: { cursor: "pointer", outlineStyle: "none" } as any, default: {} }),
              ]}
            >
              <RefreshCw size={14} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {error ? (
          <View style={styles.alertBoxError}>
            <AlertCircle size={16} color="#F87171" />
            <Text style={styles.alertTextError}>{error}</Text>
          </View>
        ) : null}

        {successMessage ? (
          <View style={styles.alertBoxSuccess}>
            <CheckCircle2 size={16} color="#34D399" />
            <Text style={styles.alertTextSuccess}>{successMessage}</Text>
          </View>
        ) : null}

        {/* Filter Pills & Search */}
        <View style={styles.filtersSection}>
          <View style={styles.searchBar}>
            <Search size={16} color={colors.textMuted} />
            <TextInput
              placeholder="Search by guest name, phone, or request ID..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery("")}>
                <X size={15} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsScroll}>
            {(
              [
                { id: "All", label: "All", count: counts.all },
                { id: "Pending", label: "Pending", count: counts.pending },
                { id: "Accepted", label: "Accepted", count: counts.accepted },
                { id: "Rejected", label: "Rejected", count: counts.rejected },
                { id: "Cancelled", label: "Cancelled", count: counts.cancelled },
                { id: "Offline", label: "Offline", count: counts.offline },
              ] as const
            ).map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setStatusFilter(tab.id)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {tab.label}
                  </Text>
                  <View style={[styles.filterChipCount, active && styles.filterChipCountActive]}>
                    <Text style={[styles.filterChipCountText, active && styles.filterChipCountTextActive]}>
                      {tab.count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Request Cards / Table List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={styles.loadingText}>Fetching guest requests...</Text>
          </View>
        ) : filteredRequests.length === 0 ? (
          <View style={styles.emptyPanel}>
            <CalendarDays size={32} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No requests found</Text>
            <Text style={styles.emptySubtitle}>
              {statusFilter !== "All"
                ? `No booking requests match the "${statusFilter}" status.`
                : "When prospective guests submit reservation requests, they will appear here."}
            </Text>
          </View>
        ) : (
          <View style={styles.requestsList}>
            {filteredRequests.map((req) => {
              const isPending = req.status === "Pending";
              const isAccepted = req.status === "Accepted";
              const isRejected = req.status === "Rejected";
              const isCancelled = req.status === "Cancelled";
              const isBusy = actionBusyId === req.id;

              return (
                <View key={req.id} style={[styles.requestCard, isWide && styles.requestCardWide]}>
                  {/* Top Bar of Card */}
                  <View style={styles.requestTop}>
                    <View style={styles.guestInfoWrap}>
                      <View style={styles.guestAvatar}>
                        <User size={16} color={colors.gold} />
                      </View>
                      <View>
                        <Text style={styles.guestName}>{req.guestName}</Text>
                        <Text style={styles.guestPhone}>{req.guestPhone}</Text>
                        {req.ticketId || req.id.startsWith("PHC-") ? (
                          <View style={styles.ticketIdBadge}>
                            <Text selectable style={styles.ticketIdBadgeText}>TICKET ID: {ticketIdForDisplay(req.ticketId, req.id)}</Text>
                          </View>
                        ) : (
                          <Text style={styles.guestPhone}>Request ID: {req.id}</Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.statusBadgeWrap}>
                      <View
                        style={[
                          styles.statusBadge,
                          isPending && styles.statusBadgePending,
                          isAccepted && styles.statusBadgeAccepted,
                          isRejected && styles.statusBadgeRejected,
                          isCancelled && styles.statusBadgeCancelled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isPending && styles.statusBadgeTextPending,
                            isAccepted && styles.statusBadgeTextAccepted,
                            isRejected && styles.statusBadgeTextRejected,
                            isCancelled && styles.statusBadgeTextCancelled,
                          ]}
                        >
                          {req.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Facts Grid */}
                  <View style={[styles.factsGrid, isWide && styles.factsGridWide]}>
                    <View style={styles.factItem}>
                      <Text style={styles.factLabel}>
                        {getAccommodationUnitLabel(req.category || dashboard?.property?.category)}
                      </Text>
                      <Text style={styles.factValue}>
                        {req.items && req.items.length > 0
                          ? req.items.map((it) => `${it.unitName} (${it.unitQuantity})`).join(", ")
                          : req.villaUnitName || "Main Accommodation"}
                      </Text>
                    </View>
                    <View style={styles.factItem}>
                      <Text style={styles.factLabel}>Stay Dates</Text>
                      <Text style={styles.factValue}>
                        {req.checkIn} &rarr; {req.checkOut} ({req.nights}N)
                      </Text>
                    </View>
                    <View style={styles.factItem}>
                      <Text style={styles.factLabel}>Guests</Text>
                      <Text style={styles.factValue}>{req.guestsCount} Guests</Text>
                    </View>
                    <View style={styles.factItem}>
                      <Text style={styles.factLabel}>Total / Advance</Text>
                      <Text style={[styles.factValue, { color: colors.gold }]}>
                        {money(req.totalAmount)} ({money(req.advanceAmount)} Adv)
                      </Text>
                    </View>
                  </View>

                  {req.notes ? (
                    <View style={styles.notesBox}>
                      <Info size={13} color={colors.gold} />
                      <Text numberOfLines={2} style={styles.notesText}>
                        {req.notes}
                      </Text>
                    </View>
                  ) : null}

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    <Pressable
                      onPress={() => setSelectedRequest(req)}
                      style={({ pressed }) => [
                        styles.btnDetails,
                        pressed && styles.pressed,
                        Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                      ]}
                    >
                      <Text style={styles.btnDetailsText}>View Details</Text>
                    </Pressable>

                    {isPending ? (
                      <View style={styles.pendingActionRow}>
                        <Pressable
                          disabled={isBusy}
                          onPress={() => void handleAcceptRequest(req)}
                          style={({ pressed }) => [
                            styles.btnAccept,
                            pressed && styles.pressed,
                            isBusy && { opacity: 0.6 },
                            Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                          ]}
                        >
                          {isBusy ? (
                            <ActivityIndicator size="small" color="#120e06" />
                          ) : (
                            <>
                              <Check size={14} color="#120e06" strokeWidth={2.5} />
                              <Text style={styles.btnAcceptText}>Accept Request</Text>
                            </>
                          )}
                        </Pressable>

                        <Pressable
                          disabled={isBusy}
                          onPress={() => void handleRejectRequest(req)}
                          style={({ pressed }) => [
                            styles.btnReject,
                            pressed && styles.pressed,
                            isBusy && { opacity: 0.6 },
                            Platform.select({ web: { cursor: "pointer" } as any, default: {} }),
                          ]}
                        >
                          <X size={14} color="#F87171" strokeWidth={2.2} />
                          <Text style={styles.btnRejectText}>Reject</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* DETAILS MODAL */}
        {selectedRequest ? (
          <Modal visible transparent animationType="fade" onRequestClose={() => setSelectedRequest(null)}>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalCard, isWide && styles.modalCardWide]}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderTitleRow}>
                    <Sparkles size={16} color={colors.gold} />
                    <Text style={styles.modalTitle}>{selectedRequest.ticketId || selectedRequest.id.startsWith("PHC-") ? "Booking Request" : `Request #${selectedRequest.id}`}</Text>
                  </View>
                  <Pressable onPress={() => setSelectedRequest(null)} style={styles.modalCloseBtn}>
                    <X size={18} color={colors.textSecondary} />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                  {selectedRequest.ticketId || selectedRequest.id.startsWith("PHC-") ? (
                    <View style={styles.ticketIdBadge}>
                      <Text selectable style={styles.ticketIdBadgeText}>TICKET ID: {ticketIdForDisplay(selectedRequest.ticketId, selectedRequest.id)}</Text>
                    </View>
                  ) : null}
                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalLabel}>Guest Name:</Text>
                    <Text style={styles.modalValue}>{selectedRequest.guestName}</Text>
                  </View>
                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalLabel}>Phone Number:</Text>
                    <Text style={styles.modalValue}>{selectedRequest.guestPhone}</Text>
                  </View>
                  {selectedRequest.guestEmail ? (
                    <View style={styles.modalFieldRow}>
                      <Text style={styles.modalLabel}>Email:</Text>
                      <Text style={styles.modalValue}>{selectedRequest.guestEmail}</Text>
                    </View>
                  ) : null}
                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalLabel}>
                      {getAccommodationUnitLabel(selectedRequest.category || dashboard?.property?.category)}:
                    </Text>
                    <Text style={styles.modalValue}>
                      {selectedRequest.items && selectedRequest.items.length > 0
                        ? selectedRequest.items.map((it) => `${it.unitName} (${it.unitQuantity})`).join(", ")
                        : selectedRequest.villaUnitName}
                    </Text>
                  </View>
                  {selectedRequest.items && selectedRequest.items.length > 0 ? (
                    <View style={styles.modalItemsBox}>
                      <Text style={styles.modalItemsHeading}>Booked Accommodations Breakdown:</Text>
                      {selectedRequest.items.map((item, idx) => (
                        <View key={`${item.unitId}-${idx}`} style={styles.modalItemRow}>
                          <Text style={styles.modalItemName}>• {item.unitName} &times; {item.unitQuantity} unit(s)</Text>
                          <Text style={styles.modalItemMeta}>({item.persons} guests &bull; {money(item.subtotal || 0)})</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalLabel}>Check-In:</Text>
                    <Text style={styles.modalValue}>{selectedRequest.checkIn} &bull; {selectedRequest.checkInTime || "02:00 PM"}</Text>
                  </View>
                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalLabel}>Check-Out:</Text>
                    <Text style={styles.modalValue}>{selectedRequest.checkOut} &bull; {selectedRequest.checkOutTime || "11:00 AM"}</Text>
                  </View>
                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalLabel}>Nights / Guests:</Text>
                    <Text style={styles.modalValue}>
                      {selectedRequest.nights} Nights &bull; {selectedRequest.guestsCount} Guests
                    </Text>
                  </View>
                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalLabel}>Guest Breakdown:</Text>
                    <Text style={styles.modalValue}>
                      👨 {selectedRequest.maleGuestCount ?? selectedRequest.guestsCount} Male &bull; 👩 {selectedRequest.femaleGuestCount ?? 0} Female
                    </Text>
                  </View>
                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalLabel}>Meal Preferences:</Text>
                    <Text style={styles.modalValue}>
                      🥗 {selectedRequest.vegGuestCount ?? selectedRequest.guestsCount} Veg &bull; 🍗 {selectedRequest.nonVegGuestCount ?? 0} Non-Veg
                    </Text>
                  </View>
                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalLabel}>Total Amount:</Text>
                    <Text style={[styles.modalValue, { color: colors.gold, fontFamily: fontFamilies.sansBold }]}>
                      {money(selectedRequest.totalAmount)}
                    </Text>
                  </View>
                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalLabel}>Advance Amount:</Text>
                    <Text style={styles.modalValue}>{money(selectedRequest.advanceAmount)}</Text>
                  </View>
                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalLabel}>Request Source:</Text>
                    <Text style={styles.modalValue}>{selectedRequest.requestSource}</Text>
                  </View>
                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalLabel}>Current Status:</Text>
                    <Text style={styles.modalValue}>{selectedRequest.status}</Text>
                  </View>
                  {selectedRequest.notes ? (
                    <View style={styles.modalNotesBlock}>
                      <Text style={styles.modalNotesHeading}>Guest Notes / Special Requests:</Text>
                      <Text style={styles.modalNotesContent}>{selectedRequest.notes}</Text>
                    </View>
                  ) : null}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Pressable
                    onPress={() => setSelectedRequest(null)}
                    style={[styles.modalBtnClose, Platform.select({ web: { cursor: "pointer" } as any, default: {} })]}
                  >
                    <Text style={styles.modalBtnCloseText}>Close</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        ) : null}

        {/* OFFLINE BOOKING MODAL */}
        {offlineModalOpen ? (
          <Modal visible transparent animationType="fade" onRequestClose={() => setOfflineModalOpen(false)}>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalCard, isWide && styles.modalCardWide]}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderTitleRow}>
                    <Plus size={16} color={colors.gold} />
                    <Text style={styles.modalTitle}>Record Offline Booking</Text>
                  </View>
                  <Pressable onPress={() => setOfflineModalOpen(false)} style={styles.modalCloseBtn}>
                    <X size={18} color={colors.textSecondary} />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Guest Full Name *</Text>
                    <TextInput
                      placeholder="e.g. Ramesh Kulkarni"
                      placeholderTextColor={colors.textMuted}
                      value={offlineGuest}
                      onChangeText={setOfflineGuest}
                      style={styles.formInput}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Guest Phone Number</Text>
                    <TextInput
                      placeholder="e.g. +91 98220 12345"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                      value={offlinePhone}
                      onChangeText={setOfflinePhone}
                      style={styles.formInput}
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Check-In Date *</Text>
                      <TextInput
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textMuted}
                        value={offlineCheckIn}
                        onChangeText={setOfflineCheckIn}
                        style={styles.formInput}
                      />
                    </View>

                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Check-Out Date *</Text>
                      <TextInput
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textMuted}
                        value={offlineCheckOut}
                        onChangeText={setOfflineCheckOut}
                        style={styles.formInput}
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Total Guests</Text>
                      <TextInput
                        placeholder="2"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                        value={offlinePersons}
                        onChangeText={setOfflinePersons}
                        style={styles.formInput}
                      />
                    </View>

                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Total Amount (₹) *</Text>
                      <TextInput
                        placeholder="e.g. 15000"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                        value={offlineAmount}
                        onChangeText={setOfflineAmount}
                        style={styles.formInput}
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Notes / Source details</Text>
                    <TextInput
                      placeholder="e.g. Direct phone booking with 50% cash advance"
                      placeholderTextColor={colors.textMuted}
                      value={offlineNote}
                      onChangeText={setOfflineNote}
                      style={styles.formInput}
                    />
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Pressable
                    disabled={offlineSubmitting}
                    onPress={() => setOfflineModalOpen(false)}
                    style={styles.modalBtnClose}
                  >
                    <Text style={styles.modalBtnCloseText}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    disabled={offlineSubmitting}
                    onPress={() => void handleCreateOfflineBooking()}
                    style={({ pressed }) => [
                      styles.modalBtnSubmit,
                      pressed && styles.pressed,
                      offlineSubmitting && { opacity: 0.6 },
                    ]}
                  >
                    {offlineSubmitting ? (
                      <ActivityIndicator size="small" color="#120e06" />
                    ) : (
                      <Text style={styles.modalBtnSubmitText}>Save Offline Booking</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        ) : null}
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
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.gold,
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: "#120e06",
    fontFamily: fontFamilies.sansBold,
    fontSize: 12.5,
  },
  secondaryBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Alerts
  alertBoxError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  alertTextError: {
    color: "#F87171",
    fontFamily: fontFamilies.sans,
    fontSize: 13,
  },
  alertBoxSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(52, 211, 153, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  alertTextSuccess: {
    color: "#34D399",
    fontFamily: fontFamilies.sans,
    fontSize: 13,
  },

  // Filters
  filtersSection: {
    gap: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(18, 22, 28, 0.8)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontFamily: fontFamilies.sans,
    fontSize: 13,
  },
  filterPillsScroll: {
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(18, 22, 28, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  filterChipActive: {
    backgroundColor: "rgba(224, 184, 74, 0.14)",
    borderColor: "rgba(224, 184, 74, 0.35)",
  },
  filterChipText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12.5,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
  },
  filterChipCount: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  filterChipCountActive: {
    backgroundColor: "rgba(224, 184, 74, 0.25)",
  },
  filterChipCountText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansBold,
    fontSize: 11,
  },
  filterChipCountTextActive: {
    color: colors.gold,
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
  emptyPanel: {
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
  emptySubtitle: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    maxWidth: 400,
    textAlign: "center",
  },

  // Requests List
  requestsList: {
    gap: 14,
  },
  requestCard: {
    backgroundColor: "rgba(14, 18, 24, 0.8)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.16)",
    padding: 16,
    gap: 14,
  },
  requestCardWide: {
    padding: 20,
  },
  requestTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
    paddingBottom: 12,
  },
  guestInfoWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  guestAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  guestName: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 14.5,
  },
  guestPhone: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
  },
  ticketIdBadge: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.5)",
    backgroundColor: "rgba(224, 184, 74, 0.13)",
  },
  ticketIdBadgeText: {
    color: "#FDE68A",
    fontFamily: fontFamilies.sansBold,
    fontSize: 10.5,
    lineHeight: 15,
  },
  statusBadgeWrap: {},
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  statusBadgePending: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  statusBadgeAccepted: {
    backgroundColor: "rgba(52, 211, 153, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  statusBadgeRejected: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  statusBadgeCancelled: {
    backgroundColor: "rgba(148, 163, 184, 0.12)",
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansBold,
  },
  statusBadgeTextPending: { color: "#F59E0B" },
  statusBadgeTextAccepted: { color: "#34D399" },
  statusBadgeTextRejected: { color: "#F87171" },
  statusBadgeTextCancelled: { color: "#94A3B8" },

  factsGrid: {
    gap: 10,
  },
  factsGridWide: {
    flexDirection: "row",
    gap: 16,
  },
  factItem: {
    flex: 1,
    backgroundColor: "rgba(22, 28, 36, 0.5)",
    borderRadius: 10,
    padding: 10,
    gap: 2,
  },
  factLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
  },
  factValue: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12.5,
  },

  notesBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(224, 184, 74, 0.06)",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.16)",
  },
  notesText: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
  },

  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  btnDetails: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  btnDetailsText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },
  pendingActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnAccept: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.gold,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 8,
  },
  btnAcceptText: {
    color: "#120e06",
    fontFamily: fontFamilies.sansBold,
    fontSize: 12,
  },
  btnReject: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 8,
  },
  btnRejectText: {
    color: "#F87171",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "85%",
    backgroundColor: "#0A0D12",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
    overflow: "hidden",
  },
  modalCardWide: {
    maxWidth: 560,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  modalHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 16,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
    gap: 12,
  },
  modalFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
    paddingBottom: 8,
  },
  modalLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12.5,
  },
  modalValue: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 13,
  },
  modalNotesBlock: {
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(224, 184, 74, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.2)",
    gap: 4,
  },
  modalNotesHeading: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 11.5,
  },
  modalNotesContent: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  modalItemsBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 6,
  },
  modalItemsHeading: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 11.5,
    marginBottom: 2,
  },
  modalItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  modalItemName: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12.5,
  },
  modalItemMeta: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
  },
  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  modalBtnClose: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnCloseText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12.5,
  },
  modalBtnSubmit: {
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnSubmitText: {
    color: "#120e06",
    fontFamily: fontFamilies.sansBold,
    fontSize: 12.5,
  },

  // Form
  formGroup: {
    gap: 6,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  formLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },
  formInput: {
    backgroundColor: "rgba(22, 28, 36, 0.8)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    height: 42,
    color: "#FFFFFF",
    fontFamily: fontFamilies.sans,
    fontSize: 13,
  },
});
