"use client";

import Image from "next/image";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/lib/stores/use-app-store";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { name, logoUrl, authorName, authorUrl, t } = useAppStore();
  const year = new Date().getFullYear().toString();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-muted/50 via-background to-muted/50 px-4">
      <div className="absolute top-4 right-4">
        <LocaleSwitcher />
      </div>

      {logoUrl && (
        <div className="mb-8">
          <Image src={logoUrl} alt={name} width={40} height={40} style={{ height: "auto" }} priority />
        </div>
      )}

      <Card className="w-full max-w-100 shadow-sm">
        <CardContent className="p-8">{children}</CardContent>
      </Card>

      <footer className="mt-8 flex flex-col items-center gap-1 text-xs text-muted-foreground">
        <span>{t("footer.copyright", { year })}</span>
        {authorName && (
          <span>
            {t("footer.builtBy")}{" "}
            {authorUrl ? (
              <a href={authorUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                {authorName}
              </a>
            ) : (
              authorName
            )}
          </span>
        )}
      </footer>
    </div>
  );
}
