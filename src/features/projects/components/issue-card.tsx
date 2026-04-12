"use client";

import { useState } from "react";
import { TYPE_CONFIG, PRIORITY_CONFIG, AVATAR_GRADIENT } from "@/lib/constants/issue-config";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Issue } from "../types";

export function IssueCard({
  issue,
  onClick,
}: {
  issue: Issue;
  onClick: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const typeConf = TYPE_CONFIG[issue.type] ?? TYPE_CONFIG.TASK;
  const TypeIcon = typeConf.icon;
  const prioConf = PRIORITY_CONFIG[issue.priority] ?? PRIORITY_CONFIG.MEDIUM;
  const PrioIcon = prioConf.icon;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("issueId", issue.id);
        e.dataTransfer.effectAllowed = "move";
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      onClick={onClick}
      className={`group cursor-grab rounded-md border bg-card p-2.5 shadow-sm transition-all duration-150
        ${dragging
          ? "rotate-2 scale-105 border-primary/40 opacity-60 shadow-lg"
          : "border-transparent hover:border-primary/30 hover:bg-accent/50 hover:shadow-md dark:hover:bg-accent/20"
        }
        active:cursor-grabbing active:shadow-sm`}
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
          <div className={`flex h-4 w-4 items-center justify-center rounded-sm ${typeConf.bg}`}>
            <TypeIcon className="h-2.5 w-2.5 text-white" />
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
              <AvatarFallback className={`${AVATAR_GRADIENT} text-[9px]`}>
                {getInitials(issue.assignee.name)}
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
