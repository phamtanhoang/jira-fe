# Error Boundaries

Next.js App Router gives you per-folder `error.tsx` files. Use them so a thrown render or query in one section doesn't collapse the whole app.

## Where boundaries are required

- **Route-group root**: `(main)/error.tsx`, `(admin)/error.tsx`, `(auth)/error.tsx` — exist today, layout-level catch-alls.
- **Heavy data pages**: any admin sub-page that does its own fetching (logs, users, settings, flags) MUST have its own `error.tsx`. Without one, a thrown query wipes the admin shell, including the sidebar — the admin can't navigate to `/admin/settings` to fix the bad config that just threw.
- **Complex feature pages**: board, projects/[id]/settings — already have boundaries. Same rule: if the page has its own data fetching that can fail unexpectedly, ship a boundary.

## Sharing the body

To DRY up four near-identical admin sub-page boundaries, put the actual component in `src/app/(admin)/admin/_components/admin-page-error.tsx` (underscore-prefixed — Next.js skips routing for it) and have each `error.tsx` re-export it as default. Each `error.tsx` still exists as a real file so Next.js knows to install a boundary at that route segment.

```tsx
// src/app/(admin)/admin/<page>/error.tsx
"use client";
import { AdminPageError } from "../_components/admin-page-error";
export default AdminPageError;
```

## Reporting

EVERY `error.tsx` MUST call `reportError(error, { level: "ERROR" })` from `@/lib/logging` inside `useEffect`. Without it, the error never reaches Sentry / `/logs/client` and is invisible to admins.

## NOT a boundary

- Per-component try/catch around a single `useQuery` is overkill — let the boundary catch it.
- React Query `onError` is for toast / retry UX, not for replacing the error boundary. Keep both.
- Recharts components are allergic to NaN points and undefined domains; if you hit chart-throws-on-bad-data in production, wrap the chart in a `react-error-boundary` `<ErrorBoundary>` rather than a route-level `error.tsx` (a chart shouldn't kill the whole admin page).
