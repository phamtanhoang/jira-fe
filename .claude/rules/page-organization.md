# Page Organization

## Page-level split (already enforced)

EVERY route page MUST be split:
- `page.tsx` (server component, exports `generateMetadata` + re-exports the client default).
- `client.tsx` (`"use client"`, contains the actual UI).

Don't put `"use client"` on `page.tsx` — it forfeits the metadata + locale-cookie reads server-side.

## When `client.tsx` gets too big (~300+ LOC)

A bloated `client.tsx` mixes data hooks, mutation handlers, and JSX. Refactor target:

```
<page>/
├── page.tsx                       # unchanged — server, metadata
├── client.tsx                     # thin: <{Page}Container />
├── error.tsx                      # if missing, add per .claude/rules/error-boundaries.md
├── loading.tsx
├── _components/                   # underscore folder — Next.js skips routing
│   ├── <page>-container.tsx       # smart: hooks + state + handlers
│   ├── <page>-header.tsx          # presentational
│   ├── <page>-<view>.tsx          # presentational, repeat per view
│   └── <subform>.tsx              # extracted inline JSX blocks
└── _hooks/
    ├── use-<page>-filters.ts      # owns filter state + memos
    └── use-<page>-mutations.ts    # bundles related mutation hooks
```

Rules:
- Container owns: state, hooks, handlers, side effects (`useEffect` for analytics, recents, etc.).
- Views are presentational: take props + render. No data fetching, no mutations directly inside.
- Wrap shared mutation handlers in `useCallback` keyed by stable IDs (`board?.id`) so memoized child rows don't re-render on parent re-render.
- Underscore-prefixed folders (`_components`, `_hooks`) are private to the route — Next.js explicitly skips routing for them. Don't put them at the route root without the prefix.

## When NOT to split

- Pages under ~250 LOC. Splitting too early scatters logic and makes refactors harder.
- Pages where the JSX tree is one cohesive block (a single form, a single chart). Extract sub-components only when there's a natural seam.

Single-file `client.tsx` ≤ 300 LOC is the goal, not a hard rule. 350 LOC of cohesive JSX beats 350 LOC across 6 files of churn.
