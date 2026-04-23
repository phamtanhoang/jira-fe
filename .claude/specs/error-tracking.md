# Feature: Error Tracking + Admin Logs UI

## Status: done

## Context
No error tracking or behavior logging existed on the frontend. When a user hit a bug, the error showed as a toast then disappeared — devs had zero context (URL, user, request payload, actions leading up to it). This adds:

1. **Breadcrumbs** — capture last 50 user actions (navigation, clicks, API calls) in memory.
2. **Axios interceptor** — on any API error, send full context (request, breadcrumbs, user, URL) to `POST /logs/client` and to Sentry.
3. **Error boundary** — capture React errors caught by `app/(main)/error.tsx` and report them.
4. **Admin UI** — `/admin/logs` page for ADMIN role to list, filter, and inspect logs.

Pairs with the BE spec [request-logging.md](../../../jira-be/.claude/specs/request-logging.md).

## Acceptance Criteria

### Breadcrumb capture
- [x] Ring buffer module at [src/lib/logging/breadcrumbs.ts](../../src/lib/logging/breadcrumbs.ts) — standalone (NOT zustand), cap 50 entries
- [x] `push()` appends, shifts oldest when full; `snapshot()` returns defensive copy
- [x] Breadcrumb shape: `{ type: 'nav'|'click'|'api'|'error'; message: string; data?: object; timestamp: string }`
- [x] Navigation breadcrumb pushed on `usePathname()` change (via `LoggingProvider`)
- [x] Click breadcrumb captures `tagName`, nearest `data-testid`, truncated visible text (60 chars)
- [x] API breadcrumb pushed on every axios request (method + url)

### Axios integration
- [x] Request interceptor in [src/lib/api/client.ts](../../src/lib/api/client.ts) adds API breadcrumb
- [x] Response error branch calls `reportError(error, { url, method, statusCode, level })`
- [x] Uses **bare** axios instance in `reportError` for posting `/logs/client` (avoid interceptor recursion)
- [x] Skips breadcrumb + reporting for `/logs/client` itself
- [x] Skips reporting for 401-pre-refresh (handled by auto-refresh)
- [x] Log send failure silently swallowed — never affects user flow

### Error reporting
- [x] [src/lib/logging/report.ts](../../src/lib/logging/report.ts) exports `reportError(error, context)` → fires both Sentry + `/api/logs/client`
- [x] Sentry captures with extra context (url, method, statusCode)
- [x] `reportError` returns `void` and is fire-and-forget — breadcrumbs attached automatically

### Error boundary
- [x] [src/app/(main)/error.tsx](../../src/app/(main)/error.tsx) calls `reportError(error, { level: 'ERROR' })` via `useEffect`
- [x] Keeps existing "Try again" UX

### Sentry SDK
- [x] `@sentry/nextjs` installed
- [x] `instrumentation.ts` + `instrumentation-client.ts` at project root
- [x] Env vars: `NEXT_PUBLIC_SENTRY_DSN` (client), `NODE_ENV` → Sentry environment
- [x] Disabled when DSN missing — graceful no-op

### Admin UI — `/admin/logs`
- [x] Route: [src/app/(main)/admin/logs/{page,client}.tsx](../../src/app/(main)/admin/logs/) (split convention)
- [x] Table columns: timestamp, level (colored badge), method, url, status (colored badge), userEmail, durationMs
- [x] Filters: level, status code, method, userEmail (search), free-text url search
- [x] Server-side pagination (cursor-based, 50 per page) — "Load more" button
- [x] Click row → opens Sheet with: sanitized request body, request query, response body, stack trace, breadcrumbs, user agent, sentryEventId
- [x] Redirect to `/dashboard` if user role !== `ADMIN` (double-safety — BE also enforces)
- [x] Nav link in sidebar hidden unless role === ADMIN
- [x] Dark mode support via semantic Tailwind colors
- [x] i18n keys under `admin.logs.*` in BOTH [vi.json](../../src/messages/vi.json) AND [en.json](../../src/messages/en.json)

## Technical Notes

### Why a standalone module (not zustand) for breadcrumbs?
Breadcrumbs are append-only diagnostic data. They shouldn't:
- Trigger React re-renders (so not reactive state)
- Be persisted (so not in stores)
- Be shared across tabs

A plain module-level `Array<Breadcrumb>` with a ring buffer is simpler and more performant.

### Click capture in LoggingProvider
`document.addEventListener('click', handler, { capture: true })`. Handler walks up from `e.target` to find closest `[data-testid]` or `button/a/[role=button]`. Records tag + testid + truncated visible text. **Does NOT read `<input>` values** — avoids leaking passwords/PII into breadcrumbs. Registered once by `LoggingProvider` mounted in root layout.

### Avoiding infinite loops
`reportError` uses a bare axios instance (`axios.create()` with no interceptors) for `POST /logs/client`. The main `api` client's interceptor would otherwise recursively invoke `reportError` on log-endpoint failures. The request interceptor also skips adding API breadcrumbs for the log endpoint itself.

### User role for admin gate
Added `role?: "USER" | "ADMIN"` to `AuthUser` type. `useCurrentUser()` returns user with role from backend `/auth/me`. Sidebar + admin-page both check this. BE enforces via `@Roles(Role.ADMIN)` regardless — UI check is UX only.

## Files Affected

**New:**
- [src/lib/logging/breadcrumbs.ts](../../src/lib/logging/breadcrumbs.ts) — ring buffer
- [src/lib/logging/types.ts](../../src/lib/logging/types.ts) — Breadcrumb, LogLevel, ClientLogPayload
- [src/lib/logging/report.ts](../../src/lib/logging/report.ts) — reportError() with bare axios
- [src/lib/logging/index.ts](../../src/lib/logging/index.ts) — barrel
- [src/components/providers/logging-provider.tsx](../../src/components/providers/logging-provider.tsx) — nav + click breadcrumbs
- [src/features/logs/api.ts](../../src/features/logs/api.ts), [hooks.ts](../../src/features/logs/hooks.ts), [types.ts](../../src/features/logs/types.ts), [index.ts](../../src/features/logs/index.ts)
- [src/features/logs/components/logs-table.tsx](../../src/features/logs/components/logs-table.tsx)
- [src/features/logs/components/logs-filters.tsx](../../src/features/logs/components/logs-filters.tsx)
- [src/features/logs/components/log-detail-sheet.tsx](../../src/features/logs/components/log-detail-sheet.tsx)
- [src/app/(main)/admin/logs/page.tsx](../../src/app/(main)/admin/logs/page.tsx) (server, metadata)
- [src/app/(main)/admin/logs/client.tsx](../../src/app/(main)/admin/logs/client.tsx) (client UI)
- [instrumentation.ts](../../instrumentation.ts) (Node/edge)
- [instrumentation-client.ts](../../instrumentation-client.ts) (browser)

**Modified:**
- [src/lib/api/client.ts](../../src/lib/api/client.ts) — breadcrumbs + error reporting
- [src/app/(main)/error.tsx](../../src/app/(main)/error.tsx) — `reportError` on catch
- [src/app/layout.tsx](../../src/app/layout.tsx) — mount `LoggingProvider` inside AppProvider
- [src/components/layouts/main-layout/components/sidebar/index.tsx](../../src/components/layouts/main-layout/components/sidebar/index.tsx) — admin-gated "Logs" link
- [src/features/auth/types.ts](../../src/features/auth/types.ts) — `role?: UserRole`
- [src/lib/constants/routes.ts](../../src/lib/constants/routes.ts) — `ADMIN_LOGS: '/admin/logs'`
- [src/lib/constants/endpoints.ts](../../src/lib/constants/endpoints.ts) — `logs` group
- [src/messages/vi.json](../../src/messages/vi.json) + [en.json](../../src/messages/en.json) — 30+ `admin.logs.*` keys + `nav.adminLogs`

## Dependencies Added
- `@sentry/nextjs` ^10.49.0

## Verification
- ✅ `npm run lint` → 0 errors (5 pre-existing warnings unchanged)
- ✅ `npm run type-check` → passes
- ✅ `npm run test:run` → 46/46 unit tests pass
- ⏳ End-to-end: login as admin → `/admin/logs` → filter + detail Sheet works (manual test)
