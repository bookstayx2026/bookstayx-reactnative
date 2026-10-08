import { apiRequest } from "./client";
import { isApiConfigured } from "./config";

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export type CustomerNotification = {
  id: number | string;
  title: string;
  message: string;
  type: "booking" | "payment" | "offer" | "referral" | "system";
  is_read: boolean;
  data_payload?: Record<string, unknown>;
  created_at: string;
};

export type NotificationsResponse = {
  success: boolean;
  notifications: CustomerNotification[];
  unreadCount: number;
};

export async function loadCustomerNotifications(token: string): Promise<NotificationsResponse> {
  if (!isApiConfigured()) {
    return { success: true, notifications: [], unreadCount: 0 };
  }

  return apiRequest<NotificationsResponse>("/notifications", {
    headers: bearer(token),
  });
}

export async function markNotificationAsRead(token: string, id: number | string): Promise<boolean> {
  if (!isApiConfigured()) return true;

  try {
    const res = await apiRequest<{ success: boolean }>(`/notifications/${encodeURIComponent(String(id))}/read`, {
      method: "PATCH",
      headers: bearer(token),
    });
    return res.success;
  } catch {
    return false;
  }
}

export async function markAllNotificationsAsRead(token: string): Promise<boolean> {
  if (!isApiConfigured()) return true;

  try {
    const res = await apiRequest<{ success: boolean }>("/notifications/read-all", {
      method: "POST",
      headers: bearer(token),
    });
    return res.success;
  } catch {
    return false;
  }
}

export async function registerPushDeviceToken(token: string, pushToken: string): Promise<boolean> {
  if (!isApiConfigured()) return true;

  try {
    const res = await apiRequest<{ success: boolean }>("/notifications/device-token", {
      method: "POST",
      headers: bearer(token),
      body: { token: pushToken },
    });
    return res.success;
  } catch {
    return false;
  }
}
