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
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useCreateIssue, useIssues } from "../hooks";
import type {
  CreateIssuePayload,
  Issue,
  Sprint,
} from "../types";
import { CustomFieldInput } from "./custom-field-input";

// Types that may parent a SUBTASK. EPIC is intentionally excluded —
// epics get child issues via `epicId`, not `parentId`. SUBTASK can't
// parent another SUBTASK (no two-level nesting).
const PARENTABLE_TYPES: Issue["type"][] = ["STORY", "BUG", "TASK"];

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
  /** Pre-selected parent issue (for SUBTASK creation under a task). The
   *  parentId is sent on the create payload and the type is locked to
   *  SUBTASK when this is supplied via the subtask-list trigger. */
  defaultParentId?: string;
  /** Pre-fill + optionally lock the Type. Used by Epic-only flow + by
   *  the subtask-list "+ Add subtask" trigger (lockType + SUBTASK). */
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
      <DialogContent className="sm:max-w-lg">
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
  defaultParentId,
  defaultType,
  lockType,
  onCreated,
}: CreateIssueModalProps) {
  const { t } = useAppStore();

  // Type options for the regular (un-locked) flow. EPIC and SUBTASK are
  // intentionally absent — both are creation flows that NEED a parent
  // context:
  //   - EPIC: created from the Epics tab via its own trigger
  //   - SUBTASK: created from a parent issue's "+ Add subtask" button
  //     (which opens this modal in lock-mode with defaultParentId set)
  // Surfacing SUBTASK in the global dropdown invited an orphan-subtask
  // workflow where the user had to manually pick a parent — a step
  // that the proper trigger pre-binds for free, and that nothing else
  // in the UI prepared them for.
  //
  // Locked-type flows collapse the option list to just `defaultType`
  // so the (hidden) dropdown doesn't accidentally surface anything else.
  const TYPE_OPTIONS = useMemo<Issue["type"][]>(() => {
    if (lockType && defaultType) return [defaultType];
    return ["STORY", "BUG", "TASK"];
  }, [lockType, defaultType]);

  const [templateId, setTemplateId] = useState<string>("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<Issue["type"]>(
    defaultType ?? TYPE_OPTIONS[0] ?? "TASK",
  );
  const [priority, setPriority] = useState<Issue["priority"]>("MEDIUM");
  const [sprintId, setSprintId] = useState<string>(defaultSprintId ?? "");
  // User-picked parent (only matters when type === SUBTASK AND the
  // caller didn't pre-bind via defaultParentId). When defaultParentId is
  // supplied — e.g. opened from "+ Add subtask" on an issue detail page
  // — we skip the picker entirely.
  const [parentIdDraft, setParentIdDraft] = useState<string>("");
  const [storyPoints, setStoryPoints] = useState("");
  const [customFieldValues, setCustomFieldValues] = useState<
    Record<string, unknown>
  >({});
  const [error, setError] = useState<string | null>(null);

  const { mutate: create, isPending } = useCreateIssue();
  const { data: templates } = useIssueTemplates(projectId);
  const { data: customFields } = useCustomFields(projectId);
  // Parent candidates — fetched only when the user might need to pick
  // one (SUBTASK + no pre-bound parent). Skipping the network call in
  // the common cases keeps the modal mount fast.
  const needsParentPicker = type === "SUBTASK" && !defaultParentId;
  // `useIssues` is gated on its `enabled: !!projectId` flag. We pass an
  // empty string when the picker isn't needed so the query stays idle.
  const { data: allIssues } = useIssues(needsParentPicker ? projectId : "");
  const parentCandidates = useMemo(() => {
    if (!allIssues) return [];
    return allIssues
      .filter((i) => PARENTABLE_TYPES.includes(i.type))
      .slice(0, 200); // safety cap — selects with thousands of items are unusable anyway
  }, [allIssues]);

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

    // Resolve the parent: caller-supplied wins (subtask-list trigger),
    // otherwise fall back to the in-form picker. SUBTASK without
    // EITHER is rejected here so the BE doesn't have to handle a
    // dangling subtask (and the user gets a clearer error).
    const effectiveParentId = defaultParentId || parentIdDraft || undefined;
    if (type === "SUBTASK" && !effectiveParentId) {
      setError(t("issue.subtaskNeedsParent"));
      return;
    }

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
      parentId: effectiveParentId,
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
            : lockType && defaultType === "SUBTASK"
              ? t("issue.addSubtask")
              : t("issue.createIssue")}
        </DialogTitle>
      </DialogHeader>
      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <DialogBody className="space-y-4 py-2">
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

          {/* Parent picker — only shown when the user manually picked
              SUBTASK as the type AND there's no `defaultParentId` from
              the trigger (subtask-list trigger pre-binds and hides this).
              Required: SUBTASK without a parent is rejected on submit. */}
          {needsParentPicker && (
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">
                {t("issue.parent")}
                <span className="ml-1 text-[10px] text-destructive">*</span>
              </label>
              <Select
                value={parentIdDraft}
                onValueChange={(v) => typeof v === "string" && setParentIdDraft(v)}
              >
                <SelectTrigger className="w-full">
                  {parentIdDraft
                    ? (() => {
                        const p = parentCandidates.find((i) => i.id === parentIdDraft);
                        return p ? `${p.key} — ${p.summary}` : parentIdDraft;
                      })()
                    : (
                      <span className="text-muted-foreground">
                        {t("issue.pickParent")}
                      </span>
                    )}
                </SelectTrigger>
                <SelectContent>
                  {parentCandidates.length === 0 ? (
                    <div className="px-2 py-1.5 text-[12px] text-muted-foreground">
                      {t("issue.noParentCandidates")}
                    </div>
                  ) : (
                    parentCandidates.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {p.key}
                        </span>
                        <span className="ml-2">{p.summary}</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

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
                className="w-full"
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
        </DialogBody>

        <DialogFooter>
          <Button
            type="submit"
            disabled={isPending || !summary.trim()}
          >
            {isPending
              ? t("common.creating")
              : lockType && defaultType === "EPIC"
                ? t("issue.createEpic")
                : lockType && defaultType === "SUBTASK"
                  ? t("issue.addSubtask")
                  : t("issue.createIssue")}
          </Button>
        </DialogFooter>
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

