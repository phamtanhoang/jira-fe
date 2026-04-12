"use client";

import { useState } from "react";
import { Plus, ChevronDown, ChevronRight, Inbox } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SprintPanel } from "./sprint-panel";
import { IssueRow } from "./issue-row";
import type { Board, Issue } from "../types";

export function BacklogView({
  board,
  allIssues,
  projectId,
  onCreateSprint,
  onStartSprint,
  onCompleteSprint,
  onUpdateSprint,
  onDeleteSprint,
  onClickIssue,
  isCreatingSprint,
  isStartingSprint,
  isCompletingSprint,
}: {
  board: Board;
  allIssues: Issue[];
  projectId: string;
  onCreateSprint: (boardId: string, name: string) => void;
  onStartSprint: (id: string) => void;
  onCompleteSprint: (id: string) => void;
  onUpdateSprint?: (id: string, data: { name?: string; goal?: string | null; startDate?: string | null; endDate?: string | null }) => void;
  onDeleteSprint?: (id: string) => void;
  onClickIssue: (key: string) => void;
  isCreatingSprint: boolean;
  isStartingSprint: boolean;
  isCompletingSprint: boolean;
}) {
  const { t } = useAppStore();
  const [showNewSprint, setShowNewSprint] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");
  const [backlogExpanded, setBacklogExpanded] = useState(true);

  // Group issues by sprint
  const sprintIssues = new Map<string, Issue[]>();
  const backlogIssues: Issue[] = [];

  for (const issue of allIssues) {
    if (issue.sprintId) {
      const existing = sprintIssues.get(issue.sprintId) ?? [];
      existing.push(issue);
      sprintIssues.set(issue.sprintId, existing);
    } else {
      backlogIssues.push(issue);
    }
  }

  // Sort sprints: active first, then planning, then completed
  const sortedSprints = [...board.sprints].sort((a, b) => {
    const order = { ACTIVE: 0, PLANNING: 1, COMPLETED: 2, CLOSED: 3 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  function handleCreateSprint(e: React.FormEvent) {
    e.preventDefault();
    const name = newSprintName.trim() || `Sprint ${board.sprints.length + 1}`;
    onCreateSprint(board.id, name);
    setNewSprintName("");
    setShowNewSprint(false);
  }

  return (
    <div className="space-y-3 p-5">
      {/* Sprints */}
      {sortedSprints.map((sprint) => (
        <SprintPanel
          key={sprint.id}
          sprint={sprint}
          issues={sprintIssues.get(sprint.id) ?? []}
          onStartSprint={onStartSprint}
          onCompleteSprint={onCompleteSprint}
          onUpdateSprint={onUpdateSprint}
          onDeleteSprint={onDeleteSprint}
          onClickIssue={onClickIssue}
          isStarting={isStartingSprint}
          isCompleting={isCompletingSprint}
        />
      ))}

      {/* Create sprint */}
      {showNewSprint ? (
        <form
          onSubmit={handleCreateSprint}
          className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3"
        >
          <Input
            placeholder={`Sprint ${board.sprints.length + 1}`}
            value={newSprintName}
            onChange={(e) => setNewSprintName(e.target.value)}
            className="h-8 max-w-xs text-[13px]"
            autoFocus
          />
          <Button size="xs" type="submit" disabled={isCreatingSprint}>
            {isCreatingSprint ? t("common.creating") : t("common.create")}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            type="button"
            onClick={() => setShowNewSprint(false)}
          >
            {t("common.cancel")}
          </Button>
        </form>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="text-[12px] text-muted-foreground"
          onClick={() => setShowNewSprint(true)}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {t("sprint.createSprint")}
        </Button>
      )}

      {/* Backlog (unassigned issues) */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            onClick={() => setBacklogExpanded(!backlogExpanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {backlogExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          <Inbox className="h-4 w-4 text-muted-foreground" />

          <span className="text-[13px] font-semibold">{t("backlog.title")}</span>

          <Badge variant="secondary" className="text-[10px]">
            {backlogIssues.length}
          </Badge>
        </div>

        {backlogExpanded && (
          <div className="border-t">
            {backlogIssues.length === 0 ? (
              <div className="px-4 py-6 text-center text-[12px] text-muted-foreground">
                {t("backlog.empty")}
              </div>
            ) : (
              <div>
                {backlogIssues.map((issue) => (
                  <IssueRow
                    key={issue.id}
                    issue={issue}
                    onClick={() => onClickIssue(issue.key)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
