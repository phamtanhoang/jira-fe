"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  RefreshCw,
  Send,
} from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { cn, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { TruncatedText } from "@/components/ui/truncated-text";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useMailLog,
  useMailLogs,
  useMailStats,
  useSendTestMail,
} from "../hooks";
import type { MailLogFilters, MailLogRow, MailStatus, MailType } from "../types";

const ANY = "__any__";

const TYPE_LABELS: Record<MailType, string> = {
  VERIFICATION: "Verification",
  PASSWORD_RESET: "Password reset",
  OTHER: "Other",
};

export function MailLogsPanel() {
  const { t } = useAppStore();
  const [filters, setFilters] = useState<MailLogFilters>({
    page: 1,
    pageSize: 50,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [testOpen, setTestOpen] = useState(false);

  const { data, isLoading } = useMailLogs(filters);
  const { data: stats } = useMailStats();

  function update<T extends keyof MailLogFilters>(
    field: T,
    value: MailLogFilters[T],
  ) {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  }

  return (
    <div className="space-y-4">
      {/* Stats + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <StatBadge
            tone="success"
            label={t("admin.mail.statSent24h")}
            value={stats?.sent ?? 0}
          />
          <StatBadge
            tone="error"
            label={t("admin.mail.statFailed24h")}
            value={stats?.failed ?? 0}
          />
        </div>
        <Button size="sm" variant="outline" onClick={() => setTestOpen(true)}>
          <Send className="mr-1.5 h-3.5 w-3.5" />
          {t("admin.mail.sendTest")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.status ?? ANY}
          onValueChange={(v) =>
            update("status", v === ANY ? undefined : (v as MailStatus))
          }
        >
          <SelectTrigger className="h-8 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t("admin.mail.allStatuses")}</SelectItem>
            <SelectItem value="SENT">{t("admin.mail.statusSent")}</SelectItem>
            <SelectItem value="FAILED">
              {t("admin.mail.statusFailed")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.type ?? ANY}
          onValueChange={(v) =>
            update("type", v === ANY ? undefined : (v as MailType))
          }
        >
          <SelectTrigger className="h-8 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t("admin.mail.allTypes")}</SelectItem>
            <SelectItem value="VERIFICATION">
              {TYPE_LABELS.VERIFICATION}
            </SelectItem>
            <SelectItem value="PASSWORD_RESET">
              {TYPE_LABELS.PASSWORD_RESET}
            </SelectItem>
            <SelectItem value="OTHER">{TYPE_LABELS.OTHER}</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder={t("admin.mail.searchRecipient")}
          value={filters.recipient ?? ""}
          onChange={(e) =>
            update("recipient", e.target.value.trim() || undefined)
          }
          className="h-8 w-64"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="grid grid-cols-[80px_minmax(0,1.4fr)_minmax(0,1.6fr)_minmax(0,2fr)_minmax(0,1.2fr)] items-center gap-3 border-b bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>{t("admin.mail.columns.status")}</span>
          <span>{t("admin.mail.columns.type")}</span>
          <span>{t("admin.mail.columns.recipient")}</span>
          <span>{t("admin.mail.columns.subject")}</span>
          <span>{t("admin.mail.columns.time")}</span>
        </div>
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !data?.data.length ? (
          <EmptyState
            compact
            icon={Mail}
            title={t("admin.mail.empty")}
            description={t("admin.mail.emptyDesc")}
          />
        ) : (
          data.data.map((row) => <MailRow key={row.id} row={row} onClick={setSelectedId} />)
        )}
      </div>

      {data && data.totalPages > 1 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onChange={(page) => setFilters((f) => ({ ...f, page }))}
        />
      )}

      <MailDetailSheet id={selectedId} onClose={() => setSelectedId(null)} />
      <SendTestDialog open={testOpen} onOpenChange={setTestOpen} />
    </div>
  );
}

function MailRow({
  row,
  onClick,
}: {
  row: MailLogRow;
  onClick: (id: string) => void;
}) {
  const failed = row.status === "FAILED";
  return (
    <button
      type="button"
      onClick={() => onClick(row.id)}
      className="grid w-full grid-cols-[80px_minmax(0,1.4fr)_minmax(0,1.6fr)_minmax(0,2fr)_minmax(0,1.2fr)] items-center gap-3 border-b px-4 py-2.5 text-left text-sm transition-colors last:border-b-0 hover:bg-muted/30"
    >
      <Badge
        variant="outline"
        className={cn(
          "gap-1 text-[10px]",
          failed
            ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        )}
      >
        {failed ? (
          <AlertCircle className="h-3 w-3" />
        ) : (
          <CheckCircle2 className="h-3 w-3" />
        )}
        {row.status}
      </Badge>
      <span className="text-[12px] font-medium">
        {TYPE_LABELS[row.type] ?? row.type}
      </span>
      <TruncatedText text={row.recipient} className="text-[12px]" />
      <TruncatedText
        text={row.subject}
        className="text-[12px] text-muted-foreground"
      />
      <TruncatedText
        text={formatDateTime(row.createdAt)}
        className="text-[11px] text-muted-foreground"
      />
    </button>
  );
}

function StatBadge({
  tone,
  label,
  value,
}: {
  tone: "success" | "error";
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5 text-[12px]">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "tabular-nums font-semibold",
          tone === "error" && value > 0 && "text-red-600 dark:text-red-400",
          tone === "success" && "text-emerald-700 dark:text-emerald-400",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function MailDetailSheet({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const { t } = useAppStore();
  const { data: row, isLoading } = useMailLog(id);

  return (
    <Sheet open={!!id} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[95vw] max-w-[95vw] overflow-y-auto sm:max-w-180 lg:max-w-250 xl:max-w-300">
        <SheetHeader className="border-b px-6 pt-6 pb-4">
          <SheetTitle>{t("admin.mail.detail.title")}</SheetTitle>
          <SheetDescription>
            {row ? `${row.recipient} · ${row.subject}` : ""}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : !row ? null : (
          <div className="space-y-5 px-6 py-5 text-sm">
            <Field label={t("admin.mail.columns.status")}>
              <Badge
                variant="outline"
                className={cn(
                  "gap-1 text-[11px]",
                  row.status === "FAILED"
                    ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                )}
              >
                {row.status === "FAILED" ? (
                  <AlertCircle className="h-3 w-3" />
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                {row.status}
              </Badge>
            </Field>
            <Field label={t("admin.mail.columns.type")}>
              {TYPE_LABELS[row.type] ?? row.type}
            </Field>
            <Field label={t("admin.mail.columns.recipient")}>
              {row.recipient}
            </Field>
            <Field label={t("admin.mail.columns.subject")}>{row.subject}</Field>
            <Field label={t("admin.mail.from")}>{row.fromEmail ?? "—"}</Field>
            <Field label={t("admin.mail.providerId")}>
              <span className="font-mono text-[12px]">
                {row.providerId ?? "—"}
              </span>
            </Field>
            {row.errorMessage && (
              <Field label={t("admin.mail.error")}>
                <pre className="max-h-80 overflow-auto rounded-md border bg-red-500/5 p-3 font-mono text-[11px] leading-relaxed text-red-700 dark:text-red-400">
                  {row.errorMessage}
                </pre>
              </Field>
            )}
            {row.sentryId && (
              <Field label="Sentry">
                <span className="font-mono text-[11px] text-muted-foreground">
                  {row.sentryId}
                </span>
              </Field>
            )}
            <Field label={t("admin.mail.columns.time")}>
              {formatDateTime(row.createdAt)}
            </Field>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({
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

function SendTestDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useAppStore();
  const [to, setTo] = useState("");
  const { mutate, isPending } = useSendTestMail();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!to.trim()) return;
    mutate(to.trim(), {
      onSuccess: () => {
        onOpenChange(false);
        setTo("");
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.mail.sendTest")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <p className="text-[12px] text-muted-foreground">
            {t("admin.mail.sendTestDesc")}
          </p>
          <Input
            type="email"
            placeholder="you@example.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending || !to.trim()}>
              {isPending ? (
                <Spinner className="mr-1.5 h-3.5 w-3.5" />
              ) : (
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              )}
              {t("admin.mail.sendTest")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
