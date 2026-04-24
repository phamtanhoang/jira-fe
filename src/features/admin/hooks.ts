"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleApiError, showMessage } from "@/lib/utils";
import {
  getPublicAnnouncement,
  getPublicMaintenance,
  getSetting,
  setSetting,
  uploadAppLogo,
} from "./api";
import { SETTING_KEYS } from "./types";
import type {
  AnnouncementValue,
  MaintenanceValue,
  SettingRow,
} from "./types";

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
      queryClient.invalidateQueries({ queryKey: ["public-maintenance"] });
      showMessage("SETTINGS_UPDATED");
    },
    onError: handleApiError,
  });
}

/**
 * Reads the announcement via the public endpoint so non-admin users can
 * actually see the banner (the byKey endpoint is admin-only).
 */
// Public settings probes — both are toggled rarely and read on every layout
// mount. A long staleTime keeps them from hammering BE as users navigate.
const PUBLIC_SETTING_STALE_MS = 5 * 60 * 1000;

export function usePublicAnnouncement() {
  return useQuery({
    queryKey: ["public-announcement"],
    queryFn: () => getPublicAnnouncement<AnnouncementValue>(),
    staleTime: PUBLIC_SETTING_STALE_MS,
    refetchOnWindowFocus: false,
  });
}

export function usePublicMaintenance() {
  return useQuery({
    queryKey: ["public-maintenance"],
    queryFn: () => getPublicMaintenance<MaintenanceValue>(),
    staleTime: PUBLIC_SETTING_STALE_MS,
    refetchOnWindowFocus: false,
  });
}

export function useUploadAppLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadAppLogo(file),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({
        queryKey: ["settings", SETTING_KEYS.APP_INFO],
      });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    onError: handleApiError,
  });
}
