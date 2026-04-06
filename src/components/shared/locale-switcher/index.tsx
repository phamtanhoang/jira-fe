"use client";

import { useAppStore } from "@/lib/stores/use-app-store";
import { type Locale, locales } from "@/lib/config/i18n";
import { Button } from "@/components/ui/button";

const localeLabels: Record<Locale, string> = {
  vi: "VI",
  en: "EN",
};

export function LocaleSwitcher() {
  const { locale, setLocale } = useAppStore();

  return (
    <div className="flex gap-0.5 rounded-lg border bg-card p-0.5">
      {locales.map((l) => (
        <Button
          key={l}
          variant={locale === l ? "default" : "ghost"}
          size="xs"
          onClick={() => setLocale(l)}
        >
          {localeLabels[l]}
        </Button>
      ))}
    </div>
  );
}
