"use client";

import * as React from "react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";

export type RangeUnit = "hours" | "days";

export interface RangePickerProps {
  value: number;
  onChange: (next: number) => void;
  presets: readonly number[];
  unit: RangeUnit;
  min?: number;
  max?: number;
  label?: string;
  className?: string;
  compact?: boolean;
}

const DEFAULT_MIN: Record<RangeUnit, number> = { hours: 1, days: 1 };
const DEFAULT_MAX: Record<RangeUnit, number> = { hours: 24 * 30, days: 365 };

export function RangePicker({
  value,
  onChange,
  presets,
  unit,
  min,
  max,
  label,
  className,
  compact,
}: RangePickerProps) {
  const { t } = useAppStore();
  const lo = min ?? DEFAULT_MIN[unit];
  const hi = max ?? DEFAULT_MAX[unit];

  const [draft, setDraft] = React.useState<string>(String(value));
  React.useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function clamp(raw: number) {
    if (!Number.isFinite(raw)) return value;
    return Math.max(lo, Math.min(hi, Math.round(raw)));
  }

  function commit(raw: string) {
    const parsed = parseInt(raw, 10);
    const next = clamp(parsed);
    onChange(next);
    setDraft(String(next));
  }

  const presetLabel = (n: number) => {
    if (unit === "hours") {
      if (n % 24 === 0) return t("common.range.daysN", { n: String(n / 24) });
      return t("common.range.hoursN", { n: String(n) });
    }
    return t("common.range.daysN", { n: String(n) });
  };

  const customLabel =
    unit === "hours" ? t("common.range.hoursShort") : t("common.range.daysShort");

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3",
        compact && "gap-1.5 p-2",
        className,
      )}
    >
      {label !== undefined && label !== "" && (
        <span className="mr-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      )}
      {presets.map((p) => (
        <Button
          key={p}
          size="sm"
          variant={value === p ? "default" : "outline"}
          onClick={() => onChange(p)}
        >
          {presetLabel(p)}
        </Button>
      ))}
      <span className="mx-1 h-5 w-px bg-border" />
      <span className="text-[12px] text-muted-foreground">
        {t("common.range.custom")}
      </span>
      <Input
        type="number"
        min={lo}
        max={hi}
        className="w-20"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      <span className="text-[12px] text-muted-foreground">{customLabel}</span>
    </div>
  );
}
