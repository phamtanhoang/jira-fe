"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser } from "@/features/auth/hooks";
import {
  LogDetailSheet,
  LogsFiltersBar,
  LogsTable,
} from "@/features/logs/components";
import { useLogs } from "@/features/logs/hooks";
import type { LogsFilters } from "@/features/logs/types";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/lib/stores/use-app-store";

export function AdminLogsClient() {
  const { t } = useAppStore();
  const router = useRouter();
  const { user, isLoading: userLoading } = useCurrentUser();

  const [filters, setFilters] = useState<LogsFilters>({ take: 50 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useLogs(filters);

  useEffect(() => {
    if (!userLoading && user && user.role !== "ADMIN") {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [user, userLoading, router]);

  if (userLoading || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (user.role !== "ADMIN") return null;

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-semibold">{t("admin.logs.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.logs.description")}
        </p>
      </div>

      <LogsFiltersBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <LogsTable logs={data?.data ?? []} onRowClick={setSelectedId} />
          {data?.hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters((f) => ({ ...f, cursor: data.nextCursor ?? undefined }))
                }
              >
                {t("admin.logs.loadMore")}
              </Button>
            </div>
          )}
        </>
      )}

      <LogDetailSheet logId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
