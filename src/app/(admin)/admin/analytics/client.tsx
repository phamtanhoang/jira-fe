"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { cn, toggleArrayItem } from "@/lib/utils";
import { useAdminAnalytics, type AdminAnalytics } from "@/features/admin-users";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RangePicker } from "@/components/ui/range-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PRESETS = [7, 14, 30, 90] as const;

type MetricId =
  | "signups"
  | "activeUsers"
  | "issuesCreated"
  | "newWorkspaces"
  | "comments"
  | "worklogs"
  | "requestsByLevel";

const DEFAULT_METRICS: MetricId[] = [
  "signups",
  "activeUsers",
  "issuesCreated",
  "newWorkspaces",
  "comments",
  "worklogs",
  "requestsByLevel",
];

export function AdminAnalyticsClient() {
  const { t } = useAppStore();
  const [days, setDays] = useState<number>(14);
  const [metrics, setMetrics] = useState<MetricId[]>(DEFAULT_METRICS);
  const { data, isLoading } = useAdminAnalytics(days);

  const totals = useMemo(() => computeTotals(data), [data]);

  function toggleMetric(m: MetricId) {
    setMetrics((prev) => toggleArrayItem(prev, m));
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t("admin.analytics.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.analytics.description")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!data}
          onClick={() => data && downloadCsv(data, t("admin.analytics.csvFilename"))}
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          {t("admin.analytics.exportCsv")}
        </Button>
      </div>

      <RangePicker
        value={days}
        onChange={setDays}
        presets={PRESETS}
        unit="days"
        min={1}
        max={180}
        label={t("admin.analytics.range")}
      />

      {/* Metric toggles */}
      <div className="flex flex-wrap gap-1.5">
        {DEFAULT_METRICS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => toggleMetric(m)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
              metrics.includes(m)
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
            )}
          >
            {t(`admin.analytics.${m}` as "admin.analytics.signups")}
          </button>
        ))}
      </div>

      {/* Totals row */}
      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {DEFAULT_METRICS.filter((m) => m !== "requestsByLevel").map((m) => (
            <TotalCard
              key={m}
              label={t(`admin.analytics.${m}` as "admin.analytics.signups")}
              value={totals[m] ?? 0}
            />
          ))}
          <TotalCard
            label={t("admin.analytics.errors")}
            value={totals.errors ?? 0}
            tone="danger"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {metrics.includes("signups") && (
          <ChartCard title={t("admin.analytics.signups")}>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <SimpleLine data={data?.signups ?? []} color="#10b981" />
            )}
          </ChartCard>
        )}
        {metrics.includes("activeUsers") && (
          <ChartCard title={t("admin.analytics.activeUsers")}>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <SimpleLine data={data?.activeUsers ?? []} color="#8b5cf6" />
            )}
          </ChartCard>
        )}
        {metrics.includes("issuesCreated") && (
          <ChartCard title={t("admin.analytics.issuesCreated")}>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <SimpleLine data={data?.issuesCreated ?? []} color="#3b82f6" />
            )}
          </ChartCard>
        )}
        {metrics.includes("newWorkspaces") && (
          <ChartCard title={t("admin.analytics.newWorkspaces")}>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <SimpleLine data={data?.newWorkspaces ?? []} color="#f59e0b" />
            )}
          </ChartCard>
        )}
        {metrics.includes("comments") && (
          <ChartCard title={t("admin.analytics.comments")}>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <SimpleLine data={data?.comments ?? []} color="#ec4899" />
            )}
          </ChartCard>
        )}
        {metrics.includes("worklogs") && (
          <ChartCard title={t("admin.analytics.worklogs")}>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <SimpleLine data={data?.worklogs ?? []} color="#14b8a6" />
            )}
          </ChartCard>
        )}
        {metrics.includes("requestsByLevel") && (
          <ChartCard
            title={t("admin.analytics.requestsByLevel")}
            wide
          >
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.requestsByLevel ?? []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" fontSize={11} tickFormatter={shortDate} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip labelFormatter={shortDate} />
                  <Legend />
                  <Bar dataKey="INFO" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="WARN" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="ERROR" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        )}
      </div>
    </div>
  );
}

function SimpleLine({
  data,
  color,
}: {
  data: { date: string; count: number }[];
  color: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="date" fontSize={11} tickFormatter={shortDate} />
        <YAxis fontSize={11} allowDecimals={false} />
        <Tooltip labelFormatter={shortDate} />
        <Line
          type="monotone"
          dataKey="count"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function TotalCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-[11px] font-medium text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 text-xl font-semibold tabular-nums",
          tone === "danger" && value > 0 && "text-red-600 dark:text-red-400",
        )}
      >
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  wide,
  children,
}: {
  title: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className={wide ? "xl:col-span-3 lg:col-span-2" : ""}>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs" />
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function computeTotals(data: AdminAnalytics | undefined) {
  if (!data) return { errors: 0 };
  const sum = (rows: { count: number }[]) =>
    rows.reduce((acc, r) => acc + r.count, 0);
  return {
    signups: sum(data.signups),
    activeUsers: Math.max(...(data.activeUsers?.map((r) => r.count) || [0])),
    issuesCreated: sum(data.issuesCreated),
    newWorkspaces: sum(data.newWorkspaces),
    comments: sum(data.comments),
    worklogs: sum(data.worklogs),
    errors: data.requestsByLevel.reduce((acc, r) => acc + r.ERROR, 0),
  };
}

function downloadCsv(data: AdminAnalytics, filename: string) {
  const rows = data.signups.map((row, i) => ({
    date: row.date,
    signups: data.signups[i]?.count ?? 0,
    activeUsers: data.activeUsers[i]?.count ?? 0,
    issuesCreated: data.issuesCreated[i]?.count ?? 0,
    newWorkspaces: data.newWorkspaces[i]?.count ?? 0,
    comments: data.comments[i]?.count ?? 0,
    worklogs: data.worklogs[i]?.count ?? 0,
    INFO: data.requestsByLevel[i]?.INFO ?? 0,
    WARN: data.requestsByLevel[i]?.WARN ?? 0,
    ERROR: data.requestsByLevel[i]?.ERROR ?? 0,
  }));
  if (rows.length === 0) return;
  const header = Object.keys(rows[0]);
  const csv = [
    header.join(","),
    ...rows.map((r) =>
      header
        .map((h) => String((r as Record<string, unknown>)[h] ?? ""))
        .join(","),
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** "2026-04-23" → "Apr 23" */
function shortDate(raw: unknown): string {
  if (typeof raw !== "string") return String(raw ?? "");
  const d = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
