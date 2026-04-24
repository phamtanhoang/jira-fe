"use client";

import Link from "next/link";
import {
  FolderKanban,
  ArrowRight,
  Users,
  LayoutGrid,
  Rocket,
  Sparkles,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/lib/stores/use-app-store";
import type { MessageKey } from "@/lib/config/i18n";
import { useWorkspaces } from "@/features/workspaces/hooks";
import { useCurrentUser } from "@/features/auth/hooks";
import { MyWorkWidget } from "@/features/projects/components/my-work-widget";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { t } = useAppStore();
  const { user } = useCurrentUser();
  const { data: workspaces, isLoading } = useWorkspaces();

  const greeting = getGreeting(t);

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      {/* Hero */}
      <div className="mb-10 rounded-xl bg-linear-to-r from-primary/8 via-primary/4 to-transparent p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {greeting}{user?.name ? `, ${user.name}` : ""}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("dashboard.overview")}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {Array.isArray(workspaces) && workspaces.length > 0 && (
        <div className="mb-8 grid grid-cols-3 gap-4">
          <StatCard
            label={t("dashboard.statWorkspaces")}
            value={workspaces.length}
            icon={FolderKanban}
            color="text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400"
          />
          <StatCard
            label={t("dashboard.statProjects")}
            value={workspaces.reduce((sum, ws) => sum + (ws._count?.projects ?? 0), 0)}
            icon={LayoutGrid}
            color="text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400"
          />
          <StatCard
            label={t("dashboard.statMembers")}
            value={workspaces.reduce((sum, ws) => sum + (ws._count?.members ?? 0), 0)}
            icon={Users}
            color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400"
          />
        </div>
      )}

      {/* My Work */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold">{t("myWork.title")}</h2>
      </div>
      <div className="mb-10">
        <MyWorkWidget />
      </div>

      {/* Workspaces */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold">{t("dashboard.yourWorkspaces")}</h2>
        <Link href={ROUTES.WORKSPACES}>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            {t("common.viewAll")}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : !Array.isArray(workspaces) || !workspaces.length ? (
        <div className="rounded-xl border border-dashed border-muted-foreground/20 bg-muted/30 py-16 text-center">
          <Rocket className="mx-auto mb-4 h-10 w-10 text-muted-foreground/30" />
          <p className="mb-1 text-sm font-medium">{t("dashboard.noWorkspaces")}</p>
          <p className="mb-5 text-xs text-muted-foreground">
            {t("dashboard.noWorkspacesDesc")}
          </p>
          <Link href={ROUTES.WORKSPACES}>
            <Button size="sm">{t("dashboard.getStarted")}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.slice(0, 6).map((ws) => (
            <Link key={ws.id} href={ROUTES.WORKSPACE(ws.id)}>
              <div className="group flex items-center gap-3.5 rounded-lg border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                  {ws.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[13px] font-semibold group-hover:text-primary">
                    {ws.name}
                  </h3>
                  <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {ws._count?.members ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <LayoutGrid className="h-3 w-3" />
                      {ws._count?.projects ?? 0}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/0 transition-all group-hover:text-muted-foreground/60 group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function getGreeting(t: (key: MessageKey) => string) {
  const hour = new Date().getHours();
  if (hour < 12) return t("dashboard.goodMorning");
  if (hour < 18) return t("dashboard.goodAfternoon");
  return t("dashboard.goodEvening");
}
