"use client";

import { useState } from "react";
import { Plus, Repeat, Trash2, Pencil } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import {
  useCreateRecurringRule,
  useDeleteRecurringRule,
  useRecurringRules,
  useUpdateRecurringRule,
} from "../hooks";
import type {
  CreateRecurringRulePayload,
  RecurringFrequency,
  RecurringRule,
} from "../types";
import { RecurringRuleDialog } from "./recurring-rule-dialog";

const FREQUENCY_LABEL: Record<RecurringFrequency, string> = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
};

export function RecurringRulesPanel({ projectId }: { projectId: string }) {
  const { t } = useAppStore();
  const { data: rules, isLoading } = useRecurringRules(projectId);
  const create = useCreateRecurringRule(projectId);
  const update = useUpdateRecurringRule(projectId);
  const remove = useDeleteRecurringRule(projectId);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringRule | null>(null);

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(rule: RecurringRule) {
    setEditing(rule);
    setEditorOpen(true);
  }

  function handleSubmit(payload: CreateRecurringRulePayload) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            name: payload.name,
            frequency: payload.frequency,
            hour: payload.hour,
            template: payload.template,
            enabled: payload.enabled,
          },
        },
        { onSuccess: () => setEditorOpen(false) },
      );
    } else {
      create.mutate(payload, { onSuccess: () => setEditorOpen(false) });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">
            {t("recurring.title")}
          </h3>
          <p className="text-[13px] text-muted-foreground">
            {t("recurring.description")}
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-1 h-3.5 w-3.5" />
          {t("recurring.addCta")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !rules?.length ? (
            <EmptyState
              compact
              icon={Repeat}
              title={t("recurring.emptyTitle")}
              description={t("recurring.emptyDesc")}
            />
          ) : (
            <div className="divide-y">
              {rules.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  onEdit={() => openEdit(rule)}
                  onToggle={() =>
                    update.mutate({
                      id: rule.id,
                      payload: { enabled: !rule.enabled },
                    })
                  }
                  onDelete={() => setDeleteTarget(rule)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RecurringRuleDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        projectId={projectId}
        editing={editing}
        onSubmit={handleSubmit}
        pending={create.isPending || update.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("recurring.deleteTitle")}
        description={
          deleteTarget
            ? t("recurring.deleteConfirm", { name: deleteTarget.name })
            : ""
        }
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          remove.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          });
        }}
      />
    </div>
  );
}

function RuleRow({
  rule,
  onEdit,
  onToggle,
  onDelete,
}: {
  rule: RecurringRule;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { t } = useAppStore();
  return (
    <div className="flex items-start gap-3 p-4">
      <Repeat
        className={
          rule.enabled
            ? "mt-0.5 h-4 w-4 text-primary"
            : "mt-0.5 h-4 w-4 text-muted-foreground/60"
        }
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="truncate text-sm font-medium">{rule.name}</h4>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            {FREQUENCY_LABEL[rule.frequency]}
          </span>
          <span className="text-[11px] text-muted-foreground">
            @ {String(rule.hour).padStart(2, "0")}:00 UTC
          </span>
        </div>
        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
          {t("recurring.summaryPrefix")}: {rule.template.summary}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          {t("recurring.nextRun")}:{" "}
          {rule.nextRunAt ? formatDateTime(rule.nextRunAt) : "—"}
          {rule.lastRunAt && (
            <>
              {" · "}
              {t("recurring.lastRun")}: {formatDateTime(rule.lastRunAt)}
            </>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Toggle checked={rule.enabled} onChange={onToggle} />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onEdit}
          aria-label={t("common.edit")}
          className="text-muted-foreground/70 hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onDelete}
          aria-label={t("common.delete")}
          className="text-muted-foreground/70 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
