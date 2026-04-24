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

## i18n parity (strict)
- EVERY new key MUST exist in BOTH `src/messages/vi.json` AND `src/messages/en.json` in the same change.
- NEVER add a key to only one file — the type system doesn't catch the gap, it just falls back to the key name in the UI.
- ALWAYS use MSG constants for toast message keys passed to `showMessage()`. The key must match an entry under `messages.*` in both locale files.

## Numbers + timing
- NEVER hardcode sidebar widths (`240`, `280`, `320`) — use `UI_SIZES` from `@/lib/constants/ui`.
- NEVER hardcode debounce delays (`300`, `800`) — use `DEBOUNCE.SEARCH` / `DEBOUNCE.AUTOSAVE`.
- NEVER hardcode HTTP status thresholds (`400`, `500`) — use `HTTP_STATUS_RANGE` from `@/lib/constants/ui`.
- NEVER hardcode staleTime millisecond values — use constants from `@/lib/constants/query-stale` (see `.claude/rules/react-query.md`).

## Upload limits (mirror of BE)
- If you validate a file size / mime on FE (for pre-upload UX), match the BE limits in `@/core/constants/upload.constant.ts`. Currently the FE inlines these for avatar upload — don't copy the pattern to new endpoints; create a FE-side shared constant instead.
