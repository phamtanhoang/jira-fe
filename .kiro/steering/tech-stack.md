---
inclusion: always
---

# Tech Stack — Frontend

## Dependencies (`jira-fe/package.json`)

| Package | Version | Role |
|---|---|---|
| `next` | 16.2.2 | App Router framework |
| `react` | 19.2.4 | UI library |
| `@tanstack/react-query` | ^5.96.2 | Server state / data fetching |
| `zustand` | ^5.0.12 | Client state (locale, app settings) |
| `axios` | ^1.14.0 | HTTP client |
| `react-hook-form` | ^7.72.1 | Form state management |
| `zod` | ^4.3.6 | Schema validation |
| `@hookform/resolvers` | ^5.2.2 | Zod ↔ RHF bridge |
| `@base-ui/react` | ^1.3.0 | Headless UI primitives (Dialog, Select, Tabs, etc.) |
| `@dnd-kit/core` | ^6.3.1 | Drag and drop core |
| `@dnd-kit/sortable` | ^10.0.0 | Sortable DnD |
| `@tiptap/react` | ^3.22.3 | Rich text editor |
| `recharts` | ^3.8.1 | Charts (burndown chart) |
| `sonner` | ^2.0.7 | Toast notifications |
| `lucide-react` | ^1.7.0 | Icons |
| `tailwindcss` | ^4 | Utility CSS |
| `class-variance-authority` | ^0.7.1 | Component variant helper (`cva`) |
| `clsx` | ^2.1.1 | Conditional class names |
| `tailwind-merge` | ^3.5.0 | Merge Tailwind classes without conflicts |
| `cmdk` | ^1.1.1 | Command palette |
| `next-themes` | ^0.4.6 | Theme switching |
| `typescript` | ^5 | Language |

---

## ALWAYS / NEVER Rules

**ALWAYS** use the `api` Axios instance from `@/lib/api` for all HTTP calls — it adds `x-timezone` header and handles 401 auto-refresh.

**ALWAYS** use `handleApiError` from `@/lib/utils` as `onError` in every `useMutation` — it extracts the BE message key and shows a translated toast.

**ALWAYS** use `showMessage(result.message)` in `onSuccess` for mutations that return a `message` field — keeps toast behaviour consistent.

**ALWAYS** define React Query keys as arrays: `["entity", id, ...filters]` — e.g. `["issues", projectId, filters]`.

**ALWAYS** use `cn()` from `@/lib/utils` for conditional Tailwind class merging.

**ALWAYS** use `t("section.key")` from `useAppStore()` for all user-visible strings — never hardcode English text in JSX.

**ALWAYS** add `"use client"` to any component that uses hooks, browser APIs, or event handlers.

**ALWAYS** add new i18n keys to both `src/messages/en.json` and `src/messages/vi.json`.

**ALWAYS** define Zod schemas in `features/xxx/schemas.ts` and infer the TypeScript type with `z.infer<typeof schema>`.

**NEVER** use `fetch()` directly — always use the `api` Axios instance.

**NEVER** use `console.log`, `console.warn`, or `console.debug` — use `console.error` only inside server utilities or error boundaries.

**NEVER** hardcode route strings — use `ROUTES.*` from `@/lib/constants`.

**NEVER** hardcode API endpoint strings — use `ENDPOINTS.*` from `@/lib/constants`.

**NEVER** import from `@/lib/stores/slices/*` directly — always use `useAppStore` from `@/lib/stores/use-app-store`.
