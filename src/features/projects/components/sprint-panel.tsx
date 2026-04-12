"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle2,
  Zap,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IssueRow } from "./issue-row";
import type { MessageKey } from "@/lib/config/i18n";
import type { Sprint, Issue } from "../types";

const STATUS_CONFIG: Record<string, { labelKey: MessageKey; color: string }> = {
  PLANNING: { labelKey: "sprint.planning", color: "bg-gray-100 text-gray-600" },
  ACTIVE: { labelKey: "sprint.active", color: "bg-blue-100 text-blue-700" },
  COMPLETED: { labelKey: "sprint.completed", color: "bg-green-100 text-green-700" },
  CLOSED: { labelKey: "sprint.closed", color: "bg-muted text-muted-foreground" },
};

export function SprintPanel({
  sprint,
  issues,
  onStartSprint,
  onCompleteSprint,
  onUpdateSprint,
  onDeleteSprint,
  onClickIssue,
  isStarting,
  isCompleting,
  renderIssueList,
}: {
  sprint: Sprint;
  issues: Issue[];
  onStartSprint: (id: string) => void;
  onCompleteSprint: (id: string) => void;
  onUpdateSprint?: (id: string, data: { name?: string; goal?: string | null; startDate?: string | null; endDate?: string | null }) => void;
  onDeleteSprint?: (id: string) => void;
  onClickIssue: (key: string) => void;
  isStarting: boolean;
  isCompleting: boolean;
  renderIssueList?: (issues: Issue[]) => React.ReactNode;
}) {
  const { t } = useAppStore();
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(sprint.name);
  const [editGoal, setEditGoal] = useState(sprint.goal ?? "");
  const [editStartDate, setEditStartDate] = useState(sprint.startDate?.slice(0, 10) ?? "");
  const [editEndDate, setEditEndDate] = useState(sprint.endDate?.slice(0, 10) ?? "");

  const statusConf = STATUS_CONFIG[sprint.status] ?? STATUS_CONFIG.PLANNING!;

  const doneCount = issues.filter(
    (i) => i.boardColumn?.category === "DONE",
  ).length;
  const totalPoints = issues.reduce((s, i) => s + (i.storyPoints ?? 0), 0);

  function handleSaveEdit() {
    if (!onUpdateSprint || !editName.trim()) return;
    onUpdateSprint(sprint.id, {
      name: editName.trim(),
      goal: editGoal.trim() || null,
      startDate: editStartDate || null,
      endDate: editEndDate || null,
    });
    setEditing(false);
  }

  function handleDelete() {
    if (!onDeleteSprint) return;
    if (window.confirm(t("sprint.deleteSprintConfirm"))) {
      onDeleteSprint(sprint.id);
    }
  }

  function startEditing() {
    setEditName(sprint.name);
    setEditGoal(sprint.goal ?? "");
    setEditStartDate(sprint.startDate?.slice(0, 10) ?? "");
    setEditEndDate(sprint.endDate?.slice(0, 10) ?? "");
    setEditing(true);
  }

  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <Zap className="h-4 w-4 text-primary" />

        <span className="text-[13px] font-semibold">{sprint.name}</span>

        <Badge variant="secondary" className={`text-[10px] ${statusConf.color}`}>
          {t(statusConf.labelKey)}
        </Badge>

        <span className="text-[11px] text-muted-foreground">
          ({issues.length} issue{issues.length !== 1 ? "s" : ""})
        </span>

        <div className="ml-auto flex items-center gap-2">
          {/* Progress */}
          {issues.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${(doneCount / issues.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {doneCount}/{issues.length}
              </span>
            </div>
          )}

          {totalPoints > 0 && (
            <Badge variant="outline" className="text-[10px]">
              {totalPoints} {t("sprint.pts")}
            </Badge>
          )}

          {/* Sprint dates */}
          {sprint.startDate && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(sprint.startDate).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
              {sprint.endDate &&
                ` — ${new Date(sprint.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
            </span>
          )}

          {/* Actions */}
          {sprint.status === "PLANNING" && (
            <Button
              size="xs"
              onClick={() => onStartSprint(sprint.id)}
              disabled={isStarting || issues.length === 0}
            >
              <Play className="mr-1 h-3 w-3" />
              {t("sprint.startSprint")}
            </Button>
          )}

          {sprint.status === "ACTIVE" && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => onCompleteSprint(sprint.id)}
              disabled={isCompleting}
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {t("sprint.completeSprint")}
            </Button>
          )}

          {/* More menu */}
          {(onUpdateSprint || onDeleteSprint) && (sprint.status === "PLANNING" || sprint.status === "ACTIVE") && (
            <DropdownMenu>
              <Button
                render={<DropdownMenuTrigger />}
                variant="ghost"
                size="icon-xs"
                className="h-6 w-6 text-muted-foreground"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
              <DropdownMenuContent align="end">
                {onUpdateSprint && (
                  <DropdownMenuItem onClick={startEditing}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    {t("sprint.editSprint")}
                  </DropdownMenuItem>
                )}
                {onDeleteSprint && sprint.status === "PLANNING" && (
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    {t("sprint.deleteSprint")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Edit form */}
      {editing && expanded && (
        <div className="space-y-3 border-t px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{t("sprint.sprintName")}</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 text-[12px]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{t("sprint.sprintGoal")}</label>
              <Input
                value={editGoal}
                onChange={(e) => setEditGoal(e.target.value)}
                placeholder={t("common.optional")}
                className="h-8 text-[12px]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{t("sprint.startDate")}</label>
              <Input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="h-8 text-[12px]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{t("sprint.endDate")}</label>
              <Input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                className="h-8 text-[12px]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="xs" onClick={handleSaveEdit} disabled={!editName.trim()}>{t("common.save")}</Button>
            <Button size="xs" variant="ghost" onClick={() => setEditing(false)}>
              <X className="mr-1 h-3 w-3" />{t("common.cancel")}
            </Button>
          </div>
        </div>
      )}

      {/* Goal */}
      {sprint.goal && expanded && !editing && (
        <div className="border-t px-4 py-2">
          <p className="text-[12px] italic text-muted-foreground">
            {t("sprint.goal", { goal: sprint.goal })}
          </p>
        </div>
      )}

      {/* Issues */}
      {expanded && (
        renderIssueList ? (
          renderIssueList(issues)
        ) : (
          <div className="border-t">
            {issues.length === 0 ? (
              <div className="px-4 py-6 text-center text-[12px] text-muted-foreground">
                {t("sprint.emptyHint")}
              </div>
            ) : (
              <div>
                {issues.map((issue) => (
                  <IssueRow
                    key={issue.id}
                    issue={issue}
                    onClick={() => onClickIssue(issue.key)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
