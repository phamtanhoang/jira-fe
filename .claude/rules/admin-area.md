# Admin Area (`/admin/*`)

Routes under `src/app/(admin)/admin/*`. Mounted under a dedicated `AdminLayout` that gates `user.role === "ADMIN"` once — individual pages MUST NOT duplicate the check.

## Layout

`src/components/layouts/admin-layout/` — separate from `main-layout/`. No cross-imports allowed.

- Header: amber "Admin" badge + "Back to app" link
- Sidebar: grouped — Overview / Operations (logs, users) / Configuration (settings, flags, announcement)
- Footer: dedicated `AdminFooter`

If the user lands on `/admin/*` without `role === "ADMIN"` the layout redirects to `/dashboard`. BE enforces independently via `@Roles(Role.ADMIN)`.

## File layout for admin pages

```
src/app/(admin)/admin/
├── layout.tsx              # AdminLayout (role gate)
├── page.tsx + client.tsx   # Overview dashboard
├── error.tsx               # Sentry-reporting error boundary (route-group fallback)
├── logs/
│   ├── page.tsx
│   ├── client.tsx          # Tabs: Requests | Audit | User activity | Email | Webhooks
│   └── error.tsx
├── users/
├── settings/
├── flags/
├── announcement/
└── _components/            # underscore prefix → Next.js skips routing
    └── admin-page-error.tsx
```

Underscore-prefixed folders (`_components`, `_hooks`) are private to the admin section. Use them for shared admin-only components.

## API calls from admin

The shared axios `api` instance auto-adds `x-origin: admin` header when `window.location.pathname.startsWith('/admin')`. BE uses this in `shouldSkipLogging()` (legacy — kept for backward compat, mostly inert after event-log refactor) to know which requests are admin-origin and skip noisy logs.

You don't need to add the header yourself — it's automatic.

## Error boundaries are mandatory

Per `.claude/rules/error-boundaries.md`, every admin sub-page with its own data fetching MUST have an `error.tsx`. Without it, a thrown query collapses the entire admin shell (sidebar disappears, user can't navigate elsewhere to fix bad config).

Shared body via `_components/admin-page-error.tsx`:

```tsx
// e.g. src/app/(admin)/admin/logs/error.tsx
"use client";
import { AdminPageError } from "../_components/admin-page-error";
export default AdminPageError;
```

## Admin reads should NOT be logged

The whole reason `x-origin: admin` exists. Don't add per-request logging from admin pages that would otherwise drown out end-user activity.

After the event-log refactor (`.claude/rules/event-logging.md` in BE) this is mostly moot since BE doesn't log per-request anymore. But the header still serves as a safety net.

## Settings + toggles pattern

Admin pages that edit settings use `useSetting<T>` + `useUpdateSetting<T>` from `@/features/admin/hooks`:

```tsx
const { data, isLoading } = useSetting<AppInfoValue>(SETTING_KEYS.APP_INFO);
const { mutate } = useUpdateSetting<AppInfoValue>(SETTING_KEYS.APP_INFO);
```

For "toggles in a popover" pattern (like the logging-config switch on `/admin/logs`), use a local override state to flip UI instantly before the mutation completes:

```tsx
const [override, setOverride] = useState<Value | null>(null);
const draft = useMemo(() => override ?? row?.value ?? DEFAULTS, [override, row]);

const update = (patch: Partial<Value>) => {
  const next = { ...draft, ...patch };
  setOverride(next);
  mutate(next, { onSuccess: () => setOverride(null) });
};
```

This avoids the laggy "click toggle → wait 1s → flip" UX.

## Admin operations on /admin/logs

The page has 5 tabs (Requests, Audit, User activity, Email, Webhooks). Each tab is a separate panel:
- `RequestsTab` (inline) — paginated event log with filters
- `AuditPanel` from `@/features/admin-audit/components`
- `UserActivityPanel` from `@/features/admin-users/components`
- `MailLogsPanel` from `@/features/mail-logs/components`
- `WebhookDeliveriesPanel` from `@/features/webhooks/components`

Header has Density toggle (compact/comfortable) and Logging-config popover.

## Audit logs renderer

`describeAudit(log)` in `@/features/admin-audit` reads the `payload` JSON and produces a human-readable line (e.g. "Deleted attachment Profile.pdf"). If BE didn't enrich the payload (see BE `.claude/rules/audit-log.md`), this falls back to raw UUID.

When adding a new admin audit action:
1. BE: add to `AuditAction` union + emit with enriched payload.
2. FE: update `describeAudit()` to recognize the new action type.

## Things easy to get wrong

- ❌ Duplicating `user.role === "ADMIN"` check in `client.tsx` of admin pages — AdminLayout already does it once.
- ❌ Importing from `main-layout/sidebar` into an admin page — layouts are isolated by design.
- ❌ Forgetting `error.tsx` on a new admin sub-page that does its own fetching — first thrown query wipes the whole shell.
- ❌ Polling endpoints from admin pages (e.g. `useUnreadCount`) — bell badge polling makes sense on user pages, NOT on admin. Admin pages should be "read on click".
