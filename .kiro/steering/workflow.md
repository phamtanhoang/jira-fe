---
inclusion: always
---

# Development Workflow — Frontend

## Git Branch Naming

```
feat/<short-description>       ← new feature
fix/<short-description>        ← bug fix
refactor/<short-description>   ← code cleanup, no behaviour change
chore/<short-description>      ← tooling, deps, config
docs/<short-description>       ← documentation only
```

Examples: `feat/issue-search-ui`, `fix/board-drag-drop`, `refactor/remove-dead-hooks`

---

## Commit Message Format (Conventional Commits)

```
<type>(fe): <short description>

Types: feat | fix | refactor | chore | docs | test | style
```

Examples:
```
feat(fe): add burndown chart component
fix(fe): handle 401 on initial page load
refactor(fe): remove unused imports
chore(fe): upgrade @tanstack/react-query to 5.96.2
```

---

## Adding a New FE Feature

1. Add endpoint constants to `src/lib/constants/endpoints.ts`
2. Add API functions to `src/features/xxx/api.ts`
3. Add React Query hooks to `src/features/xxx/hooks/use-xxx.ts`
4. Add types to `src/features/xxx/types.ts`
5. Add Zod schemas to `src/features/xxx/schemas.ts` (if forms needed)
6. Add i18n keys to both `src/messages/en.json` and `src/messages/vi.json`
7. Build components in `src/features/xxx/components/`
8. Wire up page in `src/app/(main)/...`

---

## Commands to Run Before Every Commit

```bash
npx tsc --noEmit    # must show zero TypeScript errors
npx eslint src/     # must show zero warnings
npm run build       # Next.js build must succeed
```

---

## Running the App

```bash
npm run dev      # dev server with hot reload (port 3000)
npm run build    # production build
npm run start    # run production build
npm run lint     # ESLint check
```

Make sure `jira-be` is running on port 4000 before starting the FE dev server.
