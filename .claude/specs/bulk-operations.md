# Feature: Bulk Operations on Issues

## Status: done

## Context
Select multiple issues in Backlog and apply actions to all at once.

## Acceptance Criteria
- [x] Checkbox appears on hover for each issue in Backlog view
- [x] Shift+click selects a range of issues
- [x] Floating action bar appears when 1+ issues selected
- [x] Actions: Move to sprint, Change assignee, Change priority, Delete
- [x] Confirmation required before bulk delete
- [x] Deselect all (X button) in action bar
- [x] Selection clears after action completes
- [x] Selected rows highlighted with bg-primary/5

## Technical Notes
### Backend
- `PATCH /issues/bulk` — accepts `{ issueIds, sprintId?, assigneeId?, priority? }`, uses `updateMany`
- `DELETE /issues/bulk` — accepts `{ issueIds }`, uses `deleteMany`
- Access check: verifies first issue's workspace membership

### Frontend
- Selection state: `Set<string>` in BacklogView, `lastSelectedId` for shift-range
- `DraggableIssueRow` gets `selected` + `onToggleSelect` props
- Checkbox: hidden by default, visible on row hover or when selected
- `BulkActionBar`: fixed bottom-center floating bar with sprint/assignee/priority selects + delete button
- Sprints + members passed from board page → BacklogView → BulkActionBar

## Files Affected
### Backend
- `src/core/constants/endpoint.constant.ts` — BULK_UPDATE, BULK_DELETE
- `src/modules/issues/dto/bulk-issue.dto.ts` — new
- `src/modules/issues/issues.controller.ts` — bulk endpoints
- `src/modules/issues/issues.service.ts` — bulkUpdate, bulkDelete methods

### Frontend
- `src/features/projects/components/bulk-action-bar.tsx` — new
- `src/features/projects/components/backlog-view.tsx` — selection state, checkbox UI
- `src/features/projects/hooks/use-issues.ts` — useBulkUpdateIssues, useBulkDeleteIssues
- `src/features/projects/api.ts` — bulkUpdate, bulkDelete methods
- `src/lib/constants/endpoints.ts` — issues.bulk
- `src/messages/en.json` + `vi.json` — common.selected
