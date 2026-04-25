"use client";

import { useState } from "react";
import { Activity, ChevronDown, TrendingUp, Users } from "lucide-react";
import { cn, formatDateTime, safeArray } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Button } from "@/components/ui/button";
import { RangePicker } from "@/components/ui/range-picker";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TruncatedText } from "@/components/ui/truncated-text";
import { useUserActivity } from "../hooks";
import type { UserActivityTopUser, UserActivityTopRoute } from "../types";

const PRESETS = [24, 72, 168, 24 * 30] as const;
const PAGE_STEP = 30;
const PAGE_MAX = 200;

export function UserActivityPanel() {
  const { t } = useAppStore();
  const [sinceHours, setSinceHours] = useState<number>(168);
  const [take, setTake] = useState<number>(PAGE_STEP);
  const { data, isLoading, isFetching } = useUserActivity(sinceHours, take);

  function handleRangeChange(next: number) {
    setSinceHours(next);
    setTake(PAGE_STEP);
  }

  function loadMore() {
    setTake((prev) => Math.min(prev + PAGE_STEP, PAGE_MAX));
  }

  const topUsers = safeArray<UserActivityTopUser>(data, "topUsers");
  const topRoutes = safeArray<UserActivityTopRoute>(data, "topRoutes");
  const recent = safeArray(data, "recent") as Array<{
    id: string;
    method: string;
    url: string;
    route: string | null;
    statusCode: number | null;
    userEmail: string | null;
    createdAt: string;
  }>;

  const topUsersMax = Math.max(1, ...topUsers.map((u) => u.count));
  const topRoutesMax = Math.max(1, ...topRoutes.map((r) => r.count));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {t("admin.userActivity.description")}
          </p>
        </div>
        <RangePicker
          value={sinceHours}
          onChange={handleRangeChange}
          presets={PRESETS}
          unit="hours"
          min={1}
          max={24 * 90}
          label={t("common.range.range")}
          compact
        />
      </div>

      {/* Total */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label={t("admin.userActivity.totalRequests")}
          value={data?.totalRequests ?? 0}
          icon={Activity}
          isLoading={isLoading}
        />
        <StatTile
          label={t("admin.userActivity.activeUsers")}
          value={topUsers.length}
          icon={Users}
          isLoading={isLoading}
        />
        <StatTile
          label={t("admin.userActivity.uniqueRoutes")}
          value={topRoutes.length}
          icon={TrendingUp}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {t("admin.userActivity.topUsers")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("admin.userActivity.topUsersHint")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : topUsers.length === 0 ? (
              <Empty />
            ) : (
              topUsers.map((u, idx) => (
                <div
                  key={u.userId ?? u.userEmail ?? `row-${idx}`}
                  className="flex items-center gap-3 border-b px-4 py-2 text-[12px] last:border-b-0"
                >
                  <TruncatedText
                    text={u.userEmail}
                    className="flex-1"
                  />
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(u.count / topUsersMax) * 100}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right tabular-nums font-semibold">
                    {u.count}
                  </span>
                  <span className="w-32 shrink-0 text-right text-[11px] text-muted-foreground">
                    {u.lastSeen ? formatDateTime(u.lastSeen) : "—"}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top routes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {t("admin.userActivity.topRoutes")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("admin.userActivity.topRoutesHint")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : topRoutes.length === 0 ? (
              <Empty />
            ) : (
              topRoutes.map((r) => (
                <div
                  key={`${r.method}-${r.route}`}
                  className="flex items-center gap-3 border-b px-4 py-2 text-[12px] last:border-b-0"
                >
                  <span className="shrink-0 rounded bg-muted px-1.5 py-px font-mono text-[10px] text-muted-foreground">
                    {r.method}
                  </span>
                  <TruncatedText
                    text={r.route}
                    className="flex-1 font-mono text-[11px]"
                  />
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(r.count / topRoutesMax) * 100}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right tabular-nums font-semibold">
                    {r.count}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {t("admin.userActivity.recent")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("admin.userActivity.recentHint")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-[70px_70px_minmax(0,1.3fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-3 border-b bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>{t("admin.logs.columns.method")}</span>
            <span>{t("admin.logs.columns.status")}</span>
            <span>{t("admin.logs.columns.user")}</span>
            <span>{t("admin.logs.columns.url")}</span>
            <span>{t("admin.logs.columns.time")}</span>
          </div>
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <Empty />
          ) : (
            recent.map((r) => {
              const bad = (r.statusCode ?? 0) >= 400;
              return (
                <div
                  key={r.id}
                  className="grid grid-cols-[70px_70px_minmax(0,1.3fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-3 border-b px-4 py-2 text-sm last:border-b-0 hover:bg-muted/30"
                >
                  <span className="shrink-0 rounded bg-muted px-1.5 py-px font-mono text-[10px] text-muted-foreground">
                    {r.method}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-px text-[10px] tabular-nums",
                      bad
                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                    )}
                  >
                    {r.statusCode ?? "-"}
                  </span>
                  <TruncatedText
                    text={r.userEmail}
                    className="text-[12px]"
                  />
                  <TruncatedText
                    text={r.url}
                    className="font-mono text-[11px] text-muted-foreground"
                  />
                  <TruncatedText
                    text={formatDateTime(r.createdAt)}
                    className="text-[11px] text-muted-foreground"
                  />
                </div>
              );
            })
          )}
          {recent.length >= take && take < PAGE_MAX && (
            <div className="flex items-center justify-center border-t bg-muted/20 px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMore}
                disabled={isFetching}
              >
                {isFetching ? (
                  <Spinner className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="mr-1.5 h-3.5 w-3.5" />
                )}
                {t("common.loadMore")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  isLoading,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[12px] font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <p className="text-2xl font-bold tabular-nums tracking-tight">
          {value.toLocaleString()}
        </p>
      )}
    </div>
  );
}

function Empty() {
  const { t } = useAppStore();
  return <EmptyState compact description={t("admin.logs.empty")} />;
}
