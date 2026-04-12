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
import type { Issue } from "../types";

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; bg: string; color: string }
> = {
  EPIC: { icon: Zap, bg: "bg-purple-600", color: "text-white" },
  STORY: { icon: BookOpen, bg: "bg-emerald-500", color: "text-white" },
  BUG: { icon: Bug, bg: "bg-red-500", color: "text-white" },
  TASK: { icon: CheckSquare, bg: "bg-blue-500", color: "text-white" },
  SUBTASK: { icon: Layers, bg: "bg-sky-400", color: "text-white" },
};

const PRIORITY_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string }
> = {
  HIGHEST: { icon: ChevronsUp, color: "text-red-600" },
  HIGH: { icon: ArrowUp, color: "text-red-500" },
  MEDIUM: { icon: Minus, color: "text-orange-400" },
  LOW: { icon: ArrowDown, color: "text-blue-500" },
  LOWEST: { icon: ChevronsDown, color: "text-blue-400" },
};

export function IssueCard({
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

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("issueId", issue.id);
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className="group cursor-pointer rounded-sm border border-transparent bg-card p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-all hover:border-primary/30 hover:bg-blue-50/40 hover:shadow-md active:shadow-sm"
    >
      <p className="mb-2.5 text-[13px] leading-[1.4] font-normal text-foreground">
        {issue.summary}
      </p>

      {/* Labels */}
      {issue.labels && issue.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {issue.labels.map((il) => (
            <span
              key={il.label.id}
              className="rounded-sm px-1.5 py-px text-[10px] font-medium"
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

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div
            className={`flex h-4 w-4 items-center justify-center rounded-sm ${typeConf.bg}`}
          >
            <TypeIcon className={`h-2.5 w-2.5 ${typeConf.color}`} />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">
            {issue.key}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {issue.storyPoints != null && (
            <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-semibold text-muted-foreground">
              {issue.storyPoints}
            </span>
          )}
          <PrioIcon className={`h-3.5 w-3.5 ${prioConf.color}`} />
          {issue.assignee ? (
            <Avatar className="h-5 w-5">
              <AvatarFallback className="bg-linear-to-br from-teal-400 to-cyan-500 text-[9px] font-bold text-white">
                {(issue.assignee.name ?? "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-5 w-5 rounded-full border border-dashed border-muted-foreground/30" />
          )}
        </div>
      </div>
    </div>
  );
}
