import { cache } from "react";
import type { AppSettings } from "@/lib/types";
import { ENDPOINTS, ENV } from "../../constants";

export const getAppSettingsServer = cache(
  async (): Promise<AppSettings | null> => {
    try {
      // Short ISR window — branding (logo, name, description) is set by admin
      // and needs to propagate quickly to incognito / new sessions. 30s is
      // tight enough that post-update tabs see fresh data within one minute,
      // loose enough to avoid hammering BE on every SSR render.
      const response = await fetch(
        `${ENV.API_URL}${ENDPOINTS.settings.appInfo}`,
        { next: { revalidate: 30, tags: ["app-info"] } },
      );

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
