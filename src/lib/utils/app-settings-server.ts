import type { AppSettings } from "@/lib/types";
import { ENDPOINTS } from "../constants";

let cachedSettings: AppSettings | null = null;
let cacheTime = 0;
const CACHE_DURATION = 0; // 5 minutes

/**
 * Fetch app settings on the server-side (for SSR, metadata generation)
 * Uses fetch instead of axios to work in Node.js environments
 */
export async function getAppSettingsServer(): Promise<AppSettings | null> {
    try {
        // Return cached settings if still valid
        if (cachedSettings && Date.now() - cacheTime < CACHE_DURATION) {
            return cachedSettings;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}${ENDPOINTS.settings.appInfo}`, {
            next: { revalidate: 300 }, // ISR: revalidate every 5 minutes
        });

        if (!response.ok) {
            console.error("Failed to fetch app settings:", response.statusText);
            return null;
        }

        cachedSettings = await response.json();
        cacheTime = Date.now();
        return cachedSettings;
    } catch (error) {
        console.error("Error fetching app settings (server):", error);
        return null;
    }
}
