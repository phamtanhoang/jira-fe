# Jira Clone — Frontend

Next.js project management UI with Kanban boards, sprint planning, and issue tracking.

## Tech Stack
- Next.js 16.2.2, React 19.2.4, TypeScript ^5
- Styling: TailwindCSS ^4, tw-animate-css ^1.4.0, clsx + tailwind-merge
- UI: @base-ui/react ^1.3.0 (shadcn base-nova style), lucide-react ^1.7.0
- State: zustand ^5.0.12, @tanstack/react-query ^5.96.2
- Forms: react-hook-form ^7.72.1, @hookform/resolvers ^5.2.2, zod ^4.3.6
- HTTP: axios ^1.14.0
- Theme: next-themes ^0.4.6
- Notifications: sonner ^2.0.7
- Rich Text: @tiptap/react, @tiptap/starter-kit, @tiptap/extension-placeholder, @tiptap/extension-character-count, @tiptap/extension-image

## Commands
```bash
npm run dev       # Dev server (port 3000)
npm run build     # Next.js production build
npm run lint      # ESLint
```

## Directory Structure
```
src/
├── app/
│   ├── layout.tsx              # Root: ThemeProvider → AppProvider → LoggingProvider → QueryProvider → Toaster
│   ├── (auth)/                 # Public routes: sign-in, sign-up, verify-email, forgot/reset-password
│   └── (main)/                 # Protected routes: dashboard, workspaces, issues, profile, admin/logs
│       └── {page}/
│           ├── page.tsx        # Server component — generateMetadata + re-export client
│           └── client.tsx      # "use client" — actual UI
├── components/
│   ├── layouts/
│   │   ├── auth-layout/        # AuthLayout → components/ (header, footer)
│   │   └── main-layout/        # MainLayout → components/ (header, sidebar — admin sees "Request Logs" link)
│   ├── shared/                 # locale-switcher, rich-editor (Tiptap — RichEditor + RichContent)
│   ├── providers/              # AppProvider (zustand init), QueryProvider (staleTime 60s, retry 1), LoggingProvider (nav + click breadcrumbs)
│   └── ui/                     # 18 shadcn components: avatar, badge, button, card, dialog, dropdown-menu, form, input, label, scroll-area, select, separator, sheet, skeleton, spinner, tabs, textarea, tooltip
├── features/
│   ├── auth/                   # api.ts, hooks.ts, types.ts (AuthUser has optional role: "USER"|"ADMIN"), schemas.ts, components/
│   ├── projects/               # api.ts, types.ts, hooks/ (7 domain-split files), components/ (12 components)
│   ├── workspaces/             # api.ts, hooks.ts, types.ts, components/ (2 components)
│   └── logs/                   # Admin-only. api.ts, hooks.ts, types.ts, components/ (logs-table, logs-filters, log-detail-sheet)
├── lib/
│   ├── api/client.ts           # Axios: baseURL="/api", withCredentials, x-timezone header, 401 auto-refresh, breadcrumb + error reporting
│   ├── config/i18n.ts          # locales: ["vi","en"], defaultLocale: "vi", t(locale, key, vars?)
│   ├── constants/              # routes, endpoints, settings, issue-config, validation
│   ├── logging/                # breadcrumbs.ts (ring buffer 50), report.ts (bare axios → /logs/client + Sentry), types.ts
│   ├── stores/                 # Zustand: SettingsSlice + LocaleSlice
│   └── utils/                  # cn(), getInitials(), formatDate/Short/Time(), toggleArrayItem(), showMessage(), handleApiError()
├── messages/                   # vi.json + en.json — 30+ admin.logs.* keys added for admin logs UI
└── middleware.ts               # Checks COOKIE_AUTH cookie → redirect public↔protected routes
```

### Root files (Sentry instrumentation)
- `instrumentation.ts` — Node/edge runtime init
- `instrumentation-client.ts` — browser init
Both no-op when `NEXT_PUBLIC_SENTRY_DSN` missing.

## API Communication
- Axios on `/api/*` → Next.js rewrite → backend (NEXT_PUBLIC_API_URL)
- Every request gets x-timezone header (Intl.DateTimeFormat)
- Every request pushes a breadcrumb (method + url); skipped for `/logs/client` to avoid recursion
- 401 responses trigger auto-refresh: queue failed requests, refresh once, replay all
- Non-401 errors call `reportError()` → Sentry + POST /logs/client with breadcrumbs attached
- Auth state: COOKIE_AUTH="1" cookie (set by FE login hook, checked by middleware)

## Observability
- `LoggingProvider` captures navigation (via `usePathname`) and global clicks (capture phase) → pushes to in-memory breadcrumb buffer (cap 50)
- On any unrecoverable API error OR React error boundary catch → `reportError()` sends to Sentry + `/api/logs/client`
- Breadcrumbs are a plain module-level array — NOT zustand. They never trigger re-renders and are not persisted
- Sentry disabled automatically when `NEXT_PUBLIC_SENTRY_DSN` is missing — safe for dev

## i18n
- Vietnamese (default) + English
- Files: src/messages/vi.json, src/messages/en.json
- Client-side: `const { t } = useAppStore()` → `t("section.key", { var: value })`
- Server-side metadata: `createGenerateMetadata("meta.titleKey", "meta.descKey")`
- Locale stored in COOKIE_LOCALE, persisted 1 year

## Things Easy to Get Wrong
- Main pages MUST split into page.tsx (server, metadata) + client.tsx ("use client")
- Layout folders: NEVER cross-import between auth-layout and main-layout
- Shared constants: ALWAYS import TYPE_CONFIG, PRIORITY_CONFIG, AVATAR_GRADIENT from @/lib/constants/issue-config — NEVER redefine locally
- Shared utils: ALWAYS use getInitials() — NEVER write charAt(0).toUpperCase() inline
- i18n: EVERY new key must exist in BOTH vi.json AND en.json
- App name: NEVER hardcode "Jira Clone" or any app name — always from store/settings
- Cookie: ALWAYS use COOKIE_AUTH constant — NEVER hardcode "is_authenticated"
- Dark mode: ALWAYS add `dark:` variant when using hardcoded bg colors (bg-blue-50 → dark:bg-blue-950)
- Hooks: ALWAYS use `queryClient` (not `qc`) for useQueryClient() variable name
- UNASSIGNED_VALUE ("__none__") for unassigned select — NEVER hardcode the string
- Rich text: description + comments use Tiptap (RichEditor/RichContent from @/components/shared/rich-editor). HTML stored in DB. Use `minimal` prop for comments (no headings/image)
- Logging: call `reportError()` from `@/lib/logging` ONLY for unexpected failures. Expected validation errors use `handleApiError()` (toast only, no backend log)
- Logging: NEVER import from `@/lib/logging/report` inside the axios `api` client interceptor without using the bare `logClient` — recursion will crash the tab
- Logging: do NOT capture `<input>` values in breadcrumbs — leak risk. `LoggingProvider` intentionally reads `textContent` only, not values
- Admin routes: `src/app/(main)/admin/*` must check `user.role === "ADMIN"` in client.tsx AND hide the nav link in sidebar — BE enforces via `@Roles(Role.ADMIN)` regardless, but UX should not expose links to non-admins
