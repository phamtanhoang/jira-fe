"use client";

import type { Locale } from "@/lib/config/i18n";
import type { AppSettings } from "@/lib/types";
import { useAppStore } from "@/lib/stores/use-app-store";

let hydrated = false;

export function AppProvider({
  initialLocale,
  initialSettings,
  children,
}: {
  initialLocale: Locale;
  initialSettings: AppSettings | null;
  children: React.ReactNode;
}) {
  if (!hydrated) {
    useAppStore.setState(
      {
        locale: initialLocale,
        ...(initialSettings ?? {}),
        loaded: true,
      },
      false,
      "hydrate/initial",
    );
    hydrated = true;
  }

  return <>{children}</>;
}
