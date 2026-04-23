# Feature: Admin Area (separate route group)

## Status: done

## Context
Admin-only pages currently live inside the `(main)` route group and reuse `MainLayout`. Problems:
- Admin navigation is a single link tacked onto the user sidebar.
- No room to grow: future admin features (app info, email config, users, feature flags) would pollute the user sidebar.
- Admin and end-user contexts mix — harder to style distinctly, harder to reason about access.

This spec extracts admin into its own route group `(admin)` with a dedicated `AdminLayout`, and adds pages for the existing BE `app.info` / `app.email` settings keys.

Pairs with BE spec [admin-settings-api.md](../../../jira-be/.claude/specs/admin-settings-api.md) (no new BE endpoints — the existing `GET/PUT /settings/:key` under `@Roles(Role.ADMIN)` is sufficient).

## Routes

All new routes are protected by the existing auth middleware (cookie check). Admin role is enforced:
1. **BE** — `@Roles(Role.ADMIN)` on every admin-reachable endpoint (authoritative).
2. **FE** — `AdminLayout` redirects non-admins to `/dashboard` (UX only, not a security boundary).

```
/admin                → Admin overview (tiles: logs count, app info, email status)
/admin/logs           → Request Logs (moved from (main)/admin/logs)
/admin/settings       → Tabbed settings page: App Info + App Email
```

`ROUTES.ADMIN_LOGS` stays at `/admin/logs` — FE callers don't change.

New `ROUTES` entries:
- `ADMIN: "/admin"`
- `ADMIN_SETTINGS: "/admin/settings"`

## Directory Layout

```
src/app/
├── (auth)/                         # unchanged
├── (main)/                         # unchanged; admin/ folder REMOVED
└── (admin)/                        # NEW route group
    ├── layout.tsx                  # wraps in <AdminLayout>
    └── admin/
        ├── page.tsx + client.tsx          # overview
        ├── logs/page.tsx + client.tsx     # moved from (main)
        └── settings/page.tsx + client.tsx # app.info + app.email tabs

src/components/layouts/admin-layout/
├── index.tsx                       # AdminLayout shell
└── components/
    ├── index.ts
    ├── header/index.tsx            # "Admin" badge, user menu, "Back to app" link
    └── sidebar/index.tsx           # Overview · Request Logs · Settings

src/features/admin/
├── api.ts                          # getSetting(key), setSetting(key, value)
├── hooks.ts                        # useSetting, useUpdateSetting, useLogsStats
├── schemas.ts                      # zod: appInfoSchema, appEmailSchema
└── types.ts                        # AppInfoValue, AppEmailValue
```

## Acceptance Criteria

### Access control
- [ ] `AdminLayout` (client component) reads `useCurrentUser()`; while loading → spinner; if `user.role !== "ADMIN"` → `router.replace(ROUTES.DASHBOARD)` and returns null
- [ ] Every admin `client.tsx` drops its own role check — single source of truth is `AdminLayout`
- [ ] `MainLayout` sidebar STOPS rendering the "Request Logs" nav link; replaced with an "Admin" link visible only to admins that routes to `/admin`

### Admin shell (layout)
- [ ] Dedicated header with "Admin" badge (distinct styling) + app logo/name + "Exit admin" link back to `/dashboard` + user dropdown (reuse header user menu pattern)
- [ ] Sidebar with 3 sections: Overview, Request Logs, Settings — active state highlighted
- [ ] Sidebar collapse persists via same localStorage key pattern
- [ ] Dark mode fully supported (no hardcoded colors without `dark:` variant)

### Overview page — `/admin`
- [ ] 3 summary cards: Request Logs (24h ERROR count), App Info (preview `name` + logo), App Email (preview `email` or "Not configured")
- [ ] Each card is clickable → navigates to the relevant page
- [ ] Uses `Card`, `Badge` shadcn components; icons from `lucide-react`

### Request Logs page — `/admin/logs`
- [ ] Functionally identical to old `(main)/admin/logs` — table + filters + detail sheet
- [ ] Page-level role guard REMOVED (layout handles it)

### Settings page — `/admin/settings`
- [ ] `<Tabs>` with two tabs: "App Info" and "App Email"
- [ ] **App Info tab** — fields: `name`, `logoUrl`, `description`, `authorName`, `authorUrl` (matches `AppSettings` shape). Submit via zod + react-hook-form → `PUT /settings/app.info`. Toast `SETTINGS_UPDATED`.
- [ ] **App Email tab** — fields: `email` (the FROM address used by MailService). Submit → `PUT /settings/app.email`.
- [ ] After save: invalidate `["auth", "me"]` only if app name changed (so header rerenders) and `["settings", key]`
- [ ] Empty settings do NOT throw — if `GET /settings/:key` returns 404, form shows defaults
- [ ] Loading state → skeleton; submit state → spinner on button

### i18n
- [ ] New keys under `admin.nav.*`, `admin.overview.*`, `admin.settings.*`, `admin.common.*` in BOTH `en.json` and `vi.json`
- [ ] `nav.adminLogs` key KEPT (still referenced), new `nav.admin` key added for MainLayout's admin link
- [ ] New `MSG.SETTINGS_UPDATED` in `messages` section of both JSON files

### Tests (unit)
- [ ] `features/admin/schemas.test.ts` — appInfoSchema + appEmailSchema happy/error paths
- [ ] Existing tests still pass

### Docs
- [ ] `CLAUDE.md` updated: new directory under `src/app/(admin)/`, new `admin-layout`, new `features/admin/`
- [ ] `rules/architecture.md` updated with the admin route group guidance

## Non-goals
- No user management UI (CRUD users, roles). Future work.
- No feature flags UI. Future work.
- No BE changes — existing `@Roles(Role.ADMIN)` endpoints are sufficient.
