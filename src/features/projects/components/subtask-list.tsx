"use client";

import { useRouter } from "next/navigation";
import { Layers, Plus, CheckCircle2, Circle } from "lucide-react";
import { STATUS_BADGE_COLORS } from "@/lib/constants/issue-config";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useBoard, useMoveIssue, useCreateIssue } from "../hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { Issue } from "../types";

type SubtaskChild = NonNullable<Issue["children"]>[number];

export function SubtaskList({ issue }: { issue: Issue }) {
  const router = useRouter();
  const { t } = useAppStore();
  const { data: board } = useBoard(issue.projectId);
  const { mutate: moveIssue } = useMoveIssue();
  const { mutate: createIssue } = useCreateIssue();
  const [showForm, setShowForm] = useState(false);
  const [summary, setSummary] = useState("");

  const children = issue.children ?? [];
  const doneCount = children.filter((c) => c.boardColumn?.category === "DONE").length;
  const total = children.length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  // Find first TODO and DONE columns from board
  const todoColumn = board?.columns.find((c) => c.category === "TODO");
  const doneColumn = board?.columns.find((c) => c.category === "DONE");

  function handleToggle(child: SubtaskChild, e: React.MouseEvent) {
    e.stopPropagation();
    if (!todoColumn || !doneColumn) return;

    const isDone = child.boardColumn?.category === "DONE";
    const targetColumn = isDone ? todoColumn : doneColumn;
    moveIssue({ id: child.id, columnId: targetColumn.id, position: 0 });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim()) return;
    createIssue(
      { projectId: issue.projectId, summary: summary.trim(), type: "SUBTASK", parentId: issue.id },
      { onSuccess: () => { setSummary(""); setShowForm(false); } },
    );
  }

  if (issue.type === "SUBTASK") return null;

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Layers className="h-3.5 w-3.5" />
          {t("issue.subtasks")}
          {total > 0 && ` (${total})`}
        </h3>
        <Button size="xs" variant="ghost" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-3 w-3" />{t("issue.addSubtask")}
        </Button>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">
            {doneCount}/{total}
          </span>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-3 flex gap-2">
          <Input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder={t("issue.subtaskPlaceholder")}
            className="h-8 text-[12px]"
            autoFocus
          />
          <Button size="xs" type="submit" disabled={!summary.trim()}>{t("common.create")}</Button>
        </form>
      )}

      {/* Subtask list */}
      {total > 0 && (
        <div className="rounded-lg border">
          {children.map((child) => {
            const isDone = child.boardColumn?.category === "DONE";
            return (
              <div
                key={child.id}
                onClick={() => router.push(`/issues/${child.key}`)}
                className="group flex cursor-pointer items-center gap-2.5 border-b px-3 py-2 text-[12px] last:border-b-0 transition-colors duration-150 hover:bg-muted/50"
              >
                {/* Checkbox */}
                <button
                  onClick={(e) => handleToggle(child, e)}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-green-600"
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </button>

                {/* Type icon */}
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-sky-400">
                  <Layers className="h-2.5 w-2.5 text-white" />
                </div>

                {/* Key */}
                <span className="shrink-0 font-medium text-muted-foreground">{child.key}</span>

                {/* Summary */}
                <span className={`min-w-0 flex-1 truncate ${isDone ? "line-through text-muted-foreground/60" : ""}`}>
                  {child.summary}
                </span>

                {/* Status badge */}
                {child.boardColumn && (
                  <Badge variant="secondary" className={`shrink-0 text-[10px] ${STATUS_BADGE_COLORS[child.boardColumn.category] ?? ""}`}>
                    {child.boardColumn.name}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
