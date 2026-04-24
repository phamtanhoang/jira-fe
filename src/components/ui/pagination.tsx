"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
  /** How many pages to show on each end/center of the range. Defaults to 2. */
  siblings?: number;
  className?: string;
}

/**
 * Page-number pagination with ellipses at the edges:
 *   1 2 3 4 5 … 50 51 52 53 54 55 … 96 97 98 99 100
 *
 * Keeps the first/last `siblings + 1` pages, the `siblings * 2 + 1` pages
 * around the current page, and renders `…` for each missing stretch.
 */
export function Pagination({
  page,
  totalPages,
  onChange,
  siblings = 2,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPages(page, totalPages, siblings);

  return (
    <nav
      className={cn("flex items-center justify-center gap-1", className)}
      aria-label="Pagination"
    >
      <PagerButton
        aria-label="Previous"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </PagerButton>

      {pages.map((p, idx) =>
        p === "…" ? (
          <span
            // Ellipses can repeat; combine with index for a stable key.
            key={`ellipsis-${idx}`}
            className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground/50"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </span>
        ) : (
          <PagerButton
            key={p}
            active={p === page}
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </PagerButton>
        ),
      )}

      <PagerButton
        aria-label="Next"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </PagerButton>
    </nav>
  );
}

function PagerButton({
  active,
  disabled,
  onClick,
  children,
  ...aria
}: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
} & React.AriaAttributes) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-[12px] font-medium transition-colors",
        active
          ? "border-primary/60 bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-muted",
        disabled && "pointer-events-none opacity-40",
      )}
      {...aria}
    >
      {children}
    </button>
  );
}

/**
 * Compute the visible page slots. Keeps first and last `siblings + 1` pages,
 * a window of `siblings * 2 + 1` around the current page, and inserts "…"
 * for any gap wider than 1 page. Returns a mixed array of numbers and "…".
 */
function buildPages(
  page: number,
  totalPages: number,
  siblings: number,
): Array<number | "…"> {
  const edge = siblings + 1;
  const keep = new Set<number>();

  for (let i = 1; i <= Math.min(edge, totalPages); i++) keep.add(i);
  for (let i = Math.max(1, totalPages - edge + 1); i <= totalPages; i++)
    keep.add(i);
  for (
    let i = Math.max(1, page - siblings);
    i <= Math.min(totalPages, page + siblings);
    i++
  )
    keep.add(i);

  const sorted = [...keep].sort((a, b) => a - b);
  const out: Array<number | "…"> = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
    out.push(sorted[i]);
  }
  return out;
}
