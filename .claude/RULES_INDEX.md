# Frontend `.claude/` Navigation Index

The single map of every doc / agent / skill / command / rule for the FE. When you don't know where to look, start here.

## When to read what

| Goal | Start here |
|---|---|
| First session in this repo / 15-min onboarding | [ONBOARDING.md](ONBOARDING.md) |
| Architecture overview + conventions | [CLAUDE.md](CLAUDE.md) |
| Building / shipping a new page | [skills/new-feature.md](skills/new-feature.md) |
| Debugging a defect | [skills/bug-fix-flow.md](skills/bug-fix-flow.md) |
| Restructuring without behavior change | [skills/refactor-flow.md](skills/refactor-flow.md) |
| Triaging a prod incident | [commands/diagnose-prod.md](commands/diagnose-prod.md) + [skills/investigate-prod.md](skills/investigate-prod.md) |
| Deploying to prod | [commands/deploy.md](commands/deploy.md) |
| Adding a new translation | [commands/add-translation.md](commands/add-translation.md) |
| Syncing types after BE change | [commands/openapi-sync.md](commands/openapi-sync.md) |
| Working in `/admin/*` | [rules/admin-area.md](rules/admin-area.md) |
| Working with the axios client | [rules/api-client.md](rules/api-client.md) |
| Adding React Query hook | [rules/react-query.md](rules/react-query.md) + [rules/query-stale-time.md](rules/query-stale-time.md) |
| Adding `error.tsx` | [rules/error-boundaries.md](rules/error-boundaries.md) |
| Touching the large upload flow | [rules/large-upload.md](rules/large-upload.md) |
| Persisting to localStorage | [rules/persistence.md](rules/persistence.md) |
| Paginating a list | [rules/pagination.md](rules/pagination.md) |
| Page got too big | [rules/page-organization.md](rules/page-organization.md) |
| Logging / reporting errors | [rules/logging.md](rules/logging.md) |

## Files

### Top-level

| File | Purpose |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Canonical project guide. Architecture + conventions. |
| [CLAUDE.local.md](CLAUDE.local.md) | Local-only env notes — NOT committed. |
| [ONBOARDING.md](ONBOARDING.md) | 15-minute productivity ramp. |
| [RULES_INDEX.md](RULES_INDEX.md) | This file. |
| [memory.md](memory.md) | Long-term project memory. |

### `rules/` — domain rules

| Rule | Use when |
|---|---|
| [admin-area.md](rules/admin-area.md) | Working on `/admin/*` pages |
| [api-client.md](rules/api-client.md) | Calling the BE from a component |
| [architecture.md](rules/architecture.md) | Understanding the FE shape overall |
| [component-patterns.md](rules/component-patterns.md) | Building shared UI components |
| [error-boundaries.md](rules/error-boundaries.md) | Adding `error.tsx` to a page |
| [large-upload.md](rules/large-upload.md) | Touching chunked upload pipeline |
| [logging.md](rules/logging.md) | Error reporting + breadcrumbs |
| [no-hardcode.md](rules/no-hardcode.md) | Constants vs magic numbers |
| [page-organization.md](rules/page-organization.md) | When `client.tsx` outgrows itself |
| [pagination.md](rules/pagination.md) | Numbered pages vs infinite scroll |
| [persistence.md](rules/persistence.md) | localStorage / cookies / sessionStorage |
| [query-stale-time.md](rules/query-stale-time.md) | Picking the right React Query staleTime |
| [react-query.md](rules/react-query.md) | Query key shape + mutation patterns |

### `agents/` — specialized assistants

| Agent | When to use |
|---|---|
| [debugger.md](agents/debugger.md) | A defect whose cause isn't obvious |
| [reviewer.md](agents/reviewer.md) | Second-opinion review before merge |
| [test-runner.md](agents/test-runner.md) | typecheck + lint + next build in one go |
| [performance.md](agents/performance.md) | Slow page / laggy interaction audit |

### `skills/` — repeatable workflows

| Skill | When to use |
|---|---|
| [new-feature.md](skills/new-feature.md) | Adding a new feature / page |
| [bug-fix-flow.md](skills/bug-fix-flow.md) | Working through a defect |
| [refactor-flow.md](skills/refactor-flow.md) | Restructuring without behavior change |
| [investigate-prod.md](skills/investigate-prod.md) | Triaging a prod issue |

### `commands/` — slash-command runbooks

| Command | What it does |
|---|---|
| [/deploy](commands/deploy.md) | Pre-flight FE deploy checklist |
| [/diagnose-prod](commands/diagnose-prod.md) | Triage prod issue step-by-step |
| [/openapi-sync](commands/openapi-sync.md) | Regenerate types from BE Swagger |
| [/add-translation](commands/add-translation.md) | Add an i18n key in both locales |

### `specs/` — historical decisions

One-off design docs / RFCs. Reference only.

## How the system fits together

```
┌──────────────────────────────────────────────┐
│ CLAUDE.md         ← always loaded            │
│ ONBOARDING.md     ← read once first session  │
│ RULES_INDEX.md    ← this file                │
└──────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────┐
│ Doing a task? Pick a skill:                  │
│   new-feature / bug-fix-flow /               │
│   refactor-flow / investigate-prod           │
└──────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────┐
│ Touching specific area? Read the rule:       │
│   api-client / react-query / admin-area /    │
│   error-boundaries / persistence / ...       │
└──────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────┐
│ Need help? Delegate to an agent:             │
│   debugger / reviewer / performance          │
└──────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────┐
│ Running ops? Use a slash command:            │
│   /deploy /diagnose-prod /openapi-sync /     │
│   /add-translation                           │
└──────────────────────────────────────────────┘
```

## Updating this index

When you add a new rule / agent / skill / command, add a one-line entry above. A file missing from here is invisible to future sessions.
