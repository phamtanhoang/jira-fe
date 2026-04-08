import { cache } from "react";
import type { AppSettings } from "@/lib/types";
import { ENDPOINTS } from "../constants";

export const getAppSettingsServer = cache(
  async (): Promise<AppSettings | null> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}${ENDPOINTS.settings.appInfo}`, {
        next: { revalidate: 300 },
      });

      if (!response.ok) {
        console.error("Failed to fetch app settings:", response.statusText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching app settings (server):", error);
      return null;
    }
  },
);
