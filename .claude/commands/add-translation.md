---
description: Add a new i18n key. Walks through identifying scope → edit BOTH vi.json + en.json → use t() in component → verify parity.
---

# Add a Translation Key

The app speaks Vietnamese (default) + English. EVERY new user-visible string MUST exist in both `src/messages/vi.json` AND `src/messages/en.json`.

## Steps

1. **Pick the namespace** — group keys by feature area:
   - `auth.*` — sign-in / sign-up / password / email
   - `dashboard.*` — landing
   - `issues.*` — issue list / detail / form
   - `projects.*` — project CRUD / members
   - `workspaces.*` — workspace CRUD / members
   - `admin.*` — admin UI (split: `admin.logs.*`, `admin.users.*`, `admin.settings.*`, etc.)
   - `common.*` — buttons, generic actions ("Save", "Cancel")
   - `messages.*` — toast / inline error messages
   - `meta.*` — page metadata (`<title>`, `<meta description>`)

2. **Add to `vi.json`**:
   ```json
   "issues.myNewKey": "Tạo issue mới"
   ```

3. **Add to `en.json` with the SAME key**:
   ```json
   "issues.myNewKey": "Create new issue"
   ```

4. **Use in a component**:
   ```tsx
   const { t } = useAppStore();
   return <Button>{t("issues.myNewKey")}</Button>;
   ```

   For interpolation:
   ```tsx
   t("issues.assignedTo", { name: user.name })
   // vi.json: "issues.assignedTo": "Đã gán cho {{name}}"
   // en.json: "issues.assignedTo": "Assigned to {{name}}"
   ```

5. **Server-side metadata** (in `page.tsx`):
   ```ts
   export const generateMetadata = createGenerateMetadata(
     "meta.issuesTitle",
     "meta.issuesDescription",
   );
   ```

## Parity check

```bash
# Quick visual diff — same keys on both sides?
diff <(jq -r 'keys | .[]' src/messages/vi.json | sort) <(jq -r 'keys | .[]' src/messages/en.json | sort)
```

Output should be empty. Any difference = missing key in one file → broken UI in that locale.

## Don't do this

- ❌ Hardcoding strings in JSX (`<Button>Save</Button>`) — must go through `t()`.
- ❌ Adding to only `vi.json` "I'll add EN later" — done is done; add both at once.
- ❌ Putting full HTML in a value. Translations are plain text. If you need rich formatting, split the key + use JSX templating.
- ❌ Using random key shapes (`saveButton`, `btnSave`, `save_button`). Stick to camelCase under a namespace.
- ❌ Translating brand names ("Jira Clone"). Use the configurable app name from settings — see `app.info.name` in admin settings.

## App name — separate convention

The product name is NOT hardcoded anywhere. Read it from store/settings:

```tsx
const { settings } = useAppStore();
const appName = settings?.["app.info"]?.name ?? "Jira Clone";
```

This lets admins rebrand in `/admin/settings` without code change. NEVER hardcode "Jira Clone" in a translation value.
