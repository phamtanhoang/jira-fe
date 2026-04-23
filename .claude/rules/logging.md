# Logging & Error Reporting

## When to log
- ALWAYS let the global axios interceptor handle expected API errors — it already calls `reportError()` with breadcrumbs
- CALL `reportError(error, { level: "ERROR" })` manually only for unexpected client-side exceptions outside axios (error boundaries, workers, event listeners)
- NEVER call `reportError` for expected validation failures shown to user — use `handleApiError()` (toast) instead

## Breadcrumbs
- NEVER put breadcrumb state in zustand or react-query — they shouldn't trigger re-renders
- USE `pushBreadcrumb({ type, message, data? })` from `@/lib/logging` — `timestamp` is added automatically
- DO NOT capture `<input>` / `<textarea>` values — the global click listener in `LoggingProvider` intentionally reads `textContent` only
- DO NOT add a breadcrumb for the `/logs/client` endpoint — creates recursion risk

## Avoiding recursion
- NEVER import `api` from `@/lib/api/client` inside `@/lib/logging/*` — use a bare `axios.create()` instance
- If adding a new call from the axios interceptor's error branch, CHECK it won't hit an endpoint whose own failure would re-enter the interceptor

## Admin UI
- ALWAYS gate `src/app/(main)/admin/*` routes with `user.role === "ADMIN"` check in client.tsx
- ALWAYS conditionally render the nav link in `main-layout/sidebar` — `user?.role === "ADMIN" ? [...] : []`
- BE enforces via `@Roles(Role.ADMIN)` — never rely on UI gating alone

## Sentry
- Init lives in `instrumentation.ts` (server/edge) and `instrumentation-client.ts` (browser) at project root
- NEVER call `Sentry.*` directly from components — route through `reportError()` for consistent context
- Package disables itself when `NEXT_PUBLIC_SENTRY_DSN` is missing — no guards needed at call sites
