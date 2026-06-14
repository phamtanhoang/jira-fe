---
paths:
  - "src/**/*.{ts,tsx}"
---

# No Hardcoding

## Identifiers + strings
- NEVER hardcode app name (e.g. "Jira Clone") — ALWAYS read from `useAppStore().name`
- NEVER hardcode display text — ALWAYS use `t()` from `useAppStore()`
- NEVER hardcode `"is_authenticated"` — ALWAYS use `COOKIE_AUTH` from `@/lib/constants/settings`
- NEVER hardcode `"__none__"` — ALWAYS use `UNASSIGNED_VALUE` from `@/lib/constants/issue-config`

## i18n: supported locales + fallback rules
Supported locales (`src/lib/config/i18n.ts`): **en, vi, ja, ko, zh, fr** — English is the **default fallback** (`defaultLocale`). When the current locale doesn't define a key, `t()` automatically re-walks the tree under English so the UI never shows a raw dotted key path.

### Tier 1 (strict parity — CI fails on drift)
- **`src/messages/en.json` + `src/messages/vi.json`** — every new key MUST appear in BOTH in the same change.
- The parity test at `tests/unit/messages/parity.test.ts` enforces this (key set + interpolation tokens + non-empty strings).
- The TypeScript `MessageKey` type is derived from `vi.json` — if your key compiles, it exists in vi. The type system does NOT catch a missing en entry, so the parity test is the safety net.

### Tier 2 (partial — fallback OK, translate when reasonable)
- **`ja.json`, `ko.json`, `zh.json`, `fr.json`** — keys MAY be missing; runtime falls back to English via `t()`. Treat translation as "nice to have", not a build blocker.
- WHEN adding a new key: also translate to these locales if the meaning is short / unambiguous (button labels, error messages, common nouns). Skip when the source needs cultural/contextual review.
- The fallback is a UX safety net, NOT an excuse to skip translation. A multilingual user pays the cognitive cost when their UI is half-English.

### When adding a new locale
1. Create `src/messages/<code>.json` (start with `{}` — fallback handles the rest).
2. Import + append to `locales` array in `src/lib/config/i18n.ts`.
3. Add a `LOCALE_CONFIG` entry in `src/components/shared/locale-switcher/index.tsx` (flag emoji + native label).
4. Translate at least `common.*` and `nav.*` so the locale switcher itself is recognisable.

### Toast messages
- ALWAYS use MSG constants for toast message keys passed to `showMessage()`. The key must match an entry under `messages.*` in both en + vi.

## Numbers + timing
- NEVER hardcode sidebar widths (`240`, `280`, `320`) — use `UI_SIZES` from `@/lib/constants/ui`.
- NEVER hardcode debounce delays (`300`, `800`) — use `DEBOUNCE.SEARCH` / `DEBOUNCE.AUTOSAVE`.
- NEVER hardcode HTTP status thresholds (`400`, `500`) — use `HTTP_STATUS_RANGE` from `@/lib/constants/ui`.
- NEVER hardcode staleTime millisecond values — use constants from `@/lib/constants/query-stale` (see `.claude/rules/react-query.md`).

## Upload limits (mirror of BE)
- If you validate a file size / mime on FE (for pre-upload UX), match the BE limits in `@/core/constants/upload.constant.ts`. Currently the FE inlines these for avatar upload — don't copy the pattern to new endpoints; create a FE-side shared constant instead.
