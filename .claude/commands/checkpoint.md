---
description: Commit current progress with a Conventional Commits message. Use mid-feature to checkpoint.
---

# Checkpoint

Mid-feature commit for reset safety. Squash before merge.

## Steps

```bash
cd jira-fe

git status --short
git diff --stat

# Run quality gate first (recommended)
# /quality-gate

git add <specific files>
git commit -m "<type>(<scope>): <subject>"
```

## Commit types

| Type | Use for |
|---|---|
| `feat` | new page, new component, new hook |
| `fix` | bug fix |
| `refactor` | structural change, no behavior change |
| `perf` | performance optimization |
| `style` | formatting / class names only |
| `chore` | tooling, deps |
| `docs` | docs / comments |
| `test` | tests |
| `ci` | CI/CD changes |
| `i18n` | translation key additions/changes |

Scope examples: `auth`, `dashboard`, `issues`, `projects`, `workspaces`, `admin`, `admin-logs`, `theme`, `i18n`.

## Subject rules

- Imperative present tense
- Lowercase first letter
- No trailing period
- ≤ 70 chars

Good:
- `feat(projects): add starred state to project list`
- `fix(theme): persist dark mode across navigation`
- `i18n: add vi/en keys for new attachment dropdown`
- `refactor(admin-logs): extract LogsFilters into _components`

Bad:
- `Fixed bug` — no scope, past tense
- `feat(admin): Added 5 components for logs admin page.` — period, past tense
- `wip` — no information

## Don't checkpoint

- `.env*` (gitignored — verify)
- `node_modules/`, `.next/`, `out/`
- Empty changes
- `src/lib/api/generated-types.ts` without committing the BE DTO change together — types and code must stay in sync

## After multiple checkpoints

```bash
git rebase -i HEAD~N    # squash for merge
```
