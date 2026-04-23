"use client";

import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "danger";

const ON_COLORS: Record<Variant, string> = {
  default: "bg-primary",
  success: "bg-emerald-500",
  danger: "bg-red-500",
};

export function Toggle({
  checked,
  onChange,
  disabled,
  variant = "success",
  ariaLabel,
  className,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  variant?: Variant;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
        checked
          ? ON_COLORS[variant]
          : "bg-muted-foreground/20 dark:bg-muted-foreground/30",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  );
}
