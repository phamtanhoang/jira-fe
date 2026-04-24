# React Query Conventions

## Defaults
- `QueryProvider` sets `staleTime: 60s`, `retry: 1` globally. This suits domain data (issues, boards, comments) that changes during active work.
- Override per-hook for endpoints mounted on many pages — see `.claude/rules/query-stale-time.md` section below.

## Query keys
- Use tuples: `["entity", id, ?filters]`. Examples: `["issues", projectId]`, `["issue", key]`, `["comments", issueId]`, `["auth", "me"]`.
- Shared suffix + id must match on read and invalidate — otherwise mutation won't refresh the UI.
- NEVER name the query-client variable `qc`. Use `queryClient`.

## Mutation patterns
- **Plain invalidation**: use `useInvalidatingMutation(fn, ["entity", id], { successMessage })` from `@/lib/react-query/use-invalidating-mutation`. Used by `use-comments`, `use-attachments`, `use-worklogs`.
- **Optimistic with rollback**: hand-write `useMutation` with `onMutate` (snapshot + cache patch), `onError` (rollback from snapshot), `onSettled` (invalidate). Canonical example in `use-issues.ts::useUpdateIssue`.
- **No-op guard**: in `onMutate`, diff payload against current cache value; drop fields that didn't change. If payload becomes empty, skip the API call. Prevents `target === current` drags + quick-edits from hitting BE.
- **Pending UI**: use a shared `mutationKey` (e.g. `ISSUE_MUTATION_KEY`) + `useMutationState` to show spinner on the specific row being mutated. See `usePendingIssueIds` in `use-issues.ts`.

## staleTime constants
Import from `@/lib/constants/query-stale`:

| Constant | Value | Use for |
|---|---|---|
| `STALE_AUTH_USER` | 5 min | `/auth/me` (useCurrentUser) — mounted in many layouts/pages |
| `STALE_PUBLIC_SETTING` | 5 min | `/settings/app-*` (usePublicMaintenance, usePublicAnnouncement) |
| `STALE_FEATURE_FLAGS` | 10 min | `/feature-flags/me` |
| `STALE_DASHBOARD_WIDGET` | 30s | `/issues/me/dashboard` — widget that's OK to be slightly stale |
| `STALE_DOMAIN_DEFAULT` | 60s | Same as QueryProvider default — use explicitly if you want to be unambiguous |

## When adding a new hook — staleTime checklist
1. Is this endpoint mounted in a layout/sidebar/header? → set `staleTime` to at least 5 min.
2. Is the endpoint's data session-identity (user profile, role, feature flags)? → 5-10 min.
3. Does the endpoint back a widget shown on dashboards? → 30s-1min.
4. Everything else: use default (no `staleTime` override).
5. If staleTime > 1 minute, also set `refetchOnWindowFocus: false`. Otherwise alt-tabbing refetches.

## Axios + React Query interplay
- The axios `api` instance dedupes in-flight GETs by URL+params. React Query dedupes by queryKey. They stack: even hooks with different queryKeys that hit the same URL will share one network call.
- NEVER create your own axios instance. Always use `api` from `@/lib/api/client` so you inherit dedupe + 401 refresh + 429 retry + `x-origin` header.
