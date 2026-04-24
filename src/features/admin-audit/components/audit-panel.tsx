"use client";

import { useState } from "react";
import { AVATAR_GRADIENT } from "@/lib/constants/issue-config";
import { cn, formatDateTime, getInitials, safeGet } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  AUDIT_ACTION_CONFIG,
  AUDIT_TONE_CLASS,
  describeAudit,
  useAuditLog,
  type AuditAction,
  type AuditLogFilters,
  type AuditLogRow,
} from "@/features/admin-audit";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const ACTIONS = Object.keys(AUDIT_ACTION_CONFIG) as AuditAction[];
const ANY = "__any__";

export function AuditPanel() {
  const { t } = useAppStore();
  const [filters, setFilters] = useState<AuditLogFilters>({ take: 50 });
  const [selected, setSelected] = useState<AuditLogRow | null>(null);
  const { data, isLoading } = useAuditLog(filters);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.action ?? ANY}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              action: v === ANY ? undefined : (v as AuditAction),
              cursor: undefined,
            }))
          }
        >
          <SelectTrigger className="h-8 w-60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t("admin.audit.allActions")}</SelectItem>
            {ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {AUDIT_ACTION_CONFIG[a].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="grid grid-cols-[2fr_1.5fr_2fr_1fr] gap-3 border-b bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>{t("admin.audit.columns.action")}</span>
          <span>{t("admin.audit.columns.actor")}</span>
          <span>{t("admin.audit.columns.target")}</span>
          <span>{t("admin.audit.columns.time")}</span>
        </div>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : !data?.data.length ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            {t("admin.audit.empty")}
          </div>
        ) : (
          data.data.map((row) => {
            const conf = AUDIT_ACTION_CONFIG[row.action];
            const Icon = conf.icon;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelected(row)}
                className="grid w-full grid-cols-[2fr_1.5fr_2fr_1fr] items-center gap-3 border-b px-4 py-2.5 text-left text-sm transition-colors last:border-b-0 hover:bg-muted/30"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
                      AUDIT_TONE_CLASS[conf.tone],
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 truncate font-medium text-[12.5px]">
                    {describeAudit(row.action, row.payload)}
                  </span>
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar className="h-6 w-6 shrink-0">
                    {row.actor.image ? (
                      <AvatarImage
                        src={row.actor.image}
                        alt={row.actor.email}
                      />
                    ) : null}
                    <AvatarFallback
                      className={cn(AVATAR_GRADIENT, "text-[10px]")}
                    >
                      {getInitials(row.actor.name, row.actor.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-[12px]">
                    {row.actor.name || row.actor.email}
                  </span>
                </span>
                <span className="truncate font-mono text-[11px] text-muted-foreground">
                  {row.targetType ? `${row.targetType}:` : ""}
                  {row.target ?? "—"}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {formatDateTime(row.createdAt)}
                </span>
              </button>
            );
          })
        )}
      </div>

      {data?.hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setFilters((f) => ({
                ...f,
                cursor: data.nextCursor ?? undefined,
              }))
            }
          >
            {t("admin.audit.loadMore")}
          </Button>
        </div>
      )}

      <AuditDetailSheet
        row={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function AuditDetailSheet({
  row,
  onClose,
}: {
  row: AuditLogRow | null;
  onClose: () => void;
}) {
  const { t } = useAppStore();

  if (!row) {
    return (
      <Sheet open={false} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-[520px] sm:max-w-[520px]" />
      </Sheet>
    );
  }

  const conf = AUDIT_ACTION_CONFIG[row.action];
  const Icon = conf.icon;
  const summary = describeAudit(row.action, row.payload);
  const from = safeGet<string | null>(row.payload, "from", null);
  const to = safeGet<string | null>(row.payload, "to", null);
  const targetName = safeGet<string | null>(row.payload, "targetName", null);
  const targetEmail = safeGet<string | null>(row.payload, "targetEmail", null);

  return (
    <Sheet open={!!row} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[520px] sm:max-w-[520px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md border",
                AUDIT_TONE_CLASS[conf.tone],
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span>{conf.label}</span>
          </SheetTitle>
          <SheetDescription>{formatDateTime(row.createdAt)}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4 text-sm">
          <DetailRow label={t("admin.audit.summary")}>{summary}</DetailRow>

          <DetailRow label={t("admin.audit.columns.actor")}>
            <span className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                {row.actor.image ? (
                  <AvatarImage src={row.actor.image} alt={row.actor.email} />
                ) : null}
                <AvatarFallback
                  className={cn(AVATAR_GRADIENT, "text-[10px]")}
                >
                  {getInitials(row.actor.name, row.actor.email)}
                </AvatarFallback>
              </Avatar>
              <span>
                {row.actor.name
                  ? `${row.actor.name} (${row.actor.email})`
                  : row.actor.email}
              </span>
            </span>
          </DetailRow>

          <DetailRow label={t("admin.audit.columns.target")}>
            {targetName || targetEmail ? (
              <span>
                {targetName ?? targetEmail}
                {row.targetType && (
                  <span className="ml-2 text-[11px] text-muted-foreground">
                    ({row.targetType})
                  </span>
                )}
              </span>
            ) : row.target ? (
              <span className="font-mono text-[12px]">
                {row.targetType ? `${row.targetType}:` : ""}
                {row.target}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </DetailRow>

          {from !== null && to !== null && (
            <DetailRow label={t("admin.audit.change")}>
              <span className="inline-flex items-center gap-2 rounded border bg-muted/40 px-2 py-0.5 font-mono text-[12px]">
                <span className="text-muted-foreground">{String(from)}</span>
                <span>→</span>
                <span className="font-semibold">{String(to)}</span>
              </span>
            </DetailRow>
          )}

          <div>
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("admin.audit.payload")}
            </div>
            <pre className="max-h-80 overflow-auto rounded-md border bg-muted/30 p-3 text-[11px]">
              {JSON.stringify(row.payload ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-[13px]">{children}</div>
    </div>
  );
}
