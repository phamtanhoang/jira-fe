# Requirements: FE Refactor & Code Cleanup

## Overview
Clean up the frontend (Next.js) codebase by removing dead code, unused
imports, unreferenced components/hooks, and console statements —
without changing any UI behaviour or API contracts.

## Scope
- fe/src/**/*.ts
- fe/src/**/*.tsx
- Exclude: **/*.test.ts, **/*.spec.ts, **/node_modules/**, **/.next/**

---

## User Stories

### 1. Remove unused imports
As a developer,
I want all unused imports removed from every FE file,
so that bundle size is smaller and files are easier to read.

Acceptance Criteria:
- GIVEN any .ts or .tsx file in fe/src/
- WHEN the file is opened
- THEN no ESLint no-unused-vars or unused-imports warnings exist

### 2. Remove dead components
As a developer,
I want components that are never imported anywhere to be deleted,
so that new developers are not confused by unreachable UI code.

Acceptance Criteria:
- GIVEN a component file in fe/src/components/
- WHEN it is not imported in any other file in fe/src/
- THEN the file is deleted
- AND no runtime or build error occurs after deletion

### 3. Remove dead hooks
As a developer,
I want custom hooks that are never used anywhere to be deleted.

Acceptance Criteria:
- GIVEN a hook file in fe/src/hooks/
- WHEN it is not imported in any other file in fe/src/
- THEN the file is deleted
- AND no runtime error occurs after deletion

### 4. Remove dead utility functions
As a developer,
I want utility functions in fe/src/lib/ and fe/src/utils/ that are
never called anywhere to be removed.

Acceptance Criteria:
- GIVEN a utility function
- WHEN it has zero call sites in fe/src/
- THEN it is removed
- AND its file is deleted if it becomes empty

### 5. Remove console statements
As a developer,
I want all console.log / console.warn / console.debug removed,
so that no debug output leaks to users in production.

Acceptance Criteria:
- GIVEN any .ts or .tsx file in fe/src/
- WHEN scanned
- THEN no console.log, console.warn, console.debug remain
- EXCEPT console.error inside global error boundaries (keep)

### 6. Remove commented-out code
As a developer,
I want commented-out code blocks (3+ consecutive lines) removed.

Acceptance Criteria:
- GIVEN any file containing a commented-out block of 3 or more lines
- WHEN cleanup runs
- THEN the block is removed
- AND single-line explanatory comments are preserved

## Constraints
- No UI behaviour may change
- No API call signatures may change
- TypeScript must compile with zero errors after cleanup
- ESLint must pass with zero warnings after cleanup