import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/constants";
import type { Notification, NotificationListResponse } from "./types";

export const notificationsApi = {
  list: (params: { unread?: boolean; page?: number; pageSize?: number }) =>
    api
      .get<NotificationListResponse>(ENDPOINTS.notifications.base, {
        params: {
          ...(params.unread && { unread: "true" }),
          ...(params.page && { page: params.page }),
          ...(params.pageSize && { pageSize: params.pageSize }),
        },
      })
      .then((r) => r.data),

  unreadCount: () =>
    api
      .get<{ count: number }>(ENDPOINTS.notifications.unreadCount)
      .then((r) => r.data),

  markRead: (id: string) =>
    api
      .post<{ message: string; notification: Notification }>(
        ENDPOINTS.notifications.read(id),
      )
      .then((r) => r.data),

  markAllRead: () =>
    api
      .post<{ message: string; count: number }>(ENDPOINTS.notifications.readAll)
      .then((r) => r.data),

  delete: (id: string) =>
    api
      .delete<{ message: string }>(ENDPOINTS.notifications.byId(id))
      .then((r) => r.data),

  getPreferences: () =>
    api
      .get<{ preferences: NotificationPreference[] }>(
        ENDPOINTS.notifications.preferences,
      )
      .then((r) => r.data.preferences),

  updatePreferences: (
    body: Record<string, { inApp?: boolean; email?: boolean }>,
  ) =>
    api
      .put<{ message: string; preferences: NotificationPreference[] }>(
        ENDPOINTS.notifications.preferences,
        body,
      )
      .then((r) => r.data),
};

export type NotificationPreference = {
  id: string;
  userId: string;
  type: string;
  inApp: boolean;
  email: boolean;
};
