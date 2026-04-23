---
paths:
  - "src/app/**/*"
  - "src/components/layouts/**/*"
  - "src/features/**/*"
---

# Architecture

## Page Structure
- Auth pages: server component with generateMetadata + client form component
- Main pages: ALWAYS split into page.tsx (server, metadata) + client.tsx ("use client", UI)
- ALWAYS use createGenerateMetadata(titleKey, descKey) for page metadata — reads locale from cookie

## Route Groups
- `src/app/(auth)/` — public auth forms
- `src/app/(main)/` — authenticated end-user routes (dashboard, workspaces, issues, profile)
- `src/app/(admin)/admin/*` — ADMIN-only routes. ALWAYS place admin pages here, NEVER under `(main)`
- Admin role gating lives in `AdminLayout` (single place) — do NOT duplicate the `user.role !== "ADMIN"` check in individual admin client.tsx files

## Layout Structure
```
xxx-layout/
├── index.tsx              # Import from ./components
└── components/
    ├── index.ts           # Barrel export
    ├── header/index.tsx
    └── footer/index.tsx   # or sidebar/
```
- NEVER cross-import between auth-layout, main-layout, and admin-layout — each self-contained
- NEVER import admin-layout/sidebar from main-layout/sidebar or vice versa

## Hooks Organization (features/projects/hooks/)
- ALWAYS split by domain: use-projects.ts, use-board.ts, use-issues.ts, use-comments.ts, use-sprints.ts, use-worklogs.ts, use-labels.ts
- ALWAYS re-export via hooks/index.ts barrel
- ALWAYS name useQueryClient() variable as `queryClient` (NEVER `qc`)
- ALWAYS invalidate correct cache keys: ["board", projectId], ["issues", projectId], ["comments", issueId]

## Feature Module Structure
```
features/xxx/
├── api.ts          # Axios calls with .then(r => r.data)
├── types.ts        # TypeScript interfaces
├── hooks/          # or hooks.ts for smaller modules
│   ├── index.ts    # Barrel export
│   └── use-xxx.ts  # Domain-specific hooks
└── components/     # Feature-specific components
```
