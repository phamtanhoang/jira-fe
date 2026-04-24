/**
 * React Query `staleTime` constants.
 *
 * The QueryProvider default is 60s (see `components/providers/query-provider`).
 * That's fine for domain data that changes while the user works. But for
 * identity / public-ish endpoints mounted on every layout, 60s means every
 * page navigation after the first minute re-fires the request.
 *
 * Pick from this table instead of hardcoding:
 *
 * | Constant                  | Endpoint / hook                        |
 * |---------------------------|----------------------------------------|
 * | STALE_AUTH_USER           | /auth/me (useCurrentUser)              |
 * | STALE_PUBLIC_SETTING      | /settings/app-* (usePublicMaintenance) |
 * | STALE_FEATURE_FLAGS       | /feature-flags/me                      |
 * | STALE_DASHBOARD_WIDGET    | /issues/me/dashboard                   |
 * | STALE_DOMAIN_DEFAULT      | everything else (== QueryProvider default) |
 */

/** Session-scoped identity data. User rarely changes their profile/role. */
export const STALE_AUTH_USER = 5 * 60 * 1000; // 5 min

/** Public settings toggled by admin rarely (maintenance, announcement, app-info). */
export const STALE_PUBLIC_SETTING = 5 * 60 * 1000; // 5 min

/** Feature flags — toggled rarely, read frequently. */
export const STALE_FEATURE_FLAGS = 10 * 60 * 1000; // 10 min

/** Domain data that changes during active work (issues, comments, boards). */
export const STALE_DOMAIN_DEFAULT = 60 * 1000; // 60s

/** Dashboard-widget-level data — OK to be a little stale to avoid flicker. */
export const STALE_DASHBOARD_WIDGET = 30 * 1000; // 30s
