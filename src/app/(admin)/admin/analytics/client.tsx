"use client";

import { useState } from "react";
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
import { useAppStore } from "@/lib/stores/use-app-store";
import { useAdminAnalytics } from "@/features/admin-users";
import { Skeleton } from "@/components/ui/skeleton";
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

type Days = 7 | 14 | 30;

export function AdminAnalyticsClient() {
  const { t } = useAppStore();
  const [days, setDays] = useState<Days>(14);
  const { data, isLoading } = useAdminAnalytics(days);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t("admin.analytics.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.analytics.description")}
          </p>
        </div>
        <Select
          value={String(days)}
          onValueChange={(v) => setDays(Number(v) as Days)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{t("admin.analytics.days7")}</SelectItem>
            <SelectItem value="14">{t("admin.analytics.days14")}</SelectItem>
            <SelectItem value="30">{t("admin.analytics.days30")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("admin.analytics.signups")}>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data?.signups ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" fontSize={11} tickFormatter={shortDate} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip labelFormatter={shortDate} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name={t("admin.analytics.signups")}
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title={t("admin.analytics.issuesCreated")}>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data?.issuesCreated ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" fontSize={11} tickFormatter={shortDate} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip labelFormatter={shortDate} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name={t("admin.analytics.issuesCreated")}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title={t("admin.analytics.newWorkspaces")}>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data?.newWorkspaces ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" fontSize={11} tickFormatter={shortDate} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip labelFormatter={shortDate} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name={t("admin.analytics.newWorkspaces")}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title={t("admin.analytics.requestsByLevel")}>
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
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs" />
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
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
