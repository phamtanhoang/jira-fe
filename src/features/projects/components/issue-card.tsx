"use client";

import { memo, useState } from "react";
import { Star } from "lucide-react";
import { TYPE_CONFIG, PRIORITY_CONFIG } from "@/lib/constants/issue-config";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Spinner } from "@/components/ui/spinner";
import { useIsIssuePending, useToggleStar } from "../hooks";
import type { Issue } from "../types";

// Boards render 100+ cards. Memo avoids re-rendering all cards when one
// card's local state (drag) or a sibling's mutation changes. Props are
// already stable — `issue` is referentially stable from React Query cache,
// and consumers must pass a stable `onClick` (useCallback).
export const IssueCard = memo(function IssueCard({
  issue,
  onClick,
}: {
  issue: Issue;
  onClick: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const isPending = useIsIssuePending(issue.id);
  const { mutate: toggleStar } = useToggleStar();
  const typeConf = TYPE_CONFIG[issue.type] ?? TYPE_CONFIG.TASK;
  const TypeIcon = typeConf.icon;
  const prioConf = PRIORITY_CONFIG[issue.priority] ?? PRIORITY_CONFIG.MEDIUM;
  const PrioIcon = prioConf.icon;

  return (
    <div
      draggable={!isPending}
      onDragStart={(e) => {
        e.dataTransfer.setData("issueId", issue.id);
        e.dataTransfer.effectAllowed = "move";
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      onClick={onClick}
      className={`group relative cursor-grab rounded-md border bg-card p-2.5 shadow-sm transition-all duration-150
        ${dragging
          ? "rotate-2 scale-105 border-primary/40 opacity-60 shadow-lg"
          : "border-transparent hover:border-primary/30 hover:bg-accent/50 hover:shadow-md dark:hover:bg-accent/20"
        }
        ${isPending ? "pointer-events-none opacity-60" : ""}
        active:cursor-grabbing active:shadow-sm`}
    >
      {isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/40 backdrop-blur-[1px]">
          <Spinner className="h-4 w-4 text-primary" />
        </div>
      )}
      {/* Star toggle — visible when starred, fades-in on hover otherwise */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleStar({ id: issue.id, starred: !issue.starredByMe });
        }}
        onMouseDown={(e) => e.stopPropagation()}
        draggable={false}
        className={`absolute right-1.5 top-1.5 z-5 rounded p-0.5 transition-opacity hover:bg-muted ${
          issue.starredByMe ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        aria-label={issue.starredByMe ? "Unstar" : "Star"}
        aria-pressed={!!issue.starredByMe}
      >
        <Star
          className={`h-3.5 w-3.5 ${
            issue.starredByMe
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          }`}
        />
      </button>
      <p className="mb-2.5 pr-5 text-[13px] leading-[1.4] font-normal text-foreground">
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
            <UserAvatar
              user={issue.assignee}
              className="h-5 w-5"
              fallbackClassName="text-[9px]"
            />
          ) : (
            <div className="h-5 w-5 rounded-full border border-dashed border-muted-foreground/30" />
          )}
        </div>
      </div>
    </div>
  );
});
