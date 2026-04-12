# Feature: Drag & Drop in Backlog

## Status: done

## Context
Users can drag issues between sprint panels and the Backlog section to assign/unassign sprints.

## Acceptance Criteria
- [x] Drag issue from Backlog into a sprint panel assigns it to that sprint
- [x] Drag issue from sprint back to Backlog removes sprint assignment (sprintId = null)
- [x] Drag between two sprint panels reassigns correctly
- [x] Visual drop zone highlights when dragging over (bg-primary/5)
- [x] Drag overlay shows issue key + summary as ghost card
- [x] Grip handle icon on each issue row (only grip is draggable, not entire row)
- [x] Issue row click still navigates to issue detail (not intercepted by drag)

## Technical Notes
- Uses @dnd-kit/core (DndContext, useDroppable, useDraggable, DragOverlay, PointerSensor)
- PointerSensor with distance: 5 activation constraint to distinguish click from drag
- Each sprint panel = droppable zone (id = sprint.id)
- Backlog section = droppable zone (id = "__backlog__")
- On drag end: calls useUpdateIssue with { sprintId: targetSprintId | null }
- useUpdateIssue now invalidates ["issues", projectId] for backlog list refresh
- SprintPanel accepts optional `renderIssueList` prop — when provided, BacklogView injects DnD-wrapped issue rows
- When `renderIssueList` not provided, SprintPanel renders default IssueRow list (backward compatible)
- DraggableIssueRow wraps IssueRow with GripVertical handle + drag state

## Files Affected
- `src/features/projects/components/backlog-view.tsx` — full rewrite with DndContext
- `src/features/projects/components/sprint-panel.tsx` — added renderIssueList prop
- `src/features/projects/hooks/use-issues.ts` — useUpdateIssue invalidates issues query
- `src/app/(main)/.../board/client.tsx` — passes onUpdateIssue to BacklogView

## Dependencies Added
- @dnd-kit/core
- @dnd-kit/sortable
- @dnd-kit/utilities
