import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/constants";
import type { SettingRow } from "./types";

/**
 * Reads a single setting by key (admin-only on the server).
 * Returns null when the setting doesn't exist yet (404) so forms can
 * render defaults instead of erroring.
 */
export async function getSetting<T = unknown>(
  key: string,
): Promise<SettingRow<T> | null> {
  try {
    const res = await api.get<SettingRow<T>>(ENDPOINTS.settings.byKey(key));
    return res.data;
  } catch (err: unknown) {
    const status =
      (err as { response?: { status?: number } })?.response?.status ?? 0;
    if (status === 404) return null;
    throw err;
  }
}

export async function setSetting<T>(
  key: string,
  value: T,
): Promise<SettingRow<T>> {
  const res = await api.put<SettingRow<T>>(ENDPOINTS.settings.byKey(key), {
    value,
  });
  return res.data;
}

/**
 * Public endpoint — readable by any user (including non-admins). Returns
 * `null` when the announcement has never been saved.
 */
export async function getPublicAnnouncement<T>(): Promise<T | null> {
  const res = await api.get<T | null>(ENDPOINTS.settings.appAnnouncement);
  return res.data ?? null;
}

export async function uploadAppLogo(
  file: File,
): Promise<{ message: string; logoUrl: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post<{ message: string; logoUrl: string }>(
    ENDPOINTS.settings.appInfoLogo,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

/**
 * Public endpoint — anyone can read maintenance state (needed by middleware
 * before the user is authenticated). Returns `null` when unset.
 */
export async function getPublicMaintenance<T>(): Promise<T | null> {
  const res = await api.get<T | null>(ENDPOINTS.settings.appMaintenance);
  return res.data ?? null;
}
