export const COOKIE_LOCALE = "locale";
export const COOKIE_AUTH = "is_authenticated";
/**
 * Non-sensitive UX hint used by edge middleware to bypass maintenance-mode
 * redirects for admins. BE remains the authority on role — this is only for
 * avoiding the redirect round-trip during maintenance.
 */
export const COOKIE_ROLE = "user_role";
export const COOKIE_MAX_AGE_1Y = 60 * 60 * 24 * 365;
