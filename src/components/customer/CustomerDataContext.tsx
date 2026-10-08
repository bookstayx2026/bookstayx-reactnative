import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "@/components/auth";
import { getProperty, images, type Property } from "@/data/discovery";
import { ApiError, getMyBookings, type RemoteBooking } from "@/services/api";

export type LocalBooking = {
  id: string; bookingCode: string; ticketId?: string | null; propertyId: string; name: string; image: number | string;
  location: string; dateRange: string; nights: number; guests: number;
  checkInTime?: string | null; checkOutTime?: string | null;
  vegGuestCount?: number | null; nonVegGuestCount?: number | null;
  maleGuestCount?: number | null; femaleGuestCount?: number | null;
  items?: RemoteBooking["items"]; unitName?: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  paymentStatus?: string; totalAmount: number; tab: "live" | "history";
};
type BookingInput = { property: Property; guests: number; nights: number; dateRange: string; total: number; bookingCode?: string; status?: LocalBooking["status"] };
type Value = {
  savedIds: string[]; bookings: LocalBooking[]; bookingsLoading: boolean; bookingsError: string;
  toggleSaved: (id: string) => void; isSaved: (id: string) => boolean;
  confirmBooking: (input: BookingInput) => LocalBooking; refreshBookings: () => Promise<void>;
};
const Context = createContext<Value | null>(null);

const SAVED_IDS_STORAGE_KEY = "bookstayx.saved_ids.v1";

async function readStoredSavedIds(): Promise<string[]> {
  try {
    const raw = Platform.OS === "web"
      ? globalThis.localStorage?.getItem(SAVED_IDS_STORAGE_KEY) ?? null
      : await SecureStore.getItemAsync(SAVED_IDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

async function writeStoredSavedIds(ids: string[]): Promise<void> {
  try {
    const raw = JSON.stringify(ids);
    if (Platform.OS === "web") {
      globalThis.localStorage?.setItem(SAVED_IDS_STORAGE_KEY, raw);
    } else {
      await SecureStore.setItemAsync(SAVED_IDS_STORAGE_KEY, raw);
    }
  } catch {}
}

const dateRange = (start: string, end: string) => `${new Date(start).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} – ${new Date(end).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;
const nightsBetween = (start: string, end: string) => Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000));
const mapStatus = (booking: RemoteBooking): Pick<LocalBooking, "status" | "tab"> => {
  const value = String(booking.booking_status || "").toUpperCase();
  if (value.includes("CANCEL") || value === "DELETED" || value === "EXPIRED" || value.includes("REJECT")) return { status: "cancelled", tab: "history" };
  if (new Date(booking.checkout_datetime).getTime() < Date.now() && (value === "TICKET_GENERATED" || value === "CONFIRMED" || value === "COMPLETED")) return { status: "completed", tab: "history" };
  if (["TICKET_GENERATED", "OWNER_CONFIRMED", "CONFIRMED", "ACCEPTED", "PAID"].includes(value)) return { status: "confirmed", tab: "live" };
  return { status: "pending", tab: "live" };
};
const mapBooking = (booking: RemoteBooking): LocalBooking => {
  const propertyId = booking.slug || booking.property_id;
  const bundled = getProperty(propertyId);
  return {
    id: booking.booking_id,
    bookingCode: booking.booking_id,
    ticketId: booking.ticket_id,
    propertyId,
    name: booking.property_name,
    image: booking.property_image || bundled?.image || images.villa1,
    location: booking.location || bundled?.locationLabel || "BookStayX",
    dateRange: dateRange(booking.checkin_datetime, booking.checkout_datetime),
    nights: nightsBetween(booking.checkin_datetime, booking.checkout_datetime),
    guests: Number(booking.persons || 1),
    checkInTime: booking.check_in_time || "02:00 PM",
    checkOutTime: booking.check_out_time || "11:00 AM",
    vegGuestCount: booking.veg_guest_count,
    nonVegGuestCount: booking.nonveg_guest_count,
    maleGuestCount: booking.male_guest_count,
    femaleGuestCount: booking.female_guest_count,
    items: booking.items,
    unitName: booking.unit_name,
    ...mapStatus(booking),
    paymentStatus: booking.payment_status,
    totalAmount: Number(booking.total_amount || 0),
  };
};

export function CustomerDataProvider({ children }: PropsWithChildren) {
  const { session, rotateSession, signOut } = useAuth();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [bookings, setBookings] = useState<LocalBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState("");

  // Load saved IDs on mount
  useEffect(() => {
    let active = true;
    void readStoredSavedIds().then((ids) => {
      if (active && ids.length > 0) {
        setSavedIds(ids);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const loadBookingsWithAuth = useCallback(
    async (token: string, silentRetry = true): Promise<LocalBooking[] | null> => {
      try {
        const result = await getMyBookings(token);
        setBookingsError("");
        return result.bookings.map(mapBooking);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const isAuthError =
          (err instanceof ApiError && err.status === 401) ||
          msg.toLowerCase().includes("unauthorized") ||
          msg.toLowerCase().includes("invalid or expired token") ||
          msg.toLowerCase().includes("access denied");

        if (isAuthError && silentRetry && session?.tokens?.refreshToken) {
          try {
            const nextSession = await rotateSession();
            if (nextSession?.tokens?.accessToken) {
              const retryResult = await getMyBookings(nextSession.tokens.accessToken);
              setBookingsError("");
              return retryResult.bookings.map(mapBooking);
            }
          } catch {
            // Rotation failed
          }
        }

        if (isAuthError) {
          // If session is expired and cannot be refreshed, clear it so we don't spam 401s
          await signOut();
          setBookings([]);
          setBookingsError("");
          return null;
        }

        setBookingsError(msg);
        return null;
      }
    },
    [session, rotateSession, signOut]
  );

  const refreshBookings = useCallback(async () => {
    if (!session?.tokens?.accessToken) {
      setBookings([]);
      setBookingsError("");
      return;
    }
    const list = await loadBookingsWithAuth(session.tokens.accessToken);
    if (list) {
      setBookings(list);
    }
  }, [session, loadBookingsWithAuth]);

  // Real-time polling & window focus auto-refresh
  useEffect(() => {
    if (!session?.tokens?.accessToken) return;
    let active = true;

    const fetchLatest = async () => {
      if (!session?.tokens?.accessToken) return;
      const list = await loadBookingsWithAuth(session.tokens.accessToken);
      if (active && list) {
        setBookings(list);
      }
    };

    setBookingsLoading(true);
    void fetchLatest().finally(() => {
      if (active) setBookingsLoading(false);
    });

    // Real-time polling every 6 seconds
    const interval = setInterval(() => {
      void fetchLatest();
    }, 6000);

    // Refresh on focus / tab visibility
    const handleFocus = () => void fetchLatest();
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.addEventListener("focus", handleFocus);
      document.addEventListener("visibilitychange", handleFocus);
    }

    return () => {
      active = false;
      clearInterval(interval);
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.removeEventListener("focus", handleFocus);
        document.removeEventListener("visibilitychange", handleFocus);
      }
    };
  }, [session, loadBookingsWithAuth]);

  const toggleSaved = useCallback((id: string) => {
    setSavedIds((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [id, ...current];
      void writeStoredSavedIds(next);
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  const confirmBooking = useCallback((input: BookingInput) => {
    const code = input.bookingCode || `BSX${String(Date.now()).slice(-6)}`;
    const next: LocalBooking = { id: code, bookingCode: code, propertyId: input.property.id, name: input.property.name, image: input.property.image, location: input.property.locationLabel, dateRange: input.dateRange, nights: input.nights, guests: input.guests, status: input.status || "confirmed", totalAmount: input.total, tab: "live" };
    setBookings((items) => [next, ...items.filter((item) => item.id !== code)]);
    return next;
  }, []);

  const value = useMemo(() => ({ savedIds, bookings, bookingsLoading, bookingsError, toggleSaved, isSaved, confirmBooking, refreshBookings }), [savedIds, bookings, bookingsLoading, bookingsError, toggleSaved, isSaved, confirmBooking, refreshBookings]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useCustomerData() { const value = useContext(Context); if (!value) throw new Error("useCustomerData must be used inside CustomerDataProvider"); return value; }
export const savedProperties = (ids: string[]) => ids.map(getProperty).filter(Boolean) as Property[];

