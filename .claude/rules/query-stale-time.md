# React Query `staleTime` Decisions

The default in `QueryProvider` is `staleTime: 60s`, `retry: 1`. Use that for domain data that changes during active work (issues, comments, boards). Override for anything else.

## The constants

Import from `@/lib/constants/query-stale`:

| Constant | Value | Use for |
|---|---|---|
| `STALE_AUTH_USER` | 5 min | `/auth/me` (`useCurrentUser`) — mounted in every layout |
| `STALE_PUBLIC_SETTING` | 5 min | `/settings/app-*` (announcement, maintenance, app-info) |
| `STALE_FEATURE_FLAGS` | 10 min | `/feature-flags/me` |
| `STALE_DASHBOARD_WIDGET` | 30 s | `/issues/me/dashboard` — widget where slight staleness is fine |
| `STALE_DOMAIN_DEFAULT` | 60 s | Issues, boards, comments — anything actively edited |

Don't hardcode `5 * 60 * 1000` in a hook — refer to the constant. If we later need to tune the value, one edit covers all usages.

## Decision flowchart

```
Is this endpoint hit from a layout / sidebar / header?
  yes → minimum 5 min (STALE_AUTH_USER class)

Is this endpoint identity-shaped (user role, feature flags)?
  yes → 5–10 min

Is this a dashboard widget?
  yes → STALE_DASHBOARD_WIDGET (30 s)

Is this domain data the user is actively editing?
  yes → STALE_DOMAIN_DEFAULT (60 s) — leave as provider default

Else: use provider default (60 s)
```

## Always pair long staleTime with `refetchOnWindowFocus: false`

By default React Query refetches when the tab regains focus. If you set `staleTime: 5min` but leave focus-refetch on, alt-tabbing back fires a refetch anyway — making the long staleTime meaningless.

```ts
useQuery({
  queryKey: ["auth", "me"],
  staleTime: STALE_AUTH_USER,
  refetchOnWindowFocus: false,   // ← required with > 1 min staleTime
});
```

## Skip with `enabled:`

Don't fire queries that can't succeed:

```ts
useQuery({
  queryKey: ["projects", workspaceId],
  queryFn: () => api.list(workspaceId),
  enabled: !!workspaceId,   // skip when undefined
});
```

For auth-gated queries on public pages, gate on the auth cookie:

```ts
const hasAuthCookie =
  typeof document !== "undefined" &&
  document.cookie.includes(`${COOKIE_AUTH}=1`);

useQuery({
  queryKey: ["auth", "me"],
  queryFn: () => authApi.me(),
  enabled: hasAuthCookie,    // unauthenticated tabs never burn /auth/me
});
```

## Polling endpoints

`refetchInterval` periodically refetches even if data is fresh. Examples that legitimately need polling:

- Notification bell badge (`useUnreadCount`) — currently 5 min. Set once, don't tune below 2 min without justification.
- Long-running task status — only valid for in-progress jobs. Stop polling on success/fail via `enabled: status === 'pending'`.

Polling is expensive on Neon free-tier compute (every tick = DB query). Default to NOT polling unless UX clearly requires it.

## Mutation patterns

| Pattern | When | Helper |
|---|---|---|
| Plain invalidation | Refetch after mutation (most cases) | `useInvalidatingMutation(fn, queryKey, { successMessage })` |
| Optimistic update | UX needs instant feedback (drag-drop, quick-edit) | Hand-write `useMutation` with `onMutate` snapshot + `onError` rollback + `onSettled` invalidate |
| No-op guard | Avoid sending unchanged payload | In `onMutate`, diff against cache; skip API call if no fields changed |
| Pending state per row | Spinner on the row being mutated | Shared `mutationKey` + `useMutationState` (see `usePendingIssueIds`) |

Canonical example for optimistic: `use-issues.ts::useUpdateIssue`. Read it before writing a new optimistic mutation.

## Query keys

Use tuples: `["entity", id, ?filters]`.

| Good | Bad |
|---|---|
| `["issues", projectId]` | `["issues-by-project", projectId]` (cute name) |
| `["issue", key]` | `[`issue-${key}`]` (string interpolation) |
| `["comments", issueId]` | `["comments", { issueId }]` (object, harder to invalidate) |

Filter variants: `["issues", projectId, { sprint: 1 }]` — invalidate parent `["issues", projectId]` invalidates all filter variants.

NEVER name the queryClient variable `qc`. Use `queryClient`.

## Things easy to get wrong

- ❌ Hardcoding `5 * 60 * 1000` in a hook — use the constant.
- ❌ Setting `staleTime: 5 min` but forgetting `refetchOnWindowFocus: false`.
- ❌ Polling `refetchInterval` on a sidebar widget — DB compute death.
- ❌ Inventing a new query key for the same data — mutation can't find what to invalidate.
- ❌ Calling `useQuery` without `enabled:` for conditional queries — fires with undefined → BE errors.
