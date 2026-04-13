"use client";

import { useState, useMemo } from "react";
import { Zap, Plus, ChevronDown, ChevronRight, CheckCircle2, Circle, Clock } from "lucide-react";
import { STATUS_BADGE_COLORS } from "@/lib/constants/issue-config";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useIssues, useCreateIssue } from "../hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Issue } from "../types";

type EpicFilter = "all" | "open" | "done";

export function EpicView({
  projectId,
  onClickIssue,
}: {
  projectId: string;
  onClickIssue: (key: string) => void;
}) {
  const { t } = useAppStore();
  const { data: allIssues } = useIssues(projectId);
  const { mutate: createIssue, isPending } = useCreateIssue();
  const [filter, setFilter] = useState<EpicFilter>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [newEpicName, setNewEpicName] = useState("");

  const { epics, childrenByEpic } = useMemo(() => {
    if (!allIssues) return { epics: [], childrenByEpic: new Map<string, Issue[]>() };

    const epicList = allIssues.filter((i) => i.type === "EPIC");
    const map = new Map<string, Issue[]>();

    for (const issue of allIssues) {
      if (issue.epicId) {
        const existing = map.get(issue.epicId) ?? [];
        existing.push(issue);
        map.set(issue.epicId, existing);
      }
    }

    return { epics: epicList, childrenByEpic: map };
  }, [allIssues]);

  const filteredEpics = useMemo(() => {
    return epics.filter((epic) => {
      if (filter === "all") return true;
      const children = childrenByEpic.get(epic.id) ?? [];
      const doneCount = children.filter((c) => c.boardColumn?.category === "DONE").length;
      const allDone = children.length > 0 && doneCount === children.length;
      if (filter === "done") return allDone;
      return !allDone; // "open"
    });
  }, [epics, childrenByEpic, filter]);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newEpicName.trim()) return;
    createIssue(
      { projectId, summary: newEpicName.trim(), type: "EPIC" },
      { onSuccess: () => { setNewEpicName(""); setShowCreate(false); } },
    );
  }

  return (
    <div className="p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(["all", "open", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-[12px] font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {f === "all" ? "All" : f === "open" ? "Open" : "Done"}
              {f === "all" && ` (${epics.length})`}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {t("issue.createEpic")}
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="mb-4 flex gap-2">
          <Input
            value={newEpicName}
            onChange={(e) => setNewEpicName(e.target.value)}
            placeholder="Epic name..."
            className="h-9 text-[13px]"
            autoFocus
          />
          <Button size="sm" type="submit" disabled={isPending || !newEpicName.trim()}>
            {t("common.create")}
          </Button>
          <Button size="sm" variant="ghost" type="button" onClick={() => setShowCreate(false)}>
            {t("common.cancel")}
          </Button>
        </form>
      )}

      {/* Epic list */}
      {filteredEpics.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-[13px] text-muted-foreground">
          <Zap className="mx-auto mb-2 h-8 w-8 opacity-20" />
          No epics found
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEpics.map((epic) => (
            <EpicCard
              key={epic.id}
              epic={epic}
              children={childrenByEpic.get(epic.id) ?? []}
              onClickIssue={onClickIssue}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EpicCard({
  epic,
  children,
  onClickIssue,
}: {
  epic: Issue;
  children: Issue[];
  onClickIssue: (key: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const doneCount = children.filter((c) => c.boardColumn?.category === "DONE").length;
  const total = children.length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-purple-600">
          <Zap className="h-3 w-3 text-white" />
        </div>

        <button
          onClick={() => onClickIssue(epic.key)}
          className="text-[13px] font-semibold hover:text-primary hover:underline"
        >
          {epic.summary}
        </button>

        <span className="text-[11px] text-muted-foreground">{epic.key}</span>

        {/* Progress */}
        {total > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {doneCount}/{total}
            </span>
          </div>
        )}

        {total === 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground">No issues</span>
        )}
      </div>

      {/* Children */}
      {expanded && total > 0 && (
        <div className="border-t">
          {children.map((child) => {
            const isDone = child.boardColumn?.category === "DONE";
            return (
              <button
                key={child.id}
                onClick={() => onClickIssue(child.key)}
                className="flex w-full items-center gap-2.5 border-b px-4 py-2 text-left text-[12px] last:border-b-0 transition-colors hover:bg-muted/50"
              >
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                ) : child.boardColumn?.category === "IN_PROGRESS" ? (
                  <Clock className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                )}
                <span className="shrink-0 font-medium text-muted-foreground">{child.key}</span>
                <span className={`min-w-0 flex-1 truncate ${isDone ? "line-through text-muted-foreground/60" : ""}`}>
                  {child.summary}
                </span>
                {child.boardColumn && (
                  <Badge variant="secondary" className={`shrink-0 text-[10px] ${STATUS_BADGE_COLORS[child.boardColumn.category] ?? ""}`}>
                    {child.boardColumn.name}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
