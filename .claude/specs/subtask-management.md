# Feature: Subtask Management UI

## Status: done

## Context
Backend already has parentId field. Frontend built: add subtask button, subtask list with checkboxes, progress bar, and breadcrumb navigation from child to parent.

## Acceptance Criteria
- [x] 'Add subtask' button visible in issue detail
- [x] Subtask list renders under parent issue with checkbox for each
- [x] Checking a subtask checkbox marks it Done via moveIssue API
- [x] Unchecking moves it back to Todo column
- [x] Progress bar shows X/total subtasks completed
- [x] Breadcrumb shows Parent → Current subtask in top bar
- [x] SubtaskList hidden when viewing a subtask (no nested subtasks)

## Technical Notes
- Uses `useMoveIssue` to toggle between TODO and DONE columns
- `useMoveIssue` invalidates both `["board"]` and `["issue"]` queries for instant UI update
- Board columns fetched via `useBoard(projectId)` to find TODO/DONE column IDs
- `parentId` passed in `useCreateIssue` with `type: "SUBTASK"`
- Issue type `children` field includes `boardColumn` for status display

## Files Affected
- `src/features/projects/components/subtask-list.tsx` — new component
- `src/app/(main)/issues/[key]/client.tsx` — breadcrumb + SubtaskList integration
- `src/features/projects/hooks/use-issues.ts` — useMoveIssue invalidates issue queries
- `src/features/projects/types.ts` — children type + parentId in CreateIssuePayload
