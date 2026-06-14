"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Plus } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { onShortcutEvent, SHORTCUT_EVENTS } from "@/lib/hooks/use-shortcuts";
import { useIssueTemplates } from "@/features/issue-templates/hooks";
import { useCustomFields } from "@/features/custom-fields/hooks";
import { RichEditor } from "@/components/shared/rich-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useCreateIssue } from "../hooks";
import type {
  CreateIssuePayload,
  Issue,
  Sprint,
} from "../types";
import { CustomFieldInput } from "./custom-field-input";

// Radix Select rejects empty-string values, so we use a sentinel for
// "no sprint" / "no column" and translate on submit.
const NO_SPRINT = "__none__";

// ─── Controlled modal ──────────────────────────────────────────────────

export type CreateIssueModalProps = {
  projectId: string;
  sprints?: Sprint[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selected sprint. The user can still override unless lockSprint. */
  defaultSprintId?: string;
  /** Pre-selected epic (parent for Story/Task). Hidden from the form. */
  defaultEpicId?: string;
  /** Pre-fill + optionally lock the Type. Used by Epic-only flow. */
  defaultType?: Issue["type"];
  /** When true, hide the Type dropdown entirely (defaultType wins). */
  lockType?: boolean;
  /** Fires after a successful create — caller can close menus / scroll
   *  to the new card. The full new issue is passed through. */
  onCreated?: (issue: Issue) => void;
};

export function CreateIssueModal(props: CreateIssueModalProps) {
  const { open, onOpenChange } = props;

  // `c` shortcut opens the create modal from anywhere on the board page.
  useEffect(() => {
    return onShortcutEvent(SHORTCUT_EVENTS.OPEN_CREATE_ISSUE, () =>
      onOpenChange(true),
    );
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Mount the form only when the dialog is open. Unmount = automatic
            state reset between openings — no effect-driven setState needed,
            which keeps us clear of the react-hooks/set-state-in-effect lint
            rule and avoids cascading re-renders on close. */}
        {open && <CreateIssueForm {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function CreateIssueForm({
  projectId,
  sprints = [],
  onOpenChange,
  defaultSprintId,
  defaultEpicId,
  defaultType,
  lockType,
  onCreated,
}: CreateIssueModalProps) {
  const { t } = useAppStore();

  // Type options. EPIC is intentionally absent from the regular create
  // flow — Epics get their own create entry under the Epics tab, and
  // surfacing them here invited "I accidentally made a SUBTASK with
  // type EPIC" confusion. The Epic flow funnels back through this
  // modal with `lockType=true defaultType="EPIC"`, which surfaces the
  // EPIC-only option set below.
  const TYPE_OPTIONS = useMemo<Issue["type"][]>(() => {
    if (lockType && defaultType === "EPIC") return ["EPIC"];
    return ["STORY", "BUG", "TASK", "SUBTASK"];
  }, [lockType, defaultType]);

  const [templateId, setTemplateId] = useState<string>("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<Issue["type"]>(
    defaultType ?? TYPE_OPTIONS[0] ?? "TASK",
  );
  const [priority, setPriority] = useState<Issue["priority"]>("MEDIUM");
  const [sprintId, setSprintId] = useState<string>(defaultSprintId ?? "");
  const [storyPoints, setStoryPoints] = useState("");
  const [customFieldValues, setCustomFieldValues] = useState<
    Record<string, unknown>
  >({});
  const [error, setError] = useState<string | null>(null);

  const { mutate: create, isPending } = useCreateIssue();
  const { data: templates } = useIssueTemplates(projectId);
  const { data: customFields } = useCustomFields(projectId);

  function applyTemplate(id: string) {
    setTemplateId(id);
    const tpl = templates?.find((x) => x.id === id);
    if (!tpl) return;
    // Lock-type wins over template-type — Epic create from the Epics
    // tab must stay EPIC even if a Story template is picked.
    if (!lockType) setType(tpl.type);
    if (tpl.defaultPriority) setPriority(tpl.defaultPriority);
    if (tpl.descriptionHtml) setDescription(tpl.descriptionHtml);
    if (!summary) setSummary(tpl.name);
  }

  function updateCustomField(fieldId: string, value: unknown) {
    setCustomFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  // BE rejects with 400 when a required custom field is missing — we
  // surface the same message inline so the user doesn't have to wait
  // for the round-trip.
  function findMissingRequired(): string | null {
    if (!customFields) return null;
    for (const def of customFields) {
      if (!def.required) continue;
      const v = customFieldValues[def.id];
      const empty =
        v === undefined ||
        v === null ||
        (typeof v === "string" && v.trim() === "") ||
        (Array.isArray(v) && v.length === 0);
      if (empty) return t("issue.fieldRequired", { name: def.name });
    }
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim()) return;
    const missing = findMissingRequired();
    if (missing) {
      setError(missing);
      return;
    }
    const payload: CreateIssuePayload = {
      projectId,
      summary: summary.trim(),
      description: description.trim() || undefined,
      type,
      priority,
      sprintId: sprintId || undefined,
      epicId: defaultEpicId || undefined,
      storyPoints: storyPoints ? parseInt(storyPoints) : undefined,
      customFields:
        Object.keys(customFieldValues).length > 0
          ? customFieldValues
          : undefined,
    };
    create(payload, {
      onSuccess: (result: unknown) => {
        const issue =
          (result as { issue?: Issue })?.issue ?? (result as Issue);
        onCreated?.(issue);
        onOpenChange(false);
      },
    });
  }

  // Active + planning sprints. Completed ones aren't candidates for new
  // work — including them caused users to assign issues to a sprint
  // that was already closed.
  const availableSprints = sprints.filter(
    (s) => s.status === "ACTIVE" || s.status === "PLANNING",
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {lockType && defaultType === "EPIC"
            ? t("issue.createEpic")
            : t("issue.createIssue")}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template picker — only when templates exist + not in
              lock-type mode (Epic create skips templates entirely
              because Epic templates aren't a thing today). */}
          {!lockType && templates && templates.length > 0 && (
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">
                <FileText className="mr-1 inline h-3.5 w-3.5 text-muted-foreground" />
                {t("issue.fromTemplate")}
              </label>
              <Select
                value={templateId}
                onValueChange={(v) => typeof v === "string" && applyTemplate(v)}
              >
                <SelectTrigger className="w-full">
                  {/* Custom-rendered value — show the template *name*,
                      never the raw id. With the default <SelectValue>
                      Radix rendered the value attribute (UUID) for the
                      selected item. */}
                  {templateId
                    ? (templates.find((x) => x.id === templateId)?.name ??
                      t("issue.pickTemplate"))
                    : (
                      <span className="text-muted-foreground">
                        {t("issue.pickTemplate")}
                      </span>
                    )}
                </SelectTrigger>
                <SelectContent>
                  {templates.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Type + Priority */}
          <div className="grid grid-cols-2 gap-3">
            {!lockType && (
              <div>
                <label className="mb-1.5 block text-[13px] font-medium">
                  {t("common.type")}
                </label>
                <Select
                  value={type}
                  onValueChange={(v) => v && setType(v as Issue["type"])}
                >
                  <SelectTrigger className="w-full">{t(`issue.types.${type}` as `issue.types.TASK`)}</SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((tt) => (
                      <SelectItem key={tt} value={tt}>
                        {t(`issue.types.${tt}` as `issue.types.TASK`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className={lockType ? "col-span-2" : ""}>
              <label className="mb-1.5 block text-[13px] font-medium">
                {t("issue.priority")}
              </label>
              <Select
                value={priority}
                onValueChange={(v) => v && setPriority(v as Issue["priority"])}
              >
                <SelectTrigger className="w-full">
                  {t(`issue.priorities.${priority}` as `issue.priorities.HIGH`)}
                </SelectTrigger>
                <SelectContent>
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

          {/* Summary */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium">
              {t("issue.summary")}
            </label>
            <Input
              placeholder={t("issue.summaryPlaceholder")}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description (Tiptap) */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium">
              {t("common.description")}
            </label>
            <RichEditor
              content={description}
              onChange={setDescription}
              placeholder={t("issue.descPlaceholder")}
            />
          </div>

          {/* Sprint + Story Points */}
          <div className="grid grid-cols-2 gap-3">
            {availableSprints.length > 0 && (
              <div>
                <label className="mb-1.5 block text-[13px] font-medium">
                  {t("issue.sprint")}
                </label>
                <Select
                  value={sprintId || NO_SPRINT}
                  onValueChange={(v) =>
                    setSprintId(v === NO_SPRINT ? "" : (v ?? ""))
                  }
                >
                  <SelectTrigger className="w-full">
                    {/* Custom-rendered value (see template Select). */}
                    {sprintId
                      ? (availableSprints.find((s) => s.id === sprintId)
                          ?.name ?? t("issue.backlogStatus"))
                      : (
                        <span className="text-muted-foreground">
                          {t("issue.backlogStatus")}
                        </span>
                      )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SPRINT}>
                      {t("issue.backlogStatus")}
                    </SelectItem>
                    {availableSprints.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                        {s.status === "ACTIVE" && ` (${t("sprint.active")})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">
                {t("issue.storyPoints")}
              </label>
              <Input
                type="number"
                min={0}
                placeholder="—"
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
              />
            </div>
          </div>

          {/* Custom fields — render per the project's CustomFieldDef
              list. Previously these were never shown on create, so a
              project with a `required: true` text field could never
              create issues without a manual workaround. */}
          {customFields && customFields.length > 0 && (
            <div className="space-y-3 rounded-md border bg-muted/20 p-3">
              <div className="text-[12px] font-medium text-muted-foreground">
                {t("customFields.title")}
              </div>
              {customFields.map((def) => (
                <CustomFieldInput
                  key={def.id}
                  def={def}
                  value={customFieldValues[def.id]}
                  onChange={(v) => updateCustomField(def.id, v)}
                />
              ))}
            </div>
          )}

          {error && <p className="text-[12px] text-destructive">{error}</p>}

        <Button
          type="submit"
          className="w-full"
          disabled={isPending || !summary.trim()}
        >
          {isPending
            ? t("common.creating")
            : lockType && defaultType === "EPIC"
              ? t("issue.createEpic")
              : t("issue.createIssue")}
        </Button>
      </form>
    </>
  );
}

// ─── Trigger-button wrapper (backwards-compatible) ──────────────────────

export function CreateIssueDialog({
  projectId,
  sprints = [],
}: {
  projectId: string;
  sprints?: Sprint[];
}) {
  const { t } = useAppStore();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        {t("issue.createIssue")}
      </Button>
      <CreateIssueModal
        projectId={projectId}
        sprints={sprints}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

