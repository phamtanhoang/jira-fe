# Feature: Epic View & Assignment

## Status: done

## Context
Dedicated Epics tab in project showing all epics with child issues, progress bars, and epic assignment in issue sidebar.

## Acceptance Criteria
- [x] New 'Epics' tab in project navigation (SCRUM: Summary, Backlog, Board, Epics)
- [x] Epic list shows: title, key, progress bar (done/total)
- [x] Click epic → expand to see child issues with status icons
- [x] Filter epics by: All / Open / Done
- [x] Create new epic from Epics tab
- [x] Assign/unassign epic in issue detail sidebar (dropdown with all project epics)
- [x] Epic field hidden for EPIC type issues (no self-reference)
- [x] Child issues show status: ✅ Done (green), 🕐 In Progress (blue), ○ To Do (gray)
- [x] Click child issue → opens preview modal

## Technical Notes
- No new BE endpoint — uses `GET /issues?projectId=X&type=EPIC` for epic list
- All issues fetched via `useIssues(projectId)`, then split client-side: epics vs children by epicId
- Epic assignment: `PATCH /issues/:id` with `{ epicId }` via existing `handleUpdate`
- Sidebar fetches epics via `useIssues(projectId, { type: "EPIC" })`
- UNASSIGNED_VALUE used for "None" option in epic select

## Files Affected
- `src/features/projects/components/epic-view.tsx` — new (EpicView + EpicCard)
- `src/features/projects/components/issue-detail-sidebar.tsx` — added Epic field
- `src/app/(main)/.../board/client.tsx` — added Epics tab
- `src/messages/en.json` + `vi.json` — epic, noEpic, epics, createEpic, epicProgress keys
