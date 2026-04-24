"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatDateTime } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import type { MessageKey } from "@/lib/config/i18n";
import { useActivity } from "../hooks";

const ACTION_LABEL_KEYS: Record<string, MessageKey> = {
  CREATED: "activityFeed.created",
  UPDATED: "activityFeed.updated",
  COMMENTED: "activityFeed.commented",
  ASSIGNED: "activityFeed.assigned",
  TRANSITIONED: "activityFeed.transitioned",
  ATTACHED: "activityFeed.attached",
  LOGGED_WORK: "activityFeed.loggedWork",
};

/** Raw DB field → human-readable label shown in the activity feed. */
const FIELD_LABELS: Record<string, string> = {
  assigneeId: "assignee",
  reporterId: "reporter",
  sprintId: "sprint",
  parentId: "parent",
  epicId: "epic",
  boardColumnId: "status",
  storyPoints: "story points",
  dueDate: "due date",
  startDate: "start date",
};

function prettifyField(field: string | null): string {
  if (!field) return "";
  return FIELD_LABELS[field] ?? field;
}

export function ActivityFeed({ issueId }: { issueId: string }) {
  const { t } = useAppStore();
  const { data: activities, isLoading } = useActivity(issueId);

  if (isLoading)
    return (
      <div className="text-[12px] text-muted-foreground">
        {t("activityFeed.loading")}
      </div>
    );
  if (!activities?.length)
    return (
      <div className="text-[12px] text-muted-foreground">
        {t("activityFeed.noActivity")}
      </div>
    );

  return (
    <div className="space-y-3">
      {activities.map((a) => {
        // Prefer the resolved display value — BE resolves user/sprint/epic
        // references so the feed shows names, not UUIDs.
        const oldDisplay = a.oldValueDisplay ?? a.oldValue;
        const newDisplay = a.newValueDisplay ?? a.newValue;
        const fieldLabel = prettifyField(a.field);

        return (
          <div key={a.id} className="flex gap-2.5">
            <Avatar className="mt-0.5 h-6 w-6 shrink-0">
              <AvatarFallback className="text-[9px]">
                {getInitials(a.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-[12px]">
                <span className="font-semibold">{a.user.name}</span>{" "}
                <span className="text-muted-foreground">
                  {ACTION_LABEL_KEYS[a.action]
                    ? t(ACTION_LABEL_KEYS[a.action])
                    : a.action.toLowerCase()}
                </span>
                {fieldLabel && (
                  <span className="text-muted-foreground"> {fieldLabel}</span>
                )}
                {oldDisplay && newDisplay && (
                  <>
                    {" "}
                    <span className="line-through text-muted-foreground/60">
                      {oldDisplay}
                    </span>
                    {" → "}
                    <span className="font-medium">{newDisplay}</span>
                  </>
                )}
                {!oldDisplay && newDisplay && (
                  <span className="font-medium"> {newDisplay}</span>
                )}
                {oldDisplay && !newDisplay && (
                  <span className="text-muted-foreground">
                    {" "}
                    <span className="line-through">{oldDisplay}</span>
                    {" → "}
                    <span className="italic">{t("activityFeed.unset")}</span>
                  </span>
                )}
              </p>
              <span className="text-[10px] text-muted-foreground">
                {formatDateTime(a.createdAt)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
