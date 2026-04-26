"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Key,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useCreateToken, useMyTokens, useRevokeToken } from "../hooks";
import type { PatRow } from "../types";

const EXPIRY_OPTIONS = [
  { value: "0", labelKey: "auth.tokens.expiryNever" },
  { value: "7", labelKey: "auth.tokens.expiry7d" },
  { value: "30", labelKey: "auth.tokens.expiry30d" },
  { value: "90", labelKey: "auth.tokens.expiry90d" },
  { value: "365", labelKey: "auth.tokens.expiry1y" },
] as const;

export function TokensPanel() {
  const { t } = useAppStore();
  const { data, isLoading } = useMyTokens();
  const revoke = useRevokeToken();
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<PatRow | null>(null);
  // Snapshot "now" at mount — token expiry is per-day granularity so we don't
  // need a ticking clock. Calling `Date.now()` directly during render is
  // impure (React Compiler errors).
  const [nowMs] = useState(() => Date.now());

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Key className="h-4 w-4" />
            {t("auth.tokens.title")}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("auth.tokens.description")}
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {t("auth.tokens.create")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          compact
          icon={Key}
          title={t("auth.tokens.emptyTitle")}
          description={t("auth.tokens.emptyDesc")}
        />
      ) : (
        <div className="divide-y rounded-md border">
          {data.map((row) => (
            <TokenRow
              key={row.id}
              row={row}
              now={nowMs}
              onRevoke={() => setRevokeTarget(row)}
            />
          ))}
        </div>
      )}

      <CreateTokenDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(o) => !o && setRevokeTarget(null)}
        title={t("auth.tokens.revokeTitle")}
        description={t("auth.tokens.revokeDesc", {
          name: revokeTarget?.name ?? "",
        })}
        confirmLabel={t("auth.tokens.revoke")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        loading={revoke.isPending}
        onConfirm={() => {
          if (!revokeTarget) return Promise.resolve();
          return new Promise<void>((resolve, reject) =>
            revoke.mutate(revokeTarget.id, {
              onSuccess: () => {
                setRevokeTarget(null);
                resolve();
              },
              onError: (err) => reject(err),
            }),
          );
        }}
      />
    </div>
  );
}

function TokenRow({
  row,
  now,
  onRevoke,
}: {
  row: PatRow;
  now: number;
  onRevoke: () => void;
}) {
  const { t } = useAppStore();
  const expired =
    row.expiresAt !== null && new Date(row.expiresAt).getTime() < now;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 text-xs">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{row.name}</span>
          {expired && (
            <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
              {t("auth.tokens.expired")}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <code className="font-mono">{row.tokenPrefix}…</code>
          <span>·</span>
          <span>
            {row.lastUsedAt
              ? t("auth.tokens.lastUsed", {
                  date: formatDateTime(row.lastUsedAt),
                })
              : t("auth.tokens.neverUsed")}
          </span>
          {row.expiresAt && (
            <>
              <span>·</span>
              <span>
                {t("auth.tokens.expiresOn", {
                  date: formatDateTime(row.expiresAt),
                })}
              </span>
            </>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onRevoke}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function CreateTokenDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useAppStore();
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("30");
  const [rawToken, setRawToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const create = useCreateToken();

  const handleCreate = () => {
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), expiresInDays: parseInt(expiry, 10) },
      {
        onSuccess: (res) => {
          setRawToken(res.token);
        },
      },
    );
  };

  const handleCopy = async () => {
    if (!rawToken) return;
    try {
      await navigator.clipboard.writeText(rawToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API may be unavailable in non-HTTPS dev — silent.
    }
  };

  const handleClose = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      // Reset only after the close animation has finished — keeping state
      // mid-animation flashes the form briefly.
      setTimeout(() => {
        setName("");
        setExpiry("30");
        setRawToken(null);
        setCopied(false);
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {rawToken
              ? t("auth.tokens.createdTitle")
              : t("auth.tokens.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {rawToken
              ? t("auth.tokens.createdDesc")
              : t("auth.tokens.createDesc")}
          </DialogDescription>
        </DialogHeader>

        {rawToken ? (
          <div className="space-y-3">
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
              <ShieldAlert className="mb-1.5 inline h-4 w-4" />{" "}
              {t("auth.tokens.copyWarning")}
            </div>
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2 font-mono text-[11px]">
              <code className="flex-1 truncate">{rawToken}</code>
              <Button size="xs" variant="outline" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    {t("auth.tokens.copied")}
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    {t("auth.tokens.copy")}
                  </>
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t("auth.tokens.usageHint")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pat-name">{t("auth.tokens.nameLabel")}</Label>
              <Input
                id="pat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("auth.tokens.namePlaceholder")}
                maxLength={60}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("auth.tokens.expiryLabel")}</Label>
              <Select
                value={expiry}
                onValueChange={(v) => v && setExpiry(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          {rawToken ? (
            <Button onClick={() => handleClose(false)}>
              {t("auth.tokens.done")}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={create.isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || create.isPending}
              >
                {create.isPending ? <Spinner className="h-4 w-4" /> : null}
                {t("auth.tokens.create")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
