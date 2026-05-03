"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Plus, ChevronDown, ChevronRight, Inbox, Square, CheckSquare2, Download } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/lib/stores/use-app-store";
import { ENDPOINTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SprintPanel } from "./sprint-panel";
import { BulkActionBar } from "./bulk-action-bar";
import { IssueRow } from "./issue-row";
import type { Board, Issue, UserPreview } from "../types";

const BACKLOG_ID = "__backlog__";

// ─── Draggable Issue Row ──────────────────────────────

function DraggableIssueRow({
  issue,
  onClick,
  selected,
  onToggleSelect,
}: {
  issue: Issue;
  onClick: () => void;
  selected?: boolean;
  onToggleSelect?: (id: string, shiftKey: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: issue.id,
    data: { issue },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`group/row flex items-center touch-none select-none cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-30" : ""
      } ${selected ? "bg-primary/5" : ""}`}
    >
      {onToggleSelect && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(issue.id, e.shiftKey); }}
          className={`shrink-0 px-1 py-2 transition-opacity ${selected ? "opacity-100" : "opacity-0 group-hover/row:opacity-100"}`}
        >
          {selected ? (
            <CheckSquare2 className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Square className="h-3.5 w-3.5 text-muted-foreground/40" />
          )}
        </button>
      )}
      <div className="min-w-0 flex-1">
        <IssueRow issue={issue} onClick={onClick} />
      </div>
    </div>
  );
}

// ─── Drag Overlay (ghost while dragging) ──────────────

function DragOverlayContent({ issue }: { issue: Issue }) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 shadow-lg">
      <span className="text-[12px] font-medium text-muted-foreground">{issue.key}</span>
      <span className="truncate text-[12px]">{issue.summary}</span>
    </div>
  );
}

// ─── Droppable Container ──────────────────────────────

function DroppableZone({
  id,
  children,
  isEmpty,
  emptyText,
  dropHereText,
}: {
  id: string;
  children: React.ReactNode;
  isEmpty?: boolean;
  emptyText?: string;
  dropHereText?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-10 border-t transition-colors duration-150 ${
        isOver ? "bg-primary/5 dark:bg-primary/10" : ""
      }`}
    >
      {isEmpty ? (
        <div className={`px-4 py-6 text-center text-[12px] transition-colors duration-150 ${
          isOver ? "text-primary font-medium" : "text-muted-foreground"
        }`}>
          {isOver ? dropHereText : emptyText}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

// ─── Main BacklogView ─────────────────────────────────

export function BacklogView({
  board,
  allIssues,
  projectId,
  onCreateSprint,
  onStartSprint,
  onCompleteSprint,
  onUpdateSprint,
  onDeleteSprint,
  onUpdateIssue,
  onClickIssue,
  members,
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
  onUpdateIssue?: (id: string, data: Record<string, unknown>) => void;
  onClickIssue: (key: string) => void;
  members?: UserPreview[];
  isCreatingSprint: boolean;
  isStartingSprint: boolean;
  isCompletingSprint: boolean;
}) {
  const { t } = useAppStore();
  const [showNewSprint, setShowNewSprint] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");
  const [backlogExpanded, setBacklogExpanded] = useState(true);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  function toggleSelect(id: string, shiftKey: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (shiftKey && lastSelectedId) {
        // Shift+click: select range
        const allIds = allIssues.map((i) => i.id);
        const startIdx = allIds.indexOf(lastSelectedId);
        const endIdx = allIds.indexOf(id);
        if (startIdx >= 0 && endIdx >= 0) {
          const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
          for (let i = from; i <= to; i++) next.add(allIds[i]);
        }
      } else {
        if (next.has(id)) next.delete(id); else next.add(id);
      }
      return next;
    });
    setLastSelectedId(id);
  }

  // Press-and-hold to drag. Short tap falls through to the row's onClick (open modal).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 180, tolerance: 5 } }),
  );

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

  const sortedSprints = [...board.sprints].sort((a, b) => {
    const order = { ACTIVE: 0, PLANNING: 1, COMPLETED: 2, CLOSED: 3 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  function handleDragStart(event: DragStartEvent) {
    const issue = event.active.data.current?.issue as Issue | undefined;
    setActiveIssue(issue ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveIssue(null);
    const { active, over } = event;
    if (!over || !onUpdateIssue) return;

    const issueId = active.id as string;
    const targetId = over.id as string;

    // Find the issue's current sprintId
    const issue = allIssues.find((i) => i.id === issueId);
    if (!issue) return;

    const currentSprintId = issue.sprintId ?? BACKLOG_ID;
    if (currentSprintId === targetId) return; // Dropped in same container

    const newSprintId = targetId === BACKLOG_ID ? null : targetId;
    onUpdateIssue(issueId, { sprintId: newSprintId });
  }

  function handleCreateSprint(e: React.FormEvent) {
    e.preventDefault();
    const name = newSprintName.trim() || `Sprint ${board.sprints.length + 1}`;
    onCreateSprint(board.id, name);
    setNewSprintName("");
    setShowNewSprint(false);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-3 p-5">
        {/* Sprints */}
        {sortedSprints.map((sprint) => {
          const issues = sprintIssues.get(sprint.id) ?? [];
          return (
            <SprintPanel
              key={sprint.id}
              sprint={sprint}
              issues={issues}
              onStartSprint={onStartSprint}
              onCompleteSprint={onCompleteSprint}
              onUpdateSprint={onUpdateSprint}
              onDeleteSprint={onDeleteSprint}
              onClickIssue={onClickIssue}
              isStarting={isStartingSprint}
              isCompleting={isCompletingSprint}
              renderIssueList={(issueList) => (
                <DroppableZone
                  id={sprint.id}
                  isEmpty={issueList.length === 0}
                  emptyText={t("sprint.emptyHint")}
                  dropHereText={t("backlog.dropHere")}
                >
                  <AnimatePresence mode="popLayout">
                    {issueList.map((issue) => (
                      <motion.div
                        key={issue.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                      >
                        <DraggableIssueRow
                          issue={issue}
                          onClick={() => onClickIssue(issue.key)}
                          selected={selectedIds.has(issue.id)}
                          onToggleSelect={toggleSelect}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </DroppableZone>
              )}
            />
          );
        })}

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
            <Button size="xs" variant="ghost" type="button" onClick={() => setShowNewSprint(false)}>
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
              {backlogExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            <Inbox className="h-4 w-4 text-muted-foreground" />
            <span className="text-[13px] font-semibold">{t("backlog.title")}</span>
            <Badge variant="secondary" className="text-[10px]">{backlogIssues.length}</Badge>
            {/* Export CSV — covers the entire project, not just backlog rows. */}
            <a
              href={`/api${ENDPOINTS.issues.exportCsv}?projectId=${projectId}`}
              download
              className="ml-auto inline-flex items-center gap-1 rounded-md border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title={t("backlog.exportCsvHint")}
            >
              <Download className="h-3 w-3" />
              {t("backlog.exportCsv")}
            </a>
          </div>

          {backlogExpanded && (
            <DroppableZone
              id={BACKLOG_ID}
              isEmpty={backlogIssues.length === 0}
              emptyText={t("backlog.empty")}
              dropHereText={t("backlog.dropHere")}
            >
              <AnimatePresence mode="popLayout">
                {backlogIssues.map((issue) => (
                  <motion.div
                    key={issue.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <DraggableIssueRow
                      issue={issue}
                      onClick={() => onClickIssue(issue.key)}
                      selected={selectedIds.has(issue.id)}
                      onToggleSelect={toggleSelect}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </DroppableZone>
          )}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
        {activeIssue && <DragOverlayContent issue={activeIssue} />}
      </DragOverlay>
      {/* Bulk action bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        projectId={projectId}
        sprints={board.sprints}
        members={members ?? []}
        onClear={() => setSelectedIds(new Set())}
      />
    </DndContext>
  );
}
