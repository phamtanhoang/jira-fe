"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleApiError, showMessage } from "@/lib/utils";
import { getPublicAnnouncement, getSetting, setSetting } from "./api";
import type { AnnouncementValue, SettingRow } from "./types";

export function useSetting<T>(key: string) {
  return useQuery({
    queryKey: ["settings", key],
    queryFn: () => getSetting<T>(key),
  });
}

export function useUpdateSetting<T>(key: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (value: T) => setSetting<T>(key, value),
    onSuccess: (row) => {
      queryClient.setQueryData<SettingRow<T> | null>(["settings", key], row);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      queryClient.invalidateQueries({ queryKey: ["public-announcement"] });
      showMessage("SETTINGS_UPDATED");
    },
    onError: handleApiError,
  });
}

/**
 * Reads the announcement via the public endpoint so non-admin users can
 * actually see the banner (the byKey endpoint is admin-only).
 */
export function usePublicAnnouncement() {
  return useQuery({
    queryKey: ["public-announcement"],
    queryFn: () => getPublicAnnouncement<AnnouncementValue>(),
  });
}
