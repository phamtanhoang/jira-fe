"use client";

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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Issue } from "../types";

const TYPE_CONFIG: Record<string, { icon: React.ElementType; bg: string }> = {
  EPIC: { icon: Zap, bg: "bg-purple-600" },
  STORY: { icon: BookOpen, bg: "bg-emerald-500" },
  BUG: { icon: Bug, bg: "bg-red-500" },
  TASK: { icon: CheckSquare, bg: "bg-blue-500" },
  SUBTASK: { icon: Layers, bg: "bg-sky-400" },
};

const PRIORITY_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  HIGHEST: { icon: ChevronsUp, color: "text-red-600" },
  HIGH: { icon: ArrowUp, color: "text-red-500" },
  MEDIUM: { icon: Minus, color: "text-orange-400" },
  LOW: { icon: ArrowDown, color: "text-blue-500" },
  LOWEST: { icon: ChevronsDown, color: "text-blue-400" },
};

const STATUS_COLORS: Record<string, string> = {
  TODO: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
};

export function IssueRow({
  issue,
  onClick,
}: {
  issue: Issue;
  onClick: () => void;
}) {
  const typeConf = TYPE_CONFIG[issue.type] ?? TYPE_CONFIG.TASK;
  const TypeIcon = typeConf.icon;
  const prioConf = PRIORITY_CONFIG[issue.priority] ?? PRIORITY_CONFIG.MEDIUM;
  const PrioIcon = prioConf.icon;

  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-center gap-3 border-b px-4 py-2.5 transition-colors last:border-b-0 hover:bg-muted/50"
    >
      {/* Type */}
      <div className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-sm ${typeConf.bg}`}>
        <TypeIcon className="h-3 w-3 text-white" />
      </div>

      {/* Key */}
      <span className="w-20 shrink-0 text-[12px] font-medium text-muted-foreground">
        {issue.key}
      </span>

      {/* Summary */}
      <span className="min-w-0 flex-1 truncate text-[13px]">
        {issue.summary}
      </span>

      {/* Labels */}
      {issue.labels && issue.labels.length > 0 && (
        <div className="flex gap-1">
          {issue.labels.slice(0, 2).map((il) => (
            <span
              key={il.label.id}
              className="rounded px-1.5 py-px text-[9px] font-medium"
              style={{
                backgroundColor: il.label.color + "20",
                color: il.label.color,
              }}
            >
              {il.label.name}
            </span>
          ))}
        </div>
      )}

      {/* Status */}
      {issue.boardColumn && (
        <Badge
          variant="secondary"
          className={`shrink-0 px-1.5 text-[10px] ${STATUS_COLORS[issue.boardColumn.category] ?? ""}`}
        >
          {issue.boardColumn.name}
        </Badge>
      )}

      {/* Story points */}
      {issue.storyPoints != null && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
          {issue.storyPoints}
        </span>
      )}

      {/* Priority */}
      <PrioIcon className={`h-3.5 w-3.5 shrink-0 ${prioConf.color}`} />

      {/* Assignee */}
      {issue.assignee ? (
        <Avatar className="h-5 w-5 shrink-0">
          <AvatarFallback className="bg-linear-to-br from-teal-400 to-cyan-500 text-[9px] font-bold text-white">
            {(issue.assignee.name ?? "?").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="h-5 w-5 shrink-0 rounded-full border border-dashed border-muted-foreground/30" />
      )}
    </div>
  );
}
