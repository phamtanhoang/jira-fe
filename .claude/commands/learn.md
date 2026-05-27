---
description: Capture a non-obvious decision from this session into .claude/memory.md.
---

# Learn

Save a discovery or decision worth remembering across sessions.

## Format

Append to `.claude/memory.md`:

```md
## 2026-05-28 — <topic>

**Decision/finding:** <one line>

**Why:** <one line>

**See:** [path/to/file.tsx:42](path/to/file.tsx#L42) or [rule:X](.claude/rules/X.md)
```

## What to learn

✅ Save when:
- "Tiptap RichEditor is lazy-loaded via `next/dynamic` — direct import bloats the initial bundle by ~80KB"
- "React Query 5-min staleTime requires `refetchOnWindowFocus: false` or alt-tab refetches anyway"
- "FE pushes `x-origin: admin` header automatically when `pathname.startsWith('/admin')` — don't add manually"
- "Theme cookie is read server-side in `app/layout.tsx` — `defaultTheme` mismatch causes flash"

## What NOT to learn

❌ Don't save:
- Code patterns visible in the file
- Anything in `CLAUDE.md` / `rules/`
- Sprint state — that belongs in a tracker
- "How React works" — that's docs

## Promotion

If a memory is referenced 3+ sessions, promote to `.claude/rules/<topic>.md` and delete the memory entry.

## Privacy

`memory.md` is committed. No secrets, no team-internal opinions.
