"use client";

import { useState } from "react";
import {
  FileText,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { TYPE_CONFIG, PRIORITY_CONFIG } from "@/lib/constants/issue-config";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichEditor, RichContent } from "@/components/shared/rich-editor";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLabels } from "@/features/projects/hooks";
import type { Issue, IssueTemplate } from "@/features/projects/types";
import {
  useCreateIssueTemplate,
  useDeleteIssueTemplate,
  useIssueTemplates,
  useUpdateIssueTemplate,
} from "../hooks";

const NONE = "__none__";

type TemplateDraft = {
  name: string;
  type: Issue["type"];
  descriptionHtml: string;
  defaultPriority: Issue["priority"] | "";
  defaultLabels: string[];
};

const EMPTY_DRAFT: TemplateDraft = {
  name: "",
  type: "TASK",
  descriptionHtml: "",
  defaultPriority: "",
  defaultLabels: [],
};

export function ProjectTemplates({
  projectId,
  canManage,
}: {
  projectId: string;
  canManage: boolean;
}) {
  const { t } = useAppStore();
  const { data: templates, isLoading } = useIssueTemplates(projectId);
  const { data: labels } = useLabels(projectId);
  const { mutate: deleteTpl } = useDeleteIssueTemplate(projectId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  const list = templates ?? [];
  const editing = editingId ? list.find((x) => x.id === editingId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">
            {t("templates.title")}
          </h2>
          <p className="text-[12px] text-muted-foreground">
            {t("templates.subtitle")}
          </p>
        </div>
        {canManage && !creating && !editing && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t("templates.newTemplate")}
          </Button>
        )}
      </div>

      {/* Edit / create form */}
      {(creating || editing) && (
        <TemplateForm
          projectId={projectId}
          initial={editing ?? null}
          labels={labels ?? []}
          onClose={() => {
            setCreating(false);
            setEditingId(null);
          }}
        />
      )}

      {/* List */}
      {list.length === 0 && !creating ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {t("templates.empty")}
          </p>
          {canManage && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCreating(true)}
              className="mt-2"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {t("templates.newTemplate")}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((tpl) => (
            <TemplateRow
              key={tpl.id}
              template={tpl}
              labels={labels ?? []}
              canManage={canManage}
              isEditing={editingId === tpl.id}
              onEdit={() => {
                setCreating(false);
                setEditingId(tpl.id);
              }}
              onDelete={() => setDeleteId(tpl.id)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t("templates.confirmDeleteTitle")}
        description={t("templates.confirmDeleteDesc")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        onConfirm={() => {
          if (deleteId) {
            deleteTpl(deleteId);
            setDeleteId(null);
          }
        }}
      />
    </div>
  );
}

function TemplateRow({
  template,
  labels,
  canManage,
  isEditing,
  onEdit,
  onDelete,
}: {
  template: IssueTemplate;
  labels: { id: string; name: string; color: string }[];
  canManage: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (isEditing) return null;
  const typeConf = TYPE_CONFIG[template.type] ?? TYPE_CONFIG.TASK;
  const TypeIcon = typeConf.icon;
  const prio = template.defaultPriority
    ? PRIORITY_CONFIG[template.defaultPriority]
    : null;
  const PrioIcon = prio?.icon;
  const tplLabels = labels.filter((l) =>
    template.defaultLabels.includes(l.id),
  );

  return (
    <div className="group/tpl rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${typeConf.bg}`}
            >
              <TypeIcon className="h-3 w-3 text-white" />
            </div>
            <span className="font-medium">{template.name}</span>
            {prio && PrioIcon && (
              <PrioIcon className={`h-3.5 w-3.5 ${prio.color}`} />
            )}
          </div>
          {tplLabels.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {tplLabels.map((l) => (
                <span
                  key={l.id}
                  className="rounded-sm px-1.5 py-px text-[10px] font-medium"
                  style={{
                    backgroundColor: l.color + "20",
                    color: l.color,
                  }}
                >
                  {l.name}
                </span>
              ))}
            </div>
          )}
          {template.descriptionHtml && (
            <div className="mt-2 line-clamp-2 text-[12px] text-muted-foreground">
              <RichContent html={template.descriptionHtml} />
            </div>
          )}
        </div>
        {canManage && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/tpl:opacity-100">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onEdit}
              aria-label="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onDelete}
              aria-label="Delete"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateForm({
  projectId,
  initial,
  labels,
  onClose,
}: {
  projectId: string;
  initial: IssueTemplate | null;
  labels: { id: string; name: string; color: string }[];
  onClose: () => void;
}) {
  const { t } = useAppStore();
  const [draft, setDraft] = useState<TemplateDraft>(
    initial
      ? {
          name: initial.name,
          type: initial.type,
          descriptionHtml: initial.descriptionHtml ?? "",
          defaultPriority: initial.defaultPriority ?? "",
          defaultLabels: initial.defaultLabels ?? [],
        }
      : EMPTY_DRAFT,
  );

  const { mutate: createTpl, isPending: creating } =
    useCreateIssueTemplate(projectId);
  const { mutate: updateTpl, isPending: updating } =
    useUpdateIssueTemplate(projectId);
  const busy = creating || updating;

  function handleSubmit() {
    if (!draft.name.trim()) return;
    if (initial) {
      updateTpl(
        {
          id: initial.id,
          name: draft.name.trim(),
          type: draft.type,
          descriptionHtml: draft.descriptionHtml || undefined,
          defaultPriority: draft.defaultPriority || undefined,
          defaultLabels: draft.defaultLabels,
        },
        { onSuccess: onClose },
      );
    } else {
      createTpl(
        {
          projectId,
          name: draft.name.trim(),
          type: draft.type,
          descriptionHtml: draft.descriptionHtml || undefined,
          defaultPriority: draft.defaultPriority || undefined,
          defaultLabels: draft.defaultLabels,
        },
        { onSuccess: onClose },
      );
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {initial ? t("templates.editTemplate") : t("templates.newTemplate")}
        </h3>
        <Button variant="ghost" size="icon-xs" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="mb-1.5 block text-[12px]">
            {t("templates.fieldName")}
          </Label>
          <Input
            value={draft.name}
            onChange={(e) =>
              setDraft((d) => ({ ...d, name: e.target.value }))
            }
            placeholder={t("templates.namePlaceholder")}
            autoFocus
          />
        </div>

        <div>
          <Label className="mb-1.5 block text-[12px]">
            {t("templates.fieldType")}
          </Label>
          <Select
            value={draft.type}
            onValueChange={(v) =>
              v && setDraft((d) => ({ ...d, type: v as Issue["type"] }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EPIC">{t("issue.types.EPIC")}</SelectItem>
              <SelectItem value="STORY">{t("issue.types.STORY")}</SelectItem>
              <SelectItem value="BUG">{t("issue.types.BUG")}</SelectItem>
              <SelectItem value="TASK">{t("issue.types.TASK")}</SelectItem>
              <SelectItem value="SUBTASK">
                {t("issue.types.SUBTASK")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-1.5 block text-[12px]">
            {t("templates.fieldPriority")}
          </Label>
          <Select
            value={draft.defaultPriority || NONE}
            onValueChange={(v) =>
              setDraft((d) => ({
                ...d,
                defaultPriority:
                  v === NONE ? "" : (v as Issue["priority"]),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>—</SelectItem>
              <SelectItem value="HIGHEST">
                {t("issue.priorities.HIGHEST")}
              </SelectItem>
              <SelectItem value="HIGH">
                {t("issue.priorities.HIGH")}
              </SelectItem>
              <SelectItem value="MEDIUM">
                {t("issue.priorities.MEDIUM")}
              </SelectItem>
              <SelectItem value="LOW">
                {t("issue.priorities.LOW")}
              </SelectItem>
              <SelectItem value="LOWEST">
                {t("issue.priorities.LOWEST")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Labels — toggle chips */}
      {labels.length > 0 && (
        <div>
          <Label className="mb-1.5 block text-[12px]">
            {t("templates.fieldLabels")}
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {labels.map((l) => {
              const active = draft.defaultLabels.includes(l.id);
              return (
                <button
                  type="button"
                  key={l.id}
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      defaultLabels: active
                        ? d.defaultLabels.filter((x) => x !== l.id)
                        : [...d.defaultLabels, l.id],
                    }))
                  }
                  className={`rounded-sm border px-1.5 py-px text-[11px] font-medium transition-colors ${
                    active ? "ring-2 ring-primary/40" : "opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: l.color + "20",
                    color: l.color,
                    borderColor: l.color + "40",
                  }}
                >
                  {l.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <Label className="mb-1.5 block text-[12px]">
          {t("templates.fieldDescription")}
        </Label>
        <RichEditor
          content={draft.descriptionHtml}
          onChange={(html) =>
            setDraft((d) => ({ ...d, descriptionHtml: html }))
          }
          placeholder={t("templates.descriptionPlaceholder")}
        />
      </div>

      <div className="flex justify-end gap-2 border-t pt-3">
        <Button variant="ghost" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={busy || !draft.name.trim()}
        >
          {busy
            ? t("common.saving")
            : initial
              ? t("common.save")
              : t("common.create")}
        </Button>
      </div>
    </div>
  );
}
