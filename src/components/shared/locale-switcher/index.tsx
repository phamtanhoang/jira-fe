"use client";

import { Globe } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { type Locale, locales } from "@/lib/config/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LOCALE_CONFIG: Record<Locale, { flag: string; label: string }> = {
  en: { flag: "\u{1F1FA}\u{1F1F8}", label: "English" },
  vi: { flag: "\u{1F1FB}\u{1F1F3}", label: "Ti\u1EBFng Vi\u1EC7t" },
};

export function LocaleSwitcher() {
  const { locale, setLocale } = useAppStore();
  const current = LOCALE_CONFIG[locale];

  return (
    <DropdownMenu>
      <Button
        render={<DropdownMenuTrigger />}
        variant="ghost"
        size="xs"
        className="gap-1.5 px-2 text-muted-foreground"
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="text-[11px] font-medium">{current.flag} {locale.toUpperCase()}</span>
      </Button>
      <DropdownMenuContent align="end" className="min-w-36">
        {locales.map((l) => {
          const conf = LOCALE_CONFIG[l];
          const isActive = l === locale;
          return (
            <DropdownMenuItem
              key={l}
              onClick={() => setLocale(l)}
              className={isActive ? "bg-primary/8 text-primary font-medium" : ""}
            >
              <span className="mr-2 text-base">{conf.flag}</span>
              <span className="text-[12px]">{conf.label}</span>
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
