"use client";

import { useState } from "react";
import { Plus, Shield, Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  useCreateThrottleOverride,
  useDeleteThrottleOverride,
  useThrottleOverrides,
  type ThrottleOverride,
} from "@/features/admin-throttle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TARGET_RE = /^(user:[\w-]+|ip:[\d.:a-fA-F]+)$/;

export function AdminThrottleClient() {
  const { t } = useAppStore();
  const { data, isLoading } = useThrottleOverrides();
  const create = useCreateThrottleOverride();
  const remove = useDeleteThrottleOverride();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ThrottleOverride | null>(
    null,
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Shield className="h-5 w-5" />
            {t("admin.throttle.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.throttle.description")}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("admin.throttle.add")}
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Spinner className="h-4 w-4" />
          </div>
        ) : !data || data.length === 0 ? (
          <EmptyState
            compact
            title={t("admin.throttle.emptyTitle")}
            description={t("admin.throttle.emptyDesc")}
          />
        ) : (
          <div className="divide-y">
            <div className="grid grid-cols-[2fr_1fr_1fr_2fr_1fr_auto] items-center gap-2 border-b bg-muted/30 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <span>{t("admin.throttle.target")}</span>
              <span>{t("admin.throttle.bypass")}</span>
              <span>{t("admin.throttle.multiplier")}</span>
              <span>{t("admin.throttle.reason")}</span>
              <span>{t("admin.throttle.expires")}</span>
              <span className="text-right">{t("admin.throttle.actions")}</span>
            </div>
            {data.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[2fr_1fr_1fr_2fr_1fr_auto] items-center gap-2 px-4 py-2.5 text-xs hover:bg-muted/30"
              >
                <code className="truncate font-mono text-[11px]">
                  {row.target}
                </code>
                <span
                  className={
                    row.bypass
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                  }
                >
                  {row.bypass ? t("common.yes") : t("common.no")}
                </span>
                <span className="tabular-nums">{row.multiplier}×</span>
                <span className="truncate text-muted-foreground">
                  {row.reason ?? "—"}
                </span>
                <span className="text-muted-foreground">
                  {row.expiresAt ? formatDateTime(row.expiresAt) : "—"}
                </span>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setDeleteTarget(row)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateOverrideDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(payload) =>
          new Promise<void>((resolve, reject) =>
            create.mutate(payload, {
              onSuccess: () => {
                setCreateOpen(false);
                resolve();
              },
              onError: (err) => reject(err),
            }),
          )
        }
        pending={create.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={t("admin.throttle.deleteTitle")}
        description={t("admin.throttle.deleteDesc", {
          target: deleteTarget?.target ?? "",
        })}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleteTarget) return Promise.resolve();
          return new Promise<void>((resolve, reject) =>
            remove.mutate(deleteTarget.id, {
              onSuccess: () => {
                setDeleteTarget(null);
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

function CreateOverrideDialog({
  open,
  onOpenChange,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    target: string;
    bypass: boolean;
    multiplier: number;
    reason?: string;
    expiresAt?: string;
  }) => Promise<void>;
  pending: boolean;
}) {
  const { t } = useAppStore();
  const [target, setTarget] = useState("");
  const [mode, setMode] = useState<"bypass" | "scale">("scale");
  const [multiplier, setMultiplier] = useState("2");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const targetValid = TARGET_RE.test(target);
  const multiplierNum = parseFloat(multiplier);
  const multiplierValid =
    !isNaN(multiplierNum) && multiplierNum >= 0.1 && multiplierNum <= 100;
  const canSubmit =
    targetValid && (mode === "bypass" || multiplierValid) && !pending;

  const handleSubmit = async () => {
    await onSubmit({
      target: target.trim(),
      bypass: mode === "bypass",
      multiplier: mode === "scale" ? multiplierNum : 1,
      reason: reason.trim() || undefined,
      expiresAt: expiresAt || undefined,
    });
    setTarget("");
    setReason("");
    setExpiresAt("");
    setMultiplier("2");
    setMode("scale");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("admin.throttle.addTitle")}</DialogTitle>
          <DialogDescription>
            {t("admin.throttle.addDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="target">{t("admin.throttle.targetLabel")}</Label>
            <Input
              id="target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="user:11111111-... or ip:1.2.3.4"
              className="font-mono text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              {t("admin.throttle.targetHint")}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>{t("admin.throttle.modeLabel")}</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scale">
                  {t("admin.throttle.modeScale")}
                </SelectItem>
                <SelectItem value="bypass">
                  {t("admin.throttle.modeBypass")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "scale" && (
            <div className="space-y-1.5">
              <Label htmlFor="mult">{t("admin.throttle.multiplier")}</Label>
              <Input
                id="mult"
                type="number"
                min={0.1}
                max={100}
                step={0.1}
                value={multiplier}
                onChange={(e) => setMultiplier(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                {t("admin.throttle.multiplierHint")}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reason">{t("admin.throttle.reason")}</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={255}
              placeholder={t("admin.throttle.reasonPlaceholder")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp">{t("admin.throttle.expiresAt")}</Label>
            <Input
              id="exp"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {pending ? <Spinner className="h-4 w-4" /> : null}
            {t("admin.throttle.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
