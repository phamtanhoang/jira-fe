---
description: Regenerate src/lib/api/generated-types.ts from the running BE OpenAPI spec. Run after BE DTO changes.
---

# Sync OpenAPI Types

FE consumes typed BE responses via `src/lib/api/generated-types.ts`. The file is generated from BE's Swagger JSON at `http://localhost:3031/api-json`.

## When to run

- After ANY change to BE DTOs (`*.dto.ts` files)
- After adding/renaming endpoints
- Before opening a PR that depends on a paired BE change

## Steps

1. **Start BE locally** — it must serve `/api-json`:
   ```bash
   cd jira-be
   npm run start:dev
   # Wait for "Application is running on http://localhost:3031"
   ```

2. **Run the generator in another terminal**:
   ```bash
   cd jira-fe
   npm run openapi:gen
   ```

3. **Review the diff**:
   ```bash
   git diff src/lib/api/generated-types.ts
   ```
   Expected: only the types you intended to change. Surprises = BE DTO drift not noticed yet — investigate.

4. **Commit** with the BE change OR as a follow-up:
   ```bash
   git add src/lib/api/generated-types.ts
   git commit -m "chore(api): regenerate OpenAPI types"
   ```

## Failure modes

- **`ECONNREFUSED 127.0.0.1:3031`** → BE not running locally. Start it first.
- **`Cannot find type X`** → BE DTO uses a class that isn't exposed in Swagger. Add `@ApiProperty()` to the field, or rebuild BE.
- **Diff includes hundreds of unrelated changes** → BE is on a different branch than expected. `git pull` in `jira-be/` first.

## Things easy to get wrong

- ❌ Generating types from production (`api.jira.3hteam.io.vn/api-json`) — that's the PROD schema. Always generate from your local dev BE.
- ❌ Hand-editing `generated-types.ts` — overwritten on next run. Always change the BE DTO instead.
- ❌ Forgetting to regenerate after pulling a BE branch — FE compiles against stale types and silently mismatches at runtime.
