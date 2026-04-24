"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAppStore } from "@/lib/stores/use-app-store";
import { cn, formatDateTime } from "@/lib/utils";
import { useAdminMetrics } from "@/features/admin-users";
import { LogDetailSheet } from "@/features/logs/components";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { TruncatedText } from "@/components/ui/truncated-text";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RangePicker } from "@/components/ui/range-picker";

const METRICS_PRESETS = [24, 72, 168, 24 * 30] as const;

const METHOD_COLORS: Record<string, string> = {
  GET: "#3b82f6",
  POST: "#10b981",
  PATCH: "#f59e0b",
  PUT: "#8b5cf6",
  DELETE: "#ef4444",
};

export function AdminMetricsClient() {
  const { t } = useAppStore();
  const [since, setSince] = useState<number>(24);
  const { data, isLoading } = useAdminMetrics(since);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t("admin.metrics.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.metrics.description")}
          </p>
        </div>
        <RangePicker
          value={since}
          onChange={setSince}
          presets={METRICS_PRESETS}
          unit="hours"
          min={1}
          max={24 * 90}
          label={t("common.range.range")}
          compact
        />
      </div>

      {/* Error trend — full width sparkline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {t("admin.metrics.errorTrend")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("admin.metrics.errorTrendHint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-28 w-full" />
          ) : !data?.errorTrendHourly?.length ? (
            <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
              {t("admin.metrics.errorEmpty")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={data.errorTrendHourly}>
                <defs>
                  <linearGradient id="errFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis
                  dataKey="bucket"
                  fontSize={10}
                  tickFormatter={(v: string) =>
                    new Date(v).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                    })
                  }
                />
                <YAxis fontSize={10} allowDecimals={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#errFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top routes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {t("admin.metrics.topRoutes")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-2 border-b bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>{t("admin.metrics.columns.route")}</span>
            <span className="text-right">
              {t("admin.metrics.columns.count")}
            </span>
            <span className="text-right">
              {t("admin.metrics.columns.errorRate")}
            </span>
            <span className="text-right">
              {t("admin.metrics.columns.p50")}
            </span>
            <span className="text-right">
              {t("admin.metrics.columns.p95")}
            </span>
            <span className="text-right">
              {t("admin.metrics.columns.p99")}
            </span>
          </div>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Spinner />
            </div>
          ) : !data?.topRoutes?.length ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              {t("admin.metrics.empty")}
            </div>
          ) : (
            data.topRoutes.map((r) => {
              const errorRate = r.count === 0 ? 0 : r.errorCount / r.count;
              const bad = errorRate > 0.05;
              return (
                <div
                  key={r.route}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] items-center gap-2 border-b px-4 py-2 text-sm last:border-b-0 hover:bg-muted/30"
                >
                  <span className="truncate font-mono text-[12px]">
                    {r.route}
                  </span>
                  <span className="text-right tabular-nums">{r.count}</span>
                  <span className="flex justify-end">
                    <Badge
                      variant="outline"
                      className={cn(
                        "tabular-nums",
                        bad
                          ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                          : "text-muted-foreground",
                      )}
                    >
                      {(errorRate * 100).toFixed(1)}%
                    </Badge>
                  </span>
                  <span className="text-right tabular-nums text-muted-foreground">
                    {r.p50}ms
                  </span>
                  <span className="text-right tabular-nums">{r.p95}ms</span>
                  <span className="text-right tabular-nums">{r.p99}ms</span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {t("admin.metrics.methodDistribution")}
            </CardTitle>
            <CardDescription className="text-xs" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Spinner />
            ) : (data?.methodDistribution.length ?? 0) === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                —
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data?.methodDistribution}
                    dataKey="count"
                    nameKey="method"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={2}
                    label={(props) => {
                      const p = props as {
                        method?: string;
                        count?: number;
                      };
                      return `${p.method ?? ""} (${p.count ?? 0})`;
                    }}
                    labelLine={false}
                  >
                    {data?.methodDistribution.map((entry) => (
                      <Cell
                        key={entry.method}
                        fill={METHOD_COLORS[entry.method] ?? "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {t("admin.metrics.statusDistribution")}
            </CardTitle>
            <CardDescription className="text-xs" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Spinner />
            ) : (
              <DistBars
                rows={
                  data?.statusDistribution.map((r) => ({
                    label: String(r.statusCode),
                    count: r.count,
                    color: statusColor(r.statusCode),
                  })) ?? []
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Slowest requests */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {t("admin.metrics.slowestRequests")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("admin.metrics.slowestHint")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Fixed-width grid so columns align regardless of URL/email length. */}
          <div className="grid grid-cols-[70px_minmax(0,2fr)_70px_90px_minmax(0,1.4fr)_minmax(0,1.2fr)] items-center gap-3 border-b bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>{t("admin.metrics.columns.method")}</span>
            <span>{t("admin.metrics.columns.url")}</span>
            <span className="text-right">
              {t("admin.metrics.columns.status")}
            </span>
            <span className="text-right">
              {t("admin.metrics.columns.duration")}
            </span>
            <span>{t("admin.metrics.columns.user")}</span>
            <span>{t("admin.metrics.columns.time")}</span>
          </div>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner />
            </div>
          ) : !data?.slowestRequests?.length ? (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              {t("admin.metrics.empty")}
            </div>
          ) : (
            data.slowestRequests.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedId(r.id)}
                className="grid w-full grid-cols-[70px_minmax(0,2fr)_70px_90px_minmax(0,1.4fr)_minmax(0,1.2fr)] items-center gap-3 border-b px-4 py-2 text-left text-sm transition-colors last:border-b-0 hover:bg-muted/30"
              >
                <span className="font-mono text-[11px] text-muted-foreground">
                  {r.method}
                </span>
                <TruncatedText
                  text={r.url}
                  className="font-mono text-[12px]"
                />
                <span className="text-right tabular-nums">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      (r.statusCode ?? 0) >= 500
                        ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                        : (r.statusCode ?? 0) >= 400
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          : "text-muted-foreground",
                    )}
                  >
                    {r.statusCode ?? "-"}
                  </Badge>
                </span>
                <span className="text-right tabular-nums font-semibold">
                  {r.durationMs}ms
                </span>
                <TruncatedText
                  text={r.userEmail}
                  fallback="-"
                  className="text-xs text-muted-foreground"
                />
                <TruncatedText
                  text={formatDateTime(r.createdAt)}
                  className="text-xs text-muted-foreground"
                />
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <LogDetailSheet logId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function statusColor(code: number): string {
  if (code >= 500) return "bg-red-500";
  if (code >= 400) return "bg-amber-500";
  if (code >= 300) return "bg-blue-500";
  return "bg-emerald-500";
}

function DistBars({
  rows,
}: {
  rows: { label: string; count: number; color?: string }[];
}) {
  if (rows.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground">—</div>
    );
  }
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 text-xs">
          <span className="w-14 shrink-0 truncate font-mono">{r.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full", r.color ?? "bg-primary/70")}
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right tabular-nums text-muted-foreground">
            {r.count}
          </span>
        </div>
      ))}
    </div>
  );
}
