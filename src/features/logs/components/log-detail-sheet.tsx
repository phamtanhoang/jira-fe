"use client";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { useAppStore } from "@/lib/stores/use-app-store";
import { formatDateTime } from "@/lib/utils";
import { useLog } from "../hooks";

function CodeBlock({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) return null;
  const json =
    typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-semibold uppercase text-muted-foreground">
        {label}
      </div>
      <pre className="max-h-72 overflow-auto rounded border bg-muted/30 p-2 font-mono text-[11px] whitespace-pre-wrap">
        {json}
      </pre>
    </div>
  );
}

export function LogDetailSheet({
  logId,
  onClose,
}: {
  logId: string | null;
  onClose: () => void;
}) {
  const { t } = useAppStore();
  const { data: log, isLoading } = useLog(logId);

  return (
    <Sheet open={!!logId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[720px] max-w-[95vw] overflow-y-auto sm:max-w-[720px] lg:max-w-[800px]">
        <SheetHeader>
          <SheetTitle>{t("admin.logs.detail.title")}</SheetTitle>
          <SheetDescription>
            {log ? `${log.method} ${log.url}` : ""}
          </SheetDescription>
        </SheetHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        )}

        {log && (
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <Meta label={t("admin.logs.detail.level")} value={
                <Badge>{log.level}</Badge>
              } />
              <Meta label={t("admin.logs.detail.status")} value={log.statusCode ?? "-"} />
              <Meta label={t("admin.logs.detail.time")} value={formatDateTime(log.createdAt)} />
              <Meta label={t("admin.logs.detail.duration")} value={log.durationMs != null ? `${log.durationMs}ms` : "-"} />
              <Meta label={t("admin.logs.detail.user")} value={log.userEmail ?? "-"} />
              <Meta label={t("admin.logs.detail.ip")} value={log.ip ?? "-"} />
              <Meta label={t("admin.logs.detail.source")} value={log.source} />
              <Meta label={t("admin.logs.detail.route")} value={log.route ?? "-"} />
            </div>

            {log.sentryEventId && (
              <div className="text-[12px]">
                <span className="text-muted-foreground">Sentry: </span>
                <code className="font-mono">{log.sentryEventId}</code>
              </div>
            )}

            {log.errorMessage && <CodeBlock label={t("admin.logs.detail.errorMessage")} value={log.errorMessage} />}
            {log.errorStack && <CodeBlock label={t("admin.logs.detail.stackTrace")} value={log.errorStack} />}
            <CodeBlock label={t("admin.logs.detail.requestBody")} value={log.requestBody} />
            <CodeBlock label={t("admin.logs.detail.requestQuery")} value={log.requestQuery} />
            <CodeBlock label={t("admin.logs.detail.responseBody")} value={log.responseBody} />
            <CodeBlock label={t("admin.logs.detail.breadcrumbs")} value={log.breadcrumbs} />
            <CodeBlock label={t("admin.logs.detail.userAgent")} value={log.userAgent} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
