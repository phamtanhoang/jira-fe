"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { AVATAR_GRADIENT } from "@/lib/constants/issue-config";
import { cn, formatDateTime, getInitials, safeGet } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { ENDPOINTS } from "@/lib/constants";
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
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { TruncatedText } from "@/components/ui/truncated-text";
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

export function AuditPanel({ density = "comfortable" }: { density?: "compact" | "comfortable" }) {
  const { t } = useAppStore();
  const [filters, setFilters] = useState<AuditLogFilters>({
    take: 50,
    page: 1,
  });
  const [selected, setSelected] = useState<AuditLogRow | null>(null);
  const { data, isLoading } = useAuditLog(filters);
  const rowPadding = density === "compact" ? "py-1" : "py-2.5";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.action ?? ANY}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              action: v === ANY ? undefined : (v as AuditAction),
              page: 1,
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

        {/* Export CSV — honors the action filter via the same query string. */}
        <a
          href={`/api${ENDPOINTS.admin.auditExport}${filters.action ? `?action=${filters.action}` : ""}`}
          download
          className="ml-auto inline-flex items-center gap-1 rounded-md border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title={t("admin.audit.exportHint")}
        >
          <Download className="h-3 w-3" />
          {t("admin.audit.exportCsv")}
        </a>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="sticky top-0 bg-background/95 backdrop-blur z-10 grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-3 border-b px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                className={`grid w-full grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-3 border-b px-4 text-left text-sm transition-colors last:border-b-0 hover:bg-muted/30 ${rowPadding}`}
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
                  <TruncatedText
                    text={describeAudit(row.action, row.payload)}
                    className="font-medium text-[12.5px]"
                  />
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
                  <TruncatedText
                    text={row.actor.name || row.actor.email}
                    className="text-[12px]"
                  />
                </span>
                <TruncatedText
                  text={`${row.targetType ? `${row.targetType}:` : ""}${row.target ?? "—"}`}
                  className="font-mono text-[11px] text-muted-foreground"
                />
                <TruncatedText
                  text={formatDateTime(row.createdAt)}
                  className="text-[11px] text-muted-foreground"
                />
              </button>
            );
          })
        )}
      </div>

      {data && data.totalPages > 1 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onChange={(page) => setFilters((f) => ({ ...f, page }))}
        />
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
        <SheetContent className="w-[95vw] max-w-[95vw] sm:max-w-180 lg:max-w-250 xl:max-w-300" />
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
      <SheetContent className="w-[95vw] max-w-[95vw] overflow-y-auto p-0 sm:max-w-180 lg:max-w-250 xl:max-w-300">
        <SheetHeader className="border-b px-6 pt-6 pb-4">
          <SheetTitle className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border",
                AUDIT_TONE_CLASS[conf.tone],
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-base font-semibold">{conf.label}</span>
          </SheetTitle>
          <SheetDescription className="pl-12 text-[12px]">
            {formatDateTime(row.createdAt)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6 py-5 text-sm">
          <DetailRow label={t("admin.audit.summary")}>
            <p className="leading-relaxed">{summary}</p>
          </DetailRow>

          <DetailRow label={t("admin.audit.columns.actor")}>
            <span className="flex items-center gap-2.5">
              <Avatar className="h-7 w-7">
                {row.actor.image ? (
                  <AvatarImage src={row.actor.image} alt={row.actor.email} />
                ) : null}
                <AvatarFallback
                  className={cn(AVATAR_GRADIENT, "text-[10px]")}
                >
                  {getInitials(row.actor.name, row.actor.email)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                {row.actor.name ? (
                  <>
                    <span className="font-medium">{row.actor.name}</span>
                    <span className="ml-1.5 text-muted-foreground">
                      ({row.actor.email})
                    </span>
                  </>
                ) : (
                  row.actor.email
                )}
              </span>
            </span>
          </DetailRow>

          <DetailRow label={t("admin.audit.columns.target")}>
            {targetName || targetEmail ? (
              <span>
                <span className="font-medium">
                  {targetName ?? targetEmail}
                </span>
                {row.targetType && (
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {row.targetType}
                  </span>
                )}
              </span>
            ) : row.target ? (
              <span className="font-mono text-[12px] break-all">
                {row.targetType ? `${row.targetType}:` : ""}
                {row.target}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </DetailRow>

          {from !== null && to !== null && (
            <DetailRow label={t("admin.audit.change")}>
              <span className="inline-flex items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1 font-mono text-[12px]">
                <span className="text-muted-foreground">{String(from)}</span>
                <span aria-hidden>→</span>
                <span className="font-semibold">{String(to)}</span>
              </span>
            </DetailRow>
          )}

          <div className="space-y-1.5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("admin.audit.payload")}
            </div>
            <pre className="max-h-80 overflow-auto rounded-md border bg-muted/30 p-3 font-mono text-[11px] leading-relaxed">
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
    <div className="space-y-1.5">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-[13px] leading-relaxed">{children}</div>
    </div>
  );
}
