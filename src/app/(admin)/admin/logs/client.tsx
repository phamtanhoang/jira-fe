"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LogDetailSheet,
  LogsFiltersBar,
  LogsTable,
} from "@/features/logs/components";
import { useLogs } from "@/features/logs/hooks";
import type { LogsFilters } from "@/features/logs/types";
import { AuditPanel } from "@/features/admin-audit/components/audit-panel";
import { useAppStore } from "@/lib/stores/use-app-store";

type TabValue = "requests" | "audit";

export function AdminLogsClient() {
  const { t } = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab: TabValue =
    searchParams.get("tab") === "audit" ? "audit" : "requests";
  const [tab, setTab] = useState<TabValue>(initialTab);

  function handleTabChange(next: string) {
    const value = next === "audit" ? "audit" : "requests";
    setTab(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "requests") params.delete("tab");
    else params.set("tab", value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

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

      <Tabs value={tab} onValueChange={(v) => handleTabChange(v as string)}>
        <TabsList>
          <TabsTrigger value="requests">
            {t("admin.logs.tabRequests")}
          </TabsTrigger>
          <TabsTrigger value="audit">{t("admin.logs.tabAudit")}</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          <RequestsTab />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <AuditPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RequestsTab() {
  const { t } = useAppStore();
  const [filters, setFilters] = useState<LogsFilters>({ take: 50 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useLogs(filters);

  return (
    <div className="space-y-4">
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
