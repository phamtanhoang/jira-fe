"use client";

import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/stores/use-app-store";
import { formatDateTime } from "@/lib/utils";
import type { LogLevel, RequestLog } from "../types";

const LEVEL_BADGE: Record<LogLevel, string> = {
  INFO: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  WARN: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  ERROR: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

const STATUS_BADGE = (code: number | null): string => {
  if (code == null) return "";
  if (code >= 500) return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
  if (code >= 400) return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
  if (code >= 300) return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200";
  return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200";
};

export function LogsTable({
  logs,
  onRowClick,
}: {
  logs: RequestLog[];
  onRowClick: (id: string) => void;
}) {
  const { t } = useAppStore();

  if (logs.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        {t("admin.logs.empty")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-[12px]">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">{t("admin.logs.columns.time")}</th>
            <th className="px-3 py-2 text-left font-medium">{t("admin.logs.columns.level")}</th>
            <th className="px-3 py-2 text-left font-medium">{t("admin.logs.columns.method")}</th>
            <th className="px-3 py-2 text-left font-medium">{t("admin.logs.columns.url")}</th>
            <th className="px-3 py-2 text-left font-medium">{t("admin.logs.columns.status")}</th>
            <th className="px-3 py-2 text-left font-medium">{t("admin.logs.columns.user")}</th>
            <th className="px-3 py-2 text-right font-medium">{t("admin.logs.columns.duration")}</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              onClick={() => onRowClick(log.id)}
              className="cursor-pointer border-t transition-colors hover:bg-muted/50"
            >
              <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
              <td className="px-3 py-2">
                <Badge className={LEVEL_BADGE[log.level]}>{log.level}</Badge>
              </td>
              <td className="px-3 py-2 font-mono">{log.method}</td>
              <td className="px-3 py-2 truncate max-w-[320px] font-mono">{log.url}</td>
              <td className="px-3 py-2">
                {log.statusCode != null && (
                  <Badge className={STATUS_BADGE(log.statusCode)}>{log.statusCode}</Badge>
                )}
              </td>
              <td className="px-3 py-2 truncate max-w-[180px]">{log.userEmail ?? "-"}</td>
              <td className="px-3 py-2 text-right text-muted-foreground">
                {log.durationMs != null ? `${log.durationMs}ms` : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
