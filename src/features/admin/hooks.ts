"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { STALE_PUBLIC_SETTING } from "@/lib/constants/query-stale";
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

/**
 * Invalidate Next.js ISR cache for a given tag so SSR-rendered branding
 * updates propagate to new incognito / fresh sessions immediately instead of
 * waiting for the revalidate window.
 */
async function bustSSRTag(tag: string) {
  try {
    await fetch("/ssr-revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag }),
    });
  } catch {
    // Cache bust is best-effort — the revalidate window still guarantees
    // propagation, this just shortens it.
  }
}

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
      if (key === SETTING_KEYS.APP_INFO) void bustSSRTag("app-info");
      showMessage("SETTINGS_UPDATED");
    },
    onError: handleApiError,
  });
}

/**
 * Public settings probes — toggled rarely by admin, but read on every layout
 * mount. A long staleTime keeps them from hammering BE as users navigate.
 * Reads go through the public endpoint so non-admin users can see the banner
 * (the byKey endpoint is admin-only).
 */
export function usePublicAnnouncement() {
  return useQuery({
    queryKey: ["public-announcement"],
    queryFn: () => getPublicAnnouncement<AnnouncementValue>(),
    staleTime: STALE_PUBLIC_SETTING,
    refetchOnWindowFocus: false,
  });
}

export function usePublicMaintenance() {
  return useQuery({
    queryKey: ["public-maintenance"],
    queryFn: () => getPublicMaintenance<MaintenanceValue>(),
    staleTime: STALE_PUBLIC_SETTING,
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
      void bustSSRTag("app-info");
    },
    onError: handleApiError,
  });
}
