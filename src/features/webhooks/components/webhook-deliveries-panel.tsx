"use client";

import { useState } from "react";
import { CheckCircle2, RotateCw, XCircle } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  useRetryDelivery,
  useWebhookDeliveries,
  type WebhookDelivery,
  type WebhookDeliveryFilters,
} from "@/features/webhooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_ANY = "__any__";

export function WebhookDeliveriesPanel() {
  const { t } = useAppStore();
  const [filters, setFilters] = useState<WebhookDeliveryFilters>({
    page: 1,
    pageSize: 50,
  });
  const { data, isLoading } = useWebhookDeliveries(filters);
  const retry = useRetryDelivery();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("admin.webhookDeliveries.description")}
      </p>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
        <Select
          value={filters.status ?? STATUS_ANY}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              status:
                v === STATUS_ANY
                  ? undefined
                  : (v as "PENDING" | "SUCCESS" | "FAILED"),
              page: 1,
            }))
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={STATUS_ANY}>
              {t("admin.webhookDeliveries.allStatuses")}
            </SelectItem>
            <SelectItem value="PENDING">PENDING</SelectItem>
            <SelectItem value="SUCCESS">SUCCESS</SelectItem>
            <SelectItem value="FAILED">FAILED</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_auto] gap-2 border-b bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>{t("admin.webhookDeliveries.event")}</span>
          <span>{t("admin.webhookDeliveries.webhook")}</span>
          <span>{t("admin.webhookDeliveries.status")}</span>
          <span>{t("admin.webhookDeliveries.attempts")}</span>
          <span>{t("admin.webhookDeliveries.when")}</span>
          <span className="w-10 text-right">
            {t("admin.webhookDeliveries.actions")}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-1 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            compact
            title={t("admin.webhookDeliveries.emptyTitle")}
            description={t("admin.webhookDeliveries.emptyDesc")}
          />
        ) : (
          data.data.map((d) => (
            <DeliveryRow
              key={d.id}
              row={d}
              expanded={expandedId === d.id}
              onToggleExpand={() =>
                setExpandedId((prev) => (prev === d.id ? null : d.id))
              }
              onRetry={() => retry.mutate(d.id)}
              retrying={retry.isPending}
            />
          ))
        )}
      </div>

      {data && data.totalPages > 1 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        />
      )}
    </div>
  );
}

function DeliveryRow({
  row,
  expanded,
  onToggleExpand,
  onRetry,
  retrying,
}: {
  row: WebhookDelivery;
  expanded: boolean;
  onToggleExpand: () => void;
  onRetry: () => void;
  retrying: boolean;
}) {
  const { t } = useAppStore();
  const statusColor =
    row.status === "SUCCESS"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      : row.status === "FAILED"
        ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
        : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  return (
    <>
      <button
        type="button"
        onClick={onToggleExpand}
        className="grid w-full grid-cols-[1fr_2fr_1fr_1fr_1fr_auto] items-center gap-2 border-b px-4 py-2 text-left text-xs hover:bg-muted/30"
      >
        <code className="truncate font-mono text-[11px]">{row.eventType}</code>
        <div className="min-w-0">
          <div className="truncate font-medium">{row.webhook.name}</div>
          <div className="truncate text-[10px] text-muted-foreground">
            {row.webhook.url}
          </div>
        </div>
        <div>
          <Badge variant="secondary" className={statusColor}>
            {row.status === "SUCCESS" && (
              <CheckCircle2 className="mr-1 h-3 w-3" />
            )}
            {row.status === "FAILED" && <XCircle className="mr-1 h-3 w-3" />}
            {row.status}
            {row.statusCode != null && row.statusCode > 0 && (
              <span className="ml-1 tabular-nums">{row.statusCode}</span>
            )}
          </Badge>
        </div>
        <span className="tabular-nums">{row.attempts}</span>
        <span className="text-[11px] text-muted-foreground">
          {formatDateTime(row.deliveredAt ?? row.createdAt)}
        </span>
        <div className="flex justify-end">
          {row.status === "FAILED" && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              disabled={retrying}
              title={t("admin.webhookDeliveries.retry")}
            >
              <RotateCw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </button>
      {expanded && (
        <div className="border-b bg-muted/20 p-4 text-[11px]">
          {row.error && (
            <div className="mb-2">
              <div className="font-semibold uppercase tracking-wide text-muted-foreground">
                {t("admin.webhookDeliveries.error")}
              </div>
              <pre className="mt-1 max-h-32 overflow-auto rounded bg-background p-2 font-mono">
                {row.error}
              </pre>
            </div>
          )}
          <div>
            <div className="font-semibold uppercase tracking-wide text-muted-foreground">
              {t("admin.webhookDeliveries.payload")}
            </div>
            <pre className="mt-1 max-h-64 overflow-auto rounded bg-background p-2 font-mono">
              {JSON.stringify(row.payload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
