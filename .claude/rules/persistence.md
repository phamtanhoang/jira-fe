# Client-side Persistence Patterns

When + how to use `localStorage` / `sessionStorage` / cookies. The canonical example: large upload resume in `features/projects/upload-storage.ts`.

## Layer matrix

| What | Where | Why |
|---|---|---|
| Auth (httpOnly) | cookies set by BE | Tamper-proof from JS |
| FE-readable session flags | `COOKIE_AUTH=1` cookie | Middleware needs to gate routes server-side |
| User preference (locale, theme) | cookie + Zustand store | SSR can read on first render |
| In-flight upload resume state | localStorage | Survives reload/crash |
| React Query cache | in-memory (RAM) | Refetched on mount when stale |
| Ephemeral UI state | `useState` / Zustand | Lost on reload — by design |

## Pattern: typed localStorage wrapper

Don't sprinkle `localStorage.getItem(...)` across files. Wrap a single key with a typed API:

```ts
// features/projects/upload-storage.ts (canonical example)
const STORAGE_KEY = "jira:pending-large-uploads:v1";

export type PersistedUpload = { sessionId: string; ... };

function readMap(): Record<string, PersistedUpload> { ... }
function writeMap(map: Record<string, PersistedUpload>): void { ... }

export function savePersistedUpload(entry: PersistedUpload): void { ... }
export function removePersistedUpload(sessionId: string): void { ... }
export function listPersistedUploads(issueId?: string): PersistedUpload[] { ... }
```

Why:
- Single source of truth for schema.
- Easy to migrate (bump `:v1` → `:v2` and add migration logic).
- Catches `JSON.parse` failures + wipes corrupt entries.
- Avoids `localStorage` access from SSR (every helper checks `typeof window !== "undefined"`).

## Schema versioning

Key suffix `:v1` is intentional. When the shape changes incompatibly, bump to `:v2`. Either silently drop old key (data loss but no crash) or write a migration that reads old → translates → writes new.

Don't reuse the same key with a new shape — older sessions in the wild will explode.

## Expiry — read-side filter

Always filter expired entries on read. Don't trust them to be cleaned up:

```ts
function readMap(): Record<string, PersistedUpload> {
  // ...
  const now = Date.now();
  const out: Record<string, PersistedUpload> = {};
  for (const [id, entry] of Object.entries(parsed)) {
    const expires = new Date(entry.expiresAt).getTime();
    if (Number.isFinite(expires) && expires > now) out[id] = entry;
  }
  return out;
}
```

## What NEVER goes in localStorage

- ❌ Passwords, tokens, OTPs — any tab on any site you visit can read (with XSS).
- ❌ `File` / `Blob` / `ArrayBuffer` — not serializable. Browser security forbids persisting file references anyway.
- ❌ Sensitive PII (full name, address, ID number).
- ❌ Anything > ~5 MB — most browsers cap localStorage at 5–10 MB per origin.

## SSR caveat

Next.js App Router runs your code BOTH on server and client. localStorage doesn't exist on the server → access throws.

Always:

```ts
function readMap() {
  if (typeof window === "undefined") return {};
  // ... safe
}
```

OR wrap consumers in `useEffect` so they only run client-side.

## Cookies vs localStorage decision

| Need | Use |
|---|---|
| Server (middleware) needs to read it | Cookie |
| Server doesn't need to know | localStorage |
| Sensitive (auth token) | httpOnly cookie set by BE |
| Cross-tab sync | localStorage + `storage` event |
| Survives across domains (rare) | Neither — security |

`COOKIE_AUTH=1` is the canonical example — middleware reads it to redirect public/protected routes. Auth tokens themselves are in httpOnly cookies, NOT in localStorage.

## Things easy to get wrong

- ❌ Hardcoding the storage key — define once as `const STORAGE_KEY = "..."` so renames are atomic.
- ❌ Forgetting the `:v1` suffix — future migrations break.
- ❌ Storing File/Blob references — they don't persist; user has to re-pick anyway.
- ❌ Reading localStorage at module top-level (not inside function) — runs at SSR too, throws.
- ❌ Not catching JSON.parse — one corrupted entry kills all reads. Always try/catch + wipe.
