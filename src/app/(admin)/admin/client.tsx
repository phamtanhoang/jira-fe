"use client";

import Link from "next/link";
import {
  ScrollText,
  Info,
  Mail,
  ArrowUpRight,
  ShieldCheck,
  Users,
  Briefcase,
  FolderKanban,
  Bug,
  UserCheck,
  Sparkles,
  UserX,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { AVATAR_GRADIENT } from "@/lib/constants/issue-config";
import { cn, formatDateShort, getInitials } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  useSetting,
  SETTING_KEYS,
  type AppEmailValue,
  type AppInfoValue,
} from "@/features/admin";
import { useAdminStats } from "@/features/admin-users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminOverviewClient() {
  const { t } = useAppStore();

  const { data: appInfo, isLoading: loadingInfo } =
    useSetting<AppInfoValue>(SETTING_KEYS.APP_INFO);
  const { data: appEmail, isLoading: loadingEmail } =
    useSetting<AppEmailValue>(SETTING_KEYS.APP_EMAIL);

  const { data: stats, isLoading: loadingStats } = useAdminStats();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl border bg-linear-to-br from-amber-50 via-background to-background p-6 dark:from-amber-950/30 dark:via-background dark:to-background">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {t("admin.overview.title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("admin.overview.description")}
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label={t("admin.stats.users")}
          value={stats?.users.total}
          loading={loadingStats}
          sub={`${stats?.users.admins ?? 0} ${t("admin.stats.admins").toLowerCase()}`}
        />
        <StatCard
          icon={<UserCheck className="h-4 w-4" />}
          label={t("admin.stats.newLast7Days")}
          value={stats?.users.newLast7Days}
          loading={loadingStats}
          sub={
            stats?.users.unverified !== undefined
              ? `${stats.users.unverified} ${t("admin.stats.unverified").toLowerCase()}`
              : ""
          }
          subIcon={<UserX className="h-3 w-3" />}
        />
        <StatCard
          icon={<Briefcase className="h-4 w-4" />}
          label={t("admin.stats.workspaces")}
          value={stats?.workspaces.total}
          loading={loadingStats}
        />
        <StatCard
          icon={<FolderKanban className="h-4 w-4" />}
          label={t("admin.stats.projects")}
          value={stats?.projects.total}
          loading={loadingStats}
        />
        <StatCard
          icon={<Bug className="h-4 w-4" />}
          label={t("admin.stats.issues")}
          value={stats?.issues.total}
          loading={loadingStats}
        />
      </div>

      {/* Active users + recent signups + top workspaces */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Active users 24h */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <UserCheck className="h-4 w-4" />
              {t("admin.overview.activeUsers24h")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("admin.overview.activeUsers24hDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <div className="text-4xl font-semibold tabular-nums">
                {stats?.activeUsers24h ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent signups */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              {t("admin.overview.recentSignups")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingStats ? (
              <div className="space-y-2 px-4 pb-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : !stats?.recentSignups?.length ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {t("admin.overview.notConfigured")}
              </div>
            ) : (
              <div className="divide-y">
                {stats.recentSignups.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-2 px-4 py-2 text-xs"
                  >
                    <Avatar className="h-6 w-6 shrink-0">
                      {u.image ? (
                        <AvatarImage src={u.image} alt={u.name ?? u.email} />
                      ) : null}
                      <AvatarFallback className={cn(AVATAR_GRADIENT, "text-[10px]")}>
                        {getInitials(u.name, u.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {u.name || u.email}
                      </div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {u.email}
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatDateShort(u.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top workspaces */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4" />
              {t("admin.overview.topWorkspaces")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingStats ? (
              <div className="space-y-2 px-4 pb-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !stats?.topWorkspaces?.length ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {t("admin.overview.notConfigured")}
              </div>
            ) : (
              <div className="divide-y">
                {stats.topWorkspaces.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center gap-3 px-4 py-2 text-xs"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
                      {w.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{w.name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {w.owner.name ?? "—"}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-[10px] text-muted-foreground">
                      <div>
                        {w._count.members} {t("admin.overview.members")}
                      </div>
                      <div>
                        {w._count.projects} {t("admin.overview.projects")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Logs 24h breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("admin.stats.logsLast24h")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <Skeleton className="h-6 w-full" />
          ) : (
            <LogsBar counts={stats?.logs.last24h ?? { INFO: 0, WARN: 0, ERROR: 0 }} />
          )}
        </CardContent>
      </Card>

      {/* Nav cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          href={ROUTES.ADMIN_LOGS}
          icon={<ScrollText className="h-4.5 w-4.5" />}
          tint="red"
          title={t("admin.overview.cardLogsTitle")}
          description={t("admin.overview.cardLogsDesc")}
          value={
            loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <span className="text-3xl font-semibold tabular-nums text-foreground">
                {stats?.logs.last24h.ERROR ?? 0}
              </span>
            )
          }
        />
        <SummaryCard
          href={ROUTES.ADMIN_SETTINGS}
          icon={<Info className="h-4.5 w-4.5" />}
          tint="blue"
          title={t("admin.overview.cardAppInfoTitle")}
          description={t("admin.overview.cardAppInfoDesc")}
          value={
            loadingInfo ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <div className="flex items-center gap-2">
                {appInfo?.value?.logoUrl && (
                  <img
                    src={appInfo.value.logoUrl}
                    alt=""
                    className="h-6 w-6 rounded"
                  />
                )}
                <span className="text-base font-semibold">
                  {appInfo?.value?.name || t("admin.overview.notConfigured")}
                </span>
              </div>
            )
          }
        />
        <SummaryCard
          href={ROUTES.ADMIN_SETTINGS}
          icon={<Mail className="h-4.5 w-4.5" />}
          tint="emerald"
          title={t("admin.overview.cardAppEmailTitle")}
          description={t("admin.overview.cardAppEmailDesc")}
          value={
            loadingEmail ? (
              <Skeleton className="h-6 w-40" />
            ) : (
              <span className="truncate text-base font-semibold">
                {appEmail?.value?.email || t("admin.overview.notConfigured")}
              </span>
            )
          }
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
  sub,
  subIcon,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  loading: boolean;
  sub?: string;
  subIcon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <span className="text-muted-foreground/80">{icon}</span>
        {label}
      </div>
      {loading ? (
        <Skeleton className="h-7 w-12" />
      ) : (
        <div className="text-2xl font-semibold tabular-nums">{value ?? 0}</div>
      )}
      {sub && (
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          {subIcon}
          {sub}
        </div>
      )}
    </div>
  );
}

function LogsBar({
  counts,
}: {
  counts: { INFO: number; WARN: number; ERROR: number };
}) {
  const { t } = useAppStore();
  const total = counts.INFO + counts.WARN + counts.ERROR;
  if (total === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" />
        {t("admin.stats.logsEmpty")}
      </div>
    );
  }
  const segments: { label: string; count: number; cls: string }[] = [
    {
      label: "INFO",
      count: counts.INFO,
      cls: "bg-blue-500/80",
    },
    {
      label: "WARN",
      count: counts.WARN,
      cls: "bg-amber-500/80",
    },
    {
      label: "ERROR",
      count: counts.ERROR,
      cls: "bg-red-500/80",
    },
  ];
  return (
    <div className="space-y-2">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        {segments.map((s) =>
          s.count > 0 ? (
            <div
              key={s.label}
              className={s.cls}
              style={{ width: `${(s.count / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-[11px]">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${s.cls}`} />
            <span className="font-medium">{s.label}</span>
            <span className="tabular-nums text-muted-foreground">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type Tint = "red" | "blue" | "emerald";

const TINTS: Record<Tint, string> = {
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

function SummaryCard({
  href,
  icon,
  tint,
  title,
  description,
  value,
}: {
  href: string;
  icon: React.ReactNode;
  tint: Tint;
  title: string;
  description: string;
  value: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group block transition-all duration-150 hover:-translate-y-0.5"
    >
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-md ${TINTS[tint]}`}
            >
              {icon}
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <CardTitle className="mt-2 text-sm">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-8">{value}</div>
        </CardContent>
      </Card>
    </Link>
  );
}
