---
description: Run FE quality gates (typecheck + lint + build + i18n parity). Use before commit or PR.
---

# Quality Gate (FE)

Runs sequentially. Stop at first failure.

## Steps

```bash
cd jira-fe

# 1. Typecheck
npx tsc --noEmit

# 2. Lint
npm run lint

# 3. Next.js production build — catches server/client boundary issues that tsc misses
npm run build

# 4. i18n parity — both locale files must have identical keys
diff <(jq -r 'keys | .[]' src/messages/vi.json | sort) <(jq -r 'keys | .[]' src/messages/en.json | sort)
# Empty output = parity. Any line = missing key on one side.
```

## What to do on failure

- **`tsc` error in your diff** → fix the type. Avoid `// @ts-expect-error` unless you document why.
- **Build error: "useState is not a function" or similar** → server component reading a client hook. Move to client.tsx.
- **Build error: "ENOENT process.env.X"** → missing env var. Add to `.env.example` AND `vercel.json`/CI config.
- **Lint error** → fix in your diff only. Don't touch unrelated rule violations.
- **i18n parity failure** → add the missing key in the other locale file. See `/add-translation`.

## When to skip

Never skip the build. `npm run lint` alone misses Next.js boundary errors.

## Pitfalls

- ❌ Running `npm run build` after a code change but BEFORE saving open editor files — get false success.
- ❌ Assuming "Vercel will build it" — Vercel runs the same command, so a local build failure is a guaranteed CI failure. Save the round-trip.
