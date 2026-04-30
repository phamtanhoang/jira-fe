"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import type {
  CreateRecurringRulePayload,
  IssuePriority,
  IssueType,
  RecurringFrequency,
  RecurringRule,
} from "../types";

const FREQUENCIES: RecurringFrequency[] = ["DAILY", "WEEKLY", "MONTHLY"];
const TYPES: IssueType[] = ["TASK", "STORY", "BUG", "EPIC", "SUBTASK"];
const PRIORITIES: IssuePriority[] = [
  "LOWEST",
  "LOW",
  "MEDIUM",
  "HIGH",
  "HIGHEST",
];

type FormState = {
  name: string;
  frequency: RecurringFrequency;
  hour: string; // string-typed input → coerce to number on submit
  enabled: boolean;
  summary: string;
  description: string;
  type: IssueType;
  priority: IssuePriority;
};

const EMPTY_FORM: FormState = {
  name: "",
  frequency: "WEEKLY",
  hour: "9",
  enabled: true,
  summary: "",
  description: "",
  type: "TASK",
  priority: "MEDIUM",
};

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  editing: RecurringRule | null;
  onSubmit: (payload: CreateRecurringRulePayload) => void;
  pending: boolean;
};

/**
 * Wrapper component — owns the Dialog open state. The form body is rendered
 * via `<RuleFormBody>` keyed on `editing?.id`, so the inner state resets
 * naturally on open/edit transitions instead of via a useEffect+setState
 * pattern (which trips `react-hooks/set-state-in-effect`).
 */
export function RecurringRuleDialog(props: DialogProps) {
  const { open, onOpenChange, editing } = props;
  const { t } = useAppStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? t("recurring.editTitle") : t("recurring.addTitle")}
          </DialogTitle>
          <DialogDescription>{t("recurring.dialogDesc")}</DialogDescription>
        </DialogHeader>
        {open && <RuleFormBody key={editing?.id ?? "new"} {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function RuleFormBody({
  onOpenChange,
  projectId,
  editing,
  onSubmit,
  pending,
}: DialogProps) {
  const { t } = useAppStore();
  const [form, setForm] = useState<FormState>(() =>
    editing
      ? {
          name: editing.name,
          frequency: editing.frequency,
          hour: String(editing.hour),
          enabled: editing.enabled,
          summary: editing.template.summary,
          description: editing.template.description ?? "",
          type: editing.template.type ?? "TASK",
          priority: editing.template.priority ?? "MEDIUM",
        }
      : EMPTY_FORM,
  );

  const hourNum = Number(form.hour);
  const hourValid = Number.isInteger(hourNum) && hourNum >= 0 && hourNum <= 23;
  const canSubmit =
    form.name.trim().length > 0 &&
    form.summary.trim().length > 0 &&
    hourValid;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      projectId,
      name: form.name.trim(),
      frequency: form.frequency,
      hour: hourNum,
      enabled: form.enabled,
      template: {
        summary: form.summary.trim(),
        description: form.description.trim() || undefined,
        type: form.type,
        priority: form.priority,
      },
    });
  }

  return (
    <>
      <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t("recurring.formName")}
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t("recurring.namePlaceholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t("recurring.formFrequency")}
              </label>
              <Select
                value={form.frequency}
                onValueChange={(v) =>
                  setForm({ ...form, frequency: v as RecurringFrequency })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {t(`recurring.freq.${f}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t("recurring.formHour")}
              </label>
              <Input
                type="number"
                min={0}
                max={23}
                value={form.hour}
                onChange={(e) => setForm({ ...form, hour: e.target.value })}
                aria-invalid={!hourValid && form.hour.length > 0}
              />
              <p className="text-[11px] text-muted-foreground">
                {t("recurring.hourHint")}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t("recurring.formSummary")}
            </label>
            <Input
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder={t("recurring.summaryPlaceholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t("recurring.formType")}
              </label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm({ ...form, type: v as IssueType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((tp) => (
                    <SelectItem key={tp} value={tp}>
                      {tp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t("recurring.formPriority")}
              </label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  setForm({ ...form, priority: v as IssuePriority })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t("recurring.formDescription")}
            </label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder={t("recurring.descPlaceholder")}
            />
          </div>

        <div className="flex items-center gap-2">
          <Toggle
            checked={form.enabled}
            onChange={() => setForm({ ...form, enabled: !form.enabled })}
          />
          <span className="text-sm">{t("recurring.formEnabled")}</span>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {t("common.cancel")}
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit || pending}>
          {t("common.save")}
        </Button>
      </DialogFooter>
    </>
  );
}
