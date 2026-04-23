"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  LogDetailSheet,
  LogsFiltersBar,
  LogsTable,
} from "@/features/logs/components";
import { useLogs } from "@/features/logs/hooks";
import type { LogsFilters } from "@/features/logs/types";
import { useAppStore } from "@/lib/stores/use-app-store";

export function AdminLogsClient() {
  const { t } = useAppStore();

  const [filters, setFilters] = useState<LogsFilters>({ take: 50 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useLogs(filters);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {t("admin.logs.title")}
        </h1>
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
                  setFilters((f) => ({
                    ...f,
                    cursor: data.nextCursor ?? undefined,
                  }))
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
