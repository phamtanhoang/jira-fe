# Feature: Cursor-based Pagination

## Status: done (infrastructure ready)

## Context
Added cursor-based pagination to issue list endpoint. FE hooks ready for infinite scroll.

## What's Implemented

### Backend
- `GET /issues` now accepts optional `cursor` and `take` query params
- When `take` is provided: returns `{ data, nextCursor, hasMore }` (cursor-based)
- When `take` is NOT provided: returns array directly (backward compatible — board, backlog DnD still work)
- Fetches `take + 1` items to determine `hasMore` without extra count query
- Cursor uses issue `id` (stable, unique)

### Frontend
- `issuesApi.listPaginated(projectId, { take, cursor?, sprintId? })` — new API method
- `useInfiniteIssues(projectId, { take, sprintId? })` — React Query `useInfiniteQuery` hook
- Existing `useIssues()` unchanged — still returns all issues (used by board, backlog DnD, epics)

## What's NOT Implemented Yet (use when needed)
- [ ] Infinite scroll UI in BacklogView (currently loads all via useIssues)
- [ ] Activity log pagination (no separate endpoint exists yet)
- [ ] Member list page-based pagination

## How to Use Infinite Scroll
```tsx
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteIssues(projectId, { take: 20 });
const allIssues = data?.pages.flatMap(p => p.data) ?? [];
// Trigger fetchNextPage when user scrolls to bottom
```

## Files Affected
### Backend
- `src/modules/issues/issues.service.ts` — findAll() now supports cursor/take
- `src/modules/issues/issues.controller.ts` — accepts cursor/take query params

### Frontend
- `src/features/projects/api.ts` — listPaginated method + PaginatedResponse type
- `src/features/projects/hooks/use-issues.ts` — useInfiniteIssues hook
