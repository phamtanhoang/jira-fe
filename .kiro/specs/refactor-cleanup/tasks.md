# Design: FE Refactor & Code Cleanup

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- React Query + Zustand
- ESLint + Prettier

## Approach
Two-phase: audit first (report only), execute second (after approval).
All changes are mechanical. No logic changes permitted.

---

## Phase 1 — Audit

### Scan targets
```
fe/src/components/    ← dead components
fe/src/hooks/         ← dead hooks
fe/src/lib/           ← dead utilities
fe/src/utils/         ← dead utilities
fe/src/app/           ← unused imports in pages
fe/src/store/         ← unused Zustand slices
```

### Detection methods
| Category | Method |
|---|---|
| Unused imports | ESLint: unused-imports/no-unused-imports |
| Dead components | Grep: no import of the component found in fe/src/ |
| Dead hooks | Grep: no import of the hook found in fe/src/ |
| Dead utilities | Grep: function name never called in fe/src/ |
| Console statements | Regex: console\.(log|warn|debug|info) |
| Commented-out blocks | Regex: 3+ consecutive lines starting with // or inside /* */ |

### Audit report format
```
CATEGORY        | FILE                              | LINE | ACTION
----------------|-----------------------------------|------|--------
Unused import   | src/components/Board/BoardCard.tsx | 3    | REMOVE
Dead component  | src/components/OldModal.tsx        | -    | DELETE
Console.log     | src/hooks/useIssue.ts              | 47   | REMOVE
```

---

## Phase 2 — Execute (after approval only)

### Order of operations (lowest → highest risk)
1. Remove console statements
2. Fix unused imports (ESLint --fix where possible, manual otherwise)
3. Remove commented-out code blocks
4. Delete dead hooks
5. Delete dead components
6. Remove dead utility functions

### Commit strategy (one commit per step)
```
refactor(fe): remove console statements
refactor(fe): remove unused imports
refactor(fe): remove commented-out code
refactor(fe): remove dead hooks
refactor(fe): remove dead components
refactor(fe): remove dead utility functions
```

### Verification after each step
- npx tsc --noEmit        → zero TypeScript errors
- npx eslint fe/src/      → zero unused-import warnings
- npm run build           → successful build
- npm run dev             → no runtime errors in browser console