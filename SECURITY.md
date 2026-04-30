# Security Policy

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, email `security@example.com` (replace with your real address) with:

- A description of the issue and its impact
- Steps to reproduce (URLs, payloads, screenshots, browser version)
- Affected version / commit SHA if known
- Your name / handle for credit (optional)

We will acknowledge within **3 business days** and provide a remediation timeline within 7 days.

## Scope

In-scope:

- XSS in user-rendered HTML (rich text, mentions, share links)
- CSRF on state-changing endpoints (note: backend already enforces same-site cookies + CORS)
- Open redirects in auth flows (sign-in, OAuth callback)
- Sensitive data leakage in client logs / Sentry breadcrumbs
- Auth state confusion (logged-in indicator without server confirmation)
- Subresource integrity / supply-chain (compromised npm packages)

Out of scope:

- Issues only reproducible with browser flags / extensions disabled
- Self-XSS requiring user to paste hostile content into devtools
- Rate-limit bypass — backend handles throttling; FE just retries 429 GETs

## Hardening already in place

- HTTP-only auth cookies (cannot be read by JavaScript)
- Same-site cookies (CSRF defense)
- `withCredentials: true` axios + backend CORS allowlist
- Tiptap rich-text editor output sanitized before persisting (BE sanitizes too — defense in depth)
- Breadcrumb buffer captures `textContent` only — never `<input>` values
- Sentry disabled in dev + when DSN missing — local browsing leaks zero
- Strict CSP-friendly headers via `next.config.ts` (X-Frame-Options DENY, X-Content-Type-Options nosniff, HSTS, Referrer-Policy)
- 401 auto-refresh attempts once then redirects to sign-in (no stuck-loop / token leak in URL)
- Public share routes (`/share/issue/[token]`) bypass auth but render only redacted issue data — backend strips emails + worklogs

## Disclosure log

(intentionally blank — no public CVEs at this time)
