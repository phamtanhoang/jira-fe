# Onboarding — Jira Clone Frontend (jira-fe)

Welcome to the team. This doc gets a new dev (or a new Claude Code session) productive in ~15 minutes. Read this **first** before opening tickets.

## TL;DR — the 5 most important things

1. **Next.js 16 App Router + React 19 + TanStack Query + Zustand + Tailwind 4**. Path alias `@/*` → `./src/*`.
2. **Every route page splits into `page.tsx` (server, metadata) + `client.tsx` (`"use client"`, UI).** Don't put `"use client"` on `page.tsx` — you lose locale cookies + metadata generation.
3. **NEVER hardcode strings.** All user-visible text goes through `t()` from `useAppStore`. Every key MUST exist in BOTH `vi.json` AND `en.json`.
4. **ALWAYS use `api` from `@/lib/api/client`** for backend calls. Never `axios.create` or `fetch()`. The shared instance has 401 refresh, 429 retry, breadcrumbs, dedupe, headers — all baked in.
5. **Dark mode is mandatory.** Every `bg-blue-50` needs a matching `dark:bg-blue-950`. Prefer semantic colors (`bg-card`, `bg-muted`, `text-foreground`).

## First-time setup

```bash
git clone <repo>
cd jira-fe
npm install

# Copy env template
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3031 (or your BE URL)

# Run
npm run dev          # http://localhost:3030
```

## Repo map

```
src/
├── app/
│   ├── layout.tsx                # Root providers (Theme → App → Logging → Query → Toaster)
│   ├── (auth)/                   # Public routes: sign-in, sign-up, verify-email, forgot/reset-password
│   ├── (main)/                   # Protected routes (middleware redirects unauthenticated)
│   │   ├── dashboard/page.tsx + client.tsx
│   │   ├── workspaces/[id]/projects/[projectId]/board/...
│   │   └── profile/...
│   └── (admin)/admin/            # ADMIN-only routes — gated by AdminLayout (single role check)
│       ├── logs/                 # System logs + audit + mail logs + user activity
│       ├── settings/             # App info, email, auth providers, quotas, logging config
│       ├── users/                # User management
│       └── flags/                # Feature flags CRUD
├── components/
│   ├── layouts/                  # auth-layout, main-layout, admin-layout — DO NOT cross-import
│   ├── shared/                   # rich-editor (Tiptap), locale-switcher
│   ├── providers/                # AppProvider, QueryProvider, LoggingProvider
│   └── ui/                       # 25+ shadcn-style primitives (button, dialog, popover, ...)
├── features/                     # Feature modules — one per BE module
│   ├── auth/{api,hooks,types,components,schemas}
│   ├── projects/{api,hooks,types,components}  ← biggest feature
│   ├── workspaces/{api,hooks,types,components}
│   ├── admin/{api,hooks,types,schemas,components}
│   ├── logs/{api,hooks,types,components}
│   ├── notifications/{api,hooks,types,components}
│   └── ...
├── lib/
│   ├── api/client.ts             # THE ONE axios instance. Don't create another.
│   ├── config/i18n.ts            # locales, t() helper signature
│   ├── constants/                # ROUTES, ENDPOINTS, COOKIE_*, MSG, UI_SIZES, DEBOUNCE, ...
│   ├── logging/                  # breadcrumbs + reportError (uses bare axios, NOT the api client)
│   ├── react-query/              # useInvalidatingMutation helper
│   ├── stores/                   # Zustand SettingsSlice + LocaleSlice
│   └── utils/                    # cn, getInitials, formatDate, handleApiError, showMessage
├── messages/                     # vi.json + en.json
└── middleware.ts                 # COOKIE_AUTH-based redirect for public/protected boundary
```

## Where to look for what

| I want to... | Open... |
|---|---|
| Add a new feature page | `.claude/skills/new-feature.md` |
| Add a hook with React Query | `.claude/rules/react-query.md` |
| Call a new BE endpoint | `.claude/rules/api-client.md` |
| Add a translation | `src/messages/{vi,en}.json` — must be in BOTH files |
| Use pagination | `.claude/rules/pagination.md` |
| Wire an error boundary | `.claude/rules/error-boundaries.md` |
| Add an admin page | `.claude/rules/admin-area.md` |
| Pre-flight check an upload | `.claude/rules/upload.md` |
| Persist UI state across sessions | localStorage helpers in `features/projects/upload-storage.ts` is the canonical example |

## Conventions cheat sheet

### Page split
```tsx
// src/app/(main)/profile/page.tsx — server
import { createGenerateMetadata } from "@/lib/utils/server";
import ProfileClient from "./client";
export const generateMetadata = createGenerateMetadata("meta.profileTitle", "meta.profileDesc");
export default ProfileClient;
```

```tsx
// src/app/(main)/profile/client.tsx — client
"use client";
import { useCurrentUser } from "@/features/auth/hooks";
import { useAppStore } from "@/lib/stores/use-app-store";

export default function ProfileClient() {
  const { t } = useAppStore();
  const { user } = useCurrentUser();
  return <div>{t("profile.title")}: {user?.name}</div>;
}
```

### API call wrapper
```ts
// src/features/projects/api.ts
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/constants";
import type { Project } from "./types";

export const projectsApi = {
  list: (workspaceId: string) =>
    api.get<Project[]>(ENDPOINTS.projects.base, { params: { workspaceId } }).then((r) => r.data),
};
```

### Hook
```ts
// src/features/projects/hooks/use-projects.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "../api";

export function useProjects(workspaceId: string) {
  return useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => projectsApi.list(workspaceId),
    enabled: !!workspaceId,
  });
}
```

### Mutation with invalidation
```ts
import { useInvalidatingMutation } from "@/lib/react-query/use-invalidating-mutation";

export function useCreateProject(workspaceId: string) {
  return useInvalidatingMutation(
    (payload: CreateProjectPayload) => projectsApi.create(payload),
    ["projects", workspaceId],
    { successMessage: (r) => r.message },
  );
}
```

## Conventions cheat sheet — UI

- **Avatar fallback**: `getInitials(name, email?)` from `@/lib/utils` — never inline `charAt(0)`.
- **Issue type/priority colors**: import `TYPE_CONFIG`, `PRIORITY_CONFIG` from `@/lib/constants/issue-config`.
- **Spacing constants**: `UI_SIZES.SIDEBAR_SM`, `DEBOUNCE.SEARCH`, `HTTP_STATUS_RANGE.CLIENT_ERROR` — never inline magic numbers.
- **Loading spinner**: `<Spinner />` from `@/components/ui/spinner`.
- **Empty state**: `<EmptyState icon title description action />` from `@/components/ui/empty-state`.
- **Lists with 50+ rows**: wrap row in `React.memo` and pass stable `onClick` via `useCallback`.

## Common pitfalls (learn from past pain)

1. **Hardcoding "Jira Clone"** — get app name from `useAppStore().name`. Admin can rebrand at runtime.
2. **Adding a translation key only to `en.json`** — type system doesn't catch the gap, FE renders the raw key. Always update BOTH files.
3. **Creating a second axios instance** — you lose 401 refresh, dedupe, breadcrumbs. Use `api` from `@/lib/api/client`.
4. **`useQueryClient()` named `qc`** — convention is `queryClient`. Reviewer flags `qc`.
5. **Missing `dark:` variant on light colors** — `bg-blue-50` alone breaks dark mode.
6. **Forgetting `enabled:` guard on conditional queries** — e.g. `useProjects(workspaceId)` runs with undefined → BE 404. Add `enabled: !!workspaceId`.
7. **Mounting `useCurrentUser` on public auth pages** — burns a `/auth/me` call per mount. The hook now self-gates on `COOKIE_AUTH` but pre-check first.
8. **Cross-importing layout folders** — `auth-layout/sidebar` ≠ `main-layout/sidebar`. They're isolated by design.

## i18n is type-safe

`t()` types accept only keys present in BOTH `vi.json` and `en.json` (TypeScript merges them). If you add a key to `en.json` but not `vi.json`, you'll get a compile error when consuming it.

Common pattern: add the key with `""` placeholder in vi.json first, then fill in real Vietnamese later.

## Deploy

CI builds the Docker image and pushes to Docker Hub. VPS pulls + recreates the container automatically on push to `main`.

```bash
git push origin main   # CI takes ~5 min to deploy
```

No env mutation needed FE-side — `NEXT_PUBLIC_API_URL` is baked into the image at build time. Change requires rebuild.

## Need help?

- Specs: `.claude/specs/*.md` — historical context on past features
- Memory: `.claude/memory.md` — non-obvious patterns learned the hard way
- Rules: `.claude/rules/*.md` — must-follow conventions, indexed in `RULES_INDEX.md`
- Agents: `.claude/agents/*.md` — Claude sub-agents you can invoke (`debugger`, `reviewer`, ...)
- Commands: `.claude/commands/*.md` — slash commands for common workflows

When Claude Code starts a new session, it reads `CLAUDE.md` automatically. The first thing you should do as a human is open `.claude/ONBOARDING.md` (this file) and skim the cheat sheet sections.
