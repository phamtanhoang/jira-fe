"use client";

import { Wrench } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { usePublicMaintenance } from "@/features/admin";

export function MaintenancePageClient() {
  const { t, name: appName, logoUrl } = useAppStore();
  const { data } = usePublicMaintenance();

  const message =
    data?.message?.trim() || t("admin.maintenance.pageDefaultMessage");

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-amber-50 via-background to-background p-6 dark:from-amber-950/30 dark:via-background dark:to-background">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
          <Wrench className="h-7 w-7" />
        </div>
        <div className="mb-2 flex items-center justify-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt={appName} className="h-6 w-6 rounded" />
          ) : null}
          <span className="text-sm font-semibold text-muted-foreground">
            {appName}
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("admin.maintenance.pageTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
