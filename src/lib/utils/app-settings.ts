import type { AppSettings } from "@/lib/types";
import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/constants";

let cachedSettings: AppSettings | null = null;
let cacheTime = 0;
const CACHE_DURATION = 0; // 5 minutes

/**
 * Fetch app settings from API using axios
 * Includes built-in caching to prevent duplicate requests
 */
export async function getAppSettings(): Promise<AppSettings | null> {
  try {
    // Return cached settings if still valid
    if (cachedSettings && Date.now() - cacheTime < CACHE_DURATION) {
      return cachedSettings;
    }

    const response = await api.get<AppSettings>(ENDPOINTS.settings.appInfo);
    
    if (response.data) {
      cachedSettings = response.data;
      cacheTime = Date.now();
      return cachedSettings;
    }

    return null;
  } catch (error) {
    console.error("Error fetching app settings:", error);
    return null;
  }
}
