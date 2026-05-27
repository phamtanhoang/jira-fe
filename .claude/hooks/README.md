# Hooks

Trigger-based automations wired into Claude Code via `.claude/settings.json`.

Rules:
1. **Exit 0 always** — never block tool execution.
2. **Fast** — < 200ms blocking hooks; async + timeout for heavier work.
3. **Advisory** — output to stderr/stdout, don't mutate files.

## Active hooks

| ID | Event | Trigger | Purpose |
|---|---|---|---|
| `session-start` | `SessionStart` | New session | Branch + commits + i18n parity check |
| `post-edit-i18n` | `PostToolUse` | Edit/Write on `src/messages/(vi\|en).json` | Diff keys, warn on missing |
| `post-edit-server-client` | `PostToolUse` | Edit/Write on `page.tsx` or `client.tsx` | Flag misplaced "use client" + leaked server env |

## Adding a new hook

1. Write `<name>.js` here. Stdin = `{ tool_input, tool_name, ... }`.
2. Append entry to `.claude/settings.json` `hooks` block.
3. Document above.
4. Always `process.exit(0)`.
