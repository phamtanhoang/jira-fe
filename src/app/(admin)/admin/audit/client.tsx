"use client";

import { useState } from "react";
import { ScrollText } from "lucide-react";
import { AVATAR_GRADIENT } from "@/lib/constants/issue-config";
import { cn, formatDateTime, getInitials } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  useAuditLog,
  type AuditAction,
  type AuditLogFilters,
  type AuditLogRow,
} from "@/features/admin-audit";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

const ACTIONS: AuditAction[] = [
  "ROLE_CHANGE",
  "USER_DELETE",
  "USER_DEACTIVATE",
  "USER_ACTIVATE",
  "SESSION_REVOKE",
  "SESSIONS_REVOKE_ALL",
  "WORKSPACE_DELETE",
  "SETTING_UPDATE",
  "FLAG_CREATE",
  "FLAG_UPDATE",
  "FLAG_DELETE",
];

const ANY = "__any__";

const ACTION_COLORS: Record<AuditAction, string> = {
  ROLE_CHANGE: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  USER_DELETE: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  USER_DEACTIVATE: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  USER_ACTIVATE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  SESSION_REVOKE: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  SESSIONS_REVOKE_ALL: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  WORKSPACE_DELETE: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  SETTING_UPDATE: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  FLAG_CREATE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  FLAG_UPDATE: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  FLAG_DELETE: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
};

export function AdminAuditClient() {
  const { t } = useAppStore();
  const [filters, setFilters] = useState<AuditLogFilters>({ take: 50 });
  const [selected, setSelected] = useState<AuditLogRow | null>(null);
  const { data, isLoading } = useAuditLog(filters);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {t("admin.audit.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.audit.description")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
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
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t("admin.audit.allActions")}</SelectItem>
            {ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="grid grid-cols-[auto_1.5fr_1.5fr_1.5fr_1.5fr] gap-2 border-b bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="w-10" />
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
          data.data.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setSelected(row)}
              className="grid w-full grid-cols-[auto_1.5fr_1.5fr_1.5fr_1.5fr] items-center gap-2 border-b px-4 py-2.5 text-left text-sm transition-colors last:border-b-0 hover:bg-muted/30"
            >
              <span className="w-10 text-muted-foreground">
                <ScrollText className="h-3.5 w-3.5" />
              </span>
              <Badge
                variant="outline"
                className={cn("text-[11px]", ACTION_COLORS[row.action])}
              >
                {row.action}
              </Badge>
              <span className="flex items-center gap-2 min-w-0">
                <Avatar className="h-6 w-6 shrink-0">
                  {row.actor.image ? (
                    <AvatarImage src={row.actor.image} alt={row.actor.email} />
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
          ))
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

      <Sheet
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent className="w-[520px] sm:max-w-[520px]">
          <SheetHeader>
            <SheetTitle>{selected?.action ?? ""}</SheetTitle>
            <SheetDescription>
              {selected ? formatDateTime(selected.createdAt) : ""}
            </SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="mt-4 space-y-3 text-sm">
              <DetailRow label={t("admin.audit.columns.actor")}>
                {selected.actor.name
                  ? `${selected.actor.name} (${selected.actor.email})`
                  : selected.actor.email}
              </DetailRow>
              <DetailRow label={t("admin.audit.columns.target")}>
                {selected.targetType
                  ? `${selected.targetType}: ${selected.target ?? "—"}`
                  : (selected.target ?? "—")}
              </DetailRow>
              <div>
                <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t("admin.audit.payload")}
                </div>
                <pre className="max-h-80 overflow-auto rounded-md border bg-muted/30 p-3 text-[11px]">
                  {JSON.stringify(selected.payload ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
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
