"use client";

import { X, Trash2, UserPlus, Zap, ArrowUp } from "lucide-react";
import { PRIORITIES } from "@/lib/constants/issue-config";
import type { MessageKey } from "@/lib/config/i18n";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useBulkUpdateIssues, useBulkDeleteIssues } from "../hooks";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { Sprint, UserPreview } from "../types";

export function BulkActionBar({
  selectedIds,
  projectId,
  sprints,
  members,
  onClear,
}: {
  selectedIds: Set<string>;
  projectId: string;
  sprints: Sprint[];
  members: UserPreview[];
  onClear: () => void;
}) {
  const { t } = useAppStore();
  const { mutate: bulkUpdate, isPending: updating } = useBulkUpdateIssues(projectId);
  const { mutate: bulkDelete, isPending: deleting } = useBulkDeleteIssues(projectId);
  const count = selectedIds.size;

  if (count === 0) return null;

  const ids = Array.from(selectedIds);

  function handleMoveSprint(sprintId: string | null) {
    bulkUpdate({ issueIds: ids, sprintId }, { onSuccess: onClear });
  }

  function handleAssign(assigneeId: string | null) {
    bulkUpdate({ issueIds: ids, assigneeId }, { onSuccess: onClear });
  }

  function handlePriority(priority: string) {
    bulkUpdate({ issueIds: ids, priority }, { onSuccess: onClear });
  }

  function handleDelete() {
    if (!window.confirm(t("issue.bulkDeleteConfirm", { count: String(count) }))) return;
    bulkDelete(ids, { onSuccess: onClear });
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-xl border bg-popover px-4 py-2.5 shadow-2xl dark:shadow-none">
      {/* Count + clear */}
      <div className="flex items-center gap-2">
        <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
          {count}
        </span>
        <span className="text-[12px] font-medium">{t("common.selected") || "selected"}</span>
        <button onClick={onClear} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="h-5 w-px bg-border" />

      {/* Move to sprint */}
      <Select onValueChange={(v) => handleMoveSprint(v === "__backlog__" ? null : v as string)}>
        <SelectTrigger className="h-7 w-auto gap-1.5 text-[11px]">
          <Zap className="h-3 w-3" />
          {t("issue.sprint")}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__backlog__">{t("issue.backlogStatus")}</SelectItem>
          {sprints.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Assign */}
      <Select onValueChange={(v) => handleAssign(v === "__none__" ? null : v as string)}>
        <SelectTrigger className="h-7 w-auto gap-1.5 text-[11px]">
          <UserPlus className="h-3 w-3" />
          {t("issue.assignee")}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">{t("issue.unassigned")}</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>{m.name || m.email}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority */}
      <Select onValueChange={(v) => handlePriority(v as string)}>
        <SelectTrigger className="h-7 w-auto gap-1.5 text-[11px]">
          <ArrowUp className="h-3 w-3" />
          {t("issue.priority")}
        </SelectTrigger>
        <SelectContent>
          {PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>{t(`issue.priorities.${p}` as MessageKey)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="h-5 w-px bg-border" />

      {/* Delete */}
      <Button size="xs" variant="destructive" onClick={handleDelete} disabled={deleting}>
        {deleting ? <Spinner className="mr-1 h-3 w-3" /> : <Trash2 className="mr-1 h-3 w-3" />}
        {t("common.delete")}
      </Button>

      {updating && <Spinner className="h-4 w-4 text-primary" />}
    </div>
  );
}
