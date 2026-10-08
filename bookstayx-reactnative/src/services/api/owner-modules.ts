import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { OwnerLedgerEntry, OwnerUnit } from "./owner";
import { apiRequest } from "./client";
import { readStoredSession } from "../auth/storage";

// ============================================================================
// UNIVERSAL STORAGE ADAPTER (Web localStorage + Native SecureStore)
// ============================================================================

async function getStoredItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return typeof globalThis.localStorage !== "undefined"
        ? globalThis.localStorage.getItem(key)
        : null;
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function setStoredItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof globalThis.localStorage !== "undefined") {
        globalThis.localStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (err) {
    console.warn("Storage write error for key:", key, err);
  }
}

async function getOwnerAccessToken(): Promise<string | null> {
  try {
    const raw = await readStoredSession();
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session?.role === "owner" && session?.tokens?.accessToken) {
      return session.tokens.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

// ============================================================================
// 1. EXPENSES TYPES & STORAGE (SUPABASE SYNC + OFFLINE CACHE)
// ============================================================================

export type ExpenseCategory =
  | "Cleaning"
  | "Electricity"
  | "Staff"
  | "Repairs"
  | "Food"
  | "Maintenance"
  | "Miscellaneous";

export interface ExpenseRecord {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  villaUnitId?: number;
  villaUnitName?: string;
  paidTo?: string;
  paymentMethod?: string;
  description: string;
  createdAt: string;
}

const EXPENSES_STORAGE_KEY = "bookstayx.owner.expenses.v1";

const initialExpenses: ExpenseRecord[] = [
  {
    id: "EXP-101",
    date: new Date().toISOString().split("T")[0] || "2026-09-25",
    category: "Cleaning",
    amount: 1800,
    villaUnitName: "Lakeview Villa Main",
    paidTo: "Sunita Housekeeping",
    paymentMethod: "UPI",
    description: "Deep sanitization & linen refresh for weekend checkout",
    createdAt: new Date().toISOString(),
  },
  {
    id: "EXP-102",
    date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0] || "2026-09-23",
    category: "Electricity",
    amount: 4200,
    paidTo: "MSEDCL",
    paymentMethod: "NetBanking",
    description: "Monthly common area & pool pump electricity bill",
    createdAt: new Date().toISOString(),
  },
  {
    id: "EXP-103",
    date: new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0] || "2026-09-20",
    category: "Food",
    amount: 2500,
    paidTo: "Local Organic Farm Store",
    paymentMethod: "Cash",
    description: "Welcome drink hampers, breakfast staples, tea & coffee kit",
    createdAt: new Date().toISOString(),
  },
  {
    id: "EXP-104",
    date: new Date(Date.now() - 86400000 * 8).toISOString().split("T")[0] || "2026-09-17",
    category: "Repairs",
    amount: 1500,
    paidTo: "Pawna AC Mechanics",
    paymentMethod: "UPI",
    description: "Master bedroom AC filter replacement and gas check",
    createdAt: new Date().toISOString(),
  },
];

export async function getOwnerExpenses(tokenOverride?: string): Promise<ExpenseRecord[]> {
  const token = tokenOverride || (await getOwnerAccessToken());
  if (token) {
    try {
      const response = await apiRequest<{ success: true; data: ExpenseRecord[] }>(
        "/api/owners/dashboard/expenses",
        { headers: bearer(token) }
      );
      if (response.success && Array.isArray(response.data)) {
        await setStoredItem(EXPENSES_STORAGE_KEY, JSON.stringify(response.data));
        return response.data;
      }
    } catch (err) {
      console.warn("Falling back to local cached expenses:", err);
    }
  }
  try {
    const raw = await getStoredItem(EXPENSES_STORAGE_KEY);
    if (!raw) {
      await setStoredItem(EXPENSES_STORAGE_KEY, JSON.stringify(initialExpenses));
      return initialExpenses;
    }
    return JSON.parse(raw);
  } catch {
    return initialExpenses;
  }
}

export async function saveOwnerExpense(
  expense: Omit<ExpenseRecord, "id" | "createdAt"> & { id?: string },
  tokenOverride?: string
): Promise<ExpenseRecord> {
  const token = tokenOverride || (await getOwnerAccessToken());
  if (token) {
    try {
      const response = await apiRequest<{ success: true; data: ExpenseRecord }>(
        "/api/owners/dashboard/expenses",
        { method: "POST", headers: bearer(token), body: expense }
      );
      if (response.success && response.data) {
        const current = await getOwnerExpenses(token);
        const index = current.findIndex((item) => item.id === response.data.id);
        const updated = index !== -1
          ? current.map((item, idx) => (idx === index ? response.data : item))
          : [response.data, ...current];
        await setStoredItem(EXPENSES_STORAGE_KEY, JSON.stringify(updated));
        return response.data;
      }
    } catch (err) {
      console.warn("Backend expense save failed, persisting locally:", err);
    }
  }

  const current = await getOwnerExpenses();
  if (expense.id) {
    const index = current.findIndex((item) => item.id === expense.id);
    if (index !== -1 && current[index]) {
      current[index] = { ...current[index], ...expense } as ExpenseRecord;
      await setStoredItem(EXPENSES_STORAGE_KEY, JSON.stringify(current));
      return current[index];
    }
  }
  const newRecord: ExpenseRecord = {
    ...expense,
    id: `EXP-${Date.now().toString().slice(-4)}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [newRecord, ...current];
  await setStoredItem(EXPENSES_STORAGE_KEY, JSON.stringify(updated));
  return newRecord;
}

export async function deleteOwnerExpense(id: string, tokenOverride?: string): Promise<boolean> {
  const token = tokenOverride || (await getOwnerAccessToken());
  if (token) {
    try {
      await apiRequest<{ success: true }>(
        `/api/owners/dashboard/expenses/${encodeURIComponent(id)}`,
        { method: "DELETE", headers: bearer(token) }
      );
    } catch (err) {
      console.warn("Backend expense deletion failed, deleting locally:", err);
    }
  }
  const current = await getOwnerExpenses();
  const updated = current.filter((item) => item.id !== id);
  await setStoredItem(EXPENSES_STORAGE_KEY, JSON.stringify(updated));
  return true;
}

// ============================================================================
// 2. STAFF & HOUSEKEEPING TYPES & STORAGE (SUPABASE SYNC + CACHE)
// ============================================================================

export type StaffRole =
  | "Housekeeper"
  | "Cleaner"
  | "Caretaker"
  | "Cook"
  | "Manager"
  | "Security"
  | "Other";

export type AttendanceStatus = "Present" | "Absent" | "Leave" | "Half Day";
export type StaffPaymentStatus = "Paid" | "Partial" | "Pending";

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  mobile: string;
  assignedVilla?: string;
  isActive: boolean;
  monthlySalary: number;
  joiningDate: string;
}

export interface StaffAttendanceRecord {
  date: string; // YYYY-MM-DD
  staffId: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface StaffPaymentRecord {
  id: string;
  staffId: string;
  period: string; // e.g. "September 2026"
  expectedPay: number;
  amountPaid: number;
  pendingAmount: number;
  paymentDate?: string;
  paymentStatus: StaffPaymentStatus;
  notes?: string;
}

const STAFF_STORAGE_KEY = "bookstayx.owner.staff.v1";
const ATTENDANCE_STORAGE_KEY = "bookstayx.owner.staff.attendance.v1";
const STAFF_PAYMENTS_STORAGE_KEY = "bookstayx.owner.staff.payments.v1";

const initialStaff: StaffMember[] = [
  {
    id: "STF-1",
    name: "Rahul Patil",
    role: "Housekeeper",
    mobile: "+91 98234 56789",
    assignedVilla: "Lakeview Villa Main",
    isActive: true,
    monthlySalary: 16000,
    joiningDate: "2025-01-15",
  },
  {
    id: "STF-2",
    name: "Sunita Gaikwad",
    role: "Cleaner",
    mobile: "+91 97654 32109",
    assignedVilla: "All Units",
    isActive: true,
    monthlySalary: 12000,
    joiningDate: "2025-03-01",
  },
  {
    id: "STF-3",
    name: "Dnyaneshwar Shinde",
    role: "Caretaker",
    mobile: "+91 94220 11223",
    assignedVilla: "Lakeview Villa Main",
    isActive: true,
    monthlySalary: 18000,
    joiningDate: "2024-11-10",
  },
  {
    id: "STF-4",
    name: "Aarti Kadam",
    role: "Cook",
    mobile: "+91 98811 44556",
    assignedVilla: "Cottage Unit A",
    isActive: true,
    monthlySalary: 15000,
    joiningDate: "2025-06-20",
  },
];

export async function getOwnerStaffList(tokenOverride?: string): Promise<StaffMember[]> {
  const token = tokenOverride || (await getOwnerAccessToken());
  if (token) {
    try {
      const response = await apiRequest<{ success: true; data: StaffMember[] }>(
        "/api/owners/dashboard/staff",
        { headers: bearer(token) }
      );
      if (response.success && Array.isArray(response.data)) {
        await setStoredItem(STAFF_STORAGE_KEY, JSON.stringify(response.data));
        return response.data;
      }
    } catch (err) {
      console.warn("Falling back to local cached staff:", err);
    }
  }
  try {
    const raw = await getStoredItem(STAFF_STORAGE_KEY);
    if (!raw) {
      await setStoredItem(STAFF_STORAGE_KEY, JSON.stringify(initialStaff));
      return initialStaff;
    }
    return JSON.parse(raw);
  } catch {
    return initialStaff;
  }
}

export async function saveOwnerStaffMember(
  staff: Omit<StaffMember, "id"> & { id?: string },
  tokenOverride?: string
): Promise<StaffMember> {
  const token = tokenOverride || (await getOwnerAccessToken());
  if (token) {
    try {
      const response = await apiRequest<{ success: true; data: StaffMember }>(
        "/api/owners/dashboard/staff",
        { method: "POST", headers: bearer(token), body: staff }
      );
      if (response.success && response.data) {
        const current = await getOwnerStaffList(token);
        const index = current.findIndex((item) => item.id === response.data.id);
        const updated = index !== -1
          ? current.map((item, idx) => (idx === index ? response.data : item))
          : [...current, response.data];
        await setStoredItem(STAFF_STORAGE_KEY, JSON.stringify(updated));
        return response.data;
      }
    } catch (err) {
      console.warn("Backend staff save failed, persisting locally:", err);
    }
  }

  const current = await getOwnerStaffList();
  if (staff.id) {
    const index = current.findIndex((item) => item.id === staff.id);
    if (index !== -1 && current[index]) {
      current[index] = { ...current[index], ...staff } as StaffMember;
      await setStoredItem(STAFF_STORAGE_KEY, JSON.stringify(current));
      return current[index];
    }
  }
  const newRecord: StaffMember = {
    ...staff,
    id: `STF-${Date.now().toString().slice(-4)}`,
  };
  const updated = [...current, newRecord];
  await setStoredItem(STAFF_STORAGE_KEY, JSON.stringify(updated));
  return newRecord;
}

export async function deleteOwnerStaffMember(id: string, tokenOverride?: string): Promise<boolean> {
  const token = tokenOverride || (await getOwnerAccessToken());
  if (token) {
    try {
      await apiRequest<{ success: true }>(
        `/api/owners/dashboard/staff/${encodeURIComponent(id)}`,
        { method: "DELETE", headers: bearer(token) }
      );
    } catch (err) {
      console.warn("Backend staff deletion failed, deleting locally:", err);
    }
  }
  const current = await getOwnerStaffList();
  const updated = current.filter((item) => item.id !== id);
  await setStoredItem(STAFF_STORAGE_KEY, JSON.stringify(updated));
  return true;
}

export async function getStaffAttendanceRecords(tokenOverride?: string): Promise<StaffAttendanceRecord[]> {
  const token = tokenOverride || (await getOwnerAccessToken());
  if (token) {
    try {
      const response = await apiRequest<{ success: true; data: StaffAttendanceRecord[] }>(
        "/api/owners/dashboard/staff-attendance",
        { headers: bearer(token) }
      );
      if (response.success && Array.isArray(response.data)) {
        await setStoredItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(response.data));
        return response.data;
      }
    } catch (err) {
      console.warn("Falling back to local cached attendance:", err);
    }
  }
  try {
    const raw = await getStoredItem(ATTENDANCE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function markStaffAttendance(record: StaffAttendanceRecord, tokenOverride?: string): Promise<void> {
  const token = tokenOverride || (await getOwnerAccessToken());
  if (token) {
    try {
      await apiRequest<{ success: true }>(
        "/api/owners/dashboard/staff-attendance",
        { method: "POST", headers: bearer(token), body: record }
      );
    } catch (err) {
      console.warn("Backend attendance mark failed, saving locally:", err);
    }
  }
  const current = await getStaffAttendanceRecords();
  const index = current.findIndex((r) => r.staffId === record.staffId && r.date === record.date);
  if (index !== -1) {
    current[index] = record;
  } else {
    current.push(record);
  }
  await setStoredItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(current));
}

export async function getStaffPaymentRecords(tokenOverride?: string): Promise<StaffPaymentRecord[]> {
  const token = tokenOverride || (await getOwnerAccessToken());
  if (token) {
    try {
      const response = await apiRequest<{ success: true; data: StaffPaymentRecord[] }>(
        "/api/owners/dashboard/staff-payments",
        { headers: bearer(token) }
      );
      if (response.success && Array.isArray(response.data)) {
        await setStoredItem(STAFF_PAYMENTS_STORAGE_KEY, JSON.stringify(response.data));
        return response.data;
      }
    } catch (err) {
      console.warn("Falling back to local cached payments:", err);
    }
  }
  try {
    const raw = await getStoredItem(STAFF_PAYMENTS_STORAGE_KEY);
    if (!raw) {
      const demoPayments: StaffPaymentRecord[] = [
        {
          id: "PAY-1",
          staffId: "STF-1",
          period: "September 2026",
          expectedPay: 16000,
          amountPaid: 11000,
          pendingAmount: 5000,
          paymentDate: "2026-09-10",
          paymentStatus: "Partial",
          notes: "Advance paid on 10th",
        },
        {
          id: "PAY-2",
          staffId: "STF-2",
          period: "September 2026",
          expectedPay: 12000,
          amountPaid: 12000,
          pendingAmount: 0,
          paymentDate: "2026-09-05",
          paymentStatus: "Paid",
        },
      ];
      await setStoredItem(STAFF_PAYMENTS_STORAGE_KEY, JSON.stringify(demoPayments));
      return demoPayments;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveStaffPaymentRecord(
  record: Omit<StaffPaymentRecord, "id"> & { id?: string },
  tokenOverride?: string
): Promise<StaffPaymentRecord> {
  const token = tokenOverride || (await getOwnerAccessToken());
  if (token) {
    try {
      const response = await apiRequest<{ success: true; data: StaffPaymentRecord }>(
        "/api/owners/dashboard/staff-payments",
        { method: "POST", headers: bearer(token), body: record }
      );
      if (response.success && response.data) {
        const current = await getStaffPaymentRecords(token);
        const index = current.findIndex((item) => item.id === response.data.id);
        const updated = index !== -1
          ? current.map((item, idx) => (idx === index ? response.data : item))
          : [response.data, ...current];
        await setStoredItem(STAFF_PAYMENTS_STORAGE_KEY, JSON.stringify(updated));
        return response.data;
      }
    } catch (err) {
      console.warn("Backend payment save failed, persisting locally:", err);
    }
  }

  const current = await getStaffPaymentRecords();
  if (record.id) {
    const index = current.findIndex((item) => item.id === record.id);
    if (index !== -1 && current[index]) {
      current[index] = { ...current[index], ...record } as StaffPaymentRecord;
      await setStoredItem(STAFF_PAYMENTS_STORAGE_KEY, JSON.stringify(current));
      return current[index];
    }
  }
  const newRecord: StaffPaymentRecord = {
    ...record,
    id: `PAY-${Date.now().toString().slice(-4)}`,
  };
  const updated = [newRecord, ...current];
  await setStoredItem(STAFF_PAYMENTS_STORAGE_KEY, JSON.stringify(updated));
  return newRecord;
}

// ============================================================================
// 3. BOOKING REQUESTS / ENQUIRIES (SUPABASE SYNC + CACHE)
// ============================================================================

export type RequestStatus = "Pending" | "Accepted" | "Rejected" | "Cancelled" | "Offline";

export interface BookingRequestRecord {
  id: string;
  ticketId?: string | null;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  villaUnitId?: number;
  villaUnitName: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  guestsCount: number;
  totalAmount: number;
  advanceAmount: number;
  requestSource: "Website" | "WhatsApp" | "Call" | "Referral" | "B2B";
  requestDate: string;
  status: RequestStatus;
  notes?: string;
  maleGuestCount?: number | null;
  femaleGuestCount?: number | null;
  vegGuestCount?: number | null;
  nonVegGuestCount?: number | null;
  checkInTime?: string;
  checkOutTime?: string;
  category?: string;
  items?: Array<{
    unitId: number;
    unitName: string;
    accommodationType?: string;
    persons: number;
    unitQuantity: number;
    subtotal?: number;
  }>;
}

const REQUESTS_STORAGE_KEY = "bookstayx.owner.requests.v1";

const initialRequests: BookingRequestRecord[] = [];

export async function getOwnerBookingRequests(tokenOverride?: string): Promise<BookingRequestRecord[]> {
  const token = tokenOverride || (await getOwnerAccessToken());
  if (token) {
    try {
      const response = await apiRequest<{ success: true; data: BookingRequestRecord[] }>(
        "/api/owners/dashboard/requests",
        { headers: bearer(token) }
      );
      if (response.success && Array.isArray(response.data)) {
        await setStoredItem(REQUESTS_STORAGE_KEY, JSON.stringify(response.data));
        return response.data;
      }
    } catch (err) {
      console.warn("Falling back to local cached booking requests:", err);
    }
  }
  try {
    const raw = await getStoredItem(REQUESTS_STORAGE_KEY);
    if (!raw) {
      await setStoredItem(REQUESTS_STORAGE_KEY, JSON.stringify(initialRequests));
      return initialRequests;
    }
    return JSON.parse(raw);
  } catch {
    return initialRequests;
  }
}

export async function saveBookingRequest(
  req: BookingRequestRecord,
  tokenOverride?: string
): Promise<BookingRequestRecord> {
  const token = tokenOverride || (await getOwnerAccessToken());
  if (token) {
    try {
      const response = await apiRequest<{ success: true; data: BookingRequestRecord }>(
        "/api/owners/dashboard/requests",
        { method: "POST", headers: bearer(token), body: req }
      );
      if (response.success && response.data) {
        const current = await getOwnerBookingRequests(token);
        const index = current.findIndex((r) => r.id === response.data.id);
        const updated = index !== -1
          ? current.map((r, idx) => (idx === index ? response.data : r))
          : [response.data, ...current];
        await setStoredItem(REQUESTS_STORAGE_KEY, JSON.stringify(updated));
        return response.data;
      }
    } catch (err) {
      console.warn("Backend request save failed, persisting locally:", err);
    }
  }

  const current = await getOwnerBookingRequests();
  const index = current.findIndex((r) => r.id === req.id);
  if (index !== -1) {
    current[index] = req;
  } else {
    current.unshift(req);
  }
  await setStoredItem(REQUESTS_STORAGE_KEY, JSON.stringify(current));
  return req;
}

export async function updateBookingRequestStatus(
  id: string,
  status: RequestStatus,
  tokenOverride?: string
): Promise<BookingRequestRecord | null> {
  const token = tokenOverride || (await getOwnerAccessToken());
  if (token) {
    try {
      const response = await apiRequest<{ success: true; data: BookingRequestRecord }>(
        `/api/owners/dashboard/requests/${encodeURIComponent(id)}/status`,
        { method: "PUT", headers: bearer(token), body: { status } }
      );
      if (response.success && response.data) {
        const current = await getOwnerBookingRequests(token);
        const index = current.findIndex((r) => r.id === id);
        if (index !== -1) {
          current[index] = response.data;
          await setStoredItem(REQUESTS_STORAGE_KEY, JSON.stringify(current));
        }
        return response.data;
      }
    } catch (err) {
      console.warn("Backend request status update failed, saving locally:", err);
    }
  }

  const current = await getOwnerBookingRequests();
  const index = current.findIndex((r) => r.id === id);
  if (index === -1 || !current[index]) return null;
  current[index].status = status;
  await setStoredItem(REQUESTS_STORAGE_KEY, JSON.stringify(current));
  return current[index];
}

// ============================================================================
// 4. OWNER NOTIFICATIONS (SUPABASE SYNC + CACHE)
// ============================================================================

export interface OwnerNotificationItem {
  id: string;
  type: "new_booking" | "cancellation" | "payment" | "request_update" | "system";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  referenceId?: string;
}

const OWNER_NOTIFICATIONS_KEY = "bookstayx.owner.notifications.v1";

const initialOwnerNotifications: OwnerNotificationItem[] = [
  {
    id: "ONOT-1",
    type: "new_booking",
    title: "New Confirmed Booking #BK-9042",
    message: "Vikram Malhotra booked Lakeview Villa Main for 3 nights. Advance ₹8,000 received.",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    isRead: false,
    referenceId: "BK-9042",
  },
  {
    id: "ONOT-2",
    type: "payment",
    title: "Advance Payment Received ₹5,000",
    message: "Payment successfully credited via Razorpay for booking #BK-9038.",
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    isRead: false,
    referenceId: "BK-9038",
  },
  {
    id: "ONOT-3",
    type: "request_update",
    title: "New Booking Request #REQ-7821",
    message: "Aditya Deshmukh requested Lakeview Villa for 8 guests. Review and accept.",
    timestamp: new Date(Date.now() - 3600000 * 14).toISOString(),
    isRead: false,
    referenceId: "REQ-7821",
  },
  {
    id: "ONOT-4",
    type: "cancellation",
    title: "Stay Cancelled #BK-8992",
    message: "Guest cancelled reservation for Cottage Unit A. Dates released on calendar.",
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    isRead: true,
    referenceId: "BK-8992",
  },
];

export async function getOwnerNotifications(tokenOverride?: string): Promise<OwnerNotificationItem[]> {
  const token = tokenOverride || (await getOwnerAccessToken());
  if (token) {
    try {
      const response = await apiRequest<{ success: true; data: OwnerNotificationItem[] }>(
        "/api/owners/dashboard/notifications",
        { headers: bearer(token) }
      );
      if (response.success && Array.isArray(response.data) && response.data.length > 0) {
        await setStoredItem(OWNER_NOTIFICATIONS_KEY, JSON.stringify(response.data));
        return response.data;
      }
    } catch (err) {
      console.warn("Falling back to local cached notifications:", err);
    }
  }
  try {
    const raw = await getStoredItem(OWNER_NOTIFICATIONS_KEY);
    if (!raw) {
      await setStoredItem(OWNER_NOTIFICATIONS_KEY, JSON.stringify(initialOwnerNotifications));
      return initialOwnerNotifications;
    }
    return JSON.parse(raw);
  } catch {
    return initialOwnerNotifications;
  }
}

export async function markOwnerNotificationRead(id: string, tokenOverride?: string): Promise<void> {
  const token = tokenOverride || (await getOwnerAccessToken());
  if (token) {
    try {
      await apiRequest<{ success: true }>(
        `/api/owners/dashboard/notifications/${encodeURIComponent(id)}/read`,
        { method: "PUT", headers: bearer(token) }
      );
    } catch (err) {
      console.warn("Backend notification read mark failed:", err);
    }
  }
  const current = await getOwnerNotifications(token || undefined);
  const index = current.findIndex((item) => item.id === id);
  if (index !== -1 && current[index]) {
    current[index].isRead = true;
    await setStoredItem(OWNER_NOTIFICATIONS_KEY, JSON.stringify(current));
  }
}

export async function markAllOwnerNotificationsRead(tokenOverride?: string): Promise<void> {
  const token = tokenOverride || (await getOwnerAccessToken());
  if (token) {
    try {
      await apiRequest<{ success: true }>(
        "/api/owners/dashboard/notifications/read-all",
        { method: "PUT", headers: bearer(token) }
      );
    } catch (err) {
      console.warn("Backend all-notifications read mark failed:", err);
    }
  }
  const current = await getOwnerNotifications(token || undefined);
  const updated = current.map((item) => ({ ...item, isRead: true }));
  await setStoredItem(OWNER_NOTIFICATIONS_KEY, JSON.stringify(updated));
}

// ============================================================================
// 5. OWNER SETTINGS (SUPABASE SYNC + CACHE)
// ============================================================================

export interface OwnerSettingsData {
  ownerDisplayName: string;
  businessName: string;
  primaryMobile: string;
  whatsappNumber: string;
  email: string;
  emergencyContact: string;
  autoAcceptRequests: boolean;
  smsAlertsEnabled: boolean;
  whatsappAlertsEnabled: boolean;
  checkInNoticeHours: number;
}

const OWNER_SETTINGS_KEY = "bookstayx.owner.settings.v1";

const defaultOwnerSettings: OwnerSettingsData = {
  ownerDisplayName: "Sujay Patil",
  businessName: "Pawna Haven Retreats",
  primaryMobile: "+91 88060 92609",
  whatsappNumber: "+91 88060 92609",
  email: "owner@bookstayx.com",
  emergencyContact: "+91 94220 11223",
  autoAcceptRequests: false,
  smsAlertsEnabled: true,
  whatsappAlertsEnabled: true,
  checkInNoticeHours: 24,
};

export async function getOwnerSettings(tokenOverride?: string): Promise<OwnerSettingsData> {
  const token = tokenOverride || (await getOwnerAccessToken());
  if (token) {
    try {
      const response = await apiRequest<{ success: true; data: OwnerSettingsData }>(
        "/api/owners/dashboard/settings",
        { headers: bearer(token) }
      );
      if (response.success && response.data) {
        await setStoredItem(OWNER_SETTINGS_KEY, JSON.stringify(response.data));
        return response.data;
      }
    } catch (err) {
      console.warn("Falling back to cached owner settings:", err);
    }
  }
  try {
    const raw = await getStoredItem(OWNER_SETTINGS_KEY);
    if (!raw) {
      await setStoredItem(OWNER_SETTINGS_KEY, JSON.stringify(defaultOwnerSettings));
      return defaultOwnerSettings;
    }
    return JSON.parse(raw);
  } catch {
    return defaultOwnerSettings;
  }
}

export async function saveOwnerSettings(data: Partial<OwnerSettingsData>, tokenOverride?: string): Promise<OwnerSettingsData> {
  const token = tokenOverride || (await getOwnerAccessToken());
  if (token) {
    try {
      const response = await apiRequest<{ success: true; data: OwnerSettingsData }>(
        "/api/owners/dashboard/settings",
        { method: "PUT", headers: bearer(token), body: data }
      );
      if (response.success && response.data) {
        await setStoredItem(OWNER_SETTINGS_KEY, JSON.stringify(response.data));
        return response.data;
      }
    } catch (err) {
      console.warn("Backend owner settings save failed, saving locally:", err);
    }
  }
  const current = await getOwnerSettings(token || undefined);
  const updated = { ...current, ...data };
  await setStoredItem(OWNER_SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

// ============================================================================
// 6. SHARED BOOKINGS & UNITS HELPERS
// ============================================================================

const initialDemoUnits: OwnerUnit[] = [
  {
    id: 1,
    name: "Lakeview Villa Main",
    available_persons: 12,
    total_persons: 15,
    weekday_price: "9000",
    weekend_price: "12500",
    special_price: "15000",
    amenities: ["Private Pool", "Lake View", "WiFi", "AC", "Kitchen"],
  },
  {
    id: 2,
    name: "Cottage Unit A",
    available_persons: 4,
    total_persons: 6,
    weekday_price: "4500",
    weekend_price: "6000",
    amenities: ["Garden View", "AC", "WiFi"],
  },
  {
    id: 3,
    name: "Cottage Unit B",
    available_persons: 4,
    total_persons: 6,
    weekday_price: "4500",
    weekend_price: "6000",
    amenities: ["Garden View", "AC", "WiFi"],
  },
];

const initialDemoBookings: OwnerLedgerEntry[] = [
  {
    id: 9042,
    customer_name: "Vikram Malhotra",
    check_in: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0] || "2026-09-23",
    check_out: new Date(Date.now() + 86400000 * 1).toISOString().split("T")[0] || "2026-09-26",
    payment_mode: "online",
    amount: 26000,
    advance_amount: 8000,
    total_amount: 26000,
    persons: 10,
    unit_id: 1,
    unit_name: "Lakeview Villa Main",
    source: "website",
    booking_id: "BK-9042",
    booking_status: "confirmed",
  },
  {
    id: 9038,
    customer_name: "Neha Kapoor",
    check_in: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0] || "2026-09-27",
    check_out: new Date(Date.now() + 86400000 * 4).toISOString().split("T")[0] || "2026-09-29",
    payment_mode: "online",
    amount: 12000,
    advance_amount: 5000,
    total_amount: 12000,
    persons: 4,
    unit_id: 2,
    unit_name: "Cottage Unit A",
    source: "website",
    booking_id: "BK-9038",
    booking_status: "confirmed",
  },
  {
    id: 9035,
    customer_name: "Amitabh Sen",
    check_in: new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0] || "2026-09-20",
    check_out: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0] || "2026-09-22",
    payment_mode: "offline",
    amount: 18000,
    advance_amount: 18000,
    total_amount: 18000,
    persons: 8,
    unit_id: 1,
    unit_name: "Lakeview Villa Main",
    source: "offline",
    booking_id: "BK-9035",
    booking_status: "confirmed",
  },
];

export async function getOwnerBookings(): Promise<OwnerLedgerEntry[]> {
  try {
    const raw = await getStoredItem("bookstayx.owner.bookings.v1");
    if (!raw) {
      await setStoredItem("bookstayx.owner.bookings.v1", JSON.stringify(initialDemoBookings));
      return initialDemoBookings;
    }
    return JSON.parse(raw);
  } catch {
    return initialDemoBookings;
  }
}

export async function saveOwnerBooking(booking: OwnerLedgerEntry): Promise<OwnerLedgerEntry> {
  const current = await getOwnerBookings();
  const index = current.findIndex((b) => b.id === booking.id);
  if (index !== -1) {
    current[index] = booking;
  } else {
    current.unshift(booking);
  }
  await setStoredItem("bookstayx.owner.bookings.v1", JSON.stringify(current));
  return booking;
}

export async function getOwnerUnits(): Promise<OwnerUnit[]> {
  try {
    const raw = await getStoredItem("bookstayx.owner.units.v1");
    if (!raw) {
      await setStoredItem("bookstayx.owner.units.v1", JSON.stringify(initialDemoUnits));
      return initialDemoUnits;
    }
    return JSON.parse(raw);
  } catch {
    return initialDemoUnits;
  }
}
