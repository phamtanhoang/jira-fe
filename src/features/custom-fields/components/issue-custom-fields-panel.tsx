"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useCustomFields } from "../hooks";
import type { CustomFieldDef, CustomFieldValue } from "../types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SELECT_NONE = "__none__";

type Props = {
  projectId: string;
  values: CustomFieldValue[];
  onChange: (fieldId: string, value: unknown) => void;
};

/**
 * Renders the custom-field section of the issue sidebar. Each field type
 * gets its appropriate input. Values are stored as a per-fieldId map
 * locally so re-render doesn't blow away in-progress edits while the
 * parent debounces save.
 */
export function IssueCustomFieldsPanel({ projectId, values, onChange }: Props) {
  const { t } = useAppStore();
  const { data: fields, isLoading } = useCustomFields(projectId);

  const valueMap = useMemo(() => {
    const m = new Map<string, CustomFieldValue>();
    for (const v of values) m.set(v.fieldId, v);
    return m;
  }, [values]);

  if (isLoading) {
    return (
      <div className="text-[11px] text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  if (!fields || fields.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {t("customFields.sidebarTitle")}
      </h4>
      {fields.map((def) => (
        <FieldEditor
          key={def.id}
          def={def}
          value={valueMap.get(def.id)}
          onChange={(v) => onChange(def.id, v)}
        />
      ))}
    </div>
  );
}

function FieldEditor({
  def,
  value,
  onChange,
}: {
  def: CustomFieldDef;
  value: CustomFieldValue | undefined;
  onChange: (v: unknown) => void;
}) {
  const { t } = useAppStore();
  // Local "drafting" state — keeps typing fluid without firing onChange on
  // every keystroke for non-Select inputs. Parent decides when to flush.
  const [draft, setDraft] = useState<string>(() => initialDraft(def, value));

  useEffect(() => {
    setDraft(initialDraft(def, value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.valueText, value?.valueNumber, value?.valueDate]);

  const label = (
    <div className="flex items-center gap-1">
      <span className="text-[11px] font-medium">{def.name}</span>
      {def.required && <span className="text-[10px] text-destructive">*</span>}
    </div>
  );

  switch (def.type) {
    case "TEXT":
      return (
        <div className="space-y-1">
          {label}
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => onChange(draft)}
            className="h-7 text-xs"
            placeholder={t("customFields.placeholderText")}
          />
        </div>
      );
    case "NUMBER":
      return (
        <div className="space-y-1">
          {label}
          <Input
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() =>
              onChange(draft === "" ? null : Number(draft))
            }
            className="h-7 text-xs"
          />
        </div>
      );
    case "DATE":
      return (
        <div className="space-y-1">
          {label}
          <Input
            type="date"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              onChange(e.target.value || null);
            }}
            className="h-7 text-xs"
          />
        </div>
      );
    case "SELECT": {
      const current = value?.valueSelect[0] ?? "";
      return (
        <div className="space-y-1">
          {label}
          <Select
            value={current || SELECT_NONE}
            onValueChange={(v) => onChange(v === SELECT_NONE ? null : v)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder={t("customFields.placeholderSelect")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_NONE}>—</SelectItem>
              {def.options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    case "MULTI_SELECT": {
      const current = new Set(value?.valueSelect ?? []);
      return (
        <div className="space-y-1">
          {label}
          <div className="flex flex-wrap gap-1">
            {def.options.map((opt) => {
              const checked = current.has(opt);
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => {
                    const next = new Set(current);
                    if (checked) next.delete(opt);
                    else next.add(opt);
                    onChange(Array.from(next));
                  }}
                  className={`rounded-md border px-2 py-1 text-[11px] transition ${
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
        </div>
      );
    }
    default:
      return null;
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
