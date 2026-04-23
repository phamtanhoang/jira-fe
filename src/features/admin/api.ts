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
