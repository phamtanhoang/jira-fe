---
paths:
  - "src/**/*.{ts,tsx}"
---

# No Hardcoding

- NEVER hardcode app name (e.g. "Jira Clone") — ALWAYS read from useAppStore().name
- NEVER hardcode display text — ALWAYS use t() from useAppStore()
- NEVER hardcode "is_authenticated" — ALWAYS use COOKIE_AUTH from @/lib/constants/settings
- NEVER hardcode "__none__" — ALWAYS use UNASSIGNED_VALUE from @/lib/constants/issue-config
- ALWAYS add new i18n keys to BOTH src/messages/vi.json AND src/messages/en.json
- ALWAYS use MSG constants for toast message keys passed to showMessage()
