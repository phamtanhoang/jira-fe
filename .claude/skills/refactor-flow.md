---
name: refactor-flow
description: Step-through for a FE refactor — when to split a bloated client.tsx, extract a hook, share a component. Behavior must stay identical.
allowed-tools: Bash, Read, Edit, Grep, Glob
---

# Refactor Flow (FE)

Refactor = change structure, NOT behavior. UI flows, mutations, query keys MUST stay byte-identical.

## When to refactor

- `client.tsx` past ~300 LOC AND it mixes data + handlers + JSX — see `.claude/rules/page-organization.md`.
- Three components copy the same JSX block — extract a shared component.
- The same hook is hand-rolled 3+ times — extract a hook in `features/{area}/hooks/`.
- Multiple files import from `@/components/ui/X` and add the same wrapper around it — promote the wrapper to a new UI primitive.

DON'T refactor for "consistency" alone if the inconsistent files aren't being changed. Bias toward leaving working code alone.

## Plan first

State the target shape:
- File list before / after
- What gets renamed
- Which props/state moves where
- What stays put

For an admin page split:

```
src/app/(admin)/admin/users/
├── page.tsx
├── client.tsx                      # was: 450 LOC monolith
                                    # now: <UsersContainer />
├── error.tsx
└── _components/
    ├── users-container.tsx         # smart: hooks, handlers, state
    ├── users-header.tsx            # presentational
    ├── users-table.tsx             # presentational
    ├── user-row.tsx                # memoized list row
    └── user-actions-menu.tsx       # dropdown actions
└── _hooks/
    └── use-users-filters.ts        # filter state + memos
```

## Stage the changes

The PR should be a series of clean moves:

1. **Move-only first**: Cut JSX block from `client.tsx` → paste into `_components/X.tsx` → import + render. No prop changes yet.
2. **Lift state**: Hook calls in container; pass derived values to presentational children as props.
3. **Memoize**: Wrap leaf components in `React.memo`; `useCallback` handlers.

Each step compiles + passes lint + renders identically. Don't smash all three into one diff.

## Common refactor shapes

### Container/presentational split

When `client.tsx` mixes 5+ hooks + 10+ handlers + 200 lines of JSX:

```tsx
// _components/feature-container.tsx
"use client";
export function FeatureContainer() {
  const { data, isLoading } = useFeatureList();
  const handleX = useCallback(...);
  return <FeatureView data={data} onX={handleX} />;
}

// _components/feature-view.tsx (presentational, no hooks)
export const FeatureView = memo(function FeatureView({ data, onX }) {
  return <div>...</div>;
});
```

### Hook extraction

When a component declares `useState + useMemo + useEffect` for filter logic AND the page is one of three with the same shape:

```ts
// _hooks/use-filters.ts
export function useListFilters<T extends FilterShape>(...) { ... }
```

If the hook ends up specific to this page, leave it in `_hooks/`. If it generalizes, promote to `src/features/{module}/hooks/`.

### Shared component promotion

Three pages render the same "empty + skeleton + error" trio:

```tsx
// src/components/ui/list-states.tsx
export function ListStates({ isLoading, isEmpty, error }) { ... }
```

Then convert the three sites in ONE PR. Don't leave one site stale.

### Tailwind class extraction

If a styling pattern appears 4+ times, extract via `@apply` or a `cn()` const, NOT inline duplication. Use semantic shadcn tokens (`bg-card`, `text-muted-foreground`) when the design is consistent.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm run build              # catches server/client boundary breakage
```

Browser:
- Reproduce the original flow — pixel-identical behavior.
- Test both locales: `vi` ↔ `en`.
- Test dark mode.
- Test the related flows that share state with what you refactored.

For risky refactors: ask `reviewer` agent for a behavior diff.

## Things to avoid

- ❌ Renaming + restructuring + tweaking logic in one diff.
- ❌ Refactoring at the same time as a feature — block each other on review.
- ❌ Removing `"use client"` markers without checking what they shield.
- ❌ Extracting a "reusable" component used in ONE place — premature.
- ❌ Replacing inline JSX with a `<RenderProp>` pattern when a simple component works.
- ❌ Refactoring without re-running the original flow → silent regression.
