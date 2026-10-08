/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
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
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import {
  AirVent,
  AlertTriangle,
  Bath,
  BedDouble,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CalendarRange,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CookingPot,
  CreditCard,
  DollarSign,
  Download,
  Droplets,
  FilePenLine,
  FileSpreadsheet,
  FileText,
  Flame,
  Globe,
  Heart,
  ImagePlus,
  Info,
  Layers,
  LogOut,
  MapPin,
  Minus,
  Plus,
  RefreshCw,
  Refrigerator,
  RotateCcw,
  Ban,
  Save,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  Trees,
  TrendingUp,
  Tv,
  User,
  UserCheck,
  UserRound,
  Users,
  UsersRound,
  Utensils,
  Waves,
  Wifi,
  X,
  XCircle,
  Zap,
} from "lucide-react-native";
import { router, type Href } from "expo-router";
import { PressableScale } from "@/components/foundation";
import { useAuth } from "@/components/auth";
import { colors, fontFamilies, layout, radii } from "@/theme";
import { useIsDesktop, useIsWideScreen, useWindowClass } from "@/hooks/use-window-class";
import { useOwnerDashboard } from "@/hooks/use-owner-dashboard";
import { getCategoryConfig } from "@/config/property-categories";
import { ticketIdForDisplay } from "@/utils/ticket-id";
import {
  isBinaryProperty,
  isInventoryProperty,
  getPropertyCategoryLabel,
  getAccommodationUnitLabel,
} from "@/utils/category-mode";
import {
  createProtectedLedgerEntry,
  createProtectedOwnerUnit,
  deleteProtectedLedgerEntry,
  deleteProtectedOwnerUnit,
  getProtectedOwnerCalendar,
  getProtectedOwnerLedger,
  updateBookingRequestStatus,
  updateProtectedLedgerEntry,
  updateProtectedOwnerDay,
  updateProtectedOwnerProfile,
  updateProtectedOwnerRates,
  updateProtectedOwnerUnit,
  uploadImage,
  type OwnerLedgerEntry,
  type OwnerUnit,
} from "@/services/api";

const villa1 = require("../../../assets/images/discovery/villa1.jpg");
const villa2 = require("../../../assets/images/discovery/villa2.jpg");

function Page({ children }: { children: React.ReactNode }) {
  const isWide = useIsWideScreen();
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[s.scroll, isWide && s.scrollDesktop]}
    >
      <View style={[s.page, isWide && s.pageDesktop]}>{children}</View>
    </ScrollView>
  );
}

function Panel({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[s.panel, style]}>{children}</View>;
}

function GoldButton({
  children,
  onPress,
  disabled,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={[s.goldButton, disabled && { opacity: 0.6 }]}
    >
      <LinearGradient
        colors={["#F0D078", "#D9A52A", "#B98216"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.goldButtonFill}
      >
        {children}
      </LinearGradient>
    </PressableScale>
  );
}

function SelectBox({ value, dark = false }: { value: string; dark?: boolean }) {
  return (
    <View style={[s.select, dark && s.selectDark]}>
      <Text numberOfLines={1} style={s.selectText}>
        {value}
      </Text>
      <ChevronDown size={14} color={colors.gold} strokeWidth={2.2} />
    </View>
  );
}

function Message({ error, notice }: { error?: string; notice?: string }) {
  if (!error && !notice) return null;
  return (
    <Text
      accessibilityRole="alert"
      style={[s.message, error ? s.messageError : s.messageSuccess]}
    >
      {error || notice}
    </Text>
  );
}

const cleanNumber = (value: unknown) =>
  Number(String(value ?? "").replace(/[^0-9.-]/g, "")) || 0;

const localIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

/**
 * Returns true if the calendar date is strictly before today's local start of day.
 * Normalizes both today and the target date to local date boundaries to avoid UTC/timezone glitches.
 */
export const isPastCalendarDate = (date: Date | string | null | undefined): boolean => {
  if (!date) return false;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  let targetTime: number;
  if (typeof date === "string") {
    const [y, m, d] = date.slice(0, 10).split("-").map(Number);
    if (typeof y === "number" && typeof m === "number" && typeof d === "number" && !isNaN(y) && !isNaN(m) && !isNaN(d)) {
      targetTime = new Date(y, m - 1, d).getTime();
    } else {
      const parsed = new Date(date);
      targetTime = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
    }
  } else {
    targetTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }

  return targetTime < todayStart;
};

/**
 * Returns true if the calendar date is today's local date.
 */
export const isTodayCalendarDate = (date: Date | string | null | undefined): boolean => {
  if (!date) return false;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  let targetTime: number;
  if (typeof date === "string") {
    const [y, m, d] = date.slice(0, 10).split("-").map(Number);
    if (typeof y === "number" && typeof m === "number" && typeof d === "number" && !isNaN(y) && !isNaN(m) && !isNaN(d)) {
      targetTime = new Date(y, m - 1, d).getTime();
    } else {
      const parsed = new Date(date);
      targetTime = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
    }
  } else {
    targetTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }

  return targetTime === todayStart;
};

// ==========================================
// 1. OWNER CALENDAR & AVAILABILITY SCREEN
// ==========================================
export function OwnerCalendarScreen() {
  const { token, data, loading, error, refresh } = useOwnerDashboard();
  const isDesktop = useIsWideScreen();
  const [unitId, setUnitId] = useState<number>();
  const [villaOpen, setVillaOpen] = useState(false);
  const [cursor, setCursor] = useState(new Date());
  const [weekday, setWeekday] = useState("");
  const [weekend, setWeekend] = useState("");
  const [specials, setSpecials] = useState<{ id: string; date: string; price: string }[]>([]);
  const [calendar, setCalendar] = useState<{
    date: string;
    status: string;
    price?: number;
    available_quantity?: number;
    booked_quantity?: number;
    booked_seats?: number;
    total_seats?: number;
    available_seats?: number;
  }[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  // Ledger Modal State
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [dateEntries, setDateEntries] = useState<OwnerLedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [showAddBookingForm, setShowAddBookingForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<OwnerLedgerEntry | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [customAvailableUnits, setCustomAvailableUnits] = useState<number>(1);

  // Form Fields for Ledger
  const [guestName, setGuestName] = useState("");
  const [guestPersons, setGuestPersons] = useState("2");
  const [guestAmount, setGuestAmount] = useState("");
  const [guestPayMode, setGuestPayMode] = useState<"offline" | "online">("offline");
  const [guestCheckIn, setGuestCheckIn] = useState("");
  const [guestCheckOut, setGuestCheckOut] = useState("");

  const units = useMemo(() => data?.units || [], [data?.units]);
  const unit = units.find((item) => item.id === unitId) || units[0];
  const villa = unit?.name || "No unit selected";
  const propertyCategory = data?.property?.category || (unit as any)?.category || "villa";
  const isVilla = isBinaryProperty(propertyCategory);
  const unitCapacity = unit?.total_persons || unit?.available_persons || 4;

  const propertyTotalCapacity = useMemo(() => {
    return units.reduce(
      (sum, u) => sum + (Number(u.total_inventory) || 1) * (Number(u.total_persons) || 1),
      0
    );
  }, [units]);

  const categoryTotalCapacity = useMemo(() => {
    return (Number(unit?.total_inventory) || 1) * (Number(unit?.total_persons) || 1);
  }, [unit]);

  useEffect(() => {
    if (!unitId && units[0]) setUnitId(units[0].id);
  }, [unitId, units]);

  useEffect(() => {
    if (!unit) return;
    setWeekday(String(cleanNumber(unit.weekday_price)));
    setWeekend(String(cleanNumber(unit.weekend_price)));
    const raw = Array.isArray(unit.special_dates) ? unit.special_dates : [];
    setSpecials(
      raw.map((item, index) => {
        const value = item as { date?: string; price?: number | string };
        return {
          id: String(index),
          date: value.date || "",
          price: String(value.price || ""),
        };
      })
    );
  }, [unit]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();

  const cells = useMemo(() => {
    const list: Array<{ day: number | null; date: Date | null; dow: string }> = [];
    for (let i = 0; i < startWeekday; i++) {
      list.push({ day: null, date: null, dow: "" });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      list.push({
        day: d,
        date,
        dow: date.toLocaleString("en-US", { weekday: "short" }).toUpperCase(),
      });
    }
    return list;
  }, [daysInMonth, month, startWeekday, year]);

  const weeks = useMemo(() => {
    const list: Array<Array<{ day: number | null; date: Date | null; dow: string }>> = [];
    for (let i = 0; i < cells.length; i += 7) {
      const week = cells.slice(i, i + 7);
      const paddedWeek = [...week];
      while (paddedWeek.length < 7) {
        paddedWeek.push({ day: null, date: null, dow: "" });
      }
      list.push(paddedWeek);
    }
    return list;
  }, [cells]);

  const loadCalendar = async () => {
    if (!token || !unit) return;
    const start = localIso(new Date(year, month, 1));
    const end = localIso(new Date(year, month + 1, 0));
    try {
      const result = await getProtectedOwnerCalendar(token, unit.id, start, end);
      setCalendar(
        result.data.map((item) => ({
          date: item.date,
          status: item.status || "available",
          price: item.price == null ? undefined : cleanNumber(item.price),
          available_quantity: item.available_quantity,
          booked_quantity: item.booked_quantity,
          booked_seats: item.booked_seats,
          total_seats: item.total_seats,
          available_seats: item.available_seats,
        }))
      );
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Unable to load calendar."
      );
    }
  };

  useEffect(() => {
    void loadCalendar();
  }, [token, unit, year, month]);

  const dayRecord = (day: number) =>
    calendar.find((item) => item.date === localIso(new Date(year, month, day)));

  // Date Click Handler: Opens Ledger Modal for this date!
  const handleDateClick = async (date: Date) => {
    // Past dates are strictly disabled and non-interactive
    if (isPastCalendarDate(date)) {
      return;
    }

    setSelectedDate(date);
    setLedgerModalOpen(true);
    setShowAddBookingForm(false);
    setEditingEntry(null);
    setActionError("");
    setNotice("");

    const dateStr = localIso(date);
    const nextDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    const nextDateStr = localIso(nextDay);

    // Pre-fill form fields
    const isWknd = date.getDay() === 0 || date.getDay() === 6 || date.getDay() === 5;
    const defaultPrice = isWknd ? weekend : weekday;
    setGuestName("");
    setGuestPersons(String(unitCapacity));
    setGuestAmount(defaultPrice || "12000");
    setGuestPayMode("offline");
    setGuestCheckIn(dateStr);
    setGuestCheckOut(nextDateStr);

    const rec = calendar.find((item) => item.date === dateStr);
    const maxInv = unit?.total_inventory || unitCapacity || 1;
    const currAvail = typeof rec?.available_quantity === "number" ? rec.available_quantity : (rec?.status === "booked" ? 0 : maxInv);
    setCustomAvailableUnits(currAvail);

    // Load ledger entries for this date
    if (token) {
      await refreshDateEntries(date);
    }
  };

  const refreshDateEntries = async (date: Date) => {
    if (!token) return [];
    setLedgerLoading(true);
    try {
      const dateStr = localIso(date);
      const ledgerRes = await getProtectedOwnerLedger(
        token,
        date.getFullYear(),
        date.getMonth() + 1,
        unit?.id
      );
      const matches = ledgerRes.data.filter((entry) => {
        const inDate = String(entry.check_in).slice(0, 10);
        const outDate = String(entry.check_out).slice(0, 10);
        return dateStr >= inDate && (outDate > inDate ? dateStr < outDate : dateStr === inDate);
      });
      setDateEntries(matches);
      const existingOffline = matches.find((e) => e.source === "offline");
      if (existingOffline) {
        setEditingEntry(existingOffline);
        setGuestName(existingOffline.customer_name);
        setGuestPersons(String(existingOffline.persons || unitCapacity));
        setGuestAmount(String(existingOffline.amount || existingOffline.total_amount || ""));
        setGuestCheckIn(String(existingOffline.check_in).slice(0, 10));
        setGuestCheckOut(String(existingOffline.check_out).slice(0, 10));
      }
      return matches;
    } catch (err) {
      console.log("Could not load date entries", err);
      return [];
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleAcceptReservation = async (entry: OwnerLedgerEntry) => {
    if (!token) return;
    if (selectedDate && isPastCalendarDate(selectedDate)) {
      setActionError("Cannot modify past reservations.");
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      const targetId = (entry as any).booking_id || entry.id;
      await updateBookingRequestStatus(String(targetId), "Accepted", token);
      setNotice(`Booking request for ${entry.customer_name} accepted! Marked as BOOKED 🔴.`);
      await loadCalendar();
      if (selectedDate) await refreshDateEntries(selectedDate);
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Unable to accept booking request."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRejectReservation = async (entry: OwnerLedgerEntry) => {
    if (!token) return;
    if (selectedDate && isPastCalendarDate(selectedDate)) {
      setActionError("Cannot modify past reservations.");
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      const targetId = (entry as any).booking_id || entry.id;
      await updateBookingRequestStatus(String(targetId), "Rejected", token);
      setNotice(`Booking request for ${entry.customer_name} rejected. Date released to AVAILABLE 🟢.`);
      await loadCalendar();
      if (selectedDate) await refreshDateEntries(selectedDate);
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Unable to reject booking request."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleCancelBookedReservation = async (entry: OwnerLedgerEntry) => {
    if (!token) return;
    if (selectedDate && isPastCalendarDate(selectedDate)) {
      setActionError("Cannot modify past reservations.");
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      if (entry.source === "offline" && !entry.booking_status) {
        await deleteProtectedLedgerEntry(token, entry.id);
      } else {
        const targetId = (entry as any).booking_id || entry.id;
        await updateBookingRequestStatus(String(targetId), "Cancelled", token);
      }
      const propertyCategory = data?.property?.category || (unit as any)?.category;
      if (isBinaryProperty(propertyCategory)) {
        if (unit && selectedDate) {
          await updateProtectedOwnerDay(token, unit.id, localIso(selectedDate), {
            status: "available",
            force: true,
            releaseBookings: true,
          });
        }
      }
      setNotice(`Booking cancelled.`);
      await loadCalendar();
      if (selectedDate) await refreshDateEntries(selectedDate);
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Unable to cancel booking."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleToggleDayDirectly = async (dateStr: string, currentStatus: string) => {
    if (isPastCalendarDate(dateStr)) return;
    if (!unit || !token) return;
    setBusy(true);
    setActionError("");
    try {
      const nextStatus = currentStatus === "booked" ? "available" : "booked";
      await updateProtectedOwnerDay(token, unit.id, dateStr, {
        status: nextStatus,
        force: nextStatus === "available",
        releaseBookings: nextStatus === "available",
      });
      await loadCalendar();
      setNotice(`Updated status to ${nextStatus.toUpperCase()} for ${dateStr}.`);
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Unable to update date."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSaveInventoryAvailability = async (quantity?: number, resetToDefault?: boolean) => {
    if (!unit || !token || !selectedDate) return;
    if (isPastCalendarDate(selectedDate)) {
      setActionError("Cannot modify availability for past dates.");
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      const dateStr = localIso(selectedDate);
      const maxInv = unit.total_inventory || 1;
      const targetQty = typeof quantity === "number" ? quantity : customAvailableUnits;
      const clampedQty = Math.max(0, Math.min(maxInv, targetQty));

      if (resetToDefault) {
        await updateProtectedOwnerDay(token, unit.id, dateStr, {
          reset_to_default: true,
          status: "available",
        });
        setCustomAvailableUnits(maxInv);
        setNotice(`Reset inventory for ${dateStr} to default (${maxInv} units).`);
      } else {
        await updateProtectedOwnerDay(token, unit.id, dateStr, {
          available_quantity: clampedQty,
          status: clampedQty === 0 ? "booked" : "available",
        });
        setCustomAvailableUnits(clampedQty);
        setNotice(`Updated available inventory for ${dateStr} to ${clampedQty}/${maxInv} units.`);
      }
      await loadCalendar();
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Unable to update inventory availability."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSaveOfflineBooking = async () => {
    if (!unit || !token || !selectedDate) return;
    if (isPastCalendarDate(selectedDate)) {
      setActionError("Cannot create or modify bookings for past dates.");
      return;
    }
    if (!guestName.trim()) {
      setActionError("Please enter the guest's name.");
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      const body = {
        unit_id: unit.id,
        customer_name: guestName.trim(),
        persons: cleanNumber(guestPersons) || (isVilla ? unitCapacity : categoryTotalCapacity),
        check_in: guestCheckIn || localIso(selectedDate),
        check_out: guestCheckOut || localIso(new Date(selectedDate.getTime() + 86400000)),
        payment_mode: guestPayMode,
        amount: cleanNumber(guestAmount),
      };

      if (editingEntry) {
        await updateProtectedLedgerEntry(token, editingEntry.id, body);
        setNotice("Offline booking updated.");
      } else {
        await createProtectedLedgerEntry(token, body);
        setNotice("Offline booking created and date locked.");
      }

      // Also mark day as booked for binary properties (Villa)
      const propertyCategory = data?.property?.category || (unit as any)?.category;
      if (isBinaryProperty(propertyCategory)) {
        await updateProtectedOwnerDay(token, unit.id, localIso(selectedDate), {
          status: "booked",
        });
      }

      await loadCalendar();
      setShowAddBookingForm(false);
      setEditingEntry(null);

      // Refresh modal entries
      const dateStr = localIso(selectedDate);
      const ledgerRes = await getProtectedOwnerLedger(
        token,
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        unit.id
      );
      const matches = ledgerRes.data.filter((entry) => {
        const inDate = String(entry.check_in).slice(0, 10);
        const outDate = String(entry.check_out).slice(0, 10);
        return dateStr >= inDate && (outDate > inDate ? dateStr < outDate : dateStr === inDate);
      });
      setDateEntries(matches);
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Unable to save booking."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteLedgerEntry = async (entryId: number) => {
    if (!token || !selectedDate) return;
    if (isPastCalendarDate(selectedDate)) {
      setActionError("Cannot delete or modify historical bookings.");
      return;
    }
    setBusy(true);
    try {
      await deleteProtectedLedgerEntry(token, entryId);
      setNotice("Booking removed from ledger.");

      const dateStr = localIso(selectedDate);
      // If there are no other entries or only this entry was deleted, update status to available
      if (unit) {
        const remaining = dateEntries.filter((e) => e.id !== entryId);
        if (remaining.length === 0) {
          await updateProtectedOwnerDay(token, unit.id, dateStr, { status: "available" });
        }
      }

      await loadCalendar();
      if (selectedDate && unit) {
        const ledgerRes = await getProtectedOwnerLedger(
          token,
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          unit.id
        );
        const matches = ledgerRes.data.filter((entry) => {
          const inDate = String(entry.check_in).slice(0, 10);
          const outDate = String(entry.check_out).slice(0, 10);
          return dateStr >= inDate && (outDate > inDate ? dateStr < outDate : dateStr === inDate);
        });
        setDateEntries(matches);
      }
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Unable to delete entry."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmReleaseDate = async () => {
    if (!token || !selectedDate || !unit) {
      setCancelConfirmOpen(false);
      return;
    }
    if (isPastCalendarDate(selectedDate)) {
      setCancelConfirmOpen(false);
      setActionError("Cannot release or modify past dates.");
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      const dateStr = localIso(selectedDate);

      // 1. Delete any offline ledger entries for this date
      const offlineEntries = dateEntries.filter((e) => e.source === "offline" || !e.source);
      for (const entry of offlineEntries) {
        try {
          await deleteProtectedLedgerEntry(token, entry.id);
        } catch (e) {
          console.log("Could not delete ledger entry", entry.id, e);
        }
      }
      if (editingEntry && editingEntry.source === "offline" && !offlineEntries.some((e) => e.id === editingEntry.id)) {
        try {
          await deleteProtectedLedgerEntry(token, editingEntry.id);
        } catch (e) {
          console.log("Could not delete editing entry", editingEntry.id, e);
        }
      }

      // 2. Mark day status as available in owner calendar
      await updateProtectedOwnerDay(token, unit.id, dateStr, {
        status: "available",
        force: true,
        releaseBookings: true,
      });

      // 3. Reload calendar
      await loadCalendar();

      // 4. Reset modal state
      setDateEntries([]);
      setShowAddBookingForm(false);
      setEditingEntry(null);
      setGuestName("");
      setGuestPersons(String(unitCapacity));
      setGuestAmount("");
      setCancelConfirmOpen(false);
      setNotice(`Date released to AVAILABLE 🟢`);
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Unable to release date."
      );
    } finally {
      setBusy(false);
    }
  };

  const saveRates = async () => {
    if (!unit) return;
    setBusy(true);
    setActionError("");
    try {
      await updateProtectedOwnerRates(token, unit.id, {
        weekday_price: cleanNumber(weekday),
        weekend_price: cleanNumber(weekend),
        special_dates: specials
          .filter((row) => row.date && row.price)
          .map((row) => ({ date: row.date, price: cleanNumber(row.price) })),
      });
      await refresh();
      setNotice("Rates and special date prices synced successfully.");
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Unable to update rates."
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <Page>
      {/* Hero Banner */}
      <View style={[s.hero, isDesktop && s.heroDesktop]}>
        <Image source={villa2} contentFit="cover" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={["rgba(7,8,10,.97)", "rgba(7,8,10,.88)", "rgba(7,8,10,.45)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[s.heroCopy, isDesktop && s.heroCopyDesktop]}>
          <View style={s.heroBadge}>
            <Sparkles size={11} color={colors.gold} />
            <Text style={s.heroBadgeText}>CALENDAR & RATE CONTROLS</Text>
          </View>
          <Text style={[s.heroTitle, isDesktop && s.heroTitleDesktop]}>
            Manage <Text style={s.heroAccent}>Availability &amp;</Text> Prices
          </Text>
          <Text style={[s.heroBody, isDesktop && s.heroBodyDesktop]}>
            Click any date cell to open the offline bookings ledger, block dates, or update rates.
          </Text>
        </View>
      </View>

      <View style={[s.stack, isDesktop && s.stackDesktop]}>
        <Message error={error || actionError} notice={notice} />

        {/* 2-Column Layout on Widescreen, Stack on Mobile */}
        <View style={isDesktop ? s.widescreenRow : s.mobileStack}>
          
          {/* LEFT COLUMN: Availability Calendar */}
          <View style={isDesktop ? s.widescreenLeftCol : undefined}>
            <Panel style={s.calendarPanel}>
              {/* Calendar Header */}
              <View style={s.calendarHeader}>
                <View style={s.titleIconRow}>
                  <CalendarDays size={20} color={colors.gold} strokeWidth={2} />
                  <Text style={s.sectionTitle}>Availability Calendar</Text>
                </View>

                {/* Color Legend */}
                <View style={s.legend}>
                  <Legend color="#16A34A" text="Available" />
                  <Legend color="#EAB308" text="Pending" />
                  <Legend color="#D97706" text="Limited" />
                  <Legend color="#DC2626" text="Booked" />
                  <Legend color="rgba(255, 255, 255, 0.2)" text="Past (Disabled)" />
                </View>
              </View>

              {/* Active Villa Indicator */}
              <View style={s.activeUnitStrip}>
                <View style={s.goldDot} />
                <Text style={s.activeUnitName}>{villa.toUpperCase()}</Text>
                {!isVilla && (
                  <Text style={{ color: colors.gold, fontFamily: fontFamilies.sansSemiBold, fontSize: 11.5, marginLeft: 6 }}>
                    • {categoryTotalCapacity} Max Guests ({unit?.total_inventory || 1} {getAccommodationUnitLabel(propertyCategory).toLowerCase()} @ {unit?.total_persons || 1} guests each)
                  </Text>
                )}
              </View>

              {/* Month Switcher Bar */}
              <View style={s.monthRow}>
                <PressableScale
                  accessibilityLabel="Previous month"
                  onPress={() => setCursor(new Date(year, month - 1, 1))}
                  style={s.monthArrow}
                >
                  <ChevronLeft size={20} color={colors.gold} />
                </PressableScale>

                <View style={s.monthTitleWrap}>
                  <Text style={s.monthText}>
                    {cursor.toLocaleString("en-IN", { month: "long", year: "numeric" })}
                  </Text>
                </View>

                <PressableScale
                  accessibilityLabel="Next month"
                  onPress={() => setCursor(new Date(year, month + 1, 1))}
                  style={s.monthArrow}
                >
                  <ChevronRight size={20} color={colors.gold} />
                </PressableScale>
              </View>

              {/* Weekday Day Header Row (7 Columns) */}
              <View style={s.weekRow}>
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                  <View key={d} style={s.weekDayWrap}>
                    <Text style={s.weekDay}>{d}</Text>
                  </View>
                ))}
              </View>

              {/* 7-Column Solid Square Calendar Days Grid */}
              <View style={s.calendarBody}>
                {weeks.map((week, wIdx) => (
                  <View key={`w-${wIdx}`} style={s.calendarWeekRow}>
                    {week.map((cell, cIdx) => {
                      if (cell.day === null) {
                        return (
                          <View key={`e-${wIdx}-${cIdx}`} style={s.calendarCellSlot}>
                            <View style={s.calendarCellEmpty} />
                          </View>
                        );
                      }

                      const isPast = isPastCalendarDate(cell.date);
                      const isToday = isTodayCalendarDate(cell.date);
                      const record = dayRecord(cell.day);
                      const propertyCategory = data?.property?.category || (unit as any)?.category;
                      const isVilla = isBinaryProperty(propertyCategory);
                      const isBooked = record?.status === "booked" || (record?.available_quantity === 0 && record?.status !== "pending");
                      const isPending = !isBooked && (record?.status === "pending" || (record as any)?.is_pending);
                      const isLimited = !isBooked && !isPending && (record?.status === "limited" || (!isVilla && typeof record?.available_quantity === "number" && record.available_quantity < (unit?.total_inventory || 1)));

                      const unitPersons = Number(unit?.total_persons) || 1;
                      const unitInventory = Number(unit?.total_inventory) || 1;
                      const totalSeats = record?.total_seats ?? (unitInventory * unitPersons);
                      const bookedSeats = typeof record?.booked_seats === "number"
                        ? record.booked_seats
                        : isBooked
                        ? totalSeats
                        : typeof record?.available_quantity === "number"
                        ? Math.max(0, (unitInventory - record.available_quantity) * unitPersons)
                        : 0;

                      let statusBg: string;
                      let statusBorder: string;
                      let statusTextColor = "#fff";
                      let statusLabel = isBooked
                        ? (isVilla ? "BOOKED" : `${totalSeats}/${totalSeats} BOOKED`)
                        : isPending
                        ? "PENDING"
                        : isVilla
                        ? "OPEN"
                        : `${bookedSeats}/${totalSeats} BOOKED`;

                      if (isPast) {
                        if (isBooked || (!isVilla && bookedSeats > 0)) {
                          // Historical booked: subtle dark muted red tone, preserving historical booked info
                          statusBg = "rgba(127, 29, 29, 0.35)";
                          statusBorder = "rgba(185, 28, 28, 0.35)";
                          statusTextColor = "rgba(252, 165, 165, 0.65)";
                          statusLabel = isVilla ? "BOOKED" : `${bookedSeats}/${totalSeats} BOOKED`;
                        } else {
                          // Historical open/pending: dark muted gray, no bright green
                          statusBg = "rgba(22, 27, 34, 0.55)";
                          statusBorder = "rgba(255, 255, 255, 0.05)";
                          statusTextColor = "rgba(255, 255, 255, 0.35)";
                          statusLabel = isPending ? "PENDING" : "PAST";
                        }
                      } else {
                        // Active (Today & Future): standard CRM appearance
                        statusBg = isBooked
                          ? "#DC2626"
                          : isPending
                          ? "#EAB308"
                          : isLimited
                          ? "#D97706"
                          : "#16A34A";

                        statusBorder = isToday
                          ? colors.gold
                          : isBooked
                          ? "rgba(239, 68, 68, 0.75)"
                          : isPending
                          ? "rgba(234, 179, 8, 0.75)"
                          : isLimited
                          ? "rgba(245, 158, 11, 0.75)"
                          : "rgba(34, 197, 94, 0.75)";
                      }

                      return (
                        <View key={cell.day} style={s.calendarCellSlot}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ disabled: isPast }}
                            disabled={isPast}
                            onPress={() => {
                              if (isPast) return;
                              void handleDateClick(cell.date!);
                            }}
                            style={({ pressed }) => [
                              s.calendarCell,
                              {
                                backgroundColor: statusBg,
                                borderColor: statusBorder,
                                borderWidth: isToday ? 2 : 1.5,
                                opacity: isPast ? 0.48 : 1,
                                transform: [{ scale: !isPast && pressed ? 0.95 : 1 }],
                              },
                              Platform.select({
                                web: {
                                  cursor: isPast ? "not-allowed" : "pointer",
                                  userSelect: "none",
                                } as any,
                                default: {},
                              }),
                            ]}
                          >
                            <View style={s.dayFill}>
                              <Text style={[s.dayNumber, isPast && s.dayNumberPast]}>{cell.day}</Text>
                              <Text
                                numberOfLines={1}
                                style={[
                                  s.dayStatusLabel,
                                  isPast && { color: statusTextColor, opacity: 0.8 },
                                ]}
                              >
                                {statusLabel}
                              </Text>
                            </View>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>

              {/* Interactive Help Hint */}
              <View style={s.calendarFooterNote}>
                <Info size={14} color={colors.gold} />
                <Text style={s.calendarFooterNoteText}>
                  💡 <Text style={{ color: colors.gold, fontFamily: fontFamilies.sansBold }}>Tip:</Text> Click any date cell to open the offline bookings ledger, add guest reservations, or block dates.
                </Text>
              </View>
            </Panel>
          </View>

          {/* RIGHT COLUMN: Villa Selector, Rates & Special Dates */}
          <View style={isDesktop ? s.widescreenRightCol : undefined}>
            {/* 1. Villa Unit Switcher */}
            <Panel style={s.villaPanel}>
              <View style={s.row}>
                <View style={s.roundIcon}>
                  <Building2 size={18} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.selectLabel}>
                    Select {isVilla ? "Villa Unit" : getAccommodationUnitLabel(propertyCategory)}
                  </Text>
                  <Text style={s.selectSub}>
                    {units.length} active {isVilla ? "units" : "types"} • {propertyTotalCapacity} total property capacity
                  </Text>
                </View>
                <PressableScale
                  onPress={() => setVillaOpen((v) => !v)}
                  style={s.villaSelect}
                >
                  <SelectBox value={villa} dark />
                </PressableScale>
              </View>

              {villaOpen ? (
                <View style={s.menu}>
                  {units.map((v) => (
                    <PressableScale
                      key={v.id}
                      onPress={() => {
                        setUnitId(v.id);
                        setVillaOpen(false);
                      }}
                      style={[s.menuItem, v.id === unit?.id && s.menuActive]}
                    >
                      <Text style={[s.menuText, v.id === unit?.id && s.gold]}>
                        {v.name}
                      </Text>
                    </PressableScale>
                  ))}
                </View>
              ) : null}
            </Panel>

            {/* 2. Standard Rates & Pricing Editor */}
            <Panel style={s.ratesPanel}>
              <View style={s.titleIconRow}>
                <View style={s.smallRound}>
                  <CalendarRange size={16} color={colors.gold} />
                </View>
                <Text style={s.sectionTitle}>Standard Rates</Text>
              </View>

              <View style={s.unitLabel}>
                <View style={s.goldDot} />
                <Text style={s.unitLabelText}>{villa}</Text>
              </View>

              {/* Rate Stat Pills */}
              <View style={s.rateRow}>
                <Rate
                  tone="blue"
                  label="Weekday (Base)"
                  value={`₹${cleanNumber(weekday).toLocaleString("en-IN")}`}
                />
                <Rate
                  tone="green"
                  label="Weekend Rate"
                  value={`₹${cleanNumber(weekend).toLocaleString("en-IN")}`}
                />
                <Rate
                  tone="purple"
                  label="Special Overrides"
                  value={`${specials.length} dates`}
                />
              </View>

              {/* Price Inputs */}
              <View style={s.inputRow}>
                <PriceInput
                  label="Weekday Base Price"
                  value={weekday}
                  onChange={setWeekday}
                />
                <PriceInput
                  label="Weekend Price"
                  value={weekend}
                  onChange={setWeekend}
                />
              </View>

              {/* Special Date Price Section */}
              <View style={s.specialHeader}>
                <View>
                  <Text style={s.specialTitle}>Special Date Prices</Text>
                  <Text style={s.specialSub}>Custom festival/holiday overrides</Text>
                </View>
                <PressableScale
                  onPress={() =>
                    setSpecials((rows) => [
                      ...rows,
                      {
                        id: String(Date.now()),
                        date: localIso(new Date()),
                        price: weekend || "15000",
                      },
                    ])
                  }
                  style={s.addDate}
                >
                  <Plus size={14} color={colors.gold} />
                  <Text style={s.addDateText}>Add Date</Text>
                </PressableScale>
              </View>

              {specials.map((row) => (
                <View key={row.id} style={s.specialRow}>
                  <EditableInput
                    label="Date (YYYY-MM-DD)"
                    value={row.date}
                    onChange={(value) =>
                      setSpecials((rows) =>
                        rows.map((item) =>
                          item.id === row.id ? { ...item, date: value } : item
                        )
                      )
                    }
                  />
                  <EditableInput
                    label="Override Price"
                    value={row.price}
                    onChange={(value) =>
                      setSpecials((rows) =>
                        rows.map((item) =>
                          item.id === row.id ? { ...item, price: value } : item
                        )
                      )
                    }
                    numeric
                  />
                  <PressableScale
                    accessibilityLabel="Remove special date"
                    onPress={() =>
                      setSpecials((rows) => rows.filter((r) => r.id !== row.id))
                    }
                    style={s.trash}
                  >
                    <Trash2 size={16} color="#F87171" />
                  </PressableScale>
                </View>
              ))}

              <GoldButton disabled={busy} onPress={() => void saveRates()}>
                {busy ? (
                  <ActivityIndicator color={colors.actionInk} />
                ) : (
                  <>
                    <CalendarDays size={16} color={colors.actionInk} />
                    <Text style={s.goldButtonText}>Update Rates &amp; Sync Calendars</Text>
                  </>
                )}
              </GoldButton>
            </Panel>
          </View>
        </View>
      </View>

      {/* ======================================================== */}
      {/* 3. DATE LEDGER & OFFLINE BOOKING POPUP MODAL (PawnaHaven) */}
      {/* ======================================================== */}
      <Modal
        visible={ledgerModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLedgerModalOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, isDesktop && s.modalCardDesktop]}>
            {/* Modal Header */}
            <View style={s.modalHeader}>
              <View style={{ flex: 1 }}>
                <View style={s.modalBadgeRow}>
                  <Building2 size={13} color={colors.gold} />
                  <Text style={s.modalUnitName}>{villa}</Text>
                </View>
                <Text style={s.modalDateTitle}>
                  {selectedDate
                    ? selectedDate.toLocaleDateString("en-IN", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Date Ledger"}
                </Text>
              </View>

              <PressableScale
                onPress={() => setLedgerModalOpen(false)}
                style={s.modalCloseBtn}
              >
                <X size={18} color="#fff" />
              </PressableScale>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={s.modalScroll}>
              {/* Unit Status & Capacity Banner */}
              {(() => {
                const dayNum = selectedDate ? selectedDate.getDate() : 1;
                const rec = dayRecord(dayNum);
                const hasPending = dateEntries.some((e) => {
                  const s = String(e.booking_status || "").toUpperCase();
                  return [
                    "PENDING",
                    "PENDING_OWNER_CONFIRMATION",
                    "BOOKING_REQUEST_SENT_TO_OWNER",
                    "PAYMENT_PENDING",
                  ].includes(s);
                });
                const propertyCategory = data?.property?.category || (unit as any)?.category;
                const isVilla = isBinaryProperty(propertyCategory);
                const isDayBooked = isVilla
                  ? (rec?.status === "booked" || (rec?.available_quantity === 0 && !hasPending) || (!hasPending && dateEntries.length > 0 && rec?.status !== "pending"))
                  : (rec?.status === "booked" || (rec?.available_quantity === 0 && rec?.status !== "pending" && !hasPending));
                const isDayPending =
                  !isDayBooked &&
                  (rec?.status === "pending" || (rec as any)?.is_pending || hasPending);
                const isDayLimited =
                  !isDayBooked &&
                  !isDayPending &&
                  (rec?.status === "limited" || (!isVilla && typeof rec?.available_quantity === "number" && rec.available_quantity < (unit?.total_inventory || 1)));

                const statusBg = isDayBooked ? "#EF4444" : isDayPending ? "#EAB308" : isDayLimited ? "#D97706" : "#22C55E";
                const statusTextColor = isDayBooked
                  ? "#FCA5A5"
                  : isDayPending
                  ? "#FDE047"
                  : isDayLimited
                  ? "#FDE68A"
                  : "#86EFAC";
                const modalUnitPersons = Number(unit?.total_persons) || 1;
                const modalUnitInventory = Number(unit?.total_inventory) || 1;
                const modalTotalSeats = rec?.total_seats ?? (modalUnitInventory * modalUnitPersons);
                const modalBookedSeats = typeof rec?.booked_seats === "number"
                  ? rec.booked_seats
                  : isDayBooked
                  ? modalTotalSeats
                  : typeof rec?.available_quantity === "number"
                  ? Math.max(0, (modalUnitInventory - rec.available_quantity) * modalUnitPersons)
                  : 0;
                const modalAvailableSeats = Math.max(0, modalTotalSeats - modalBookedSeats);

                const statusLabel = isVilla
                  ? (isDayBooked ? "BOOKED" : isDayPending ? "PENDING" : "AVAILABLE")
                  : isDayBooked
                  ? `FULLY BOOKED (${modalTotalSeats}/${modalTotalSeats} SEATS)`
                  : isDayPending
                  ? "PENDING"
                  : isDayLimited
                  ? `${modalBookedSeats}/${modalTotalSeats} SEATS BOOKED (${modalAvailableSeats} AVAILABLE)`
                  : `AVAILABLE (0/${modalTotalSeats} SEATS BOOKED)`;

{/* Inventory Availability Controls for Quantity-based properties */}
              {(unit?.total_inventory || 1) > 1 ? (
                <View style={s.modalInventoryControlBox}>
                  <View style={s.modalInventoryHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Layers size={15} color={colors.gold} />
                      <Text style={s.modalInventoryTitle}>UNITS AVAILABLE FOR THIS DATE</Text>
                    </View>
                    <Text style={s.modalInventorySub}>
                      Total Stock: <Text style={{ color: colors.gold, fontFamily: fontFamilies.sansBold }}>{unit?.total_inventory || 1}</Text> units ({categoryTotalCapacity} seats)
                    </Text>
                  </View>

                  <View style={s.inventoryStepperRow}>
                    <View style={s.inventoryStepper}>
                      <PressableScale
                        disabled={busy || customAvailableUnits <= 0}
                        onPress={() => setCustomAvailableUnits((prev) => Math.max(0, prev - 1))}
                        style={[s.stepperBtn, customAvailableUnits <= 0 && s.stepperBtnDisabled]}
                      >
                        <Minus size={16} color={customAvailableUnits <= 0 ? colors.textMuted : colors.gold} />
                      </PressableScale>

                      <View style={s.stepperValueBox}>
                        <Text style={s.stepperValueText}>{customAvailableUnits}</Text>
                        <Text style={s.stepperValueSub}>of {unit?.total_inventory || 1} available ({customAvailableUnits * (unit?.total_persons || 1)} seats)</Text>
                      </View>

                      <PressableScale
                        disabled={busy || customAvailableUnits >= (unit?.total_inventory || 1)}
                        onPress={() => setCustomAvailableUnits((prev) => Math.min(unit?.total_inventory || 1, prev + 1))}
                        style={[s.stepperBtn, customAvailableUnits >= (unit?.total_inventory || 1) && s.stepperBtnDisabled]}
                      >
                        <Plus size={16} color={customAvailableUnits >= (unit?.total_inventory || 1) ? colors.textMuted : colors.gold} />
                      </PressableScale>
                    </View>

                    <View style={s.inventoryActionBtnGroup}>
                      <PressableScale
                        disabled={busy}
                        onPress={() => {
                          setCustomAvailableUnits(0);
                          void handleSaveInventoryAvailability(0);
                        }}
                        style={s.blockAllBtn}
                      >
                        <Ban size={13} color="#EF4444" />
                        <Text style={s.blockAllBtnText}>Block All (0)</Text>
                      </PressableScale>

                      <PressableScale
                        disabled={busy}
                        onPress={() => {
                          const def = unit?.total_inventory || 1;
                          setCustomAvailableUnits(def);
                          void handleSaveInventoryAvailability(def, true);
                        }}
                        style={s.resetDefaultBtn}
                      >
                        <RotateCcw size={13} color={colors.gold} />
                        <Text style={s.resetDefaultBtnText}>Reset Max</Text>
                      </PressableScale>
                    </View>
                  </View>

                  <View style={{ marginTop: 10 }}>
                    <GoldButton
                      disabled={busy}
                      onPress={() => void handleSaveInventoryAvailability()}
                    >
                      {busy ? (
                        <ActivityIndicator color={colors.actionInk} />
                      ) : (
                        <>
                          <Save size={14} color={colors.actionInk} />
                          <Text style={s.goldButtonText}>Save Units Availability ({customAvailableUnits} units)</Text>
                        </>
                      )}
                    </GoldButton>
                  </View>
                </View>
              ) : null}

                              return (
                  <View style={s.statusCapacityBanner}>
                    <View>
                      <Text style={s.statusCapacityLabel}>DATE AVAILABILITY</Text>
                      <View style={s.statusPillRow}>
                        <View
                          style={[
                            s.statusPillDot,
                            { backgroundColor: statusBg },
                          ]}
                        />
                        <Text
                          style={[
                            s.statusPillText,
                            { color: statusTextColor },
                          ]}
                        >
                          {statusLabel}
                        </Text>
                      </View>
                      <Text style={s.capacityHint}>
                        {isVilla
                          ? `Max capacity: ${unitCapacity} guests`
                          : `Total category capacity: ${categoryTotalCapacity} guests (${unit?.total_persons || 1} guests/unit • ${unit?.total_inventory || 1} units)`}
                      </Text>
                    </View>

                    {/* Add / Edit Booking Toggle Button */}
                    <PressableScale
                      onPress={() => {
                        if (showAddBookingForm) {
                          if (isDayBooked) {
                            setCancelConfirmOpen(true);
                          } else {
                            setShowAddBookingForm(false);
                            setEditingEntry(null);
                          }
                          return;
                        }
                        const existingOfflineEntry = dateEntries.find((e) => e.source === "offline");
                        if (existingOfflineEntry) {
                          setEditingEntry(existingOfflineEntry);
                          setGuestName(existingOfflineEntry.customer_name);
                          setGuestPersons(String(existingOfflineEntry.persons || unitCapacity));
                          setGuestAmount(String(existingOfflineEntry.amount || existingOfflineEntry.total_amount || ""));
                          setGuestCheckIn(String(existingOfflineEntry.check_in).slice(0, 10));
                          setGuestCheckOut(String(existingOfflineEntry.check_out).slice(0, 10));
                        }
                        setShowAddBookingForm(true);
                      }}
                      style={s.addBookingToggleBtn}
                    >
                      {showAddBookingForm ? (
                        <>
                          <X size={14} color="#fff" />
                          <Text style={s.addBookingToggleText}>Cancel</Text>
                        </>
                      ) : isDayBooked ? (
                        <>
                          <FilePenLine size={14} color={colors.actionInk} strokeWidth={2.2} />
                          <Text
                            style={[s.addBookingToggleText, { color: colors.actionInk }]}
                          >
                            Edit Booking
                          </Text>
                        </>
                      ) : (
                        <>
                          <Plus size={14} color={colors.actionInk} strokeWidth={2.5} />
                          <Text
                            style={[s.addBookingToggleText, { color: colors.actionInk }]}
                          >
                            Add Offline Booking
                          </Text>
                        </>
                      )}
                    </PressableScale>
                  </View>
                );
              })()}

              {/* ADD / EDIT OFFLINE BOOKING FORM */}
              {showAddBookingForm ? (
                <View style={s.modalFormBox}>
                  <Text style={s.modalFormHeading}>
                    {editingEntry ? "Edit Offline Booking" : "New Offline Guest Booking"}
                  </Text>

                  {/* Customer Name */}
                  <View style={s.field}>
                    <Text style={s.fieldLabel}>Customer / Guest Full Name</Text>
                    <View style={s.inputShell}>
                      <User size={15} color={colors.gold} />
                      <TextInput
                        value={guestName}
                        onChangeText={setGuestName}
                        placeholder="e.g. Rajesh Patil"
                        placeholderTextColor={colors.textMuted}
                        style={s.input}
                      />
                    </View>
                  </View>

                  {/* Persons & Amount Grid */}
                  <View style={s.inputRow}>
                    <View style={s.field}>
                      <Text style={s.fieldLabel}>
                        Persons (Max {isVilla ? unitCapacity : categoryTotalCapacity})
                      </Text>
                      <View style={s.inputShell}>
                        <Users size={15} color={colors.gold} />
                        <TextInput
                          value={guestPersons}
                          onChangeText={setGuestPersons}
                          keyboardType="numeric"
                          placeholder="2"
                          placeholderTextColor={colors.textMuted}
                          style={s.input}
                        />
                      </View>
                    </View>

                    <View style={s.field}>
                      <Text style={s.fieldLabel}>Total Booking Amount (₹)</Text>
                      <View style={s.inputShell}>
                        <Text style={s.currency}>₹</Text>
                        <TextInput
                          value={guestAmount}
                          onChangeText={setGuestAmount}
                          keyboardType="numeric"
                          placeholder="12000"
                          placeholderTextColor={colors.textMuted}
                          style={s.input}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Payment Mode */}
                  <View style={s.field}>
                    <Text style={s.fieldLabel}>Payment Mode</Text>
                    <View style={s.payModeToggleRow}>
                      <PressableScale
                        onPress={() => setGuestPayMode("offline")}
                        style={[
                          s.payModeBtn,
                          guestPayMode === "offline" && s.payModeBtnActive,
                        ]}
                      >
                        <CreditCard size={14} color={guestPayMode === "offline" ? colors.actionInk : colors.gold} />
                        <Text
                          style={[
                            s.payModeBtnText,
                            guestPayMode === "offline" && s.payModeBtnTextActive,
                          ]}
                        >
                          Offline (Cash / UPI)
                        </Text>
                      </PressableScale>

                      <PressableScale
                        onPress={() => setGuestPayMode("online")}
                        style={[
                          s.payModeBtn,
                          guestPayMode === "online" && s.payModeBtnActive,
                        ]}
                      >
                        <CreditCard size={14} color={guestPayMode === "online" ? colors.actionInk : colors.gold} />
                        <Text
                          style={[
                            s.payModeBtnText,
                            guestPayMode === "online" && s.payModeBtnTextActive,
                          ]}
                        >
                          Online Transfer
                        </Text>
                      </PressableScale>
                    </View>
                  </View>

                  {/* Dates Row */}
                  <View style={s.inputRow}>
                    <View style={s.field}>
                      <Text style={s.fieldLabel}>Check-in Date</Text>
                      <View style={s.inputShell}>
                        <TextInput
                          value={guestCheckIn}
                          onChangeText={setGuestCheckIn}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor={colors.textMuted}
                          style={s.input}
                        />
                      </View>
                    </View>

                    <View style={s.field}>
                      <Text style={s.fieldLabel}>Check-out Date</Text>
                      <View style={s.inputShell}>
                        <TextInput
                          value={guestCheckOut}
                          onChangeText={setGuestCheckOut}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor={colors.textMuted}
                          style={s.input}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={s.modalFormBtnRow}>
                    <View style={{ flex: 1 }}>
                      <GoldButton
                        disabled={busy}
                        onPress={() => void handleSaveOfflineBooking()}
                      >
                        {busy ? (
                          <ActivityIndicator color={colors.actionInk} />
                        ) : (
                          <>
                            <Save size={16} color={colors.actionInk} />
                            <Text style={s.goldButtonText}>
                              {editingEntry ? "Update Booking" : "Save Booking & Lock Date"}
                            </Text>
                          </>
                        )}
                      </GoldButton>
                    </View>

                    {dateEntries.length > 0 ||
                    dayRecord(selectedDate ? selectedDate.getDate() : 1)?.status === "booked" ||
                    editingEntry ? (
                      <PressableScale
                        onPress={() => setCancelConfirmOpen(true)}
                        style={s.cancelReleaseBtn}
                      >
                        <Trash2 size={15} color="#EF4444" />
                        <Text style={s.cancelReleaseBtnText}>Cancel & Release</Text>
                      </PressableScale>
                    ) : (
                      <PressableScale
                        onPress={() => {
                          setShowAddBookingForm(false);
                          setEditingEntry(null);
                        }}
                        style={s.cancelReleaseBtnSecondary}
                      >
                        <X size={15} color="#A1A1AA" />
                        <Text style={s.cancelReleaseBtnSecondaryText}>Cancel</Text>
                      </PressableScale>
                    )}
                  </View>
                </View>
              ) : null}

              {/* EXISTING BOOKINGS LIST FOR THIS DATE */}
              <View style={s.modalEntriesSection}>
                <Text style={s.modalEntriesHeading}>
                  RESERVATIONS ON THIS DATE ({dateEntries.length})
                </Text>

                {ledgerLoading ? (
                  <View style={s.modalLoadingBox}>
                    <ActivityIndicator color={colors.gold} />
                    <Text style={s.modalLoadingText}>Loading reservations...</Text>
                  </View>
                ) : dateEntries.length > 0 ? (
                  dateEntries.map((entry, idx) => {
                    const isOnline = entry.source === "website" || (entry.source as string) === "online";
                    const rawStatus = String(entry.booking_status || "").toUpperCase();
                    const isPending = [
                      "PENDING",
                      "PENDING_OWNER_CONFIRMATION",
                      "BOOKING_REQUEST_SENT_TO_OWNER",
                      "PAYMENT_PENDING",
                    ].includes(rawStatus);

                    return (
                      <View
                        key={entry.id || idx}
                        style={[
                          s.modalEntryCard,
                          isOnline && s.modalEntryCardOnline,
                          isPending && {
                            borderColor: "rgba(234, 179, 8, 0.4)",
                            backgroundColor: "rgba(234, 179, 8, 0.05)",
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={s.modalEntryLeft}>
                            <View
                              style={[
                                s.modalEntryIndex,
                                isOnline && s.modalEntryIndexOnline,
                                isPending && {
                                  backgroundColor: "rgba(234, 179, 8, 0.18)",
                                  borderColor: "rgba(234, 179, 8, 0.35)",
                                },
                              ]}
                            >
                              {isOnline ? (
                                <Globe size={16} color={isPending ? "#EAB308" : "#60A5FA"} />
                              ) : (
                                <Text
                                  style={[
                                    s.modalEntryIndexText,
                                    isPending && { color: "#EAB308" },
                                  ]}
                                >
                                  #{idx + 1}
                                </Text>
                              )}
                            </View>
                            <View style={{ flex: 1 }}>
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  flexWrap: "wrap",
                                  gap: 6,
                                }}
                              >
                                <Text style={s.modalEntryName}>
                                  {entry.customer_name}
                                </Text>
                                <Text
                                  style={[
                                    s.modalEntryAmount,
                                    isOnline && s.modalEntryAmountOnline,
                                    isPending && { color: "#EAB308" },
                                  ]}
                                >
                                  ₹{cleanNumber(entry.total_amount || entry.amount).toLocaleString("en-IN")}
                                </Text>
                              </View>
                              <Text style={s.modalEntryDates}>
                                📅 {String(entry.check_in).slice(0, 10)} → {String(entry.check_out).slice(0, 10)}
                              </Text>
                              <Text style={{ color: colors.gold, fontFamily: fontFamilies.sansSemiBold, fontSize: 11, marginBottom: 4 }}>
                                🕒 Check-in: {entry.check_in_time || "02:00 PM"} &bull; Check-out: {entry.check_out_time || "11:00 AM"}
                              </Text>
                              {isOnline && entry.booking_id ? (
                                <View style={s.ownerTicketIdPill}>
                                  <Text selectable style={s.ownerTicketIdText}>TICKET ID: {ticketIdForDisplay(entry.ticket_id, entry.booking_id)}</Text>
                                </View>
                              ) : null}
                              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                                <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: "rgba(59, 130, 246, 0.12)" }}>
                                  <Text style={{ color: "#60A5FA", fontFamily: fontFamilies.sansSemiBold, fontSize: 10.5 }}>
                                    👨 {entry.male_guest_count ?? entry.persons ?? 1} Male • 👩 {entry.female_guest_count ?? 0} Female
                                  </Text>
                                </View>
                                <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: "rgba(16, 185, 129, 0.12)" }}>
                                  <Text style={{ color: "#34D399", fontFamily: fontFamilies.sansSemiBold, fontSize: 10.5 }}>
                                    🥗 {entry.veg_guest_count ?? entry.persons ?? 1} Veg • 🍗 {entry.nonveg_guest_count ?? 0} Non-Veg
                                  </Text>
                                </View>
                              </View>
                              <View style={s.modalEntryBadges}>
                                <View
                                  style={[
                                    s.modalEntrySourceBadge,
                                    isOnline && s.modalEntrySourceBadgeOnline,
                                    isPending && {
                                      backgroundColor: "rgba(234, 179, 8, 0.15)",
                                      borderColor: "rgba(234, 179, 8, 0.3)",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      s.modalEntrySourceText,
                                      isOnline && s.modalEntrySourceTextOnline,
                                      isPending && { color: "#EAB308" },
                                    ]}
                                  >
                                    {isOnline ? "ONLINE (APP / WEB)" : "OFFLINE BOOKING"}
                                  </Text>
                                </View>
                                <Text style={s.modalEntryPersons}>
                                  👥 {entry.persons || unitCapacity} guests
                                </Text>
                                {entry.booking_status ? (
                                  <View
                                    style={[
                                      s.modalStatusBadge,
                                      isPending && {
                                        backgroundColor: "rgba(234, 179, 8, 0.2)",
                                        borderColor: "rgba(234, 179, 8, 0.4)",
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        s.modalStatusText,
                                        isPending && { color: "#FDE047" },
                                      ]}
                                    >
                                      {isPending
                                        ? "PENDING CONFIRMATION"
                                        : entry.booking_status.toUpperCase()}
                                    </Text>
                                  </View>
                                ) : null}
                              </View>
                            </View>
                          </View>

                          {/* Quick Actions Row */}
                          <View
                            style={{
                              marginTop: 12,
                              paddingTop: 10,
                              borderTopWidth: 1,
                              borderTopColor: "rgba(255, 255, 255, 0.08)",
                              flexDirection: "row",
                              gap: 8,
                              alignItems: "center",
                              justifyContent: "flex-end",
                              flexWrap: "wrap",
                            }}
                          >
                            {isPending ? (
                              <>
                                <PressableScale
                                  disabled={busy}
                                  onPress={() => void handleRejectReservation(entry)}
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 5,
                                    paddingHorizontal: 12,
                                    paddingVertical: 7,
                                    borderRadius: 8,
                                    backgroundColor: "rgba(239, 68, 68, 0.12)",
                                    borderWidth: 1,
                                    borderColor: "rgba(239, 68, 68, 0.4)",
                                  }}
                                >
                                  <XCircle size={14} color="#EF4444" />
                                  <Text
                                    style={{
                                      color: "#EF4444",
                                      fontFamily: fontFamilies.sansBold,
                                      fontSize: 11.5,
                                    }}
                                  >
                                    Reject Request
                                  </Text>
                                </PressableScale>

                                <PressableScale
                                  disabled={busy}
                                  onPress={() => void handleAcceptReservation(entry)}
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 5,
                                    paddingHorizontal: 14,
                                    paddingVertical: 7,
                                    borderRadius: 8,
                                    backgroundColor: "#16A34A",
                                    borderWidth: 1,
                                    borderColor: "rgba(34, 197, 94, 0.8)",
                                  }}
                                >
                                  <CheckCircle2 size={14} color="#fff" />
                                  <Text
                                    style={{
                                      color: "#fff",
                                      fontFamily: fontFamilies.sansBold,
                                      fontSize: 11.5,
                                    }}
                                  >
                                    Accept Request
                                  </Text>
                                </PressableScale>
                              </>
                            ) : (
                              <>
                                {!isOnline ? (
                                  <PressableScale
                                    onPress={() => {
                                      setEditingEntry(entry);
                                      setGuestName(entry.customer_name);
                                      setGuestPersons(String(entry.persons || unitCapacity));
                                      setGuestAmount(String(entry.amount || entry.total_amount || ""));
                                      setGuestCheckIn(String(entry.check_in).slice(0, 10));
                                      setGuestCheckOut(String(entry.check_out).slice(0, 10));
                                      setShowAddBookingForm(true);
                                    }}
                                    style={{
                                      flexDirection: "row",
                                      alignItems: "center",
                                      gap: 5,
                                      paddingHorizontal: 10,
                                      paddingVertical: 6,
                                      borderRadius: 8,
                                      backgroundColor: "rgba(224, 184, 74, 0.12)",
                                      borderWidth: 1,
                                      borderColor: "rgba(224, 184, 74, 0.35)",
                                    }}
                                  >
                                    <FilePenLine size={13} color={colors.gold} />
                                    <Text
                                      style={{
                                        color: colors.gold,
                                        fontFamily: fontFamilies.sansSemiBold,
                                        fontSize: 11,
                                      }}
                                    >
                                      Edit
                                    </Text>
                                  </PressableScale>
                                ) : null}

                                <PressableScale
                                  disabled={busy}
                                  onPress={() => void handleCancelBookedReservation(entry)}
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 5,
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 8,
                                    backgroundColor: "rgba(239, 68, 68, 0.12)",
                                    borderWidth: 1,
                                    borderColor: "rgba(239, 68, 68, 0.35)",
                                  }}
                                >
                                  <Trash2 size={13} color="#EF4444" />
                                  <Text
                                    style={{
                                      color: "#EF4444",
                                      fontFamily: fontFamilies.sansSemiBold,
                                      fontSize: 11,
                                    }}
                                  >
                                    Cancel Booking
                                  </Text>
                                </PressableScale>
                              </>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={s.modalEmptyBox}>
                    <Text style={s.modalEmptyText}>
                      No reservations recorded for this date.
                    </Text>
                  </View>
                )}
              </View>

              {/* Quick Toggle Day Button */}
              {selectedDate ? (
                <View style={s.quickToggleDayWrap}>
                  <PressableScale
                    onPress={() =>
                      handleToggleDayDirectly(
                        localIso(selectedDate),
                        dayRecord(selectedDate.getDate())?.status || "available"
                      )
                    }
                    style={s.quickToggleBtn}
                  >
                    <RefreshCw size={14} color={colors.gold} />
                    <Text style={s.quickToggleBtnText}>
                      Toggle Date:{" "}
                      {dayRecord(selectedDate.getDate())?.status === "booked"
                        ? "Mark as AVAILABLE 🟢"
                        : "Mark as BOOKED 🔴"}
                    </Text>
                  </PressableScale>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CONFIRMATION POPUP FOR ACCIDENTAL TOUCH SAFEGUARD */}
      <Modal
        visible={cancelConfirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelConfirmOpen(false)}
      >
        <View style={s.confirmModalOverlay}>
          <View style={s.confirmModalCard}>
            <View style={s.confirmModalIconBox}>
              <AlertTriangle size={32} color="#EF4444" />
            </View>

            <Text style={s.confirmModalTitle}>Release Date to Available?</Text>

            <Text style={s.confirmModalDesc}>
              Are you sure you want to cancel and mark{" "}
              <Text style={{ color: colors.gold, fontFamily: fontFamilies.sansBold }}>
                {selectedDate
                  ? selectedDate.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "this date"}
              </Text>{" "}
              as AVAILABLE?
              {"\n\n"}
              This will remove the offline reservation and unlock the calendar cell for new guest bookings.
            </Text>

            <View style={s.confirmModalActions}>
              <PressableScale
                onPress={() => setCancelConfirmOpen(false)}
                style={s.confirmModalBtnCancel}
              >
                <Text style={s.confirmModalBtnCancelText}>No, Keep Booked</Text>
              </PressableScale>

              <PressableScale
                disabled={busy}
                onPress={() => void handleConfirmReleaseDate()}
                style={s.confirmModalBtnConfirm}
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.confirmModalBtnConfirmText}>
                    Yes, Release to Available
                  </Text>
                )}
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>
    </Page>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <View style={s.legendItem}>
      <View style={[s.legendDot, { backgroundColor: color }]} />
      <Text style={s.legendText}>{text}</Text>
    </View>
  );
}

function Rate({
  tone,
  label,
  value,
}: {
  tone: "blue" | "green" | "purple";
  label: string;
  value: string;
}) {
  const p =
    tone === "blue"
      ? ["rgba(30,58,95,.55)", "#93C5FD"]
      : tone === "green"
      ? ["rgba(20,83,45,.55)", "#86EFAC"]
      : ["rgba(76,29,149,.55)", "#D8B4FE"];

  return (
    <View style={[s.rate, { backgroundColor: p[0], borderColor: p[1] + "59" }]}>
      <Text numberOfLines={1} style={s.rateLabel}>
        {label}
      </Text>
      <Text style={s.rateValue}>{value}</Text>
    </View>
  );
}

function PriceInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.inputShell}>
        <Text style={s.currency}>₹</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholderTextColor={colors.textMuted}
          style={s.input}
        />
      </View>
    </View>
  );
}

function EditableInput({
  label,
  value,
  onChange,
  numeric,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  numeric?: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? "numeric" : "default"}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        style={[s.inputShell, s.editableInput, multiline && s.multiline]}
      />
    </View>
  );
}

function OwnerImages({
  token,
  images,
  onChange,
  onError,
}: {
  token: string;
  images: string[];
  onChange: (images: string[]) => void;
  onError: (message: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const pick = async () => {
    try {
      if (Platform.OS !== "web") {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted)
          throw new Error("Photo access is required to upload images.");
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        allowsMultipleSelection: true,
        selectionLimit: Math.max(1, 20 - images.length),
      });
      if (result.canceled) return;
      setUploading(true);
      const uploaded = await Promise.all(
        result.assets.map((asset) => uploadImage(token, asset, true))
      );
      onChange([...images, ...uploaded.map((item) => item.url)].slice(0, 20));
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Unable to upload image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={s.ownerMedia}>
      <Text style={s.fieldLabel}>Property &amp; Unit Media Gallery</Text>
      <View style={s.ownerMediaRow}>
        {images.map((uri, index) => (
          <View key={`${uri}-${index}`} style={s.ownerMediaItem}>
            <Image source={{ uri }} contentFit="cover" style={StyleSheet.absoluteFill} />
            <PressableScale
              accessibilityLabel="Remove image"
              onPress={() =>
                onChange(images.filter((_, itemIndex) => itemIndex !== index))
              }
              style={s.ownerMediaRemove}
            >
              <X size={12} color="#fff" />
            </PressableScale>
          </View>
        ))}
        <PressableScale onPress={() => void pick()} style={s.ownerMediaAdd}>
          {uploading ? (
            <ActivityIndicator color={colors.gold} />
          ) : (
            <>
              <ImagePlus size={19} color={colors.gold} />
              <Text style={s.ownerMediaAddText}>Upload</Text>
            </>
          )}
        </PressableScale>
      </View>
    </View>
  );
}

// ==========================================
// 2. OWNER BOOKINGS LEDGER SCREEN
// ==========================================
export function OwnerBookingsScreen() {
  const { token, data, loading, error } = useOwnerDashboard();
  const isDesktop = useIsWideScreen();
  const [cursor, setCursor] = useState(() => new Date());
  const currentYear = cursor.getFullYear();
  const currentMonth = cursor.getMonth() + 1;

  const [entries, setEntries] = useState<OwnerLedgerEntry[]>([]);
  const [unitFilter, setUnitFilter] = useState<number | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "online" | "offline">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OwnerLedgerEntry | null>(null);
  const [name, setName] = useState("");
  const [persons, setPersons] = useState("1");
  const [checkIn, setCheckIn] = useState(localIso(new Date()));
  const [checkOut, setCheckOut] = useState(
    localIso(new Date(Date.now() + 86400000))
  );
  const [amount, setAmount] = useState("");
  const [unitId, setUnitId] = useState<number>();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    if (!token) return;
    try {
      const result = await getProtectedOwnerLedger(
        token,
        currentYear,
        currentMonth,
        unitFilter
      );
      setEntries(result.data);
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Unable to load ledger."
      );
    }
  };

  useEffect(() => {
    void load();
  }, [token, currentYear, currentMonth, unitFilter]);

  useEffect(() => {
    if (!unitId && data?.units[0]) setUnitId(data.units[0].id);
  }, [data, unitId]);

  const reset = () => {
    setEditing(null);
    setName("");
    setPersons("1");
    setAmount("");
    setCheckIn(localIso(cursor));
    setCheckOut(
      localIso(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1))
    );
    setFormOpen(false);
  };

  const edit = (entry: OwnerLedgerEntry) => {
    setEditing(entry);
    setName(entry.customer_name);
    setPersons(
      String((entry as OwnerLedgerEntry & { persons?: number }).persons || 1)
    );
    setAmount(String(entry.amount || entry.total_amount || 0));
    setCheckIn(String(entry.check_in).slice(0, 10));
    setCheckOut(String(entry.check_out).slice(0, 10));
    if (entry.unit_id) setUnitId(entry.unit_id);
    setFormOpen(true);
  };

  const save = async () => {
    if (!unitId) return;
    setBusy(true);
    setActionError("");
    try {
      const body = {
        unit_id: unitId,
        customer_name: name,
        persons: cleanNumber(persons),
        check_in: checkIn,
        check_out: checkOut,
        payment_mode: "offline" as const,
        amount: cleanNumber(amount),
      };
      if (editing) await updateProtectedLedgerEntry(token, editing.id, body);
      else await createProtectedLedgerEntry(token, body);
      await load();
      reset();
      setNotice(
        editing ? "Offline booking updated." : "Offline booking added successfully."
      );
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Unable to save booking."
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = (entry: OwnerLedgerEntry) =>
    Alert.alert(
      "Delete offline booking",
      `Remove ${entry.customer_name} from the ledger?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            void deleteProtectedLedgerEntry(token, entry.id)
              .then(load)
              .catch((caught) =>
                setActionError(
                  caught instanceof Error
                    ? caught.message
                    : "Unable to delete booking."
                )
              ),
        },
      ]
    );

  const onlineEntries = useMemo(
    () => entries.filter((e) => e.source === "website" || (e.source as string) === "online"),
    [entries]
  );
  const offlineEntries = useMemo(
    () => entries.filter((e) => e.source === "offline"),
    [entries]
  );
  const displayedEntries = useMemo(() => {
    if (sourceFilter === "online") return onlineEntries;
    if (sourceFilter === "offline") return offlineEntries;
    return entries;
  }, [entries, onlineEntries, offlineEntries, sourceFilter]);

  const total = entries
    .filter(
      (item) =>
        ![
          "cancelled",
          "cancelled_by_owner",
          "owner_cancelled",
          "rejected",
          "deleted",
        ].includes(String(item.booking_status || "").toLowerCase())
    )
    .reduce(
      (sum, item) => sum + cleanNumber(item.total_amount ?? item.amount),
      0
    );

  const downloadCsv = () => {
    if (!entries.length) {
      Alert.alert("No Data", "There are no bookings to export for this period.");
      return;
    }
    const headers = [
      "ID",
      "Customer Name",
      "Source",
      "Unit Name",
      "Check In",
      "Check Out",
      "Guests",
      "Payment Mode",
      "Amount (INR)",
      "Status",
    ];
    const rows = displayedEntries.map((e, idx) => [
      idx + 1,
      `"${(e.customer_name || "").replace(/"/g, '""')}"`,
      `"${e.source.toUpperCase()}"`,
      `"${(e.unit_name || "").replace(/"/g, '""')}"`,
      `"${String(e.check_in).slice(0, 10)}"`,
      `"${String(e.check_out).slice(0, 10)}"`,
      e.persons || 1,
      `"${(e.payment_mode || (e.source === "website" ? "online" : "offline")).toUpperCase()}"`,
      cleanNumber(e.total_amount ?? e.amount),
      `"${(e.booking_status || "CONFIRMED").toUpperCase()}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    if (Platform.OS === "web") {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `BookStayX_Bookings_${currentYear}_${String(currentMonth).padStart(2, "0")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert("CSV Export", "CSV Report is ready for download in web browser.");
    }
  };

  const downloadPdf = () => {
    if (!entries.length) {
      Alert.alert("No Data", "There are no bookings to export for this period.");
      return;
    }
    if (Platform.OS === "web") {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        Alert.alert("Popup Blocked", "Please allow popups to print / save the PDF report.");
        return;
      }
      const periodName = cursor.toLocaleString("en-IN", { month: "long", year: "numeric" });
      const propertyName = data?.property?.title || "Owner Property";
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>BookStayX - Bookings Report (${periodName})</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; padding: 32px; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #E0B84A; padding-bottom: 16px; margin-bottom: 24px; }
            .brand { font-size: 26px; font-weight: 800; color: #0F172A; letter-spacing: -0.5px; }
            .brand span { color: #D97706; }
            .meta { font-size: 13px; color: #64748B; margin-top: 4px; }
            .badge { background: #FEF3C7; border: 1px solid #F59E0B; color: #92400E; font-weight: 700; padding: 6px 14px; border-radius: 20px; font-size: 12px; }
            .kpis { display: flex; gap: 16px; margin-bottom: 28px; }
            .kpi { flex: 1; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; background: #F8FAFC; }
            .kpi-title { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748B; letter-spacing: 0.5px; }
            .kpi-val { font-size: 24px; font-weight: 800; color: #0F172A; margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
            th { background: #0F172A; color: #fff; text-align: left; padding: 10px 12px; font-weight: 600; font-size: 12px; }
            td { padding: 11px 12px; border-bottom: 1px solid #E2E8F0; }
            tr:nth-child(even) { background: #F8FAFC; }
            .src-online { color: #2563EB; font-weight: 700; background: #DBEAFE; padding: 3px 8px; border-radius: 6px; font-size: 11px; display: inline-block; }
            .src-offline { color: #B45309; font-weight: 700; background: #FEF3C7; padding: 3px 8px; border-radius: 6px; font-size: 11px; display: inline-block; }
            .amount { text-align: right; font-weight: 700; font-size: 14px; color: #0F172A; }
            .footer { margin-top: 36px; padding-top: 16px; border-top: 2px solid #E2E8F0; display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; }
            @media print {
              body { padding: 12px; }
              @page { size: landscape; margin: 12mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">BookStay<span>X</span> <span style="font-size: 16px; font-weight: 600; color: #64748B;">| Owner Bookings Report</span></div>
              <div class="meta"><strong>Property:</strong> ${propertyName} &nbsp;|&nbsp; <strong>Period:</strong> ${periodName} &nbsp;|&nbsp; <strong>Generated:</strong> ${new Date().toLocaleString("en-IN")}</div>
            </div>
            <div class="badge">OFFICIAL STATEMENT</div>
          </div>

          <div class="kpis">
            <div class="kpi">
              <div class="kpi-title">Total Month Revenue</div>
              <div class="kpi-val">₹${total.toLocaleString("en-IN")}</div>
            </div>
            <div class="kpi">
              <div class="kpi-title">Total Bookings</div>
              <div class="kpi-val">${entries.length}</div>
            </div>
            <div class="kpi">
              <div class="kpi-title">Online App Bookings</div>
              <div class="kpi-val" style="color: #2563EB;">${onlineEntries.length}</div>
            </div>
            <div class="kpi">
              <div class="kpi-title">Offline Bookings</div>
              <div class="kpi-val" style="color: #D97706;">${offlineEntries.length}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Guest Name</th>
                <th>Booking Source</th>
                <th>Unit</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Guests</th>
                <th>Status</th>
                <th>Payment Mode</th>
                <th style="text-align: right;">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              ${displayedEntries.map((e, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${e.customer_name}</strong></td>
                  <td><span class="${e.source === "website" ? "src-online" : "src-offline"}">${e.source === "website" ? "🌐 ONLINE (APP)" : "📝 OFFLINE"}</span></td>
                  <td>${e.unit_name || "Unit"}</td>
                  <td>${String(e.check_in).slice(0, 10)}</td>
                  <td>${String(e.check_out).slice(0, 10)}</td>
                  <td>${e.persons || 1} guests</td>
                  <td><span style="font-weight: 700; color: ${['cancelled', 'cancelled_by_owner', 'rejected'].includes(String(e.booking_status || '').toLowerCase()) ? '#DC2626' : '#16A34A'};">${(e.booking_status || 'CONFIRMED').toUpperCase()}</span></td>
                  <td>${(e.payment_mode || (e.source === "website" ? "Online" : "Offline")).toUpperCase()}</td>
                  <td class="amount" style="${['cancelled', 'cancelled_by_owner', 'rejected'].includes(String(e.booking_status || '').toLowerCase()) ? 'text-decoration: line-through; color: #94A3B8;' : ''}">₹${cleanNumber(e.total_amount ?? e.amount).toLocaleString("en-IN")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="footer">
            <div>Total Records: ${displayedEntries.length}</div>
            <div>Net Period Revenue: ₹${total.toLocaleString("en-IN")}</div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      Alert.alert("PDF Export", "PDF Report print is available directly in web browser.");
    }
  };

  const cycleFilter = () => {
    const options: [number | "all", string][] = [
      ["all", "All Units"],
      ...(data?.units || []).map((u) => [u.id, u.name] as [number, string]),
    ];
    const index = options.findIndex(([id]) => id === unitFilter);
    setUnitFilter(options[(index + 1) % options.length]![0]);
  };

  const filterLabel =
    unitFilter === "all"
      ? "All Units"
      : data?.units.find((u) => u.id === unitFilter)?.name || "All Units";

  return (
    <Page>
      <View style={[s.contentPad, isDesktop && s.contentPadDesktop]}>
        <Message error={error || actionError} notice={notice} />

        {/* Top Header with Month Navigator & Export Buttons */}
        <View style={[s.bookingsTopBar, isDesktop && s.bookingsTopBarDesktop]}>
          {/* Month Switcher */}
          <View style={s.bookingsMonthSwitcher}>
            <PressableScale
              onPress={() => setCursor(new Date(currentYear, currentMonth - 2, 1))}
              style={s.monthArrowSmall}
            >
              <ChevronLeft size={18} color={colors.gold} />
            </PressableScale>
            <Text style={s.bookingsMonthText}>
              {cursor.toLocaleString("en-IN", { month: "long", year: "numeric" })}
            </Text>
            <PressableScale
              onPress={() => setCursor(new Date(currentYear, currentMonth, 1))}
              style={s.monthArrowSmall}
            >
              <ChevronRight size={18} color={colors.gold} />
            </PressableScale>
          </View>

          {/* Export Action Buttons */}
          <View style={s.exportActionsRow}>
            <PressableScale
              onPress={downloadPdf}
              style={[s.exportBtn, s.exportBtnPdf]}
            >
              <FileText size={15} color="#D97706" />
              <Text style={s.exportBtnTextPdf}>Download PDF</Text>
            </PressableScale>

            <PressableScale
              onPress={downloadCsv}
              style={[s.exportBtn, s.exportBtnExcel]}
            >
              <FileSpreadsheet size={15} color="#16A34A" />
              <Text style={s.exportBtnTextExcel}>Download Excel</Text>
            </PressableScale>

            <PressableScale
              onPress={() => setFormOpen((value) => !value)}
              style={s.addBookingBtn}
            >
              <Plus size={15} color={colors.actionInk} strokeWidth={2.2} />
              <Text style={s.addBookingBtnText}>Add Offline</Text>
            </PressableScale>
          </View>
        </View>

        {/* Widescreen KPI Stats Strip */}
        <View style={[s.kpiGrid, isDesktop && s.kpiGridDesktop]}>
          <View style={s.kpiCard}>
            <View style={s.kpiTop}>
              <Text style={s.kpiLabel}>MONTHLY REVENUE</Text>
              <DollarSign size={16} color={colors.gold} />
            </View>
            <Text style={s.kpiValue}>₹{total.toLocaleString("en-IN")}</Text>
            <Text style={s.kpiSub}>Active ledger revenue</Text>
          </View>

          <View style={s.kpiCard}>
            <View style={s.kpiTop}>
              <Text style={s.kpiLabel}>TOTAL BOOKINGS</Text>
              <CalendarCheck2 size={16} color="#86EFAC" />
            </View>
            <Text style={s.kpiValue}>{entries.length}</Text>
            <Text style={s.kpiSub}>Reservations this month</Text>
          </View>

          <View style={s.kpiCard}>
            <View style={s.kpiTop}>
              <Text style={s.kpiLabel}>ONLINE / OFFLINE</Text>
              <Building2 size={16} color="#93C5FD" />
            </View>
            <Text style={s.kpiValue}>
              {onlineEntries.length} <Text style={{ fontSize: 13, color: colors.textMuted }}>online</Text> / {offlineEntries.length} <Text style={{ fontSize: 13, color: colors.textMuted }}>offline</Text>
            </Text>
            <Text style={s.kpiSub}>Multi-channel breakdown</Text>
          </View>
        </View>

        {/* Filter Bar: Unit filter & Source Tabs */}
        <View style={[s.filtersRow, isDesktop && s.filtersRowDesktop]}>
          {/* Source Tabs */}
          <View style={s.filterTabs}>
            <PressableScale
              onPress={() => setSourceFilter("all")}
              style={[s.filterTab, sourceFilter === "all" && s.filterTabActive]}
            >
              <Text style={[s.filterTabText, sourceFilter === "all" && s.filterTabTextActive]}>
                All Bookings ({entries.length})
              </Text>
            </PressableScale>
            <PressableScale
              onPress={() => setSourceFilter("online")}
              style={[s.filterTab, sourceFilter === "online" && s.filterTabActiveOnline]}
            >
              <Globe size={13} color={sourceFilter === "online" ? "#93C5FD" : colors.textMuted} />
              <Text style={[s.filterTabText, sourceFilter === "online" && s.filterTabTextActiveOnline]}>
                Online App ({onlineEntries.length})
              </Text>
            </PressableScale>
            <PressableScale
              onPress={() => setSourceFilter("offline")}
              style={[s.filterTab, sourceFilter === "offline" && s.filterTabActiveOffline]}
            >
              <Text style={[s.filterTabText, sourceFilter === "offline" && s.filterTabTextActiveOffline]}>
                Offline ({offlineEntries.length})
              </Text>
            </PressableScale>
          </View>

          <View style={s.filtersRightWrap}>
            <PressableScale onPress={cycleFilter} style={{ minWidth: 150 }}>
              <SelectBox value={filterLabel} />
            </PressableScale>
          </View>
        </View>

        {formOpen ? (
          <Panel style={s.formPanel}>
            <Text style={s.formTitle}>
              {editing ? "Edit Offline Booking" : "New Offline Booking"}
            </Text>
            <EditableInput label="Guest name" value={name} onChange={setName} />
            <View style={s.inputRow}>
              <EditableInput
                label="Guests count"
                value={persons}
                onChange={setPersons}
                numeric
              />
              <EditableInput
                label="Total amount (₹)"
                value={amount}
                onChange={setAmount}
                numeric
              />
            </View>
            <View style={s.inputRow}>
              <EditableInput
                label="Check-in Date"
                value={checkIn}
                onChange={setCheckIn}
              />
              <EditableInput
                label="Check-out Date"
                value={checkOut}
                onChange={setCheckOut}
              />
            </View>
            <Text style={s.fieldLabel}>Select Unit</Text>
            <View style={s.optionRow}>
              {data?.units.map((u) => (
                <PressableScale
                  key={u.id}
                  onPress={() => setUnitId(u.id)}
                  style={[s.option, unitId === u.id && s.optionActive]}
                >
                  <Text style={[s.optionText, unitId === u.id && s.gold]}>
                    {u.name}
                  </Text>
                </PressableScale>
              ))}
            </View>
            <GoldButton onPress={() => void save()}>
              {busy ? (
                <ActivityIndicator color={colors.actionInk} />
              ) : (
                <>
                  <Save size={16} color={colors.actionInk} />
                  <Text style={s.goldButtonText}>Save Booking</Text>
                </>
              )}
            </GoldButton>
            {editing ? (
              <PressableScale onPress={reset} style={s.cancel}>
                <Text style={s.cancelText}>Cancel editing</Text>
              </PressableScale>
            ) : null}
          </Panel>
        ) : null}

        {/* Ledger Bookings List */}
        <View style={s.ledgerList}>
          {displayedEntries.length ? (
            displayedEntries.map((entry, index) => {
              const isOnline = entry.source === "website" || (entry.source as string) === "online";
              const statusLower = String(entry.booking_status || "").toLowerCase();
              const isCancelled = [
                "cancelled",
                "cancelled_by_owner",
                "owner_cancelled",
                "rejected",
                "deleted",
              ].includes(statusLower);
              const isPending = [
                "pending",
                "pending_approval",
                "requested",
              ].includes(statusLower);

              return (
                <View
                  key={`${entry.source}-${entry.id}-${index}`}
                  style={[
                    s.bookingCard,
                    isDesktop && s.bookingCardDesktop,
                    isOnline && s.bookingCardOnline,
                    isCancelled && { borderColor: "rgba(239, 68, 68, 0.35)", opacity: 0.82 },
                  ]}
                >
                  <View
                    style={[
                      s.bookingId,
                      isOnline && s.bookingIdOnline,
                      isCancelled && { backgroundColor: "rgba(239, 68, 68, 0.12)", borderColor: "rgba(239, 68, 68, 0.35)" },
                    ]}
                  >
                    {isOnline ? (
                      <Globe size={18} color={isCancelled ? "#EF4444" : "#60A5FA"} />
                    ) : (
                      <Text style={[s.bookingIdText, isCancelled && { color: "#EF4444" }]}>#{index + 1}</Text>
                    )}
                  </View>
                  <View style={s.bookingMain}>
                    <View style={s.bookingTitleRow}>
                      <Text style={[s.guest, isCancelled && { color: colors.textSecondary }]}>{entry.customer_name}</Text>
                      <View
                        style={[
                          s.channelBadge,
                          isOnline ? s.channelOnline : s.channelOffline,
                          isCancelled && { backgroundColor: "rgba(239, 68, 68, 0.12)", borderColor: "rgba(239, 68, 68, 0.35)" },
                        ]}
                      >
                        <Text
                          style={[
                            s.channelBadgeText,
                            isOnline ? s.channelOnlineText : s.channelOfflineText,
                            isCancelled && { color: "#F87171" },
                          ]}
                        >
                          {isCancelled
                            ? "❌ CANCELLED / REJECTED"
                            : isOnline
                            ? "🌐 ONLINE (APP / WEB)"
                            : "📝 OFFLINE BOOKING"}
                        </Text>
                      </View>
                    </View>

                    <View style={s.bookingMeta}>
                      <Text style={s.muted}>{entry.unit_name || "Property Unit"}</Text>
                      <Text style={s.metaDot}>•</Text>
                      <Text style={s.muted}>👥 {entry.persons || 1} guests</Text>
                      {entry.booking_status ? (
                        <>
                          <Text style={s.metaDot}>•</Text>
                          <Text
                            style={[
                              s.statusPill,
                              isCancelled && {
                                backgroundColor: "rgba(239, 68, 68, 0.15)",
                                color: "#EF4444",
                              },
                              isPending && {
                                backgroundColor: "rgba(245, 158, 11, 0.15)",
                                color: "#F59E0B",
                              },
                            ]}
                          >
                            {entry.booking_status.toUpperCase()}
                          </Text>
                        </>
                      ) : null}
                    </View>
                    {isOnline && entry.booking_id ? (
                      <View style={s.ownerTicketIdPill}>
                        <Text selectable style={s.ownerTicketIdText}>TICKET ID: {ticketIdForDisplay(entry.ticket_id, entry.booking_id)}</Text>
                      </View>
                    ) : null}
                    <Text style={s.datesMeta}>
                      📅 {String(entry.check_in).slice(0, 10)} → {String(entry.check_out).slice(0, 10)} &bull; {entry.check_in_time || "02:00 PM"}
                    </Text>
                    <Text style={[s.muted, { fontSize: 11, marginTop: 2 }]}>
                      👨 {entry.male_guest_count ?? entry.persons ?? 1}M • 👩 {entry.female_guest_count ?? 0}F &bull; 🥗 {entry.veg_guest_count ?? entry.persons ?? 1}V • 🍗 {entry.nonveg_guest_count ?? 0}NV
                    </Text>
                  </View>
                  <View style={s.bookingRight}>
                    <Text
                      style={[
                        s.bookingAmount,
                        isOnline && s.bookingAmountOnline,
                        isCancelled && {
                          color: colors.textMuted,
                          textDecorationLine: "line-through",
                        },
                      ]}
                    >
                      ₹{cleanNumber(entry.total_amount ?? entry.amount).toLocaleString("en-IN")}
                    </Text>
                    {!isOnline ? (
                      <View style={s.miniActions}>
                        <PressableScale onPress={() => edit(entry)}>
                          <FilePenLine size={16} color={colors.gold} />
                        </PressableScale>
                        <PressableScale onPress={() => remove(entry)}>
                          <Trash2 size={16} color="#F87171" />
                        </PressableScale>
                      </View>
                    ) : (
                      <View
                        style={[
                          s.onlineLockBadge,
                          isCancelled && {
                            backgroundColor: "rgba(239, 68, 68, 0.12)",
                            borderColor: "rgba(239, 68, 68, 0.35)",
                          },
                        ]}
                      >
                        <ShieldCheck size={13} color={isCancelled ? "#EF4444" : "#60A5FA"} />
                        <Text
                          style={[
                            s.onlineLockText,
                            isCancelled && { color: "#F87171" },
                          ]}
                        >
                          {isCancelled ? "Cancelled" : "Auto-Synced"}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={s.emptyBox}>
              <CalendarCheck2 size={32} color={colors.gold} />
              <Text style={s.empty}>
                {sourceFilter === "all"
                  ? "No bookings recorded for this month."
                  : `No ${sourceFilter} bookings found for this month.`}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Page>
  );
}

// ==========================================
// 3. OWNER UNITS SCREEN (RICH PROPERTY SPECS & CATALOGUE ALIGNED)
// ==========================================

const ALL_AMENITY_PRESETS = [
  { label: "Wi-Fi", Icon: Wifi },
  { label: "AC", Icon: AirVent },
  { label: "Private Pool", Icon: Droplets },
  { label: "Kitchen", Icon: CookingPot },
  { label: "Smart TV", Icon: Tv },
  { label: "Refrigerator", Icon: Refrigerator },
  { label: "Parking", Icon: Car },
  { label: "Power Backup", Icon: Zap },
  { label: "Lawn / Garden", Icon: Trees },
  { label: "Sea / Lake View", Icon: Waves },
  { label: "Hot Water", Icon: Bath },
  { label: "Caretaker on Site", Icon: Users },
];

const ALL_ACTIVITY_PRESETS = [
  { label: "Bonfire Nights", Icon: Flame },
  { label: "Barbecue Setup", Icon: Utensils },
  { label: "Kayaking", Icon: Waves },
  { label: "Beach / Nature Walks", Icon: Trees },
  { label: "Cycling", Icon: Sparkles },
  { label: "Indoor Board Games", Icon: Store },
  { label: "Stargazing Deck", Icon: Sparkles },
];

const CATEGORY_PRESETS = [
  "Private Pool Villa",
  "Luxury Lakefront Villa",
  "Beachfront Villa",
  "Deluxe Pool Villa",
  "Cottage & Estate",
  "Glamping Tent",
  "Penthouse Suite",
  "Heritage Homestay",
];

const BADGE_PRESETS = [
  "Curated Luxury Stay",
  "Rare Find",
  "Lakefront Luxury",
  "Guest Favorite",
  "100% Verified Stay",
  "Bestseller Stay",
];

const MEAL_PLAN_PRESETS = [
  "All Meals Package (AP)",
  "Breakfast Included (CP)",
  "Room Only (EP)",
  "Chef on Demand",
  "Self Cooking Allowed",
];

const DEFAULT_ACCOMMODATION_PRESETS: string[] = ["Tent", "Cottage", "Glamping Dome", "Room", "Suite", "Villa"];
const ACCOMMODATION_TYPE_PRESETS: Record<string, string[]> = {
  camping_cottages: ["Tent", "Cottage", "Glamping Dome", "Luxury Tent", "Family Cottage", "Lakeside Camp"],
  resort: ["Room", "Deluxe Room", "Executive Room", "Suite", "Pool View Suite", "Family Suite", "Villa"],
  homestay: ["Room", "Standard Room", "Deluxe Room", "Valley View Room", "Family Room", "Entire Floor"],
  villa: ["Villa", "Private Pool Villa", "Heritage Villa", "Luxury Estate"],
};

export function OwnerUnitsScreen() {
  const windowClass = useWindowClass();
  const isDesktop = useIsWideScreen();
  const { token, data, loading, error, refresh } = useOwnerDashboard();
  const categoryConfig = getCategoryConfig(data?.property?.category);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OwnerUnit | null>(null);

  // 1. Basic Info & Inventory Model
  const [name, setName] = useState("");
  const [accommodationType, setAccommodationType] = useState("Tent");
  const [totalInventory, setTotalInventory] = useState("10");
  const [category, setCategory] = useState("Private Pool Villa");
  const [badge, setBadge] = useState("Curated Luxury Stay");
  const [locationLabel, setLocationLabel] = useState("");
  const [description, setDescription] = useState("");

  // 2. Capacity & Room Breakdown
  const [capacity, setCapacity] = useState("4");
  const [bedrooms, setBedrooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [bedConfig, setBedConfig] = useState("1 King Bed, 1 Sofa Bed");

  // 3. Pricing & Tariffs
  const [weekday, setWeekday] = useState("4500");
  const [weekend, setWeekend] = useState("5500");
  const [extraGuestPrice, setExtraGuestPrice] = useState("1000");
  const [securityDeposit, setSecurityDeposit] = useState("2000");

  // 4. Meal Plans & Demographics
  const [hasFood, setHasFood] = useState(true);
  const [mealPlan, setMealPlan] = useState("All Meals Package (AP)");
  const [vegPrice, setVegPrice] = useState("800");
  const [nonVegPrice, setNonVegPrice] = useState("1200");
  const [kitchenFacility, setKitchenFacility] = useState("Fully equipped private kitchen with microwave, refrigerator & caretaker support");

  // 5. Amenities Multi-Select & Custom
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "Wi-Fi", "AC", "Private Pool", "Kitchen", "Smart TV", "Refrigerator", "Parking", "Power Backup", "Lawn / Garden", "Sea / Lake View"
  ]);
  const [customAmenities, setCustomAmenities] = useState("");

  // 6. Activities Multi-Select & Custom
  const [selectedActivities, setSelectedActivities] = useState<string[]>([
    "Bonfire Nights", "Barbecue Setup", "Kayaking", "Beach / Nature Walks", "Cycling", "Indoor Board Games"
  ]);
  const [customActivities, setCustomActivities] = useState("");

  // 7. Schedule & Timings
  const [checkInTime, setCheckInTime] = useState("02:00 PM onwards");
  const [checkOutTime, setCheckOutTime] = useState("11:00 AM");
  const [scheduleNote, setScheduleNote] = useState("Early check-in or late check-out is subject to availability and prior notice.");

  // 8. Policies & Rules
  const [whatYouWillLove, setWhatYouWillLove] = useState("Private spaces with premium interiors and curated comforts. Scenic lake views, peaceful surroundings, thoughtful hospitality, and space for families or groups.");
  const [houseRules, setHouseRules] = useState("Check-in from 2:00 PM. Check-out by 11:00 AM. Valid Government ID mandatory for all adult guests. Quiet hours 10:00 PM – 7:00 AM.");
  const [cancellationPolicy, setCancellationPolicy] = useState("Free cancellation up to 48 hours before check-in. Eligible refunds are processed within 5–7 business days.");
  const [petFriendly, setPetFriendly] = useState(true);
  const [smokingAllowed, setSmokingAllowed] = useState(false);

  // 9. Media Gallery
  const [images, setImages] = useState<string[]>([]);

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  const accPresets: string[] = useMemo(() => {
    const cat = data?.property?.category || "villa";
    return ACCOMMODATION_TYPE_PRESETS[cat] ?? DEFAULT_ACCOMMODATION_PRESETS;
  }, [data?.property?.category]);

  const toggleAmenity = (label: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(label) ? prev.filter((a) => a !== label) : [...prev, label]
    );
  };

  const toggleActivity = (title: string) => {
    setSelectedActivities((prev) =>
      prev.includes(title) ? prev.filter((a) => a !== title) : [...prev, title]
    );
  };

  const open = (unit?: OwnerUnit) => {
    const isCamp = data?.property?.category === "camping_cottages";
    const isResort = data?.property?.category === "resort";
    const isHomestay = data?.property?.category === "homestay";
    const isVilla = data?.property?.category === "villa";

    const defaultAccType = isCamp ? "Tent" : isResort || isHomestay ? "Room" : "Villa";
    const defaultInventory = isVilla ? "1" : isCamp ? "10" : "5";
    const defaultCapacity = isVilla ? "8" : isCamp ? "2" : "2";
    const defaultWeekday = isVilla ? "12000" : isCamp ? "2500" : isResort ? "6000" : "3000";
    const defaultWeekend = isVilla ? "16000" : isCamp ? "3200" : isResort ? "7500" : "3800";

    setEditing(unit || null);
    setName(unit?.name || "");
    setAccommodationType(unit?.accommodation_type || defaultAccType);
    setTotalInventory(String(unit?.total_inventory || defaultInventory));
    setCategory(unit?.category || (isVilla ? "Private Pool Villa" : isCamp ? "Glamping Tent" : "Deluxe Room"));
    setBadge(unit?.badge || "Curated Luxury Stay");
    setLocationLabel(unit?.location_label || data?.property?.location || "Pawna Lake, Lonavala, Maharashtra");
    setDescription(unit?.description || "");
    setCapacity(String(unit?.total_persons || unit?.available_persons || defaultCapacity));
    setBedrooms(String(unit?.bedrooms ?? (isVilla ? 3 : 1)));
    setBathrooms(String(unit?.bathrooms ?? (isVilla ? 3 : 1)));
    setBedConfig(unit?.bed_config || (isVilla ? "2 King Beds, 1 Queen Bed, 2 Sofa Cum Beds" : "1 King Bed, 1 Sofa Bed"));
    setWeekday(String(cleanNumber(unit?.weekday_price) || defaultWeekday));
    setWeekend(String(cleanNumber(unit?.weekend_price) || defaultWeekend));
    setExtraGuestPrice(String(cleanNumber(unit?.extra_guest_price) || 1000));
    setSecurityDeposit(String(cleanNumber(unit?.security_deposit) || (isVilla ? 5000 : 2000)));
    setHasFood(unit?.has_food !== false);
    setMealPlan(unit?.meal_plan || "All Meals Package (AP)");
    setVegPrice(String(cleanNumber(unit?.veg_price) || 800));
    setNonVegPrice(String(cleanNumber(unit?.non_veg_price) || 1200));
    setKitchenFacility(unit?.kitchen_facility || "Fully equipped private kitchen with microwave, refrigerator & caretaker support");

    // Amenities
    const rawAmenities = Array.isArray(unit?.amenities)
      ? unit.amenities.map(String)
      : String(unit?.amenities || "").split(",").map((s) => s.trim()).filter(Boolean);
    const presetLabels = ALL_AMENITY_PRESETS.map((p) => p.label);
    const knownAmenities = rawAmenities.filter((a) => presetLabels.includes(a));
    const extraAmenities = rawAmenities.filter((a) => !presetLabels.includes(a));
    setSelectedAmenities(knownAmenities.length > 0 ? knownAmenities : [
      "Wi-Fi", "AC", "Private Pool", "Kitchen", "Smart TV", "Refrigerator", "Parking", "Power Backup"
    ]);
    setCustomAmenities(extraAmenities.join(", "));

    // Activities
    const rawActivities = Array.isArray(unit?.activities)
      ? unit.activities.map(String)
      : String(unit?.activities || "").split(",").map((s) => s.trim()).filter(Boolean);
    const actPresetLabels = ALL_ACTIVITY_PRESETS.map((p) => p.label);
    const knownActivities = rawActivities.filter((a) => actPresetLabels.includes(a));
    const extraActivities = rawActivities.filter((a) => !actPresetLabels.includes(a));
    setSelectedActivities(knownActivities.length > 0 ? knownActivities : [
      "Bonfire Nights", "Barbecue Setup", "Kayaking", "Beach / Nature Walks"
    ]);
    setCustomActivities(extraActivities.join(", "));

    // Schedule & Policies
    setCheckInTime(unit?.check_in_time || "02:00 PM onwards");
    setCheckOutTime(unit?.check_out_time || "11:00 AM");
    setScheduleNote(unit?.schedule_note || "Early check-in or late check-out is subject to availability and prior notice.");
    setWhatYouWillLove(unit?.what_you_will_love || "Private spaces with premium interiors and curated comforts. Scenic lake views, peaceful surroundings, thoughtful hospitality, and space for families or groups.");
    setHouseRules(unit?.house_rules || "Check-in from 2:00 PM. Check-out by 11:00 AM. Valid Government ID mandatory for all adult guests. Quiet hours 10:00 PM – 7:00 AM.");
    setCancellationPolicy(unit?.cancellation_policy || "Free cancellation up to 48 hours before check-in. Eligible refunds are processed within 5–7 business days.");
    setPetFriendly(unit?.pet_friendly ?? true);
    setSmokingAllowed(unit?.smoking_allowed ?? false);

    setImages(Array.isArray(unit?.images) ? unit.images.map(String) : []);
    setFormOpen(true);
  };

  const close = () => {
    setFormOpen(false);
    setEditing(null);
    setImages([]);
  };

  const save = async () => {
    setBusy(true);
    setActionError("");

    const finalAmenities = [
      ...selectedAmenities,
      ...customAmenities.split(",").map((s) => s.trim()).filter(Boolean),
    ];
    const finalActivities = [
      ...selectedActivities,
      ...customActivities.split(",").map((s) => s.trim()).filter(Boolean),
    ];

    const body = {
      name: name.trim() || `${categoryConfig.unitLabel}`,
      total_inventory: cleanNumber(totalInventory) || 1,
      accommodation_type: accommodationType.trim() || "Tent",
      category,
      badge,
      location_label: locationLabel,
      description,
      available_persons: cleanNumber(capacity) || 1,
      total_persons: cleanNumber(capacity) || 1,
      bedrooms: cleanNumber(bedrooms) || 1,
      bathrooms: cleanNumber(bathrooms) || 1,
      bed_config: bedConfig,
      weekday_price: String(cleanNumber(weekday) || 0),
      weekend_price: String(cleanNumber(weekend) || 0),
      extra_guest_price: String(cleanNumber(extraGuestPrice) || 0),
      security_deposit: String(cleanNumber(securityDeposit) || 0),
      has_food: hasFood,
      meal_plan: mealPlan,
      veg_price: String(cleanNumber(vegPrice) || 0),
      non_veg_price: String(cleanNumber(nonVegPrice) || 0),
      kitchen_facility: kitchenFacility,
      amenities: finalAmenities,
      activities: finalActivities,
      check_in_time: checkInTime,
      check_out_time: checkOutTime,
      schedule_note: scheduleNote,
      what_you_will_love: whatYouWillLove,
      house_rules: houseRules,
      cancellation_policy: cancellationPolicy,
      pet_friendly: petFriendly,
      smoking_allowed: smokingAllowed,
      images,
    };

    try {
      if (editing) await updateProtectedOwnerUnit(token, editing.id, body);
      else await createProtectedOwnerUnit(token, body);
      await refresh();
      close();
      setNotice(editing ? `${categoryConfig.unitLabel} updated successfully.` : `New ${categoryConfig.unitLabel.toLowerCase()} added to public catalogue!`);
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Unable to save unit."
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = (unit: OwnerUnit) =>
    Alert.alert("Delete unit", `Delete ${unit.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          void deleteProtectedOwnerUnit(token, unit.id)
            .then(async () => {
              await refresh();
              setNotice("Unit deleted.");
            })
            .catch((caught) =>
              setActionError(
                caught instanceof Error ? caught.message : "Unable to delete unit."
              )
            ),
      },
    ]);

  if (loading) return <Loading />;

  return (
    <Page>
      <View style={[s.contentPad, isDesktop && s.contentPadDesktop]}>
        <Message error={error || actionError} notice={notice} />

        <View style={s.unitsHeader}>
          <View>
            <Text style={s.unitsTitle}>
              Manage {categoryConfig.pluralUnitLabel} & Inventory
            </Text>
            <Text style={s.unitsSubtitle}>
              Configure distinct stay types, total unit quantities, tariffs, meal packages, amenities, and stay policies.
            </Text>
          </View>

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Add Stay Type"
            onPress={() => open()}
            style={s.addUnitButton}
          >
            <LinearGradient
              colors={["#F0D078", "#D9A52A", "#B98216"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.addUnitButtonFill}
            >
              <Plus size={16} color={colors.actionInk} strokeWidth={2.3} />
              <Text style={s.addUnitText}>{`Add ${categoryConfig.unitLabel}`}</Text>
            </LinearGradient>
          </PressableScale>
        </View>

        {/* ========================================================================= */}
        {/* COMPREHENSIVE ADD / EDIT STAY TYPE MODAL POPUP */}
        {/* ========================================================================= */}
        <Modal
          visible={formOpen}
          transparent
          animationType="fade"
          onRequestClose={close}
        >
          <View style={s.stayTypeModalOverlay}>
            <Pressable style={s.stayTypeModalBackdrop} onPress={close} />
            <View style={[s.stayTypeModalCard, isDesktop && s.stayTypeModalCardDesktop]}>
              {/* Modal Header */}
              <View style={s.stayTypeModalHeader}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <Sparkles size={16} color={colors.gold} />
                    <Text style={s.stayTypeModalTitle}>
                      {editing ? `Edit ${categoryConfig.unitLabel} Specs & Inventory` : `Add New ${categoryConfig.unitLabel} / Stay Type`}
                    </Text>
                  </View>
                  <Text style={s.stayTypeModalSub}>
                    All fields here automatically populate the public stay catalogue (<Text style={{ color: colors.gold }}>/properties/{data?.property?.slug || "unit"}</Text>)
                  </Text>
                </View>
                <Pressable onPress={close} style={s.modalCloseBtn}>
                  <X size={18} color={colors.textSecondary} />
                </Pressable>
              </View>

              {/* Modal Scrollable Content */}
              <ScrollView
                showsVerticalScrollIndicator={true}
                contentContainerStyle={s.stayTypeModalScroll}
                keyboardShouldPersistTaps="handled"
              >
                {/* 1. BASIC IDENTITY & INVENTORY SPECIFICATION */}
                <View style={s.formSectionBox}>
                  <View style={s.formSectionHead}>
                    <Building2 size={15} color={colors.gold} />
                    <Text style={s.formSectionTitle}>1. {categoryConfig.title.toUpperCase()} STAY TYPE & INVENTORY QUANTITY</Text>
                  </View>

                  <EditableInput
                    label={`Stay Type Title (e.g. ${categoryConfig.key === 'camping_cottages' ? 'Premium Tent, Lake View Cottage' : categoryConfig.key === 'resort' ? 'Deluxe Room, Pool View Suite' : 'Standard Room, Luxury Villa'})`}
                    value={name}
                    onChange={setName}
                  />

                  <View style={s.field}>
                    <Text style={s.fieldLabel}>Accommodation Type / Class</Text>
                    <View style={s.optionRow}>
                      {accPresets.map((acc) => (
                        <Pressable
                          key={acc}
                          onPress={() => setAccommodationType(acc)}
                          style={[s.option, accommodationType === acc && s.optionActive]}
                        >
                          <Text style={[s.optionText, accommodationType === acc && s.optionTextActive]}>
                            {acc}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <EditableInput
                    label="Total Inventory / Quantity (Number of identical sellable units)"
                    value={totalInventory}
                    onChange={setTotalInventory}
                    numeric
                  />

                  <View style={s.field}>
                    <Text style={s.fieldLabel}>Featured Badge / Tagline</Text>
                    <View style={s.optionRow}>
                      {BADGE_PRESETS.map((b) => (
                        <Pressable
                          key={b}
                          onPress={() => setBadge(b)}
                          style={[s.option, badge === b && s.optionActive]}
                        >
                          <Text style={[s.optionText, badge === b && s.optionTextActive]}>
                            {b}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <EditableInput
                    label="Location / Area Label (e.g. Pawna Lake, Lonavala, Maharashtra)"
                    value={locationLabel}
                    onChange={setLocationLabel}
                  />

                  <EditableInput
                    label="About / Property Description (Displays in Overview Tab)"
                    value={description}
                    onChange={setDescription}
                    multiline
                  />
                </View>

                {/* 2. CAPACITY & ROOM SPECS */}
                <View style={s.formSectionBox}>
                  <View style={s.formSectionHead}>
                    <Users size={15} color={colors.gold} />
                    <Text style={s.formSectionTitle}>2. CAPACITY (PER UNIT) & ROOM SPECIFICATIONS</Text>
                  </View>

                  <View style={s.inputRow}>
                    <EditableInput
                      label="Max Guest Capacity (Per Single Unit)"
                      value={capacity}
                      onChange={setCapacity}
                      numeric
                    />
                    <EditableInput
                      label="Number of Bedrooms / Rooms"
                      value={bedrooms}
                      onChange={setBedrooms}
                      numeric
                    />
                    <EditableInput
                      label="Number of Bathrooms"
                      value={bathrooms}
                      onChange={setBathrooms}
                      numeric
                    />
                  </View>

                  <EditableInput
                    label="Bed Setup & Room Layout (e.g. 1 King Bed, 1 Sofa Bed / 1 Queen Mattress)"
                    value={bedConfig}
                    onChange={setBedConfig}
                  />
                </View>

                {/* 3. PRICING & TARIFF BREAKDOWN */}
                <View style={s.formSectionBox}>
                  <View style={s.formSectionHead}>
                    <DollarSign size={15} color={colors.gold} />
                    <Text style={s.formSectionTitle}>3. NIGHTLY RATES & TARIFF CONFIGURATION</Text>
                  </View>

                  <View style={s.inputRow}>
                    <EditableInput
                      label="Weekday Nightly Rate (₹ / unit)"
                      value={weekday}
                      onChange={setWeekday}
                      numeric
                    />
                    <EditableInput
                      label="Weekend Nightly Rate (₹ / unit)"
                      value={weekend}
                      onChange={setWeekend}
                      numeric
                    />
                  </View>

                  <View style={s.inputRow}>
                    <EditableInput
                      label="Extra Guest Charge (₹/person/night)"
                      value={extraGuestPrice}
                      onChange={setExtraGuestPrice}
                      numeric
                    />
                    <EditableInput
                      label="Security Deposit (₹ Refundable)"
                      value={securityDeposit}
                      onChange={setSecurityDeposit}
                      numeric
                    />
                  </View>
                </View>

                {/* 4. MEAL PACKAGES & DEMOGRAPHICS PRICING */}
                <View style={s.formSectionBox}>
                  <View style={s.formSectionHead}>
                    <Utensils size={15} color={colors.gold} />
                    <Text style={s.formSectionTitle}>4. MEAL PACKAGES & DEMOGRAPHICS PRICING</Text>
                  </View>

                  <View style={s.field}>
                    <Text style={s.fieldLabel}>Food & Meal Service</Text>
                    <View style={s.togglePillRow}>
                      <Pressable
                        onPress={() => setHasFood(true)}
                        style={[s.togglePill, hasFood && s.togglePillActive]}
                      >
                        <Text style={[s.togglePillText, hasFood && s.togglePillTextActive]}>
                          🍳 With Food (Meals Provided)
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setHasFood(false)}
                        style={[s.togglePill, !hasFood && s.togglePillActive]}
                      >
                        <Text style={[s.togglePillText, !hasFood && s.togglePillTextActive]}>
                          🚫 Without Food (Room Only)
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {hasFood ? (
                    <>
                      <View style={s.field}>
                        <Text style={s.fieldLabel}>Meal Package Included</Text>
                        <View style={s.optionRow}>
                          {MEAL_PLAN_PRESETS.map((mp) => (
                            <Pressable
                              key={mp}
                              onPress={() => setMealPlan(mp)}
                              style={[s.option, mealPlan === mp && s.optionActive]}
                            >
                              <Text style={[s.optionText, mealPlan === mp && s.optionTextActive]}>
                                {mp}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>

                      <View style={s.inputRow}>
                        <EditableInput
                          label="Veg Meal Tariff (₹/guest/day)"
                          value={vegPrice}
                          onChange={setVegPrice}
                          numeric
                        />
                        <EditableInput
                          label="Non-Veg Meal Tariff (₹/guest/day)"
                          value={nonVegPrice}
                          onChange={setNonVegPrice}
                          numeric
                        />
                      </View>
                    </>
                  ) : (
                    <View style={[s.message, { borderColor: "rgba(224, 184, 74, 0.3)", backgroundColor: "rgba(224, 184, 74, 0.06)", marginTop: 4, marginBottom: 8 }]}>
                      <Text style={{ color: colors.gold, fontFamily: fontFamilies.sansBold, fontSize: 12, marginBottom: 2 }}>
                        Room Only / No Meals Service
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontFamily: fontFamilies.sans, fontSize: 11.5 }}>
                        Veg and Non-Veg preference selectors will be hidden on customer booking for this unit, and meal badges will be omitted on tickets.
                      </Text>
                    </View>
                  )}

                  <EditableInput
                    label="Kitchen Facility & Equipment Notes"
                    value={kitchenFacility}
                    onChange={setKitchenFacility}
                  />
                </View>

                {/* 5. INCLUDED AMENITIES */}
                <View style={s.formSectionBox}>
                  <View style={s.formSectionHead}>
                    <Wifi size={15} color={colors.gold} />
                    <Text style={s.formSectionTitle}>5. INCLUDED AMENITIES (SELECT ALL THAT APPLY)</Text>
                  </View>

                  <View style={s.presetGrid}>
                    {ALL_AMENITY_PRESETS.map(({ label, Icon }) => {
                      const active = selectedAmenities.includes(label);
                      return (
                        <Pressable
                          key={label}
                          onPress={() => toggleAmenity(label)}
                          style={[s.presetChip, active && s.presetChipActive]}
                        >
                          <Icon size={14} color={active ? colors.gold : colors.textMuted} />
                          <Text style={[s.presetChipText, active && s.presetChipTextActive]}>
                            {label}
                          </Text>
                          {active ? <Check size={12} color={colors.gold} /> : null}
                        </Pressable>
                      );
                    })}
                  </View>

                  <EditableInput
                    label="Additional Custom Amenities (Comma separated)"
                    value={customAmenities}
                    onChange={setCustomAmenities}
                  />
                </View>

                {/* 6. EXPERIENCES & ACTIVITIES */}
                <View style={s.formSectionBox}>
                  <View style={s.formSectionHead}>
                    <Flame size={15} color={colors.gold} />
                    <Text style={s.formSectionTitle}>6. EXPERIENCES & ACTIVITIES (ACTIVITIES TAB)</Text>
                  </View>

                  <View style={s.presetGrid}>
                    {ALL_ACTIVITY_PRESETS.map(({ label, Icon }) => {
                      const active = selectedActivities.includes(label);
                      return (
                        <Pressable
                          key={label}
                          onPress={() => toggleActivity(label)}
                          style={[s.presetChip, active && s.presetChipActive]}
                        >
                          <Icon size={14} color={active ? colors.gold : colors.textMuted} />
                          <Text style={[s.presetChipText, active && s.presetChipTextActive]}>
                            {label}
                          </Text>
                          {active ? <Check size={12} color={colors.gold} /> : null}
                        </Pressable>
                      );
                    })}
                  </View>

                  <EditableInput
                    label="Additional Custom Activities (Comma separated)"
                    value={customActivities}
                    onChange={setCustomActivities}
                  />
                </View>

                {/* 7. STAY SCHEDULE & TIMINGS */}
                <View style={s.formSectionBox}>
                  <View style={s.formSectionHead}>
                    <Clock size={15} color={colors.gold} />
                    <Text style={s.formSectionTitle}>7. SCHEDULE & CHECK-IN / CHECK-OUT TIMINGS</Text>
                  </View>

                  <View style={s.inputRow}>
                    <EditableInput
                      label="Check-in Time (e.g. 02:00 PM onwards)"
                      value={checkInTime}
                      onChange={setCheckInTime}
                    />
                    <EditableInput
                      label="Check-out Time (e.g. 11:00 AM)"
                      value={checkOutTime}
                      onChange={setCheckOutTime}
                    />
                  </View>

                  <EditableInput
                    label="Schedule & Early Check-in Note"
                    value={scheduleNote}
                    onChange={setScheduleNote}
                  />
                </View>

                {/* 8. POLICIES, RULES & HIGHLIGHTS */}
                <View style={s.formSectionBox}>
                  <View style={s.formSectionHead}>
                    <ShieldCheck size={15} color={colors.gold} />
                    <Text style={s.formSectionTitle}>8. POLICIES, HOUSE RULES & HIGHLIGHTS</Text>
                  </View>

                  <EditableInput
                    label="What You'll Love (Feature Highlights)"
                    value={whatYouWillLove}
                    onChange={setWhatYouWillLove}
                    multiline
                  />

                  <EditableInput
                    label="Rules & House Policies (Quiet hours, ID proof etc.)"
                    value={houseRules}
                    onChange={setHouseRules}
                    multiline
                  />

                  <EditableInput
                    label="Cancellation & Refund Policy"
                    value={cancellationPolicy}
                    onChange={setCancellationPolicy}
                    multiline
                  />

                  {/* Toggles for Pet & Smoking */}
                  <View style={s.inputRow}>
                    <View style={s.field}>
                      <Text style={s.fieldLabel}>Pet Friendly Policy</Text>
                      <View style={s.togglePillRow}>
                        <Pressable
                          onPress={() => setPetFriendly(true)}
                          style={[s.togglePill, petFriendly && s.togglePillActive]}
                        >
                          <Text style={[s.togglePillText, petFriendly && s.togglePillTextActive]}>
                            🐾 Pets Allowed
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setPetFriendly(false)}
                          style={[s.togglePill, !petFriendly && s.togglePillActive]}
                        >
                          <Text style={[s.togglePillText, !petFriendly && s.togglePillTextActive]}>
                            🚫 No Pets
                          </Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={s.field}>
                      <Text style={s.fieldLabel}>Smoking Policy</Text>
                      <View style={s.togglePillRow}>
                        <Pressable
                          onPress={() => setSmokingAllowed(true)}
                          style={[s.togglePill, smokingAllowed && s.togglePillActive]}
                        >
                          <Text style={[s.togglePillText, smokingAllowed && s.togglePillTextActive]}>
                            🌿 Outdoor Only
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setSmokingAllowed(false)}
                          style={[s.togglePill, !smokingAllowed && s.togglePillActive]}
                        >
                          <Text style={[s.togglePillText, !smokingAllowed && s.togglePillTextActive]}>
                            🚭 Non-Smoking
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 9. PHOTOS & GALLERY */}
                <View style={s.formSectionBox}>
                  <View style={s.formSectionHead}>
                    <ImagePlus size={15} color={colors.gold} />
                    <Text style={s.formSectionTitle}>9. PHOTOS & MEDIA GALLERY</Text>
                  </View>
                  <OwnerImages
                    token={token}
                    images={images}
                    onChange={setImages}
                    onError={setActionError}
                  />
                </View>
              </ScrollView>

              {/* MODAL FOOTER ACTIONS */}
              <View style={s.stayTypeModalFooter}>
                <PressableScale onPress={close} style={s.stayTypeCancelBtn}>
                  <Text style={s.stayTypeCancelBtnText}>Cancel</Text>
                </PressableScale>
                <View style={{ flex: 1, maxWidth: 280 }}>
                  <GoldButton onPress={() => void save()} disabled={busy}>
                    {busy ? (
                      <ActivityIndicator color={colors.actionInk} />
                    ) : (
                      <>
                        <Save size={16} color={colors.actionInk} />
                        <Text style={s.goldButtonText}>
                          {editing ? `Save ${categoryConfig.unitLabel} Changes` : `Create ${categoryConfig.unitLabel}`}
                        </Text>
                      </>
                    )}
                  </GoldButton>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* ========================================================================= */}
        {/* DISTINCT STAY TYPES / INVENTORY GRID */}
        {/* ========================================================================= */}
        <View style={[s.unitsList, isDesktop && s.unitsListDesktop]}>
          {data?.units.map((u) => {
            const image =
              Array.isArray(u.images) && u.images[0]
                ? { uri: String(u.images[0]) }
                : villa1;
            const categoryText = u.category || (categoryConfig.key === "camping_cottages" ? "Glamping Tent" : "Deluxe Room");
            const badgeText = u.badge || "Curated Luxury Stay";
            const bedroomsCount = u.bedrooms ?? 1;
            const bathroomsCount = u.bathrooms ?? 1;
            const guestsCount = u.total_persons || u.available_persons || 2;
            const totalUnitsCount = u.total_inventory || 1;
            const accType = u.accommodation_type || (categoryConfig.key === "camping_cottages" ? "Tent" : categoryConfig.key === "resort" ? "Room" : "Villa");
            const mealPlanText = u.meal_plan || "All Meals Package (AP)";
            const checkIn = u.check_in_time || "02:00 PM";
            const checkOut = u.check_out_time || "11:00 AM";

            return (
              <Panel
                key={u.id}
                style={[s.unitPanel, isDesktop && s.unitPanelDesktop]}
              >
                {/* Top Card Row */}
                <View style={s.unitTop}>
                  <Image source={image} contentFit="cover" style={s.unitImage} />
                  <View style={s.unitInfo}>
                    <View style={s.unitBadgePillRow}>
                      <View style={s.unitCategoryPill}>
                        <Text style={s.unitCategoryText}>{accType}</Text>
                      </View>
                      <View style={[s.unitBadgePill, { backgroundColor: "rgba(240, 208, 120, 0.15)", borderWidth: 1, borderColor: "rgba(240, 208, 120, 0.3)" }]}>
                        <Layers size={10} color={colors.gold} />
                        <Text style={[s.unitBadgeText, { color: colors.gold, fontFamily: fontFamilies.sansBold }]}>
                          {totalUnitsCount} {totalUnitsCount === 1 ? "Unit Available" : "Units Total"}
                        </Text>
                      </View>
                    </View>

                    <Text style={s.unitName}>{u.name}</Text>
                    <Text style={s.unitLocationText}>
                      {u.location_label || data?.property?.location || "Maharashtra"}
                    </Text>
                  </View>
                  <View style={[s.status, s.availableStatus]}>
                    <Text style={[s.statusText, { color: "#86EFAC" }]}>ACTIVE</Text>
                  </View>
                </View>

                {/* Specs Row: Guests per unit, Total inventory, Bedrooms, Bathrooms */}
                <View style={s.specsChipGrid}>
                  <View style={s.specMiniChip}>
                    <Users size={12} color={colors.gold} />
                    <Text style={s.specMiniChipText}>Max {guestsCount} Guests/Unit</Text>
                  </View>
                  <View style={[s.specMiniChip, { backgroundColor: "rgba(240, 208, 120, 0.1)" }]}>
                    <Layers size={12} color={colors.gold} />
                    <Text style={[s.specMiniChipText, { color: colors.gold, fontFamily: fontFamilies.sansBold }]}>
                      {totalUnitsCount} Units In Stock
                    </Text>
                  </View>
                  {bedroomsCount > 0 ? (
                    <View style={s.specMiniChip}>
                      <BedDouble size={12} color={colors.gold} />
                      <Text style={s.specMiniChipText}>{bedroomsCount} BHK / Rooms</Text>
                    </View>
                  ) : null}
                  {bathroomsCount > 0 ? (
                    <View style={s.specMiniChip}>
                      <Bath size={12} color={colors.gold} />
                      <Text style={s.specMiniChipText}>{bathroomsCount} Baths</Text>
                    </View>
                  ) : null}
                </View>

                {/* Pricing Breakdown Bar */}
                <View style={s.priceBar}>
                  <View>
                    <Text style={s.weekday}>WEEKDAY TARIFF</Text>
                    <Text style={s.unitPrice}>
                      ₹{cleanNumber(u.weekday_price).toLocaleString("en-IN")}
                      <Text style={s.perNight}> /night</Text>
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={s.weekday}>WEEKEND TARIFF</Text>
                    <Text style={s.unitPrice}>
                      ₹{cleanNumber(u.weekend_price).toLocaleString("en-IN")}
                      <Text style={s.perNight}> /night</Text>
                    </Text>
                  </View>
                </View>

                {/* Meal & Schedule Info Strip */}
                <View style={s.unitMetaStrip}>
                  <View style={s.unitMetaCol}>
                    <Text style={s.unitMetaLabel}>Meal Package</Text>
                    <Text style={s.unitMetaVal} numberOfLines={1}>🍽️ {mealPlanText}</Text>
                  </View>
                  <View style={s.unitMetaCol}>
                    <Text style={s.unitMetaLabel}>Stay Timings</Text>
                    <Text style={s.unitMetaVal}>🕒 In {checkIn} • Out {checkOut}</Text>
                  </View>
                </View>

                {/* Actions Row */}
                <View style={s.unitActionsRow}>
                  <View style={{ flex: 1 }}>
                    <GoldButton onPress={() => open(u)}>
                      <FilePenLine size={16} color={colors.actionInk} />
                      <Text style={s.goldButtonText}>Edit Stay Type & Inventory</Text>
                    </GoldButton>
                  </View>
                  <PressableScale
                    onPress={() => remove(u)}
                    style={s.deleteUnitBtn}
                  >
                    <Trash2 size={16} color="#F87171" />
                  </PressableScale>
                </View>
              </Panel>
            );
          })}
        </View>
      </View>
    </Page>
  );
}

// ==========================================
// 4. OWNER PROFILE & PROPERTY DETAILS SCREEN
// ==========================================
export function OwnerProfileScreen() {
  const { signOut } = useAuth();
  const isDesktop = useIsWideScreen();
  const { token, data, loading, error, refresh } = useOwnerDashboard();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState("");
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!data) return;
    setOwnerName(data.owner.name || "");
    setWhatsapp(data.owner.whatsapp || "");
    setTitle(data.property.title || "");
    setLocation(data.property.location || "");
    setDescription(data.property.description || "");
    setAmenities(data.property.amenities.join(", "));
    setImages(data.property.images || []);
  }, [data]);

  const save = async () => {
    setBusy(true);
    setActionError("");
    try {
      await updateProtectedOwnerProfile(token, {
        ownerName,
        whatsapp,
        title,
        location,
        description,
        amenities: amenities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        images,
      });
      await refresh();
      setEditing(false);
      setNotice("Profile and property details updated.");
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Unable to update profile."
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <Page>
      <View style={[s.contentPad, isDesktop && s.contentPadDesktop]}>
        <Message error={error || actionError} notice={notice} />

        <View style={s.profileHeader}>
          <Text style={s.profileTitle}>Property &amp; Owner Profile</Text>
          <PressableScale
            onPress={() => void signOut().then(() => router.replace("/login"))}
            style={s.logout}
          >
            <View style={s.logoutFill}>
              <LogOut size={15} color="#fff" />
              <Text style={s.logoutText}>Logout</Text>
            </View>
          </PressableScale>
        </View>

        {/* 2-Column Profile Dashboard on Widescreen */}
        <View style={isDesktop ? s.widescreenProfileRow : s.mobileStack}>
          {/* Left Column: Owner Card */}
          <View style={isDesktop ? s.widescreenProfileLeft : undefined}>
            <Panel style={s.profileCard}>
              <View style={s.avatarGlow}>
                <View style={s.avatar}>
                  <UserRound size={32} color={colors.gold} />
                </View>
              </View>
              <View style={s.profileCopy}>
                <Text style={s.propertyName}>{data?.property.title}</Text>
                <Text style={s.ownerName}>
                  {data?.owner.name} <Text style={s.muted}>•</Text> {data?.owner.mobile}
                </Text>
              </View>
              <View style={s.verifiedBadge}>
                <ShieldCheck size={12} color={colors.gold} />
                <Text style={s.verifiedText}>VERIFIED OWNER</Text>
              </View>
            </Panel>
          </View>

          {/* Right Column: Property Information Form */}
          <View style={isDesktop ? s.widescreenProfileRight : undefined}>
            <Panel>
              <View style={s.formHeader}>
                <Text style={s.formTitle}>Property Information</Text>
                <PressableScale
                  onPress={() => setEditing((value) => !value)}
                  style={s.inlineAction}
                >
                  {editing ? (
                    <RefreshCw size={14} color={colors.gold} />
                  ) : (
                    <FilePenLine size={14} color={colors.gold} />
                  )}
                  <Text style={s.inlineActionText}>{editing ? "Cancel" : "Edit Details"}</Text>
                </PressableScale>
              </View>

              <EditableInput
                label="Owner full name"
                value={ownerName}
                onChange={setOwnerName}
              />
              <EditableInput
                label="WhatsApp contact number"
                value={whatsapp}
                onChange={setWhatsapp}
                numeric
              />
              <EditableInput
                label="Property title"
                value={title}
                onChange={setTitle}
              />
              <EditableInput
                label="Property location"
                value={location}
                onChange={setLocation}
              />
              <EditableInput
                label="Property description"
                value={description}
                onChange={setDescription}
                multiline
              />
              <EditableInput
                label="Amenities (comma separated)"
                value={amenities}
                onChange={setAmenities}
              />

              {editing ? (
                <>
                  <OwnerImages
                    token={token}
                    images={images}
                    onChange={setImages}
                    onError={setActionError}
                  />
                  <GoldButton onPress={() => void save()}>
                    {busy ? (
                      <ActivityIndicator color={colors.actionInk} />
                    ) : (
                      <>
                        <Save size={16} color={colors.actionInk} />
                        <Text style={s.goldButtonText}>Save Profile Changes</Text>
                      </>
                    )}
                  </GoldButton>
                </>
              ) : (
                <Text style={s.profileNotice}>
                  Property details are synced with BookStayX public catalogue. Unit
                  pricing and details can be managed from the{" "}
                  <Text
                    style={s.link}
                    onPress={() => router.push("/owner/units" as Href)}
                  >
                    Units
                  </Text>{" "}
                  tab.
                </Text>
              )}
            </Panel>
          </View>
        </View>
      </View>
    </Page>
  );
}

function Loading() {
  return (
    <View style={s.loading}>
      <ActivityIndicator color={colors.gold} size="large" />
      <Text style={s.loadingText}>Loading owner dashboard…</Text>
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================
const s = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: 100,
    backgroundColor: "#07080A",
  },
  scrollDesktop: {
    paddingBottom: 48,
  },
  page: {
    width: "100%",
    maxWidth: layout.sourceMaxWidth,
  },
  pageDesktop: {
    maxWidth: 1360,
  },
  stack: {
    padding: 16,
    gap: 16,
  },
  stackDesktop: {
    paddingHorizontal: 28,
    paddingTop: 20,
    gap: 24,
  },
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  contentPadDesktop: {
    paddingHorizontal: 28,
    paddingTop: 24,
  },

  // Widescreen Layout Grids
  widescreenRow: {
    flexDirection: "row",
    gap: 24,
    alignItems: "flex-start",
  },
  widescreenLeftCol: {
    flex: 1,
    minWidth: 0,
  },
  widescreenRightCol: {
    flex: 1,
    minWidth: 0,
    gap: 20,
  },
  mobileStack: {
    gap: 16,
  },
  widescreenProfileRow: {
    flexDirection: "row",
    gap: 24,
    alignItems: "flex-start",
  },
  widescreenProfileLeft: {
    flex: 1,
    minWidth: 0,
  },
  widescreenProfileRight: {
    flex: 1.6,
    minWidth: 0,
  },

  // Panels
  panel: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.22)",
    backgroundColor: "#10141B",
    ...Platform.select({
      web: {
        boxShadow: "0 6px 24px rgba(0, 0, 0, 0.35)",
      } as any,
      default: {},
    }),
  },
  calendarPanel: {
    padding: 20,
  },
  villaPanel: {
    zIndex: 10,
  },
  ratesPanel: {
    padding: 20,
    gap: 14,
  },

  // Hero
  hero: {
    height: 180,
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(224, 184, 74, 0.16)",
  },
  heroDesktop: {
    height: 200,
  },
  heroCopy: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  heroCopyDesktop: {
    paddingHorizontal: 32,
    paddingVertical: 32,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    marginBottom: 8,
  },
  heroBadgeText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: "#fff",
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 26,
    lineHeight: 30,
  },
  heroTitleDesktop: {
    fontSize: 34,
    lineHeight: 38,
  },
  heroAccent: {
    color: colors.gold,
    fontFamily: fontFamilies.displayItalic,
  },
  heroBody: {
    marginTop: 6,
    color: "#B0B6BF",
    fontFamily: fontFamilies.sans,
    fontSize: 12.5,
    lineHeight: 18,
    maxWidth: 500,
  },
  heroBodyDesktop: {
    fontSize: 13.5,
    lineHeight: 20,
  },

  // Villa Selector Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  roundIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.4)",
    backgroundColor: "rgba(224, 184, 74, 0.1)",
  },
  selectLabel: {
    color: "#fff",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13.5,
  },
  selectSub: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    marginTop: 2,
  },
  villaSelect: {
    minWidth: 160,
    height: 40,
  },
  select: {
    height: 40,
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
    backgroundColor: "#14181F",
  },
  selectDark: {
    height: 40,
    borderRadius: 10,
    backgroundColor: "#0B0E11",
  },
  selectText: {
    flex: 1,
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12.5,
  },
  menu: {
    position: "absolute",
    zIndex: 40,
    right: 14,
    top: 68,
    width: 220,
    overflow: "hidden",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.45)",
    backgroundColor: "#12161C",
    ...Platform.select({
      web: { boxShadow: "0 14px 32px rgba(0, 0, 0, 0.7)" } as any,
      default: { elevation: 20 },
    }),
  },
  menuItem: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  menuActive: {
    backgroundColor: "rgba(224, 184, 74, 0.15)",
  },
  menuText: {
    color: "#F3F4F6",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 13,
  },
  gold: { color: colors.gold },

  // Calendar
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  titleIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  sectionTitle: {
    color: "#fff",
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 20,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4.5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },
  activeUnitStrip: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  activeUnitName: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 12.5,
    letterSpacing: 0.6,
  },
  goldDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },

  // Month Selector
  monthRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(11, 14, 18, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  monthArrow: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
  },
  monthTitleWrap: {
    alignItems: "center",
  },
  monthText: {
    color: "#fff",
    fontFamily: fontFamilies.sansBold,
    fontSize: 15,
    letterSpacing: 0.3,
  },

  // Week Row (7 Columns)
  weekRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    paddingBottom: 8,
  },
  weekDayWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  weekDay: {
    textAlign: "center",
    color: colors.textMuted,
    fontFamily: fontFamilies.sansBold,
    fontSize: 11,
    letterSpacing: 0.6,
  },

  // Calendar Body & Week Rows (7 Square Cells per row)
  calendarBody: {
    marginTop: 10,
    gap: 8,
  },
  calendarWeekRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  calendarCellSlot: {
    flex: 1,
    aspectRatio: 1,
    minHeight: 48,
  },
  calendarCellEmpty: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
  },
  calendarCell: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)",
        cursor: "pointer",
        transition: "transform 0.1s ease",
      } as any,
      default: { elevation: 3 },
    }),
  },
  dayFill: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    color: "#fff",
    fontFamily: fontFamilies.sansBold,
    fontSize: 15,
    lineHeight: 18,
    textAlign: "center",
  },
  dayNumberPast: {
    color: "rgba(255, 255, 255, 0.35)",
    fontFamily: fontFamilies.sansMedium,
  },
  dayStatusLabel: {
    marginTop: 2,
    color: "#fff",
    fontFamily: fontFamilies.sansBold,
    fontSize: 8,
    letterSpacing: 0.5,
    textAlign: "center",
    opacity: 0.95,
  },
  calendarFooterNote: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(224, 184, 74, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.2)",
  },
  calendarFooterNoteText: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    lineHeight: 17,
  },

  // Standard Rates
  smallRound: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.4)",
  },
  unitLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  unitLabelText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },
  rateRow: {
    flexDirection: "row",
    gap: 8,
  },
  rate: {
    flex: 1,
    minHeight: 68,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "space-between",
  },
  rateLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
  },
  rateValue: {
    color: "#fff",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  field: {
    flex: 1,
    minWidth: 0,
    marginBottom: 8,
  },
  fieldLabel: {
    marginBottom: 6,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11.5,
  },
  inputShell: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    backgroundColor: "#0B0E11",
  },
  currency: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 14,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
    padding: 0,
  },
  specialHeader: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  specialTitle: {
    color: "#fff",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13.5,
  },
  specialSub: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10.5,
    marginTop: 1,
  },
  addDate: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 11,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.55)",
    backgroundColor: "rgba(224, 184, 74, 0.08)",
  },
  addDateText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
  },
  specialRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  trash: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    marginBottom: 8,
  },
  goldButton: {
    width: "100%",
    height: 48,
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  goldButtonFill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  goldButtonText: {
    color: colors.actionInk,
    fontFamily: fontFamilies.sansBold,
    fontSize: 13.5,
  },

  // Modal / Ledger Popup (PawnaHaven style)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 580,
    maxHeight: "90%",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    backgroundColor: "#10141B",
    overflow: "hidden",
    ...Platform.select({
      web: { boxShadow: "0 20px 60px rgba(0, 0, 0, 0.85)" } as any,
      default: { elevation: 24 },
    }),
  },
  modalCardDesktop: {
    maxWidth: 640,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  modalBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  modalUnitName: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  modalDateTitle: {
    color: "#fff",
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 22,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  modalScroll: {
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  statusCapacityBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 16,
  },
  statusCapacityLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansBold,
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  statusPillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  statusPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    fontFamily: fontFamilies.sansBold,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  capacityHint: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    marginTop: 3,
  },
  addBookingToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.goldAction,
  },
  addBookingToggleText: {
    fontFamily: fontFamilies.sansBold,
    fontSize: 12,
  },
  modalFormBox: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(224, 184, 74, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
    marginBottom: 18,
    gap: 10,
  },
  modalFormHeading: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 14,
    marginBottom: 4,
  },
  payModeToggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  payModeBtn: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    backgroundColor: "rgba(11, 14, 18, 0.8)",
  },
  payModeBtnActive: {
    backgroundColor: colors.goldAction,
    borderColor: colors.gold,
  },
  payModeBtnText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11.5,
  },
  payModeBtnTextActive: {
    color: colors.actionInk,
    fontFamily: fontFamilies.sansBold,
  },
  modalEntriesSection: {
    marginBottom: 16,
  },
  modalEntriesHeading: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansBold,
    fontSize: 10.5,
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  modalLoadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 8,
  },
  modalLoadingText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
  },
  modalEntryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 8,
  },
  modalEntryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  modalEntryIndex: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "rgba(224, 184, 74, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
  },
  modalEntryIndexText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 11.5,
  },
  modalEntryName: {
    color: "#fff",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 14,
  },
  modalEntryDates: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    marginTop: 2,
  },
  modalEntryBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  modalEntryCardOnline: {
    borderColor: "rgba(96, 165, 250, 0.35)",
    backgroundColor: "rgba(30, 58, 95, 0.18)",
  },
  modalEntryIndexOnline: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    borderColor: "rgba(96, 165, 250, 0.5)",
  },
  modalEntrySourceBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.15)",
  },
  modalEntrySourceBadgeOnline: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
  },
  modalEntrySourceText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 8.5,
  },
  modalEntrySourceTextOnline: {
    color: "#93C5FD",
  },
  modalStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    backgroundColor: "rgba(34, 197, 94, 0.18)",
  },
  modalStatusText: {
    color: "#86EFAC",
    fontFamily: fontFamilies.sansBold,
    fontSize: 8,
  },
  modalEntryPersons: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 10.5,
  },
  modalEntryRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  modalEntryAmount: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 15,
  },
  modalEntryAmountOnline: {
    color: "#93C5FD",
  },
  modalEntryActions: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  modalActionBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
  },
  modalActionBtnDanger: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  onlineLockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(96, 165, 250, 0.3)",
    marginTop: 4,
  },
  onlineLockText: {
    color: "#93C5FD",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 9.5,
  },
  modalEmptyBox: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modalEmptyText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
  },
  quickToggleDayWrap: {
    marginTop: 4,
    paddingBottom: 8,
  },
  quickToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    backgroundColor: "rgba(224, 184, 74, 0.08)",
  },
  quickToggleBtnText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12.5,
  },

  // KPI Stats Grid (Bookings)
  kpiGrid: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  kpiGridDesktop: {
    gap: 16,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.2)",
    backgroundColor: "#10141B",
  },
  kpiTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kpiLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  kpiValue: {
    marginTop: 8,
    color: "#fff",
    fontFamily: fontFamilies.sansBold,
    fontSize: 22,
  },
  kpiSub: {
    marginTop: 4,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
  },

  // Bookings Top Bar & Exports
  bookingsTopBar: {
    flexDirection: "column",
    gap: 12,
    marginBottom: 16,
  },
  bookingsTopBarDesktop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bookingsMonthSwitcher: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(16, 20, 27, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.25)",
  },
  monthArrowSmall: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
  },
  bookingsMonthText: {
    color: "#fff",
    fontFamily: fontFamilies.sansBold,
    fontSize: 14,
    minWidth: 140,
    textAlign: "center",
  },
  exportActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  exportBtn: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  exportBtnPdf: {
    backgroundColor: "rgba(217, 119, 6, 0.12)",
    borderColor: "rgba(217, 119, 6, 0.4)",
  },
  exportBtnTextPdf: {
    color: "#FBBF24",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11.5,
  },
  exportBtnExcel: {
    backgroundColor: "rgba(22, 163, 74, 0.12)",
    borderColor: "rgba(34, 197, 94, 0.4)",
  },
  exportBtnTextExcel: {
    color: "#86EFAC",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11.5,
  },

  // Bookings Filter Tabs & Rows
  filtersRow: {
    flexDirection: "column",
    gap: 12,
    marginBottom: 16,
  },
  filtersRowDesktop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterTabs: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  filterTabActive: {
    backgroundColor: "rgba(224, 184, 74, 0.18)",
    borderColor: colors.gold,
  },
  filterTabActiveOnline: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    borderColor: "#60A5FA",
  },
  filterTabActiveOffline: {
    backgroundColor: "rgba(217, 119, 6, 0.2)",
    borderColor: "#F59E0B",
  },
  filterTabText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11.5,
  },
  filterTabTextActive: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
  },
  filterTabTextActiveOnline: {
    color: "#93C5FD",
    fontFamily: fontFamilies.sansBold,
  },
  filterTabTextActiveOffline: {
    color: "#FDE68A",
    fontFamily: fontFamilies.sansBold,
  },
  filtersRightWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addBookingBtn: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 15,
    borderRadius: radii.pill,
    backgroundColor: colors.goldAction,
  },
  addBookingBtnText: {
    color: colors.actionInk,
    fontFamily: fontFamilies.sansBold,
    fontSize: 12,
  },
  ledgerList: {
    gap: 12,
  },
  bookingCard: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "#10141B",
  },
  bookingCardDesktop: {
    paddingHorizontal: 18,
  },
  bookingCardOnline: {
    borderColor: "rgba(96, 165, 250, 0.3)",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
  },
  bookingId: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    backgroundColor: "rgba(224, 184, 74, 0.1)",
  },
  bookingIdOnline: {
    borderColor: "rgba(96, 165, 250, 0.4)",
    backgroundColor: "rgba(59, 130, 246, 0.15)",
  },
  bookingIdText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
  },
  bookingMain: {
    flex: 1,
  },
  bookingTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  guest: {
    color: "#fff",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 15,
  },
  channelBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  channelOnline: {
    backgroundColor: "rgba(59, 130, 246, 0.18)",
    borderColor: "rgba(96, 165, 250, 0.4)",
  },
  channelOffline: {
    backgroundColor: "rgba(217, 119, 6, 0.18)",
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  channelBadgeText: {
    fontFamily: fontFamilies.sansBold,
    fontSize: 9,
  },
  channelOnlineText: {
    color: "#93C5FD",
  },
  channelOfflineText: {
    color: "#FDE68A",
  },
  bookingMeta: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  ownerTicketIdPill: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    marginTop: 7,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.55)",
    backgroundColor: "rgba(224, 184, 74, 0.13)",
  },
  ownerTicketIdText: {
    color: "#FDE68A",
    fontFamily: fontFamilies.sansBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  metaDot: {
    color: "rgba(255, 255, 255, 0.2)",
    fontSize: 11,
  },
  statusPill: {
    color: "#86EFAC",
    fontFamily: fontFamilies.sansBold,
    fontSize: 9.5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
  },
  muted: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
  },
  datesMeta: {
    marginTop: 3,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11.5,
  },
  bookingRight: {
    alignItems: "flex-end",
  },
  bookingAmount: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 16,
  },
  bookingAmountOnline: {
    color: "#93C5FD",
  },
  miniActions: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 8,
  },
  empty: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
  },

  // Units
  unitsHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18,
  },
  unitsTitle: {
    color: colors.gold,
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 26,
  },
  unitsSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
  },
  addUnitButton: {
    height: 42,
    borderRadius: 12,
    overflow: "hidden",
  },
  addUnitButtonFill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
  },
  addUnitText: {
    color: colors.actionInk,
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
  },
  unitsList: {
    gap: 16,
  },
  unitsListDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  unitPanel: {
    gap: 12,
  },
  unitPanelDesktop: {
    width: "48.5%",
  },
  unitTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  unitImage: {
    width: 58,
    height: 58,
    borderRadius: 12,
  },
  unitInfo: {
    flex: 1,
  },
  unitName: {
    color: "#fff",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 16,
  },
  capacity: {
    alignSelf: "flex-start",
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radii.pill,
    backgroundColor: "#1A2740",
  },
  capacityText: {
    color: "#7EB6FF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 9.5,
  },
  status: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  availableStatus: {
    backgroundColor: "rgba(20, 83, 45, 0.7)",
  },
  statusText: {
    fontFamily: fontFamilies.sansBold,
    fontSize: 9.5,
    letterSpacing: 0.6,
  },
  priceBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    backgroundColor: "#0B0E11",
  },
  weekday: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  unitPrice: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 16,
    marginTop: 2,
  },
  perNight: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
  },
  unitActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deleteUnitBtn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },

  // Profile
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  profileTitle: {
    color: colors.gold,
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 28,
  },
  logout: {
    height: 38,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#DC2626",
  },
  logoutFill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
  },
  logoutText: {
    color: "#fff",
    fontFamily: fontFamilies.sansBold,
    fontSize: 12.5,
  },
  profileCard: {
    alignItems: "center",
    gap: 12,
    padding: 24,
    borderColor: "rgba(224, 184, 74, 0.35)",
  },
  avatarGlow: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 38,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
  },
  avatar: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 34,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: "#0B0E11",
  },
  profileCopy: {
    alignItems: "center",
  },
  propertyName: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 18,
    textAlign: "center",
  },
  ownerName: {
    marginTop: 4,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    textAlign: "center",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
  },
  verifiedText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  formTitle: {
    color: "#fff",
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 20,
  },
  inlineAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.4)",
    backgroundColor: "rgba(224, 184, 74, 0.08)",
  },
  inlineActionText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11.5,
  },
  profileNotice: {
    marginTop: 14,
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 20,
  },
  link: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
  },

  // Media
  ownerMedia: {
    marginVertical: 10,
    gap: 8,
  },
  ownerMediaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ownerMediaItem: {
    width: 76,
    height: 66,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#0B0E11",
  },
  ownerMediaRemove: {
    position: "absolute",
    right: 4,
    top: 4,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  ownerMediaAdd: {
    width: 76,
    height: 66,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(224, 184, 74, 0.45)",
    backgroundColor: "rgba(224, 184, 74, 0.04)",
  },
  ownerMediaAddText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 9.5,
  },

  // General Helpers
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#07080A",
  },
  loadingText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
  },
  message: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },
  messageError: {
    color: "#FCA5A5",
    borderColor: "rgba(239, 68, 68, 0.4)",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },
  messageSuccess: {
    color: "#86EFAC",
    borderColor: "rgba(34, 197, 94, 0.4)",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  editableInput: {
    width: "100%",
    color: "#fff",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 13,
    paddingHorizontal: 12,
  },
  multiline: {
    height: 88,
    paddingTop: 10,
    textAlignVertical: "top",
  },
  formPanel: {
    marginBottom: 20,
    gap: 16,
    padding: 22,
  },
  formHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    paddingBottom: 14,
    marginBottom: 6,
  },
  formSub: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
  },
  formSectionBox: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.18)",
    gap: 12,
  },
  formSectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(224, 184, 74, 0.15)",
    paddingBottom: 8,
    marginBottom: 4,
  },
  formSectionTitle: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 4,
  },
  option: {
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  optionActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(224, 184, 74, 0.14)",
  },
  optionText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11.5,
  },
  optionTextActive: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 4,
  },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.09)",
  },
  presetChipActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
  },
  presetChipText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11.5,
  },
  presetChipTextActive: {
    color: "#fff",
    fontFamily: fontFamilies.sansBold,
  },
  togglePillRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  togglePill: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  togglePillActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(224, 184, 74, 0.15)",
  },
  togglePillText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11.5,
  },
  togglePillTextActive: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
  },
  formActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  cancelFormBtn: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  cancelFormBtnText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
  },
  unitBadgePillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  unitCategoryPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: "rgba(96, 165, 250, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(96, 165, 250, 0.35)",
  },
  unitCategoryText: {
    color: "#93C5FD",
    fontFamily: fontFamilies.sansBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  unitBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
  },
  unitBadgeText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 9,
  },
  unitLocationText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    marginTop: 2,
  },
  specsChipGrid: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  specMiniChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  specMiniChipText: {
    color: "#fff",
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },
  unitMetaStrip: {
    flexDirection: "row",
    gap: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  unitMetaCol: {
    flex: 1,
    gap: 2,
  },
  unitMetaLabel: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 9.5,
    textTransform: "uppercase",
  },
  unitMetaVal: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
  },
  cancel: {
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },

  // Inventory Availability Modal Controls
  modalInventoryControlBox: {
    backgroundColor: "#131722",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.28)",
    padding: 14,
    marginBottom: 14,
  },
  modalInventoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 6,
  },
  modalInventoryTitle: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 11.5,
    letterSpacing: 0.6,
  },
  modalInventorySub: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
  },
  inventoryStepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
  },
  inventoryStepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A0D14",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    padding: 4,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperValueBox: {
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValueText: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.sansBold,
    fontSize: 16,
  },
  stepperValueSub: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 10.5,
  },
  inventoryActionBtnGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  blockAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
  },
  blockAllBtnText: {
    color: "#EF4444",
    fontFamily: fontFamilies.sansBold,
    fontSize: 11.5,
  },
  resetDefaultBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "rgba(224, 184, 74, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
  },
  resetDefaultBtnText: {
    color: colors.gold,
    fontFamily: fontFamilies.sansBold,
    fontSize: 11.5,
  },

  // Accidental-Touch Safeguard Confirmation Modal
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 9999,
  },
  confirmModalCard: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.3)",
    backgroundColor: "#12151B",
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  confirmModalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  confirmModalTitle: {
    color: "#fff",
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 20,
    textAlign: "center",
    marginBottom: 10,
  },
  confirmModalDesc: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 22,
  },
  confirmModalActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  confirmModalBtnCancel: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    backgroundColor: "#181C24",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmModalBtnCancelText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
  },
  confirmModalBtnConfirm: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmModalBtnConfirmText: {
    color: "#fff",
    fontFamily: fontFamilies.sansBold,
    fontSize: 13,
  },
  modalFormBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  cancelReleaseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  cancelReleaseBtnText: {
    color: "#FCA5A5",
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12.5,
  },
  cancelReleaseBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  cancelReleaseBtnSecondaryText: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12.5,
  },

  // Stay Type & Inventory Modal Popup
  stayTypeModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 9999,
  },
  stayTypeModalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
  stayTypeModalCard: {
    width: "100%",
    maxWidth: 840,
    maxHeight: "90%",
    backgroundColor: "#0D1017",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(224, 184, 74, 0.35)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 25,
    zIndex: 10,
  },
  stayTypeModalCardDesktop: {
    maxWidth: 880,
    maxHeight: "88%",
  },
  stayTypeModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "#11141D",
  },
  stayTypeModalTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 18,
  },
  stayTypeModalSub: {
    color: colors.textMuted,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    marginTop: 2,
  },
  stayTypeModalScroll: {
    padding: 20,
    gap: 16,
  },
  stayTypeModalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "#11141D",
  },
  stayTypeCancelBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  stayTypeCancelBtnText: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
  },
});
