---
name: investigate-prod
description: Run a triage on a FE production issue — repro → console → Sentry → admin logs → recent deploys.
allowed-tools: Bash, Read, Grep
---

# Investigate Production Incident (FE)

When FE prod misbehaves, follow `.claude/commands/diagnose-prod.md`. This skill is the agent-friendly version.

## Fast triage (5 min)

1. **Reproduce** in incognito at `https://jira.3hteam.io.vn/`. Confirm the bug exists for a clean session.
2. **DevTools Console** — red errors? Note the file:line + stack frame.
3. **Network tab** — any non-2xx? Note method + path + status + response body.
4. **Sentry browser dashboard** — filter `release: <latest>`. Read breadcrumbs leading to error.
5. **Admin event log** `/admin/logs` — filter `source=frontend, level=ERROR, last 30min`.
6. **Recent deploys** — `git log --oneline -10` to correlate with rollout time.

Stop at the first step that yields a clear root cause.

## Pattern → diagnosis matrix

| Symptom | Likely cause | Next step |
|---|---|---|
| Blank page after deploy | Hydration mismatch | Check console for "Hydration failed". Look for `Math.random` / `Date.now` outside `useEffect` |
| `ChunkLoadError` | Stale tab + redeploy | User hard-refresh fixes. Confirm CDN cache TTL is sane |
| 401 loop everywhere | Refresh token broken or JWT_SECRET rotated | Tell users to re-login OR revert env change |
| `/admin` redirects to `/dashboard` for an admin | `user.role` missing | Check `/auth/me` response shape |
| Drag-and-drop snaps back | Optimistic update missing/wrong queryKey | Check `useUpdateIssue::onMutate` |
| Toast spam single action | Double error reporting (axios + mutation onError) | Pick one path |
| Rich text loses formatting | Tiptap output not roundtripping | Check `RichEditor` props + BE-stored HTML |
| Form silently doesn't submit | Validation fails but no `<FormMessage />` | Add messages to every field |
| Locale flicker / wrong language | `COOKIE_LOCALE` server-vs-client mismatch | Check root layout |
| Theme flashes | `ThemeProvider` below hydration boundary | Move provider up |
| Page slow / re-fetches every nav | Missing `staleTime` | Per `.claude/rules/query-stale-time.md` |
| Bell badge polls aggressively | `refetchInterval` too tight | Bump to ≥ 2 min |
| `Cannot read property X of undefined` on load | Query data accessed without `isLoading` guard | Add guard or optional chaining |

## Browser-specific bugs

- **Safari/iOS 401 only** → cookie SameSite policy. BE sets `Lax`; verify nginx doesn't strip.
- **Firefox CSP rejection** → check `<meta http-equiv="Content-Security-Policy">` if added recently.

## When to escalate

- A non-deterministic bug that's not in Sentry → ask user for `console.log` dump + their browser/OS.
- A bug that only happens for users in `production` (not staging) → check feature flags, A/B, environment env vars.

## Outputs of this skill

When done, report:
- Summary: `<symptom> caused by <root cause>`.
- Evidence: console line(s), Sentry event ID, response body snippet, commit SHA.
- Fix: one-line action.
- Confidence: high / medium / low.

## Things to avoid

- ❌ Hard-refresh before noting the error.
- ❌ Trusting screenshots without a fresh repro.
- ❌ Assuming the bug is BE without checking response codes.
- ❌ Reverting on a coincidence — verify by reverting + re-testing.
