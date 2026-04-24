# Pagination

Two patterns. Pick based on UI, not preference.

## Page-based — admin lists
- Use when the UI shows numbered pages (`<Pagination>` component).
- BE response shape: `{ data, total, page, pageSize, totalPages, hasMore, nextCursor: null }`.
- BE implementation: `$transaction([count, findMany({ skip, take })])` so count + data see the same snapshot.
- FE component: `@/components/ui/pagination.tsx` — handles ellipsis (`1 2 3 … 50 51 52 … 98 99 100`).
- Current users: `/admin/logs`, `/admin/audit`.

## Cursor-based — infinite scroll
- Use when the UI loads more on scroll / "Load more" button and doesn't care about jumping to arbitrary page N.
- BE response shape: `{ data, nextCursor, hasMore }`.
- BE implementation: `findMany({ take: n+1, ...(cursor && { cursor: { id: cursor }, skip: 1 }) })` + slice to detect more.
- FE hook: `useInfiniteQuery`. Current user: `useInfiniteIssues` in `use-issues.ts`.

## Do not mix
- Same endpoint should not support both. If the UI needs both behaviours, split into two endpoints or two query-string modes — but prefer one.
- If converting a cursor endpoint to page-based (as done for logs/audit), keep `nextCursor: null` in the response for backward compat instead of removing it.

## Filters + pagination
- Reset `page` to 1 whenever any filter changes. See `jira-fe/src/features/logs/components/logs-filters.tsx` — every `onChange` sets `page: 1`.
