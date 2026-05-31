import { ENV } from "./env";

export const COOKIE_LOCALE = "locale";
export const COOKIE_AUTH = "is_authenticated";
/**
 * Non-sensitive UX hint used by edge middleware to bypass maintenance-mode
 * redirects for admins. BE remains the authority on role — this is only for
 * avoiding the redirect round-trip during maintenance.
 */
export const COOKIE_ROLE = "user_role";
export const COOKIE_MAX_AGE_1Y = 60 * 60 * 24 * 365;

/**
 * Build a `document.cookie` write string. When `NEXT_PUBLIC_COOKIE_DOMAIN`
 * is set, the cookie is scoped to that domain so the BE-set (OAuth callback)
 * and FE-set (password login) cookies live in the same bucket and clearing
 * one wipes the other. Leave the env empty in single-domain / localhost dev.
 */
export function writeAuthCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  const domain = ENV.COOKIE_DOMAIN ? `;domain=${ENV.COOKIE_DOMAIN}` : "";
  document.cookie = `${name}=${value};path=/;max-age=${COOKIE_MAX_AGE_1Y}${domain}`;
}

/**
 * Wipe an auth cookie under BOTH scopes — explicit domain AND host-only.
 * Browsers treat `is_authenticated; Domain=.foo` and `is_authenticated`
 * (no domain) as separate cookies, so a single clear leaves the other
 * intact. After a deployment that flipped `NEXT_PUBLIC_COOKIE_DOMAIN`,
 * stale host-only cookies from the old setup would otherwise outlive
 * logout and keep the user "authenticated" client-side.
 */
export function clearAuthCookie(name: string): void {
  if (typeof document === "undefined") return;
  // Host-only — covers legacy cookies set before COOKIE_DOMAIN existed.
  document.cookie = `${name}=;path=/;max-age=0`;
  // Explicit domain — covers cookies set by the cross-subdomain helpers.
  if (ENV.COOKIE_DOMAIN) {
    document.cookie = `${name}=;path=/;max-age=0;domain=${ENV.COOKIE_DOMAIN}`;
  }
}
