"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useCustomFields } from "../hooks";
import type { CustomFieldDef, CustomFieldValue } from "../types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

// Sentinel for the "clear" option in SELECT. Required fields hide this
// entry — they can never legitimately go back to empty without the user
// being shown an error.
const SELECT_NONE = "__none__";

type Props = {
  projectId: string;
  values: CustomFieldValue[];
  onChange: (fieldId: string, value: unknown) => void;
};

/**
 * Inline-editable per-issue custom-field panel.
 *
 * Each field renders as a single row: a fixed-width label on the left,
 * the current value on the right. Hovering the value reveals a pencil
 * icon; clicking it swaps the display for the appropriate edit control
 * (Input / Select / DatePicker / chip toggle). Saving happens on blur
 * (text/number/date) or per-click (single-select / multi-select), then
 * the row reverts to display mode.
 *
 * This mirrors the standard sidebar rows (Sprint / Assignee / Priority)
 * so custom fields don't look like a foreign tax-form drop-in.
 *
 * Required-field rule: if the field is `required`, the SELECT "—" entry
 * is hidden AND any attempt to commit an empty value pops an inline
 * error toast + reverts the draft. Optional fields can be cleared by
 * picking "—" or emptying the input.
 */
export function IssueCustomFieldsPanel({ projectId, values, onChange }: Props) {
  const { data: fields, isLoading } = useCustomFields(projectId);

  const valueMap = useMemo(() => {
    const m = new Map<string, CustomFieldValue>();
    for (const v of values) m.set(v.fieldId, v);
    return m;
  }, [values]);

  if (isLoading || !fields || fields.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {fields.map((def) => (
        <FieldRow
          key={def.id}
          def={def}
          value={valueMap.get(def.id)}
          onChange={(v) => onChange(def.id, v)}
        />
      ))}
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────

function FieldRow({
  def,
  value,
  onChange,
}: {
  def: CustomFieldDef;
  value: CustomFieldValue | undefined;
  onChange: (v: unknown) => void;
}) {
  const { t } = useAppStore();
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click. The select dropdown lives in a portal — we
  // exclude it from the "outside" check so picking an option doesn't
  // immediately collapse the row before the click registers.
  useEffect(() => {
    if (!editing) return;
    function onClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("[data-slot=select-content]")) return;
      if (ref.current && !ref.current.contains(target)) {
        setEditing(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [editing]);

  // The committed value can be cleared (TEXT/NUMBER → null) or set to a
  // valid type-specific shape. Required guard: clearing a required
  // field flips into an inline error + reverts to the previous value.
  function commit(next: unknown) {
    const isEmpty =
      next === null ||
      next === undefined ||
      next === "" ||
      (Array.isArray(next) && next.length === 0);
    if (isEmpty && def.required) {
      toast.error(t("issue.fieldRequired", { name: def.name }));
      return;
    }
    onChange(next);
    setEditing(false);
  }

  return (
    <div ref={ref} className="flex items-start gap-2">
      <span className="mt-1.5 flex w-24 shrink-0 items-center gap-1 text-[11px] font-medium text-muted-foreground">
        <span className="truncate">{def.name}</span>
        {def.required && (
          <span className="text-[10px] text-destructive" title={t("common.required")}>
            *
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        {editing ? (
          <FieldEditor
            def={def}
            value={value}
            onCommit={commit}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="group/field flex w-full items-center gap-1 rounded-md px-2 py-1 text-[12px] transition-colors duration-150 hover:bg-muted/60 dark:hover:bg-muted/30">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
            >
              <span className="min-w-0 flex-1">{renderDisplay(def, value)}</span>
              <Pencil className="h-3 w-3 shrink-0 text-muted-foreground/0 transition-colors group-hover/field:text-muted-foreground/50" />
            </button>
            {/* Quick-clear button — shown only when the field has a
                value AND the field is optional. Required fields can't
                be cleared directly (matches the toast-on-clear rule). */}
            {!def.required && hasValue(def, value) && (
              <button
                type="button"
                onClick={() => commit(null)}
                aria-label={t("common.clear")}
                title={t("common.clear")}
                className="rounded p-0.5 text-muted-foreground/0 transition-colors group-hover/field:text-muted-foreground/60 hover:bg-muted hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Display value (read-mode) ────────────────────────────────────────

function renderDisplay(
  def: CustomFieldDef,
  value: CustomFieldValue | undefined,
): React.ReactNode {
  const empty = <span className="text-muted-foreground/60">—</span>;
  if (!value) return empty;

  switch (def.type) {
    case "TEXT": {
      const v = value.valueText;
      return v && v.trim() !== "" ? (
        <span className="wrap-break-word">{v}</span>
      ) : (
        empty
      );
    }
    case "NUMBER": {
      const n = value.valueNumber;
      // 0 is a valid number — only null/undefined renders as "—".
      return n == null ? empty : <span>{n}</span>;
    }
    case "DATE": {
      const d = value.valueDate;
      return d ? <span>{formatDate(d)}</span> : empty;
    }
    case "SELECT": {
      const s = value.valueSelect?.[0];
      return s ? <span>{s}</span> : empty;
    }
    case "MULTI_SELECT": {
      const arr = value.valueSelect ?? [];
      if (arr.length === 0) return empty;
      return (
        <div className="flex flex-wrap gap-1">
          {arr.map((v) => (
            <span
              key={v}
              className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
            >
              {v}
            </span>
          ))}
        </div>
      );
    }
    default:
      // Unknown future field type — leak nothing to the user, but at
      // least don't render an empty row that hides a real value.
      return empty;
  }
}

// ─── Editor (write-mode) ──────────────────────────────────────────────

function FieldEditor({
  def,
  value,
  onCommit,
  onCancel,
}: {
  def: CustomFieldDef;
  value: CustomFieldValue | undefined;
  onCommit: (v: unknown) => void;
  onCancel: () => void;
}) {
  const { t } = useAppStore();
  const [draft, setDraft] = useState<string>(() => initialDraft(def, value));

  // Sync the draft if the parent's value changes (e.g. another tab via
  // realtime). Doesn't fire on close because `editing` toggles the
  // editor's mount lifecycle — every reopen starts fresh.
  useEffect(() => {
    setDraft(initialDraft(def, value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.valueText, value?.valueNumber, value?.valueDate]);

  switch (def.type) {
    case "TEXT":
      return (
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => onCommit(draft === "" ? null : draft)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCommit(draft === "" ? null : draft);
            }
            if (e.key === "Escape") onCancel();
          }}
          className="h-7 text-xs"
          placeholder={t("customFields.placeholderText")}
        />
      );

    case "NUMBER":
      return (
        <Input
          autoFocus
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => onCommit(draft === "" ? null : Number(draft))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCommit(draft === "" ? null : Number(draft));
            }
            if (e.key === "Escape") onCancel();
          }}
          className="h-7 text-xs"
          placeholder="0"
        />
      );

    case "DATE":
      return (
        <Input
          autoFocus
          type="date"
          value={draft}
          // Native date pickers don't always fire blur after the
          // selection closes the popup — commit on change instead so a
          // single tap-pick saves.
          onChange={(e) => {
            setDraft(e.target.value);
            onCommit(e.target.value === "" ? null : e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") onCancel();
          }}
          className="h-7 text-xs"
        />
      );

    case "SELECT": {
      const current = value?.valueSelect?.[0] ?? "";
      return (
        <Select
          // Render the popup as soon as we mount so the user doesn't
          // need to click twice (display → editor → trigger → popup).
          defaultOpen
          value={current || SELECT_NONE}
          onValueChange={(v) => {
            if (typeof v !== "string") return;
            onCommit(v === SELECT_NONE ? null : v);
          }}
        >
          <SelectTrigger className="h-7 w-full text-xs">
            {current || (
              <span className="text-muted-foreground">
                {t("customFields.placeholderSelect")}
              </span>
            )}
          </SelectTrigger>
          <SelectContent>
            {/* Required fields can't be cleared via the picker — hide
                the "—" row entirely so the only path to empty is the
                inline-error toast above. */}
            {!def.required && (
              <SelectItem value={SELECT_NONE}>
                <span className="text-muted-foreground">—</span>
              </SelectItem>
            )}
            {def.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    case "MULTI_SELECT": {
      // Live editing — every chip toggle commits immediately (matching
      // the create modal's behavior). Clear-all is handled by toggling
      // off the last selected chip; required-field guard kicks in.
      const current = new Set(value?.valueSelect ?? []);
      const toggle = (opt: string) => {
        const next = new Set(current);
        if (next.has(opt)) next.delete(opt);
        else next.add(opt);
        onCommit(Array.from(next));
      };
      return (
        <div className="flex flex-wrap gap-1 rounded-md border bg-background px-2 py-1.5">
          {def.options.map((opt) => {
            const checked = current.has(opt);
            return (
              <button
                type="button"
                key={opt}
                onClick={() => toggle(opt)}
                className={`rounded-md border px-2 py-0.5 text-[11px] transition ${
                  checked
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      );
    }

    default:
      return null;
  }
}

function hasValue(
  def: CustomFieldDef,
  value: CustomFieldValue | undefined,
): boolean {
  if (!value) return false;
  switch (def.type) {
    case "TEXT":
      return value.valueText != null && value.valueText.trim() !== "";
    case "NUMBER":
      return value.valueNumber != null;
    case "DATE":
      return value.valueDate != null;
    case "SELECT":
    case "MULTI_SELECT":
      return (value.valueSelect?.length ?? 0) > 0;
    default:
      return false;
  }
}

function initialDraft(
  def: CustomFieldDef,
  value: CustomFieldValue | undefined,
): string {
  if (!value) return "";
  switch (def.type) {
    case "TEXT":
      return value.valueText ?? "";
    case "NUMBER":
      return value.valueNumber == null ? "" : String(value.valueNumber);
    case "DATE":
      return value.valueDate
        ? new Date(value.valueDate).toISOString().slice(0, 10)
        : "";
    default:
      return "";
  }
}
