/**
 * Notifications API client.
 */
import { apiFetch } from "./http";
import { NotificationRead, UnreadCountResponse } from "../types/api";

export async function getNotifications(): Promise<NotificationRead[]> {
  return apiFetch<NotificationRead[]>("/api/notifications");
}

export async function getUnreadCount(): Promise<UnreadCountResponse> {
  return apiFetch<UnreadCountResponse>("/api/notifications/unread-count");
}

export async function markNotificationAsRead(
  notificationId: number
): Promise<NotificationRead> {
  return apiFetch<NotificationRead>(
    `/api/notifications/${notificationId}/read`,
    {
      method: "POST",
    }
  );
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiFetch<void>("/api/notifications/read-all", {
    method: "POST",
  });
}
