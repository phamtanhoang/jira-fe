# Feature: UI Polish — Loading, DnD, Inline Edit, Transitions

## Status: done

## Context
Improve overall UI quality: drag-drop visual feedback, inline edit discoverability, loading spinners, empty states, smooth transitions.

## Acceptance Criteria
- [x] Drag & drop: cursor-grab, dragging card rotates/scales/fades, column drop zone scales up
- [x] Inline edit: Pencil icon appears on hover for summary and description
- [x] Loading: Spinner component on comment submit button
- [x] Empty state: comments section shows icon + message when empty
- [x] Transitions: all hover/drag effects have duration-150 or duration-200

## Files Affected
- `src/components/ui/spinner.tsx` — new Spinner component
- `src/features/projects/components/issue-card.tsx` — DnD visual feedback
- `src/features/projects/components/board-column.tsx` — drop zone animation
- `src/app/(main)/issues/[key]/client.tsx` — inline edit hover indicators
- `src/features/projects/components/issue-comments.tsx` — spinner + empty state
