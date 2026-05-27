---
description: Pre-flight checklist for deploying FE changes to production. Typecheck → lint → build → i18n parity → push → verify.
---

# Deploy FE to Production

This is the production FE deploy runbook. Execute step-by-step.

## 0. Confirm changes are intentional

```bash
git status
git diff --stat HEAD
```

Unexpected files? Stash or commit before continuing.

## 1. Local quality gates

```bash
cd jira-fe

# Typecheck — must pass
npx tsc --noEmit

# Lint — must pass
npm run lint

# Production build — must pass
npm run build
```

Build catches:
- Server/client component misuse
- Missing env reads at build time
- Sentry source map upload (if `SENTRY_AUTH_TOKEN` is set)

If any gate fails → fix, re-run, don't push broken code.

## 2. i18n parity check

If you added any new translation keys, BOTH `vi.json` and `en.json` MUST have them. Quick check:

```bash
# Pull keys from each (rough — for visual diff)
node -e "console.log(Object.keys(JSON.parse(require('fs').readFileSync('src/messages/vi.json'))).length)"
node -e "console.log(Object.keys(JSON.parse(require('fs').readFileSync('src/messages/en.json'))).length)"
```

Mismatch = missing key. FE silently falls back to the key name in production — looks broken.

## 3. OpenAPI regeneration (if BE DTOs changed)

If this PR pairs with a BE change that touched DTOs:

```bash
# BE must be running locally on :3031
npm run openapi:gen
```

This refreshes `src/lib/api/generated-types.ts`. Commit the updated file.

If the BE isn't running, the script fails — start BE first.

## 4. Push to git

```bash
git add <changed files>
git commit -m "<type>(<scope>): <subject>"
git push origin <branch>
```

Commit format (Conventional Commits):
- `feat(<scope>):` — new feature
- `fix(<scope>):` — bug fix
- `refactor(<scope>):` — non-functional change
- `perf(<scope>):` — performance
- `style(<scope>):` — formatting only
- `chore(<scope>):` — tooling, deps
- `docs(<scope>):` — docs only

## 5. Watch CI

Vercel / GH Actions auto-deploys on push. Takes ~2–4 min.

```bash
gh run watch
```

Or watch the Vercel dashboard for the project.

## 6. Verify

After deploy completes:

```powershell
# Hit the homepage
curl.exe -I https://jira.3hteam.io.vn/

# Open the app, smoke-test:
# - Sign in
# - Navigate to a project board
# - Create / drag an issue
# - Toggle theme (light/dark)
# - Switch locale (vi/en)
# - Open /admin if you're admin
```

Sentry browser dashboard: any new error within 5 min of deploy = your problem. Check it.

## 7. Rollback (if needed)

```bash
git revert <bad-commit>
git push
```

CI redeploys. Or for a hot rollback via Vercel UI: Promote previous deployment.

## Pitfalls

- ❌ Pushing without `npm run build` — type errors that pass `tsc --noEmit` can still fail on Next.js build (server/client boundary).
- ❌ Adding a translation key in only one locale file — broken UI in the other locale.
- ❌ Importing server-only code (`process.env.SECRET`) from a client component — leaks into the JS bundle. Build sometimes warns, sometimes silently bundles it. Audit.
- ❌ Forgetting to `npm run openapi:gen` after BE DTO change — FE types lie, runtime fails.
- ❌ Hardcoding the BE URL — always go through `NEXT_PUBLIC_API_URL` via the axios `api` client.
