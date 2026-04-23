# Feature: Admin Area — Enhancements

## Status: done

## Context
Builds on [admin-area.md](./admin-area.md) (the route-group split). Adds substantive admin functionality beyond logs and basic app settings, plus a visually distinct admin footer so the admin experience reads as a truly separate product surface.

Pairs with BE spec [../../../jira-be/.claude/specs/admin-users-api.md](../../../jira-be/.claude/specs/admin-users-api.md).

## Deliverables (all new)

### 1. Admin Footer
- `src/components/layouts/admin-layout/components/footer/index.tsx`
- Subtle bottom bar: app version (from `package.json` at build time via `process.env.NEXT_PUBLIC_APP_VERSION` or fallback), "System" label, link to Swagger docs (`${NEXT_PUBLIC_API_URL}/api` — BE mounts Swagger at `/api`).
- Matches the amber/admin accent used in header + sidebar — no pastel colors borrowed from the user-facing footer.
- Wired into `AdminLayout` between `<main>` and the bottom of the flex column.

### 2. User Management — `/admin/users`
- Table columns: Avatar + Name, Email, Role badge, Email verified ✓/✗, Created, Actions (change role / delete dropdown)
- Filters: search (email or name), role (USER/ADMIN/all), verified (yes/no/all)
- Cursor pagination — "Load more" button (same pattern as logs)
- Actions:
  - Change role dropdown (USER ↔ ADMIN) — confirms before apply
  - Delete — destructive red button with confirm dialog; disabled on self
- Cannot change role / delete own account — UI disables those actions when `user.id === currentUser.id`; BE also enforces
- Feature folder: `src/features/admin-users/` with `api.ts`, `hooks.ts`, `types.ts`

### 3. System Stats — overview upgrade
- `/admin` overview replaces the 3 static cards with a stat row (users · admins · workspaces · projects · issues) + the existing 3 nav cards + a "Last 24h logs by level" mini bar (INFO/WARN/ERROR counts).
- Calls `GET /admin/stats` once (single round-trip). Skeleton during load.
- Hook: `useAdminStats()` in `@/features/admin-users/hooks`

### 4. Feature Flags — `/admin/flags`
- Settings-based (no BE route change). Stored in `app.features` setting, shape: `Record<string, boolean>`.
- Table: flag name, on/off toggle. Add new flag (input + initial value). Delete row.
- Exposes `useFeatureFlag(key: string)` hook that consumes app.features from `useAppStore()` — requires adding `features` to `SettingsSlice` and hydrating it in `AppProvider`.
- Changes are persisted via `PUT /settings/app.features`; on success the store is updated immediately so app reflects the new flag value without reload.

### 5. Announcement Banner — `/admin/announcement`
- Settings-based. Stored in `app.announcement` setting: `{ enabled: boolean, message: string, severity: "info"|"warn"|"critical" }`.
- FE: `AppProvider` hydrates announcement into `useAppStore()`; `MainLayout` (and `AdminLayout`) render a dismissible banner under the header when `enabled === true && message.length > 0`.
- Dismissal is per-tab (sessionStorage key `announcement-dismissed-v{hash}`); when the admin edits the message the hash changes and the banner re-appears automatically.
- Admin page: toggle + severity select + multi-line input + live preview.

## Routes added
```
/admin/users           — user management (AdminLayout)
/admin/flags           — feature flags (AdminLayout)
/admin/announcement    — announcement editor (AdminLayout)
```

Route constants:
```ts
ADMIN_USERS: "/admin/users",
ADMIN_FLAGS: "/admin/flags",
ADMIN_ANNOUNCEMENT: "/admin/announcement",
```

Sidebar groups (admin sidebar):
- **Overview** — /admin
- **Operations** — Request Logs, User Management
- **Configuration** — App Settings, Feature Flags, Announcement
Each group gets a small muted label; keeps the sidebar scannable as features grow.

## Endpoint constants (FE)
Add `ENDPOINTS.users` + `ENDPOINTS.admin.stats` mirroring BE.

## i18n
New top-level keys:
- `admin.users.*` (title, filters, columns, actions, dialogs)
- `admin.stats.*` (labels)
- `admin.flags.*` (title, empty state, addFlag, confirmDelete)
- `admin.announcement.*` (title, enabled, severity.{info,warn,critical}, messagePlaceholder, preview)
- `admin.footer.*` (version, docs, system)
- `admin.nav.*` add: users, flags, announcement
- `nav.*` unaffected
- Messages: `MSG.USER_ROLE_UPDATED`, `MSG.USER_DELETED`, `MSG.CANNOT_MODIFY_SELF`

All keys MUST be added to BOTH `vi.json` and `en.json`.

## Store changes
`SettingsSlice` adds:
```ts
features: Record<string, boolean>;
announcement: { enabled: boolean; message: string; severity: "info"|"warn"|"critical" } | null;
```
Both hydrated in `AppProvider` alongside the existing app-info payload.

## Acceptance criteria
- [ ] All new admin pages render inside `AdminLayout` (no duplicate role guard in client.tsx)
- [ ] Admin footer visible on every admin page, matches theme (amber accent)
- [ ] `/admin/users` — list, filter, change role (with self-disable), delete (with self-disable + confirm)
- [ ] `/admin` overview uses single `/admin/stats` call
- [ ] `/admin/flags` — CRUD flags, store updates immediately after save
- [ ] `/admin/announcement` — banner visible on all MainLayout pages when enabled; dismiss persists until message changes
- [ ] BE destructive actions emit new `MSG` constants that FE translates
- [ ] Dark mode: all new UI has `dark:` variants; tested in both themes
- [ ] Non-admin users are redirected away from every new admin route
- [ ] `npx jest` and `npx tsc --noEmit` both clean

## Non-goals
- No avatar upload or password reset by admin (future)
- No workspace ownership transfer in the delete flow (BE will cascade; admin is warned in the confirm dialog)
- No bulk user actions
- No custom metadata fields on users (role is the only mutable field)
