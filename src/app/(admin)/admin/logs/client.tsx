"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui/pagination";
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
import { UserActivityPanel } from "@/features/admin-users/components/user-activity-panel";
import { useAppStore } from "@/lib/stores/use-app-store";

type TabValue = "requests" | "audit" | "activity";

export function AdminLogsClient() {
  const { t } = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab: TabValue = ((): TabValue => {
    const t = searchParams.get("tab");
    if (t === "audit" || t === "activity") return t;
    return "requests";
  })();
  const [tab, setTab] = useState<TabValue>(initialTab);

  function handleTabChange(next: string) {
    const value: TabValue =
      next === "audit" || next === "activity" ? next : "requests";
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
          <TabsTrigger value="activity">
            {t("admin.logs.tabActivity")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          <RequestsTab />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <AuditPanel />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <UserActivityPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RequestsTab() {
  const [filters, setFilters] = useState<LogsFilters>({ take: 50, page: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useLogs(filters);

  return (
    <div className="space-y-4">
      <LogsFiltersBar
        filters={filters}
        onChange={(next) => setFilters({ ...next, page: 1 })}
      />

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <LogsTable logs={data?.data ?? []} onRowClick={setSelectedId} />
          {data && data.totalPages > 1 && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              onChange={(page) => setFilters((f) => ({ ...f, page }))}
            />
          )}
        </>
      )}

      <LogDetailSheet logId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
