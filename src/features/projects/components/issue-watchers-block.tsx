"use client";

import { useAppStore } from "@/lib/stores/use-app-store";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useWatchers } from "../hooks";

const VISIBLE_LIMIT = 6;

/**
 * Stacked avatars of users currently watching this issue. Hides itself when
 * nobody is watching to avoid an empty-looking section in the sidebar.
 *
 * Extracted from `issue-detail-sidebar.tsx`.
 */
export function IssueWatchersBlock({ issueId }: { issueId: string }) {
  const { t } = useAppStore();
  const { data: watchers } = useWatchers(issueId);
  const list = watchers ?? [];
  if (list.length === 0) return null;

  const visible = list.slice(0, VISIBLE_LIMIT);
  const overflow = list.length - visible.length;

  return (
    <div className="px-2 py-1">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">
          {t("issue.watchers")}
        </span>
        <span className="text-[10px] text-muted-foreground/70 tabular-nums">
          {list.length}
        </span>
      </div>
      <div className="flex -space-x-1.5">
        {visible.map((u) => (
          <UserAvatar
            key={u.id}
            user={u}
            className="h-6 w-6 ring-2 ring-background"
            fallbackClassName="text-[9px]"
          />
        ))}
        {overflow > 0 && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full border bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-background">
            +{overflow}
          </span>
        )}
      </div>
    </div>
  );
}
