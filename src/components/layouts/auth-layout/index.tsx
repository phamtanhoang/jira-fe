"use client";

import Image from "next/image";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { AppFooter } from "@/components/shared/app-footer";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/lib/stores/use-app-store";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { name, logoUrl } = useAppStore();

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

      <AppFooter className="mt-8 flex flex-col items-center gap-0.5" />
    </div>
  );
}
