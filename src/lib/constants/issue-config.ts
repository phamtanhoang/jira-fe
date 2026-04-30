import {
  Bug,
  BookOpen,
  CheckSquare,
  Layers,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronsUp,
  ChevronsDown,
} from "lucide-react";

// ─── Issue Type ────────────────────────────────────────
// Colors map to design tokens in globals.css — `bg-issue-*` resolves
// via the `@theme inline` mapping. Dark-mode contrast handled there.

export const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; bg: string }
> = {
  EPIC: { icon: Zap, bg: "bg-issue-epic" },
  STORY: { icon: BookOpen, bg: "bg-issue-story" },
  BUG: { icon: Bug, bg: "bg-issue-bug" },
  TASK: { icon: CheckSquare, bg: "bg-issue-task" },
  SUBTASK: { icon: Layers, bg: "bg-issue-subtask" },
};

// ─── Issue Priority ────────────────────────────────────

export const PRIORITY_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string }
> = {
  HIGHEST: { icon: ChevronsUp, color: "text-priority-highest" },
  HIGH: { icon: ArrowUp, color: "text-priority-high" },
  MEDIUM: { icon: Minus, color: "text-priority-medium" },
  LOW: { icon: ArrowDown, color: "text-priority-low" },
  LOWEST: { icon: ChevronsDown, color: "text-priority-lowest" },
};

// ─── Status Category Colors ───────────────────────────

/** Dot indicator (board column headers, summary charts) */
export const STATUS_DOT_COLORS: Record<string, string> = {
  TODO: "bg-status-todo",
  IN_PROGRESS: "bg-status-progress",
  DONE: "bg-status-done",
};

/** Badge styling (issue row, status badges) */
export const STATUS_BADGE_COLORS: Record<string, string> = {
  TODO: "bg-status-todo/15 text-status-todo",
  IN_PROGRESS: "bg-status-progress/15 text-status-progress",
  DONE: "bg-status-done/15 text-status-done",
};

// ─── Enum Arrays (for filters, selects) ───────────────

export const ISSUE_TYPES = ["EPIC", "STORY", "BUG", "TASK", "SUBTASK"] as const;
export const PRIORITIES = ["HIGHEST", "HIGH", "MEDIUM", "LOW", "LOWEST"] as const;

// ─── Select placeholder ───────────────────────────────

/** Magic value for "unassigned" in Select components */
export const UNASSIGNED_VALUE = "__none__";

// ─── Avatar gradient ──────────────────────────────────

export const AVATAR_GRADIENT = "bg-linear-to-br from-teal-400 to-cyan-500 font-bold text-white";
