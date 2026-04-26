"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleApiError, showMessage } from "@/lib/utils";
import { notificationsApi } from "./api";

const KEY = ["notifications"] as const;
const UNREAD_KEY = ["notifications", "unread-count"] as const;

// Bell badge: poll every 60s when the tab is active. Backend marks this
// route as log-skip so polling doesn't bloat the request log.
const UNREAD_REFETCH_MS = 60_000;

export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_KEY,
    queryFn: () => notificationsApi.unreadCount(),
    staleTime: 30_000,
    refetchInterval: UNREAD_REFETCH_MS,
    refetchOnWindowFocus: true,
  });
}

export function useNotifications(params: {
  unread?: boolean;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => notificationsApi.list(params),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
    },
    onError: handleApiError,
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
    },
    onError: handleApiError,
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
    },
    onError: handleApiError,
  });
}

const PREFERENCES_KEY = ["notifications", "preferences"] as const;

export function useNotificationPreferences() {
  return useQuery({
    queryKey: PREFERENCES_KEY,
    queryFn: () => notificationsApi.getPreferences(),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, { inApp?: boolean; email?: boolean }>) =>
      notificationsApi.updatePreferences(body),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.setQueryData(PREFERENCES_KEY, result.preferences);
    },
    onError: handleApiError,
  });
}
