// Single source of truth for environment-variable access in the frontend.
// All other modules MUST import from `@/lib/constants` (which re-exports
// this `ENV`) and never read `process.env.*` directly. Defaults live here
// and only here — callers stay declarative.
//
// `NEXT_PUBLIC_*` variables are statically inlined by the Next.js bundler at
// build time, so they're safe to read in client, server, and edge code.
// `NODE_ENV` and `NEXT_RUNTIME` are also inlined by Next.

const NODE_ENV = process.env.NODE_ENV ?? "development";
const NEXT_RUNTIME = process.env.NEXT_RUNTIME ?? "";

export const ENV = {
  // ─── Public ────────────────────────────────────────────────────────────
  // Next.js rewrite target for `/api/*`. Used by the few server-side
  // fetches that bypass the axios client (middleware maintenance probe,
  // SSR app-settings prefetch).
  API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",

  // Sentry DSN — empty string disables init in instrumentation files.
  SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN ?? "",

  // ─── Derived flags — only place we compare NODE_ENV / NEXT_RUNTIME ────
  NODE_ENV,
  IS_PRODUCTION: NODE_ENV === "production",
  IS_DEVELOPMENT: NODE_ENV === "development",
  IS_NODE_RUNTIME: NEXT_RUNTIME === "nodejs",
  IS_EDGE_RUNTIME: NEXT_RUNTIME === "edge",
} as const;
