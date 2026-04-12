"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Columns3, List, Plus, LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  useProject,
  useBoard,
  useIssues,
  useMoveIssue,
  useCreateIssue,
  useCreateSprint,
  useUpdateSprint,
  useDeleteSprint,
  useStartSprint,
  useCompleteSprint,
  useAddColumn,
  useUpdateColumn,
  useDeleteColumn,
} from "@/features/projects/hooks";
import { useWorkspace } from "@/features/workspaces/hooks";
import { BoardColumn } from "@/features/projects/components/board-column";
import { BacklogView } from "@/features/projects/components/backlog-view";
import { SummaryView } from "@/features/projects/components/summary-view";
import { BoardFilterBar, EMPTY_FILTERS, type BoardFilters } from "@/features/projects/components/board-filters";
import { CreateIssueDialog } from "@/features/projects/components/create-issue-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { BoardColumn as BoardColumnType, UserPreview } from "@/features/projects/types";

export default function BoardPage() {
  const { workspaceId, projectId } = useParams<{
    workspaceId: string;
    projectId: string;
  }>();
  const router = useRouter();
  const { t } = useAppStore();
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: project } = useProject(projectId);
  const { data: board, isLoading } = useBoard(projectId);
  const { data: allIssues } = useIssues(projectId);
  const { mutate: moveIssue } = useMoveIssue();
  const { mutate: createIssue } = useCreateIssue();
  const { mutate: createSprint, isPending: isCreatingSprint } = useCreateSprint(projectId);
  const { mutate: startSprint, isPending: isStartingSprint } = useStartSprint(projectId);
  const { mutate: completeSprint, isPending: isCompletingSprint } = useCompleteSprint(projectId);
  const { mutate: updateSprint } = useUpdateSprint(projectId);
  const { mutate: deleteSprint } = useDeleteSprint(projectId);
  const { mutate: addColumn } = useAddColumn(projectId);
  const { mutate: updateColumn } = useUpdateColumn(projectId);
  const { mutate: deleteColumn } = useDeleteColumn(projectId);

  const [filters, setFilters] = useState<BoardFilters>(EMPTY_FILTERS);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  const activeSprint = board?.sprints.find((s) => s.status === "ACTIVE");

  const members: UserPreview[] = useMemo(() => {
    if (!project?.members) return [];
    return project.members.map((m) => m.user);
  }, [project]);

  const filteredColumns = useMemo(() => {
    if (!board?.columns) return [];
    return board.columns.map((col) => ({
      ...col,
      issues: col.issues.filter((issue) => {
        // Board tab: only show issues from active sprint
        if (activeSprint && issue.sprintId && issue.sprintId !== activeSprint.id) return false;
        if (filters.search && !issue.summary.toLowerCase().includes(filters.search.toLowerCase()) && !issue.key.toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters.types.length > 0 && !filters.types.includes(issue.type)) return false;
        if (filters.priorities.length > 0 && !filters.priorities.includes(issue.priority)) return false;
        if (filters.assigneeIds.length > 0 && (!issue.assigneeId || !filters.assigneeIds.includes(issue.assigneeId))) return false;
        return true;
      }),
    })) as BoardColumnType[];
  }, [board?.columns, filters, activeSprint]);

  function handleMoveIssue(issueId: string, columnId: string) {
    moveIssue({ id: issueId, columnId, position: 0 });
  }

  function handleClickIssue(key: string) {
    router.push(ROUTES.ISSUE(key));
  }

  function handleQuickCreate(summary: string) {
    createIssue({ projectId, summary });
  }

  function handleAddColumn(e: React.FormEvent) {
    e.preventDefault();
    if (!newColumnName.trim() || !board) return;
    addColumn({ boardId: board.id, name: newColumnName.trim() });
    setNewColumnName("");
    setShowAddColumn(false);
  }

  const addColumnUI = showAddColumn ? (
    <form
      onSubmit={handleAddColumn}
      className="flex h-fit w-68 shrink-0 flex-col gap-2 rounded-lg bg-muted/40 p-3"
    >
      <Input
        placeholder={t("board.columnName")}
        value={newColumnName}
        onChange={(e) => setNewColumnName(e.target.value)}
        className="h-8 text-[12px]"
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="xs" type="submit" disabled={!newColumnName.trim()}>{t("common.add")}</Button>
        <Button size="xs" variant="ghost" type="button" onClick={() => setShowAddColumn(false)}>{t("common.cancel")}</Button>
      </div>
    </form>
  ) : (
    <button
      onClick={() => setShowAddColumn(true)}
      className="flex h-10 w-68 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-dashed text-[12px] text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted/40 hover:text-foreground"
    >
      <Plus className="h-3.5 w-3.5" />
      {t("board.addColumn")}
    </button>
  );

  const columnsView = (
    <>
      {filteredColumns.map((column) => (
        <BoardColumn
          key={column.id}
          column={column}
          onMoveIssue={handleMoveIssue}
          onClickIssue={handleClickIssue}
          onQuickCreate={handleQuickCreate}
          onDeleteColumn={(colId) =>
            board && deleteColumn({ boardId: board.id, columnId: colId })
          }
          onUpdateWipLimit={(colId, wipLimit) =>
            board && updateColumn({ boardId: board.id, columnId: colId, wipLimit })
          }
        />
      ))}
      {addColumnUI}
    </>
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div>
          <div className="mb-0.5 flex items-center gap-1 text-[12px] text-muted-foreground">
            <Link href={ROUTES.WORKSPACES} className="hover:text-foreground hover:underline">{t("nav.workspaces")}</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href={ROUTES.WORKSPACE(workspaceId)} className="hover:text-foreground hover:underline">{workspace?.name ?? "..."}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">{project?.key ?? "..."}</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold">{project?.name ?? "Board"}</h1>
            {activeSprint && (
              <Badge variant="secondary" className="gap-1 text-[10px] bg-blue-50 text-blue-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                {activeSprint.name}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CreateIssueDialog projectId={projectId} sprints={board?.sprints ?? []} />
          <Link href={ROUTES.PROJECT_SETTINGS(workspaceId, projectId)}>
            <Button variant="ghost" size="icon-xs" className="text-muted-foreground">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex gap-3 overflow-auto p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-68 shrink-0 rounded-lg" />
          ))}
        </div>
      ) : board?.type === "SCRUM" ? (
        <Tabs defaultValue="summary" className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b px-6">
            <TabsList variant="line">
              <TabsTrigger value="summary"><LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />{t("board.summary")}</TabsTrigger>
              <TabsTrigger value="backlog">
                <List className="mr-1.5 h-3.5 w-3.5" />{t("board.backlog")}
                {board.sprints.length > 0 && <Badge variant="secondary" className="ml-1.5 px-1.5 text-[10px]">{board.sprints.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="board">
                <Columns3 className="mr-1.5 h-3.5 w-3.5" />{t("board.board")}
                {activeSprint && <Badge variant="secondary" className="ml-1.5 px-1.5 text-[10px] bg-blue-50 text-blue-700">{activeSprint.name}</Badge>}
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="summary" className="flex-1 overflow-auto">
            <SummaryView board={board} allIssues={allIssues ?? []} members={project?.members ?? []} />
          </TabsContent>
          <TabsContent value="backlog" className="flex-1 overflow-auto">
            <BacklogView
              board={board}
              allIssues={allIssues ?? []}
              projectId={projectId}
              onCreateSprint={(boardId, name) => createSprint({ boardId, name })}
              onStartSprint={startSprint}
              onCompleteSprint={completeSprint}
              onUpdateSprint={(id, data) => updateSprint({ id, ...data })}
              onDeleteSprint={deleteSprint}
              onClickIssue={handleClickIssue}
              isCreatingSprint={isCreatingSprint}
              isStartingSprint={isStartingSprint}
              isCompletingSprint={isCompletingSprint}
            />
          </TabsContent>
          <TabsContent value="board" className="flex flex-1 flex-col overflow-hidden">
            {activeSprint ? (
              <>
                <div className="border-b px-5 py-2.5">
                  <BoardFilterBar filters={filters} onChange={setFilters} members={members} />
                </div>
                <div className="flex flex-1 gap-3 overflow-auto p-5">{columnsView}</div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
                <Columns3 className="h-10 w-10 opacity-30" />
                <p className="text-[13px] font-medium">{t("board.noActiveSprint")}</p>
                <p className="text-[12px]">{t("board.noActiveSprintDesc")}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b px-5 py-2.5">
            <BoardFilterBar filters={filters} onChange={setFilters} members={members} />
          </div>
          <div className="flex flex-1 gap-3 overflow-auto p-5">{columnsView}</div>
        </div>
      )}
    </div>
  );
}
