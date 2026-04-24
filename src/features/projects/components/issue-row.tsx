"use client";

import { memo } from "react";
import { TYPE_CONFIG, PRIORITY_CONFIG, STATUS_BADGE_COLORS } from "@/lib/constants/issue-config";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { TruncatedText } from "@/components/ui/truncated-text";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useIsIssuePending } from "../hooks";
import type { Issue } from "../types";

// Backlog renders 50+ rows. Memo keeps re-renders local to the changed row.
export const IssueRow = memo(function IssueRow({
  issue,
  onClick,
}: {
  issue: Issue;
  onClick: () => void;
}) {
  const isPending = useIsIssuePending(issue.id);
  const typeConf = TYPE_CONFIG[issue.type] ?? TYPE_CONFIG.TASK;
  const TypeIcon = typeConf.icon;
  const prioConf = PRIORITY_CONFIG[issue.priority] ?? PRIORITY_CONFIG.MEDIUM;
  const PrioIcon = prioConf.icon;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex cursor-pointer items-center gap-3 border-b px-4 py-2.5 transition-colors last:border-b-0 hover:bg-muted/50",
        isPending && "opacity-60",
      )}
    >
      {isPending && (
        <div className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2">
          <Spinner className="h-3.5 w-3.5 text-primary" />
        </div>
      )}
      {/* Type */}
      <div className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-sm ${typeConf.bg}`}>
        <TypeIcon className="h-3 w-3 text-white" />
      </div>

      {/* Key */}
      <span className="w-20 shrink-0 text-[12px] font-medium text-muted-foreground">
        {issue.key}
      </span>

      {/* Summary */}
      <TruncatedText
        text={issue.summary}
        className="flex-1 text-[13px]"
      />

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
          className={`shrink-0 px-1.5 text-[10px] ${STATUS_BADGE_COLORS[issue.boardColumn.category] ?? ""}`}
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
        <UserAvatar
          user={issue.assignee}
          className="h-5 w-5 shrink-0"
          fallbackClassName="text-[9px]"
        />
      ) : (
        <div className="h-5 w-5 shrink-0 rounded-full border border-dashed border-muted-foreground/30" />
      )}
    </div>
  );
});
