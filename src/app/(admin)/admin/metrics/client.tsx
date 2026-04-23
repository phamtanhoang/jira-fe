"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { cn } from "@/lib/utils";
import { useAdminMetrics } from "@/features/admin-users";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SinceHours = 24 | 72 | 168;

export function AdminMetricsClient() {
  const { t } = useAppStore();
  const [since, setSince] = useState<SinceHours>(24);
  const { data, isLoading } = useAdminMetrics(since);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t("admin.metrics.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.metrics.description")}
          </p>
        </div>
        <Select
          value={String(since)}
          onValueChange={(v) => setSince(Number(v) as SinceHours)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24">{t("admin.metrics.since24h")}</SelectItem>
            <SelectItem value="72">{t("admin.metrics.since72h")}</SelectItem>
            <SelectItem value="168">{t("admin.metrics.since168h")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Top routes */}
      <Card>
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
            ) : (
              <DistBars
                rows={
                  data?.methodDistribution.map((r) => ({
                    label: r.method,
                    count: r.count,
                  })) ?? []
                }
              />
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
                  })) ?? []
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DistBars({ rows }: { rows: { label: string; count: number }[] }) {
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
              className="h-full bg-primary/70"
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
