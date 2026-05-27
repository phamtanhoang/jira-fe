---
description: Scan .claude/ + CLAUDE.md + Next.js code for leaked secrets and accidental server-env exposure.
---

# Security Scan (FE)

Quick local scan for FE-specific leak patterns.

## What to scan

```bash
cd jira-fe

# 1. Find raw secrets in committed config
grep -rEn "(eyJ[a-zA-Z0-9_-]{20,}|sk-[a-zA-Z0-9]{20,}|sntrys_[a-zA-Z0-9_]+|re_[a-zA-Z0-9]{30,})" \
  .claude/ CLAUDE.md next.config.* 2>/dev/null

# 2. Confirm .env not tracked
git ls-files | grep -E "^\.env" || echo "✅ .env not tracked"

# 3. Look for non-NEXT_PUBLIC_ env reads in client code (LEAKS to bundle)
grep -rEn "process\.env\.(?!NEXT_PUBLIC_|NODE_ENV)" src/ 2>/dev/null | grep -v "\.server\.ts" | grep -v "lib/api/.*server"

# 4. Find hardcoded localhost / dev URLs in source
grep -rEn "https?://localhost|127\.0\.0\.1|http://api\." src/ 2>/dev/null

# 5. Look for secrets in i18n files (translators sometimes paste tokens)
grep -nE "(sk-|eyJ|password|api[_-]?key)" src/messages/*.json 2>/dev/null
```

## FE-specific leaks to watch for

| Pattern | Why it's dangerous |
|---|---|
| `process.env.SECRET_KEY` in `client.tsx` | Webpack inlines it into the JS bundle visible to every visitor |
| `process.env.NEXT_PUBLIC_*` containing a real secret | Same — `NEXT_PUBLIC_` is INTENDED to be public, treat as such |
| API token hardcoded in fetch call | Same risk |
| Sentry DSN in source (NEXT_PUBLIC_SENTRY_DSN) | OK to expose — DSNs are designed for browser use |

## Reading the leak

If `process.env.X` shows in a client component:
- Is `X` prefixed `NEXT_PUBLIC_`? → fine (intended) but ensure the value is truly meant to be public.
- Otherwise → that env var leaks to the browser bundle. Move the call to a Server Component, API route, or `*.server.ts` helper.

## If you find a secret

1. Rotate the credential at the source (BE side / provider dashboard).
2. Remove from source, commit.
3. If pushed: rewrite history. See BE `/security-scan` for the BFG / `git filter-repo` recipe.

## Things to avoid

- ❌ Putting BE secrets in `NEXT_PUBLIC_*` "just so the FE can read them" — proxy through `/api`.
- ❌ Committing CLAUDE.local.md without verifying `.gitignore`.
- ❌ Translators / contributors pasting tokens into `vi.json`/`en.json` — these are public files.
- ❌ Trusting "client-only" comments — webpack ignores them, the code ships either way.
