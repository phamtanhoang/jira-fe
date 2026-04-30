"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import {
  CalendarDays,
  Columns3,
  GitBranch,
  LayoutDashboard,
  List,
  Zap,
} from "lucide-react";
import { pushRecent } from "@/lib/utils";
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
  useUpdateIssue,
  useAddColumn,
  useUpdateColumn,
  useDeleteColumn,
} from "@/features/projects/hooks";
import { useWorkspace } from "@/features/workspaces/hooks";
import { BoardColumn } from "@/features/projects/components/board-column";
import { BacklogView } from "@/features/projects/components/backlog-view";
import { SummaryView } from "@/features/projects/components/summary-view";
import {
  BoardFilterBar,
  EMPTY_FILTERS,
  matchesCustomFieldFilters,
  type BoardFilters,
} from "@/features/projects/components/board-filters";
import { IssuePreviewModal } from "@/features/projects/components/issue-preview-modal";
import { EpicView } from "@/features/projects/components/epic-view";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Heavy views (CalendarView ~360 LOC, RoadmapView ~590 LOC + recharts) lazy-
// loaded — they only render when the user clicks the corresponding tab.
// Splits ~30KB of JSX/SVG out of the initial board bundle.
const ViewSkeleton = () => (
  <div className="space-y-3 p-5">
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-72 w-full" />
  </div>
);
const CalendarView = dynamic(
  () =>
    import("@/features/projects/components/calendar-view").then((m) => ({
      default: m.CalendarView,
    })),
  { loading: ViewSkeleton, ssr: false },
);
const RoadmapView = dynamic(
  () =>
    import("@/features/projects/components/roadmap-view").then((m) => ({
      default: m.RoadmapView,
    })),
  { loading: ViewSkeleton, ssr: false },
);
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type {
  BoardColumn as BoardColumnType,
  UserPreview,
} from "@/features/projects/types";
import { AddColumnForm } from "./add-column-form";
import { BoardHeader } from "./board-header";

export function BoardContainer() {
  const { workspaceId, projectId } = useParams<{
    workspaceId: string;
    projectId: string;
  }>();
  const { t } = useAppStore();
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: project } = useProject(projectId);
  const { data: board, isLoading } = useBoard(projectId);
  const { data: allIssues } = useIssues(projectId);
  const { mutate: moveIssue } = useMoveIssue();
  const { mutate: createIssue } = useCreateIssue();
  const { mutate: createSprint, isPending: isCreatingSprint } =
    useCreateSprint(projectId);
  const { mutate: startSprint, isPending: isStartingSprint } =
    useStartSprint(projectId);
  const { mutate: completeSprint, isPending: isCompletingSprint } =
    useCompleteSprint(projectId);
  const { mutate: updateSprint } = useUpdateSprint(projectId);
  const { mutate: deleteSprint } = useDeleteSprint(projectId);
  const { mutate: updateIssue } = useUpdateIssue();
  const { mutate: addColumn } = useAddColumn(projectId);
  const { mutate: updateColumn } = useUpdateColumn(projectId);
  const { mutate: deleteColumn } = useDeleteColumn(projectId);

  const [filters, setFilters] = useState<BoardFilters>(EMPTY_FILTERS);
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  const activeSprint = board?.sprints.find((s) => s.status === "ACTIVE");

  // Track this project in the Cmd+K "Recent" list. Re-fires only when the
  // identity-bearing fields change (not on every project re-fetch). We
  // pre-bind primitives so the dep array is exhaustive without snapshotting
  // the whole project object.
  const recentProjectId = project?.id;
  const recentProjectName = project?.name;
  const recentProjectKey = project?.key;
  const recentProjectWsId = project?.workspaceId;
  useEffect(() => {
    if (!recentProjectId) return;
    pushRecent({
      type: "PROJECT",
      id: recentProjectId,
      name: recentProjectName ?? "",
      key: recentProjectKey ?? "",
      workspaceId: recentProjectWsId ?? "",
    });
  }, [
    recentProjectId,
    recentProjectName,
    recentProjectKey,
    recentProjectWsId,
  ]);

  const members: UserPreview[] = useMemo(() => {
    if (!project?.members) return [];
    return project.members.map((m) => m.user);
  }, [project]);

  const columns = board?.columns;
  const filteredColumns = useMemo(() => {
    if (!columns) return [];
    return columns.map((col) => ({
      ...col,
      issues: col.issues.filter((issue) => {
        // Board tab: only show issues from active sprint
        if (
          activeSprint &&
          issue.sprintId &&
          issue.sprintId !== activeSprint.id
        )
          return false;
        if (
          filters.search &&
          !issue.summary.toLowerCase().includes(filters.search.toLowerCase()) &&
          !issue.key.toLowerCase().includes(filters.search.toLowerCase())
        )
          return false;
        if (filters.types.length > 0 && !filters.types.includes(issue.type))
          return false;
        if (
          filters.priorities.length > 0 &&
          !filters.priorities.includes(issue.priority)
        )
          return false;
        if (
          filters.assigneeIds.length > 0 &&
          (!issue.assigneeId || !filters.assigneeIds.includes(issue.assigneeId))
        )
          return false;
        if (!matchesCustomFieldFilters(issue, filters.customFields))
          return false;
        return true;
      }),
    })) as BoardColumnType[];
  }, [columns, filters, activeSprint]);

  function handleMoveIssue(issueId: string, columnId: string) {
    // No-op if the target column is the same as the current one
    const current = board?.columns.find((col) =>
      col.issues.some((i) => i.id === issueId),
    );
    if (current?.id === columnId) return;
    moveIssue({ id: issueId, columnId, position: 0 });
  }

  function handleClickIssue(key: string) {
    setPreviewKey(key);
  }

  function handleQuickCreate(summary: string) {
    createIssue({ projectId, summary });
  }

  function handleAddColumn(name: string) {
    if (!board) return;
    addColumn({ boardId: board.id, name });
  }

  const columnsView = (
    <>
      {filteredColumns.map((column, idx) => (
        <BoardColumn
          key={column.id}
          column={column}
          prevColumnId={filteredColumns[idx - 1]?.id ?? null}
          nextColumnId={filteredColumns[idx + 1]?.id ?? null}
          onMoveIssue={handleMoveIssue}
          onClickIssue={handleClickIssue}
          onQuickCreate={handleQuickCreate}
          onDeleteColumn={(colId) =>
            board && deleteColumn({ boardId: board.id, columnId: colId })
          }
          onUpdateWipLimit={(colId, wipLimit) =>
            board &&
            updateColumn({ boardId: board.id, columnId: colId, wipLimit })
          }
        />
      ))}
      <AddColumnForm onSubmit={handleAddColumn} />
    </>
  );

  return (
    <div className="flex h-full flex-col">
      <BoardHeader
        workspaceId={workspaceId}
        projectId={projectId}
        workspaceName={workspace?.name}
        projectKey={project?.key}
        projectName={project?.name}
        activeSprint={activeSprint}
        sprints={board?.sprints ?? []}
      />

      {isLoading ? (
        <div className="flex gap-3 overflow-auto p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-68 shrink-0 rounded-lg" />
          ))}
        </div>
      ) : board?.type === "SCRUM" ? (
        <Tabs
          defaultValue="summary"
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="border-b px-6">
            <TabsList variant="line">
              <TabsTrigger value="summary">
                <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                {t("board.summary")}
              </TabsTrigger>
              <TabsTrigger value="epics">
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                {t("issue.epics")}
              </TabsTrigger>
              <TabsTrigger value="backlog">
                <List className="mr-1.5 h-3.5 w-3.5" />
                {t("board.backlog")}
                {board.sprints.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 px-1.5 text-[10px]"
                  >
                    {board.sprints.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="board">
                <Columns3 className="mr-1.5 h-3.5 w-3.5" />
                {t("board.board")}
                {activeSprint && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 px-1.5 text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  >
                    {activeSprint.name}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                {t("board.calendar")}
              </TabsTrigger>
              <TabsTrigger value="roadmap">
                <GitBranch className="mr-1.5 h-3.5 w-3.5" />
                {t("board.roadmap")}
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="summary" className="flex-1 overflow-auto">
            <SummaryView
              board={board}
              allIssues={allIssues ?? []}
              members={project?.members ?? []}
            />
          </TabsContent>
          <TabsContent value="epics" className="flex-1 overflow-auto">
            <EpicView projectId={projectId} onClickIssue={handleClickIssue} />
          </TabsContent>
          <TabsContent value="backlog" className="flex-1 overflow-auto">
            <BacklogView
              board={board}
              allIssues={allIssues ?? []}
              projectId={projectId}
              onCreateSprint={(boardId, name) =>
                createSprint({ boardId, name })
              }
              onStartSprint={startSprint}
              onCompleteSprint={completeSprint}
              onUpdateSprint={(id, data) => updateSprint({ id, ...data })}
              onDeleteSprint={deleteSprint}
              onUpdateIssue={(id, data) => updateIssue({ id, ...data })}
              onClickIssue={handleClickIssue}
              members={members}
              isCreatingSprint={isCreatingSprint}
              isStartingSprint={isStartingSprint}
              isCompletingSprint={isCompletingSprint}
            />
          </TabsContent>
          <TabsContent
            value="board"
            className="flex flex-1 flex-col overflow-hidden"
          >
            {activeSprint ? (
              <>
                <div className="border-b px-5 py-2.5">
                  <BoardFilterBar
                    filters={filters}
                    onChange={setFilters}
                    members={members}
                    projectId={projectId}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 overflow-auto p-3 sm:flex-row sm:p-5">
                  {columnsView}
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
                <Columns3 className="h-10 w-10 opacity-30" />
                <p className="text-[13px] font-medium">
                  {t("board.noActiveSprint")}
                </p>
                <p className="text-[12px]">{t("board.noActiveSprintDesc")}</p>
              </div>
            )}
          </TabsContent>
          <TabsContent
            value="calendar"
            className="flex flex-1 flex-col overflow-hidden"
          >
            <CalendarView
              issues={allIssues ?? []}
              onClickIssue={(issue) => handleClickIssue(issue.key)}
              onUpdateIssue={(id, data) => updateIssue({ id, ...data })}
            />
          </TabsContent>
          <TabsContent
            value="roadmap"
            className="flex flex-1 flex-col overflow-hidden"
          >
            {board && (
              <RoadmapView
                board={board}
                allIssues={allIssues ?? []}
                onClickIssue={(issue) => handleClickIssue(issue.key)}
                onUpdateIssue={(id, data) => updateIssue({ id, ...data })}
              />
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Tabs
          defaultValue="board"
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="border-b px-6">
            <TabsList variant="line">
              <TabsTrigger value="board">
                <Columns3 className="mr-1.5 h-3.5 w-3.5" />
                {t("board.board")}
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                {t("board.calendar")}
              </TabsTrigger>
              <TabsTrigger value="roadmap">
                <GitBranch className="mr-1.5 h-3.5 w-3.5" />
                {t("board.roadmap")}
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent
            value="board"
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="border-b px-5 py-2.5">
              <BoardFilterBar
                filters={filters}
                onChange={setFilters}
                members={members}
                projectId={projectId}
              />
            </div>
            <div className="flex flex-1 flex-col gap-3 overflow-auto p-3 sm:flex-row sm:p-5">
              {columnsView}
            </div>
          </TabsContent>
          <TabsContent
            value="calendar"
            className="flex flex-1 flex-col overflow-hidden"
          >
            <CalendarView
              issues={allIssues ?? []}
              onClickIssue={(issue) => handleClickIssue(issue.key)}
              onUpdateIssue={(id, data) => updateIssue({ id, ...data })}
            />
          </TabsContent>
          <TabsContent
            value="roadmap"
            className="flex flex-1 flex-col overflow-hidden"
          >
            {board && (
              <RoadmapView
                board={board}
                allIssues={allIssues ?? []}
                onClickIssue={(issue) => handleClickIssue(issue.key)}
                onUpdateIssue={(id, data) => updateIssue({ id, ...data })}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
      {previewKey && (
        <IssuePreviewModal
          issueKey={previewKey}
          onClose={() => setPreviewKey(null)}
        />
      )}
    </div>
  );
}
