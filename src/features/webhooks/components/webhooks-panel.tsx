"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Plug,
  Plus,
  Send,
  Trash2,
  Webhook,
} from "lucide-react";
import { toggleArrayItem } from "@/lib/utils";
import { CLIPBOARD_FEEDBACK_MS } from "@/lib/constants/ui";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  useCreateWebhook,
  useDeleteWebhook,
  useTestWebhook,
  useUpdateWebhook,
  useWorkspaceWebhooks,
} from "../hooks";
import { WEBHOOK_EVENTS, type Webhook as WebhookRow } from "../types";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

export function WebhooksPanel({ workspaceId }: { workspaceId: string }) {
  const { t } = useAppStore();
  const { data, isLoading } = useWorkspaceWebhooks(workspaceId);
  const remove = useDeleteWebhook(workspaceId);
  const test = useTestWebhook(workspaceId);
  const update = useUpdateWebhook(workspaceId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WebhookRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WebhookRow | null>(null);

  const handleEdit = (row: WebhookRow) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Webhook className="h-4 w-4" />
            {t("workspace.webhooks.title")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("workspace.webhooks.description")}
          </p>
        </div>
        <Button size="sm" onClick={handleAdd} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {t("workspace.webhooks.add")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          compact
          icon={Plug}
          title={t("workspace.webhooks.emptyTitle")}
          description={t("workspace.webhooks.emptyDesc")}
        />
      ) : (
        <div className="divide-y rounded-md border">
          {data.map((row) => (
            <WebhookListRow
              key={row.id}
              row={row}
              onEdit={() => handleEdit(row)}
              onDelete={() => setDeleteTarget(row)}
              onTest={() => test.mutate(row.id)}
              onToggleEnabled={() =>
                update.mutate({
                  webhookId: row.id,
                  payload: { enabled: !row.enabled },
                })
              }
              testing={test.isPending}
            />
          ))}
        </div>
      )}

      <WebhookDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        editing={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={t("workspace.webhooks.deleteTitle")}
        description={t("workspace.webhooks.deleteDesc", {
          name: deleteTarget?.name ?? "",
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

function WebhookListRow({
  row,
  onEdit,
  onDelete,
  onTest,
  onToggleEnabled,
  testing,
}: {
  row: WebhookRow;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
  onToggleEnabled: () => void;
  testing: boolean;
}) {
  const { t } = useAppStore();
  const [copied, setCopied] = useState(false);
  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(row.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), CLIPBOARD_FEEDBACK_MS);
    } catch {
      // clipboard unavailable — silent
    }
  };
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 text-xs">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{row.name}</span>
          {!row.enabled && (
            <Badge variant="secondary" className="text-[10px]">
              {t("workspace.webhooks.disabled")}
            </Badge>
          )}
          {row.url.includes("hooks.slack.com") && (
            <Badge
              variant="secondary"
              className="bg-purple-50 text-purple-700 text-[10px] dark:bg-purple-950 dark:text-purple-300"
            >
              Slack
            </Badge>
          )}
        </div>
        <code className="block truncate text-[10px] text-muted-foreground">
          {row.url}
        </code>
        <div className="flex flex-wrap gap-1">
          {row.events.map((e) => (
            <span
              key={e}
              className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium"
            >
              {e}
            </span>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="xs"
          onClick={handleCopySecret}
          title={t("workspace.webhooks.copySecret")}
        >
          {copied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={onTest}
          disabled={testing || !row.enabled}
          title={t("workspace.webhooks.test")}
        >
          <Send className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="xs" onClick={onToggleEnabled}>
          {row.enabled
            ? t("workspace.webhooks.disable")
            : t("workspace.webhooks.enable")}
        </Button>
        <Button variant="ghost" size="xs" onClick={onEdit}>
          {t("common.edit")}
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function WebhookDialog({
  open,
  onOpenChange,
  workspaceId,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  editing: WebhookRow | null;
}) {
  const { t } = useAppStore();
  const create = useCreateWebhook(workspaceId);
  const update = useUpdateWebhook(workspaceId);

  // Re-key the inner form on `editing.id` so opening for a different row
  // (or switching between create/edit) re-initializes the form state.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing
              ? t("workspace.webhooks.editTitle")
              : t("workspace.webhooks.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("workspace.webhooks.dialogDesc")}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <WebhookFormInner
            key={editing?.id ?? "new"}
            initial={
              editing ?? {
                name: "",
                url: "",
                events: ["issue.created"] as string[],
                enabled: true,
              }
            }
            isEditing={!!editing}
            pending={create.isPending || update.isPending}
            onSubmit={(payload) => {
              if (editing) {
                update.mutate(
                  { webhookId: editing.id, payload },
                  { onSuccess: () => onOpenChange(false) },
                );
              } else {
                create.mutate(payload, {
                  onSuccess: () => onOpenChange(false),
                });
              }
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function WebhookFormInner({
  initial,
  isEditing,
  pending,
  onSubmit,
  onCancel,
}: {
  initial: { name: string; url: string; events: string[]; enabled: boolean };
  isEditing: boolean;
  pending: boolean;
  onSubmit: (payload: {
    name: string;
    url: string;
    events: string[];
    enabled: boolean;
  }) => void;
  onCancel: () => void;
}) {
  const { t } = useAppStore();
  const [name, setName] = useState(initial.name);
  const [url, setUrl] = useState(initial.url);
  const [events, setEvents] = useState<string[]>(initial.events);
  const [enabled, setEnabled] = useState(initial.enabled);

  const validUrl = useMemo(() => {
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, [url]);
  const canSubmit = name.trim().length > 0 && validUrl && events.length > 0;

  return (
    <>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="wh-name">{t("workspace.webhooks.name")}</Label>
          <Input
            id="wh-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="production-deploy-bot"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wh-url">{t("workspace.webhooks.url")}</Label>
          <Input
            id="wh-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            className="font-mono text-xs"
          />
          <p className="text-[10px] text-muted-foreground">
            {t("workspace.webhooks.urlHint")}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>{t("workspace.webhooks.events")}</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {WEBHOOK_EVENTS.map((e) => {
              const checked = events.includes(e);
              return (
                <label
                  key={e}
                  className="flex cursor-pointer items-center gap-2 rounded-md border bg-card px-2 py-1.5 text-xs hover:bg-muted/30"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => setEvents((s) => toggleArrayItem(s, e))}
                    className="h-3.5 w-3.5"
                  />
                  <code className="font-mono text-[11px]">{e}</code>
                </label>
              );
            })}
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-card px-3 py-2 text-xs hover:bg-muted/30">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          {t("workspace.webhooks.enabledLabel")}
        </label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={pending}>
          {t("common.cancel")}
        </Button>
        <Button
          onClick={() =>
            onSubmit({ name: name.trim(), url, events, enabled })
          }
          disabled={!canSubmit || pending}
        >
          {pending ? <Spinner className="h-4 w-4" /> : null}
          {isEditing ? t("common.save") : t("workspace.webhooks.create")}
        </Button>
      </DialogFooter>
    </>
  );
}

