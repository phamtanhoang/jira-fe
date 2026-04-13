"use client";

import { useRef } from "react";
import type { Locale } from "@/lib/config/i18n";
import type { AppSettings } from "@/lib/types";
import { useAppStore } from "@/lib/stores/use-app-store";

export function AppProvider({
  initialLocale,
  initialSettings,
  children,
}: {
  initialLocale: Locale;
  initialSettings: AppSettings | null;
  children: React.ReactNode;
}) {
  const initialized = useRef(false);
  if (!initialized.current) {
    useAppStore.setState(
      {
        locale: initialLocale,
        ...(initialSettings ?? {}),
        loaded: true,
      },
      false,
      "hydrate/initial",
    );
    initialized.current = true;
  }

  return <>{children}</>;
}
