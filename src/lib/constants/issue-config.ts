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

export const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; bg: string }
> = {
  EPIC: { icon: Zap, bg: "bg-purple-600" },
  STORY: { icon: BookOpen, bg: "bg-emerald-500" },
  BUG: { icon: Bug, bg: "bg-red-500" },
  TASK: { icon: CheckSquare, bg: "bg-blue-500" },
  SUBTASK: { icon: Layers, bg: "bg-sky-400" },
};

// ─── Issue Priority ────────────────────────────────────

export const PRIORITY_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string }
> = {
  HIGHEST: { icon: ChevronsUp, color: "text-red-600" },
  HIGH: { icon: ArrowUp, color: "text-red-500" },
  MEDIUM: { icon: Minus, color: "text-orange-400" },
  LOW: { icon: ArrowDown, color: "text-blue-500" },
  LOWEST: { icon: ChevronsDown, color: "text-blue-400" },
};

// ─── Status Category Colors ───────────────────────────

/** Dot indicator (board column headers, summary charts) */
export const STATUS_DOT_COLORS: Record<string, string> = {
  TODO: "bg-gray-400",
  IN_PROGRESS: "bg-blue-500",
  DONE: "bg-green-500",
};

/** Badge styling (issue row, status badges) */
export const STATUS_BADGE_COLORS: Record<string, string> = {
  TODO: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
};

// ─── Enum Arrays (for filters, selects) ───────────────

export const ISSUE_TYPES = ["EPIC", "STORY", "BUG", "TASK", "SUBTASK"] as const;
export const PRIORITIES = ["HIGHEST", "HIGH", "MEDIUM", "LOW", "LOWEST"] as const;

// ─── Select placeholder ───────────────────────────────

/** Magic value for "unassigned" in Select components */
export const UNASSIGNED_VALUE = "__none__";

// ─── Avatar gradient ──────────────────────────────────

export const AVATAR_GRADIENT = "bg-linear-to-br from-teal-400 to-cyan-500 font-bold text-white";
