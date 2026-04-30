# Contributing to Jira Clone Frontend

Thanks for your interest in contributing! This guide gets you from clone to merged PR.

## Quick start

```bash
git clone <repo-url> jira-fe
cd jira-fe
cp .env.example .env       # set NEXT_PUBLIC_API_URL to your backend
npm install
npm run dev                # boots on port 3030
```

Visit http://localhost:3030. Backend must be running (default expects `http://localhost:3031`).

## Stack

- **Framework**: Next.js 16 App Router + React 19 + TypeScript 5 (strict + 4 extra flags)
- **Styling**: TailwindCSS 4, shadcn/ui (base-ui/react primitives), lucide-react icons
- **State**: Zustand (settings + locale slices), TanStack Query 5 (server state)
- **Forms**: react-hook-form + Zod resolvers
- **HTTP**: single axios instance (`@/lib/api/client`) with GET dedupe + 401 refresh + 429 retry
- **Rich text**: Tiptap (lazy-loaded)
- **Observability**: Sentry (production only) + breadcrumb ring buffer + `/logs/client` ingest

## Folder layout

```
src/
├── app/             # Next.js App Router routes
├── components/      # layouts, providers, shared, ui (shadcn primitives)
├── features/        # 18 feature modules (auth, projects, workspaces, ...)
├── lib/             # api/, config/, constants/, hooks/, logging/, react-query/, stores/, types/, utils/
├── messages/        # vi.json (default) + en.json
└── middleware.ts    # auth + maintenance gate
```

## Pull request checklist

Before opening a PR:

- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes (strict + noUnusedLocals/Parameters/ImplicitReturns/FallthroughCasesInSwitch)
- [ ] `npm run build` succeeds (Next production build)
- [ ] `npm run test:run` green (Jest unit tests if added)
- [ ] Manual smoke: `npm run dev`, try the UI flow in browser
- [ ] If new page: split `page.tsx` (server, metadata) + `client.tsx` (`"use client"`, UI)
- [ ] If new i18n key: add to **both** `vi.json` AND `en.json` in same change
- [ ] If new form: use `react-hook-form` + `zodResolver`, schema in `features/xxx/schemas.ts`

## Conventions (the bare minimum)

- **API calls**: only via `api` from `@/lib/api/client` (gives you GET dedupe, x-timezone, 401 refresh, 429 retry, breadcrumbs). Never `axios.create()` elsewhere or use `fetch()` directly.
- **No hardcoded display text** — always `t("section.key")` from `useAppStore()`.
- **No hardcoded UI sizes/timings** — `UI_SIZES`, `DEBOUNCE`, `HTTP_STATUS_RANGE` from `@/lib/constants/ui`.
- **No hardcoded staleTime** — pick from `@/lib/constants/query-stale` (`STALE_AUTH_USER`, `STALE_PUBLIC_SETTING`, etc.).
- **Avatar initials** — always `getInitials(name, email?)` from `@/lib/utils`. Never inline `name.charAt(0).toUpperCase()`.
- **Dark mode** — every hardcoded color needs `dark:` variant (`bg-blue-50 dark:bg-blue-950`). Prefer semantic (`bg-card`, `text-foreground`).
- **List rows ≥ 50** — wrap in `React.memo` + parent passes stable `useCallback` handlers.

Detailed rules in `.claude/rules/*.md`.

## Commit style

Conventional-ish — lead with verb, present tense:

```
feat(board): add roadmap view
fix(auth): clear cookie on logout regression
chore: bump deps
docs: clarify component-patterns rule
refactor(rich-editor): extract mention list
```

## Reporting issues

Open a GitHub issue with: reproduction steps, expected vs actual, browser + Next.js version, screenshot if visual. For security issues, see [SECURITY.md](./SECURITY.md) — do **not** open a public issue.
