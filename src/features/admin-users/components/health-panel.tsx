"use client";

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  HardDrive,
  Mail,
  Server,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useAdminHealth } from "../hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Status = "ok" | "warn" | "error" | "off";

function StatusDot({ status }: { status: Status }) {
  const cls =
    status === "ok"
      ? "bg-green-500"
      : status === "warn"
        ? "bg-amber-500"
        : status === "error"
          ? "bg-red-500"
          : "bg-gray-300 dark:bg-gray-600";
  return (
    <span className={cn("inline-block h-2 w-2 rounded-full", cls)} aria-hidden />
  );
}

function formatUptime(sec: number) {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  }
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  return `${d}d ${h}h`;
}

export function HealthPanel() {
  const { t } = useAppStore();
  const { data, isLoading } = useAdminHealth();

  const dbStatus: Status = !data
    ? "off"
    : data.db.ok
      ? data.db.latencyMs > 500
        ? "warn"
        : "ok"
      : "error";

  const supabaseStatus: Status = !data
    ? "off"
    : !data.supabase.configured
      ? "off"
      : data.supabase.ok
        ? "ok"
        : "error";

  const mailStatus: Status = !data
    ? "off"
    : data.mail.configured
      ? "ok"
      : "off";

  const sentryStatus: Status = !data
    ? "off"
    : data.sentry.active
      ? "ok"
      : data.sentry.configured
        ? "warn"
        : "off";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4" />
          {t("admin.health.title")}
        </CardTitle>
        <CardDescription className="text-xs">
          {t("admin.health.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ProbeCard
              icon={<Database className="h-3.5 w-3.5" />}
              label={t("admin.health.db")}
              status={dbStatus}
              detail={
                data.db.ok
                  ? `${data.db.latencyMs}ms`
                  : t("admin.health.errorState")
              }
            />
            <ProbeCard
              icon={<HardDrive className="h-3.5 w-3.5" />}
              label={t("admin.health.supabase")}
              status={supabaseStatus}
              detail={
                !data.supabase.configured
                  ? t("admin.health.notConfigured")
                  : data.supabase.ok
                    ? t("admin.health.reachable")
                    : t("admin.health.errorState")
              }
            />
            <ProbeCard
              icon={<Mail className="h-3.5 w-3.5" />}
              label={t("admin.health.mail")}
              status={mailStatus}
              detail={
                data.mail.configured
                  ? data.mail.from || t("admin.health.configured")
                  : t("admin.health.notConfigured")
              }
            />
            <ProbeCard
              icon={<Sparkles className="h-3.5 w-3.5" />}
              label={t("admin.health.sentry")}
              status={sentryStatus}
              detail={
                data.sentry.active
                  ? t("admin.health.active")
                  : data.sentry.configured
                    ? t("admin.health.dormant")
                    : t("admin.health.notConfigured")
              }
            />
          </div>
        )}

        {data && (
          <div className="mt-4 grid gap-2 text-[11px] text-muted-foreground sm:grid-cols-4">
            <div className="flex items-center gap-1.5">
              <Server className="h-3 w-3" />
              {t("admin.health.node")} {data.runtime.nodeVersion}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {t("admin.health.uptime")} {formatUptime(data.runtime.uptimeSec)}
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu className="h-3 w-3" />
              {t("admin.health.memory")} {data.runtime.memoryMB} MB
            </div>
            <div className="flex items-center gap-1.5 capitalize">
              {t("admin.health.env")} {data.runtime.env}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProbeCard({
  icon,
  label,
  status,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  status: Status;
  detail: string;
}) {
  return (
    <div className="rounded-md border bg-card px-3 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {icon}
          {label}
        </div>
        <div className="flex items-center gap-1">
          <StatusDot status={status} />
          {status === "ok" && (
            <CheckCircle2 className="h-3 w-3 text-green-500" />
          )}
          {status === "error" && (
            <AlertCircle className="h-3 w-3 text-red-500" />
          )}
        </div>
      </div>
      <p className="mt-1 truncate text-[10px] text-muted-foreground">{detail}</p>
    </div>
  );
}
