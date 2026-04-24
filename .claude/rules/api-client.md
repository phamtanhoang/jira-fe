# API Client

The single axios instance `api` in `@/lib/api/client.ts` is the ONLY way to call the backend from the browser.

## Features baked in
1. **In-flight GET dedupe** — multiple callers hitting the same URL+params within the same tick share one promise. Complements React Query's queryKey dedupe.
2. **`x-origin: admin` header** — set automatically when `window.location.pathname` starts with `/admin`. BE uses it to skip logging admin-origin traffic.
3. **`x-timezone` header** — browser timezone string, used by BE timezone interceptor.
4. **401 auto-refresh** — on 401, queue the failed request, POST `/auth/refresh`, replay on success. If refresh itself returns 401, clear cookies and redirect to `/sign-in` (do NOT queue — would deadlock).
5. **429 auto-retry** — GETs retry with `Retry-After` header (or exponential backoff `[1s, 2s, 4s]`, max 3). POST/PATCH/DELETE reject immediately with `message: "TOO_MANY_REQUESTS"`.
6. **Breadcrumb push** — every non-`/logs/client` request adds to the logging ring buffer.
7. **Error reporting** — non-401 failures call `reportError()` with url/method/status/level.

## Rules
- NEVER create another `axios.create()` instance. You'd lose all 7 features above.
- NEVER use `fetch()` for API calls from components. Exception: the Next.js edge middleware can use `fetch` (no axios at the edge), but it should add its own headers (e.g. maintenance probe).
- NEVER bypass the client to pipe tokens manually — auth cookies are httpOnly, the client already sends them via `withCredentials: true`.

## When adding an endpoint call
- Write a small wrapper in `features/xxx/api.ts` that imports `api`, calls `.get/.post/.patch/.delete`, and `.then((r) => r.data)`.
- Export type inference from the call return (don't re-declare response types inline).

## When adding a mutation
- Consume the api wrapper from a react-query hook (see `.claude/rules/react-query.md`).
- For mutations that should not trigger the 429 auto-retry (they're not idempotent), no action needed — the client already skips retry for non-GET.
