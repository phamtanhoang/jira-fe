---
description: Triage a production FE issue — blank page, 401 loop, broken interaction, slow page. Walks through browser console → Sentry → BE logs → known patterns.
---

# Diagnose Production FE Issue

When the FE misbehaves on production, don't guess. Follow this triage in order.

## 1. Reproduce in the browser

Open https://jira.3hteam.io.vn/ in an incognito window. Note:
- What route?
- What action?
- Does it reproduce 100% or intermittently?
- Does it reproduce in a different browser?

## 2. Browser console + network tab

Open DevTools BEFORE the action that triggers the bug.

**Console:**
- Red errors → uncaught exceptions. Note the stack frame. If minified, find the source map by clicking the file link.
- "ChunkLoadError" → bundle file 404. Usually means a stale tab + a redeploy invalidated old chunks. Hard-refresh fixes for the user; the underlying bug is that the old chunk is gone.

**Network tab:**
- 401 → auth issue. See section 5.
- 4xx with JSON body → BE validation rejected something. Read the response body for `errorCode`.
- 5xx → BE crash. Jump to BE diagnose (`jira-be/.claude/commands/diagnose-prod.md`).
- Pending forever / red CORS → BE down OR rewrite broken (Next.js `/api/*` → `NEXT_PUBLIC_API_URL`).

## 3. Sentry browser dashboard

Filter: `environment: production`, `release: <latest>`.

The error event shows breadcrumbs from `LoggingProvider` (navigation, clicks) + axios calls. Read the last 5–10 breadcrumbs before the error — they tell you exactly what the user did.

If the error has `extra.endpoint` it's an axios failure. Cross-reference with `/admin/logs`.

## 4. Admin event log

Login as admin → `/admin/logs` → tab Requests → filter:
- `source=frontend` → reports from `reportError()` calls in the browser
- `level=ERROR`
- date range = last 30 min

`responseBody` has the original error payload + breadcrumbs.

## 5. Auth issues

| Symptom | Likely cause | Fix |
|---|---|---|
| 401 loop on every request | Refresh token expired or cookies blocked | Check 3rd-party cookie settings, or BE rotated JWT_SECRET |
| Redirects to /sign-in on protected page | `COOKIE_AUTH=1` missing | Did the login mutation set it? Check `useLogin` hook |
| Logged in but `/admin` redirects to `/dashboard` | `user.role !== "ADMIN"` | Check `/auth/me` response — `role` field present? |
| Cross-site 401 only on Safari/iOS | SameSite cookie setting too strict | BE sets `SameSite=Lax` — verify nginx isn't stripping |

## 6. Common bug archetypes

| Symptom | Likely cause |
|---|---|
| Blank page after deploy | Hydration mismatch. Server-rendered HTML != client render. Check for `Math.random`, `Date.now`, `localStorage` reads outside `useEffect`. |
| Toast spam on a single action | Mutation hook missing `onError` swallow + global axios `reportError` BOTH fire. Pick one. |
| Drag-and-drop snaps back | Optimistic update missing or wrong queryKey patch. Check `useUpdateIssue::onMutate`. |
| Rich text loses formatting | Tiptap content roundtrip lost. Check schema — uses `description` HTML field as-is, no sanitize that strips formatting. |
| Form silently doesn't submit | `react-hook-form` validation fails but no `errors.X` rendered. Add `<FormMessage />` to every `<FormField>`. |
| Theme flashes on load | `ThemeProvider` not above hydration boundary, or `defaultTheme` mismatch with cookie. |
| Locale flashes wrong language | `COOKIE_LOCALE` server-read vs client default mismatch. Check `app/layout.tsx`. |
| `Cannot read properties of undefined (reading 'X')` on page load | Query data accessed before `isLoading: false` check. Add the guard. |
| Page slow / janky after navigation | Forgot `staleTime` → refetches every nav. Check `.claude/rules/query-stale-time.md`. |
| Bell badge polls aggressively | `refetchInterval` too tight in `useUnreadCount`. Should be 2+ min. |

## 7. Recent deploys

```bash
git log --oneline -10
gh run list --limit 5
```

If a commit was deployed recently and the bug correlates → rollback:

```bash
git revert <bad-sha>
git push     # auto-deploys
```

## 8. Last resort — local repro

```bash
# Check out the production-deployed tag
git checkout <prod-sha>
cd jira-fe
npm install
NEXT_PUBLIC_API_URL=https://api.jira.3hteam.io.vn npm run dev
```

Hit `http://localhost:3030`. If it reproduces locally, you have a debugger. If NOT, it's environment-specific (CDN cache, browser cache, real prod data).

## Pitfalls

- ❌ Hard-refreshing before reading the console — you lose the error.
- ❌ Assuming the error is BE without checking `/api/*` response codes first.
- ❌ Trusting the user's screenshot — get the URL + a fresh repro.
- ❌ Reverting on a coincidence — confirm by reverting and checking the bug actually goes away.
