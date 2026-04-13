---
inclusion: always
---

# Project: Jira Clone — Frontend

Full-stack Jira-like project management tool. This folder (`jira-fe/`) is the Next.js 16 App Router frontend running on port 3000.

```
jira-fe/   ← this app (Next.js 16, port 3000)
jira-be/   ← NestJS REST API (port 4000) — separate folder
```

---

## FE ↔ BE Communication

- Axios base URL: `/api` (relative)
- Next.js rewrites `/api/:path*` → `http://localhost:4000/:path*` (configured in `next.config.ts`)
- Auth: `access_token` + `refresh_token` cookies are set by BE (httpOnly — not readable by JS)
- FE sets `is_authenticated=1` cookie on login (non-httpOnly) — used by middleware and 401 refresh logic
- Every Axios request automatically includes `x-timezone` header (IANA timezone string) via interceptor in `src/lib/api/client.ts`
- Auto-refresh on 401: queues failed requests, calls `POST /api/auth/refresh`, replays queue
- Axios instance: `src/lib/api/client.ts` — always use this, never raw `fetch()`

---

## Required Environment Variables (`jira-fe/.env`)

| Variable | Example | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | BE base URL for Next.js rewrite target |

---

## Auth & Route Protection

- `src/middleware.ts` runs on every non-static request
- Unauthenticated users → redirected to `/sign-in`
- Authenticated users on public pages → redirected to `/dashboard`
- Public routes defined in `src/lib/constants/routes.ts` as `PUBLIC_ROUTES`
- Auth state tracked via `is_authenticated` cookie (value `"1"`)

---

## Role & Permission System

Roles are enforced on the BE. The FE receives the user object with:
- `user.role`: `USER` | `ADMIN` (global platform role)

Workspace/project roles are embedded in the workspace/project member objects returned by the API. The FE uses these to conditionally show/hide UI elements (e.g. delete buttons, settings links) but does NOT enforce access — the BE does.

---

## Top 5 Things Easiest to Get Wrong

1. **Using `fetch()` instead of the `api` Axios instance** — `fetch()` won't include the `x-timezone` header or trigger the 401 auto-refresh. Always import `api` from `@/lib/api`.

2. **Hardcoding English strings in JSX** — All user-visible text must use `t("section.key")` from `useAppStore()`. Hardcoded strings won't be translated and won't update when the app name changes.

3. **Missing `onError: handleApiError` in mutations** — Without it, API errors are silently swallowed. Every `useMutation` must have `onError: handleApiError`.

4. **Adding a BE message key without updating both `en.json` and `vi.json`** — The raw key string will show in the toast instead of a translated message.

5. **Forgetting `"use client"` on components that use hooks** — Next.js App Router defaults to server components. Any component using `useState`, `useEffect`, `useQuery`, or event handlers needs `"use client"` at the top.
