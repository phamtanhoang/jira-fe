---
inclusion: fileMatch
globs: ["src/**/*.tsx", "src/**/*.ts"]
---

# Frontend Conventions

## Import Alias

`@/*` maps to `jira-fe/src/*` (configured in `tsconfig.json`).

```ts
import { api } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
```

---

## File & Folder Organisation

```
src/
  app/                        ← Next.js App Router pages
    (auth)/                   ← Auth route group (no layout chrome)
    (main)/                   ← Main app route group (sidebar + header)
  components/
    ui/                       ← shadcn/base-ui primitives (Button, Input, etc.)
    shared/                   ← Reusable cross-feature components
    layouts/                  ← Layout wrappers (auth-layout, main-layout)
    providers/                ← React context providers (AppProvider, QueryProvider)
  features/
    auth/                     ← api.ts, hooks.ts, schemas.ts, types.ts, components/
    projects/                 ← api.ts, types.ts, hooks/, components/
    workspaces/               ← api.ts, hooks.ts, types.ts, components/
  lib/
    api/                      ← Axios client + index re-export
    config/                   ← i18n config
    constants/                ← ROUTES, ENDPOINTS, COOKIE_AUTH, issue-config, etc.
    stores/                   ← Zustand store (use-app-store.ts + slices/)
    types/                    ← Shared TypeScript types
    utils/                    ← cn, format, message, metadata, server/
  messages/                   ← en.json, vi.json
  middleware.ts               ← Auth redirect middleware
```

### Naming conventions
- Page files: `page.tsx`, `client.tsx` (client component for the page), `layout.tsx`
- Feature components: PascalCase, one component per file, named export
- Hooks: `use-kebab-case.ts`, named export `export function useXxx()`
- API modules: `api.ts` with a plain object export (`export const issuesApi = { ... }`)
- Types: `types.ts` with named `export type` / `export interface`

---

## Component Structure

```tsx
"use client"; // only if using hooks, browser APIs, or event handlers

import { useState } from "react";
import { useAppStore } from "@/lib/stores/use-app-store";
// ... other imports

export function MyComponent({ prop }: { prop: string }) {
  const { t } = useAppStore();
  // hooks first, then derived state, then handlers, then JSX
  return <div>{t("some.key")}</div>;
}
```

- Named exports only (no default exports for feature components)
- `"use client"` only when needed — keep server components where possible
- Props typed inline or with a local `type Props = { ... }`

---

## Form Pattern: Zod + React Hook Form

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

// 1. Define schema in features/xxx/schemas.ts
const mySchema = z.object({
  email: z.string().min(1, { message: "EMAIL_REQUIRED" }),
});
type MyForm = z.infer<typeof mySchema>;

// 2. Use in component
const form = useForm<MyForm>({
  resolver: zodResolver(mySchema),
  defaultValues: { email: "" },
});

// 3. Validation error messages are MSG keys (e.g. "EMAIL_REQUIRED")
//    Translate them with:
const te = (key: string) => t(`validation.${key}` as "validation.EMAIL_INVALID");
// Pass te to <FormMessage renderMessage={te} />

// 4. Submit via button onClick (not form onSubmit — avoids page reload):
<Button onClick={form.handleSubmit((data) => mutate(data))}>Submit</Button>
```

---

## Data Fetching Pattern: React Query

```ts
// In features/xxx/hooks/use-xxx.ts
"use client";

export function useXxx(id: string) {
  return useQuery({
    queryKey: ["xxx", id],           // array, entity name first
    queryFn: () => xxxApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateXxx() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateXxxPayload) => xxxApi.create(data),
    onSuccess: (result) => {
      showMessage(result.message);                           // toast
      queryClient.invalidateQueries({ queryKey: ["xxx"] }); // refresh
    },
    onError: handleApiError,                                // always
  });
}
```

Query key conventions used in this codebase:
- `["auth", "me"]` — current user
- `["issues", projectId, filters]` — issue list
- `["issues-infinite", projectId, sprintId]` — paginated issues
- `["board", projectId]` — board data
- `["issue", key]` — single issue by key

---

## Error → Toast Flow

1. Axios response interceptor catches errors → `Promise.reject(error)`
2. React Query `onError: handleApiError` is called
3. `handleApiError(error)` in `src/lib/utils/message.ts`:
   - Extracts `error.response.data.message` (the MSG key string from BE, e.g. `"ISSUE_NOT_FOUND"`)
   - Looks up `messages.ISSUE_NOT_FOUND` in the active locale via `useAppStore.getState().t()`
   - Calls `toast.error(translatedMessage)` via `sonner`
4. For success: `showMessage(result.message)` — uses `toast.success` for keys in `SUCCESS_KEYS` set, `toast.error` for error keys

---

## i18n: Adding a New Key

1. Add to `src/messages/en.json` under the appropriate section:
   ```json
   { "mySection": { "myKey": "My English text" } }
   ```
2. Add to `src/messages/vi.json`:
   ```json
   { "mySection": { "myKey": "Văn bản tiếng Việt" } }
   ```
3. Use in a component:
   ```tsx
   const { t } = useAppStore();
   t("mySection.myKey")  // TypeScript autocompletes valid keys
   ```
4. For BE message keys (toasts), add to the `"messages"` section of both JSON files.

`MessageKey` type is auto-derived from `vi.json` — TypeScript will error if you use a key that doesn't exist.

---

## Zustand Store

- Single store: `useAppStore` from `@/lib/stores/use-app-store.ts`
- Composed from `SettingsSlice` (app name, logo, description) and `LocaleSlice` (locale, `t()` function)
- Hydrated server-side in `AppProvider` before first render
- Access: `const { t, locale, appName } = useAppStore()`
- Never import slice files directly — always use `useAppStore`
