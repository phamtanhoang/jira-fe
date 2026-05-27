---
name: bug-fix-flow
description: Repeatable workflow for fixing a FE bug — reproduce in browser, locate, write a minimal fix, verify in vi+en+dark, commit.
allowed-tools: Bash, Read, Edit, Grep, Glob
---

# Bug Fix Flow (FE)

A bug is a defect against the spec. Verify each step.

## 1. Reproduce in the browser

Open DevTools BEFORE the action that triggers the bug.

- What route?
- What action?
- 100% repro or intermittent?
- Browser console: any errors?
- Network tab: any 4xx/5xx?
- Reproduce in Incognito (rule out cached state)
- Reproduce in another browser (rule out browser-specific)

If you can't reproduce: see `.claude/commands/diagnose-prod.md`.

## 2. Locate

Console error stack → file:line. If minified, use source maps via DevTools.
Network error → `errorCode` in response body. Search the codebase for that code's handler.
Visual bug → React DevTools: which component? Inspect props/state.

Use the `debugger` agent if the trace isn't obvious.

## 3. Verify hypothesis

Don't change code yet. State the hypothesis: "I think X is happening because Y."

Test the hypothesis: log values, comment out a hook, swap a constant. Confirm.

## 4. Minimal fix

DON'T:
- Refactor surrounding code
- Extract a "reusable helper" for a one-off
- Add defensive null-checks for impossible states
- Change other components that "look similar"

DO:
- Change the minimum to fix the root cause
- Match the existing patterns (see `.claude/rules/*.md`)

Common bug archetypes:

| Symptom | Root cause | Fix shape |
|---|---|---|
| Drag-drop snaps back | Optimistic update missing or wrong queryKey patch | Update `onMutate` in the mutation hook |
| Re-fetches on every nav | Missing `staleTime` | Set per `.claude/rules/query-stale-time.md` |
| Refetch on alt-tab despite long staleTime | Missing `refetchOnWindowFocus: false` | Add to the hook config |
| Form silently doesn't submit | `react-hook-form` validation fails but no `<FormMessage />` | Add `<FormMessage />` to the field |
| Dark mode broken | Hardcoded `bg-blue-50` without `dark:bg-blue-950` | Add `dark:` variant or use semantic token |
| Locale flicker | `t()` called before store hydrated | Wrap in `useEffect` or use `defaultLocale` cookie SSR |
| Hydration mismatch error | `Math.random` / `new Date()` outside `useEffect` | Move to useEffect or `useMemo` with stable input |
| Mutation shows toast twice | Both `onError` AND axios `reportError` fire | Pick one — typically let `handleApiError` handle expected, `reportError` for unexpected |
| List row re-renders on every parent update | `React.memo` missing + new function ref each render | Wrap row + `useCallback` for handlers |
| Toast i18n key showing as raw string | Missing key in one locale file | Add to BOTH `vi.json` + `en.json` |
| `Cannot read property X of undefined` | Query data accessed before isLoading check | Add the guard or use optional chaining |

## 5. Verify

```bash
npx tsc --noEmit
npm run lint
```

Browser:
- Reproduce the original failing flow → bug gone
- Check other locales: switch vi ↔ en
- Check dark mode: toggle theme
- Check related flows: bug might have side effects (e.g. fixing drag-drop optimistic could break creation)

## 6. Commit

```
fix({scope}): <subject>

Reproduced via: <repro steps>
Root cause: <one line>
Fix: <one line>
```

## 7. Deploy

See `.claude/commands/deploy.md`. FE deploys are fast (no schema step).

## Things to avoid

- ❌ Refactoring + fixing in the same commit — hard to review, hard to revert.
- ❌ Adding `try/catch` that hides the error.
- ❌ Bumping React Query staleTime to 1 hour to "fix" a refetch — it's masking, not fixing.
- ❌ Disabling a lint rule to silence a warning — fix the warning's underlying issue.
- ❌ Forgetting to verify in the OTHER locale — many bugs only show in `en`.
