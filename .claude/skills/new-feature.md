---
name: new-feature
description: Add a new feature page with page/client split, hooks, i18n parity, error boundary, and metadata.
allowed-tools: Bash, Write, Edit, Read, Grep
---

# Add New Feature

Complete checklist for a new user-facing feature with its own route + data fetching.

## 1. Page files (server/client split)

```
src/app/(main)/{route}/
├── page.tsx       # server component — metadata only
├── client.tsx     # "use client" — actual UI
├── loading.tsx    # optional but recommended (Suspense fallback)
└── error.tsx      # REQUIRED if the page fetches data — see .claude/rules/error-boundaries.md
```

### page.tsx (server)

```tsx
import { createGenerateMetadata } from "@/lib/utils/server";
import PageClient from "./client";

export const generateMetadata = createGenerateMetadata(
  "meta.{titleKey}",
  "meta.{descKey}",
);

export default PageClient;
```

NEVER put `"use client"` on `page.tsx` — you'd lose server-side metadata + locale cookie reads. See `.claude/rules/page-organization.md`.

### client.tsx ("use client")

```tsx
"use client";
import { useAppStore } from "@/lib/stores";

export default function PageClient() {
  const { t } = useAppStore();
  // hooks, state, JSX
}
```

If `client.tsx` exceeds ~300 LOC, refactor into `_components/` + `_hooks/` per `.claude/rules/page-organization.md`.

### error.tsx

```tsx
"use client";
import { useEffect } from "react";
import { reportError } from "@/lib/logging";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reportError(error, { level: "ERROR" }); }, [error]);
  return (
    <div className="p-6">
      <h2>Something went wrong</h2>
      <button onClick={reset}>Retry</button>
    </div>
  );
}
```

Mandatory — without it, a thrown query in this page wipes the layout. See `.claude/rules/error-boundaries.md`.

## 2. i18n parity

Add EVERY new key to BOTH `src/messages/vi.json` AND `src/messages/en.json`:
- `meta.{titleKey}` / `meta.{descKey}` for page metadata
- UI strings under feature namespace (e.g. `projects.newButton`)

See `.claude/commands/add-translation.md` for the full pattern + parity check.

## 3. Route constant

Add to `src/lib/constants/routes.ts`:

```ts
export const ROUTES = {
  // ...
  MY_FEATURE: "/my-feature",
};
```

NEVER hardcode paths in `<Link href="/my-feature">` — always `ROUTES.MY_FEATURE`.

## 4. API wrapper

```ts
// src/features/{module}/api.ts
import { api } from "@/lib/api/client";

export const myFeatureApi = {
  list: (params: ListParams) => api.get("/my-feature", { params }).then((r) => r.data),
  create: (body: CreateBody) => api.post("/my-feature", body).then((r) => r.data),
};
```

ALWAYS use the shared `api` client. NEVER `axios.create()` or `fetch()`. See `.claude/rules/api-client.md`.

## 5. React Query hooks

```ts
// src/features/{module}/hooks/use-my-feature.ts
import { useQuery } from "@tanstack/react-query";
import { myFeatureApi } from "../api";

export function useMyFeatureList(workspaceId?: string) {
  return useQuery({
    queryKey: ["my-feature", workspaceId],
    queryFn: () => myFeatureApi.list({ workspaceId: workspaceId! }),
    enabled: !!workspaceId,
    // staleTime: STALE_DOMAIN_DEFAULT — omit to use provider default 60s
  });
}
```

Pick the right `staleTime` from `@/lib/constants/query-stale` per `.claude/rules/query-stale-time.md`. Default 60s is fine for domain data.

For mutations: see `.claude/rules/react-query.md` — plain invalidation via `useInvalidatingMutation`, optimistic via hand-rolled `useMutation` with `onMutate`/`onError`/`onSettled`.

Re-export from `hooks/index.ts` barrel.

## 6. Types

```ts
// src/features/{module}/types.ts
export type MyFeatureItem = {
  id: string;
  name: string;
  workspaceId: string;
};
```

If BE exposes the type via OpenAPI, prefer importing from `src/lib/api/generated-types.ts` after running `npm run openapi:gen`. See `.claude/commands/openapi-sync.md`.

## 7. Shared imports — don't redeclare

- `cn()` for class merging — from `@/lib/utils`
- `getInitials()` for avatars — from `@/lib/utils`
- `formatDate()` for date strings — from `@/lib/utils`
- `TYPE_CONFIG` / `PRIORITY_CONFIG` / `AVATAR_GRADIENT` — from `@/lib/constants/issue-config`
- `COOKIE_AUTH` / `COOKIE_LOCALE` — from `@/lib/constants/settings`
- `UI_SIZES` / `DEBOUNCE` / `HTTP_STATUS_RANGE` — from `@/lib/constants/ui`

NEVER inline `300ms` debounce, `240px` width, `charAt(0).toUpperCase()` — go through the constants.

## 8. Dark mode

Every hardcoded color needs a `dark:` variant:

```tsx
<div className="bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100">
```

For shadcn semantic tokens (`bg-card`, `text-foreground`) — they already swap automatically. Use those when possible.

## 9. Empty state + loading + error

- Empty: use `<EmptyState>` from `@/components/ui/empty-state`, NEVER redeclare inline.
- Loading: use `<Skeleton>` or `<Spinner>` from `@/components/ui`.
- Error: handled by `error.tsx`. Inline error UIs only for partial failures.

## 10. Lazy-load heavy editors

Tiptap, Recharts, etc. should be `next/dynamic`:

```tsx
const RichEditor = dynamic(() => import("@/components/shared/rich-editor"), { ssr: false });
```

Never inline import these in a page mounted on the critical path.

## 11. Verify

```bash
npx tsc --noEmit
npm run lint
npm run build              # catches server/client boundary issues
# Open in browser → check vi + en + light + dark + smoke-test
```

## 12. Pairing with BE

If this feature requires a new BE endpoint:
1. BE first: add module per `jira-be/.claude/skills/new-module.md`.
2. Run BE locally.
3. FE: `npm run openapi:gen` to refresh types.
4. Wire up FE hooks against the new types.

## Things easy to get wrong

- ❌ `"use client"` in `page.tsx` — loses metadata/locale benefits.
- ❌ i18n key in only one locale file — broken UI in the other.
- ❌ Skipping `error.tsx` on a data-fetching page — error wipes the whole layout.
- ❌ Hardcoded color without `dark:` variant — unreadable in dark mode.
- ❌ Inventing a queryKey for the same data — mutations can't invalidate it.
- ❌ Polling `refetchInterval` on a sidebar component — Neon free-tier compute death.
- ❌ Bypassing the shared `api` client — loses 401 refresh + 429 retry + dedupe.
