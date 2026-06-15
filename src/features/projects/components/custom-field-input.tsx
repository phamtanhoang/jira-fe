"use client";

import { X } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomFieldDef } from "@/features/custom-fields/types";

/**
 * Inline editor for a single project-defined custom field. Used by the
 * Create Issue modal — same control shape as the issue-detail panel,
 * just without the inline-edit chrome.
 */
export function CustomFieldInput({
  def,
  value,
  onChange,
}: {
  def: CustomFieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const { t } = useAppStore();

  const label = (
    <label className="mb-1 flex items-center gap-1.5 text-[12px] font-medium">
      <span>{def.name}</span>
      {def.required && (
        <span className="text-[10px] text-destructive" title={t("common.required")}>
          *
        </span>
      )}
    </label>
  );

  switch (def.type) {
    case "TEXT":
      return (
        <div>
          {label}
          <Input
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={def.name}
          />
        </div>
      );

    case "NUMBER":
      return (
        <div>
          {label}
          <Input
            type="number"
            value={typeof value === "number" ? String(value) : (value as string) ?? ""}
            onChange={(e) =>
              onChange(e.target.value === "" ? undefined : Number(e.target.value))
            }
            placeholder="0"
          />
        </div>
      );

    case "DATE":
      return (
        <div>
          {label}
          <Input
            type="date"
            value={typeof value === "string" ? value.slice(0, 10) : ""}
            onChange={(e) =>
              onChange(
                e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined,
              )
            }
          />
        </div>
      );

    case "SELECT": {
      const hasValue = typeof value === "string" && value.length > 0;
      return (
        <div>
          {label}
          <div className="flex items-center gap-1.5">
            <Select
              value={typeof value === "string" ? value : ""}
              onValueChange={(v) => onChange(v || undefined)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("common.select")} />
              </SelectTrigger>
              <SelectContent>
                {def.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasValue && !def.required && (
              <button
                type="button"
                onClick={() => onChange(undefined)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={t("common.clear")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      );
    }

    case "MULTI_SELECT": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div>
          {label}
          <div className="flex flex-wrap gap-1.5">
            {def.options.map((opt) => {
              const active = selected.includes(opt);
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() =>
                    onChange(
                      active
                        ? selected.filter((s) => s !== opt)
                        : [...selected, opt],
                    )
                  }
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
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
