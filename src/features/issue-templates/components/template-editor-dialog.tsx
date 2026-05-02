"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichEditor } from "@/components/shared/rich-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Issue, IssueTemplate } from "@/features/projects/types";
import {
  useCreateIssueTemplate,
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

export function TemplateForm({
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
