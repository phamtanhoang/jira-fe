import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /** Optional icon to render centered above the title. */
  icon?: LucideIcon;
  /** Optional illustration node (e.g. an SVG component). Takes precedence over icon. */
  illustration?: React.ReactNode;
  title?: string;
  description?: string;
  /** Extra content (e.g. a button) rendered below the description. */
  action?: React.ReactNode;
  /** Override container sizing (e.g. `"py-20"` for taller empty blocks). */
  className?: string;
  /**
   * Compact mode: tightens the vertical rhythm for inline empty panels
   * (e.g. a list inside a card).
   */
  compact?: boolean;
}

/**
 * Shared empty-state block. Use instead of redeclaring variations of
 * "flex items-center justify-center text-sm text-muted-foreground" across
 * features. Keeps spacing + colour palette consistent.
 */
export function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  action,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 text-center",
        compact ? "py-8" : "py-12",
        className,
      )}
    >
      {illustration && (
        <div className={cn("text-muted-foreground", compact ? "h-16 w-16" : "h-24 w-24")}>
          {illustration}
        </div>
      )}
      {!illustration && Icon && (
        <Icon
          className={cn(
            "text-muted-foreground/40",
            compact ? "h-6 w-6" : "h-8 w-8",
          )}
        />
      )}
      {title && (
        <p className="text-[13px] font-medium text-foreground">{title}</p>
      )}
      {description && (
        <p className="max-w-sm text-[12px] text-muted-foreground">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
