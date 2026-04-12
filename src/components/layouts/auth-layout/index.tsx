"use client";

import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { Card, CardContent } from "@/components/ui/card";
import { Footer, Header } from "./components";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-muted/50 via-background to-muted/50 px-4">
      <div className="absolute top-4 right-4">
        <LocaleSwitcher />
      </div>

      <Header />

      <Card className="w-full max-w-100 shadow-sm">
        <CardContent className="p-8">{children}</CardContent>
      </Card>

      <Footer className="mt-8 flex flex-col items-center gap-0.5" />
    </div>
  );
}
