"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/config/i18n";
import { useAppStore } from "@/lib/stores/use-app-store";

let localeHydrated = false;

export function AppProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  if (!localeHydrated) {
    useAppStore.setState({ locale: initialLocale }, false, "hydrate/locale");
    localeHydrated = true;
  }

  const { loaded, fetchSettings } = useAppStore();

  useEffect(() => {
    if (!loaded) fetchSettings();
  }, [loaded, fetchSettings]);

  if (!loaded) return null;

  return <>{children}</>;
}
