import { api } from "./client";
import { ENDPOINTS } from "@/lib/constants";

/**
 * Proactive access-token refresh.
 *
 * Without this, the FIRST request fired after the access token expires
 * comes back as a 401 — the global axios interceptor recovers
 * transparently (POSTs /auth/refresh, replays the failed request) but
 * the 401 is still visible in the browser DevTools Network panel as a
 * red error. That's noisy and confusing during demos / debugging.
 *
 * Instead, schedule a background `/auth/refresh` call to fire
 * `SAFETY_WINDOW_SEC` seconds BEFORE the token expires. The 401 path
 * remains as a safety net for edge cases (server-side clock skew, tab
 * suspended past its expiry while the timer was paused, etc.) — but
 * under normal use the user's requests never see a 401.
 *
 * Persistence: we mirror the absolute expiry timestamp into localStorage
 * so a full-page reload (which loses every `setTimeout`) can pick up
 * where it left off via `resumeRefreshIfNeeded()`.
 */

const STORAGE_KEY = "jira:access_token_expires_at:v1";
// Refresh 60s before expiry — comfortable margin even with mild clock
// skew between BE and FE. Don't go below ~30s; under that the BE-side
// throttle on /auth/refresh (10/min) becomes a hazard.
const SAFETY_WINDOW_MS = 60_000;
// Minimum delay so a misconfigured short-lived token doesn't immediately
// loop refresh requests. 10s gives the FE a beat after login before
// firing the first proactive refresh.
const MIN_DELAY_MS = 10_000;

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Storage helpers ────────────────────────────────────
function readExpiry(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeExpiry(expiresAt: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, String(expiresAt));
  } catch {
    // localStorage can throw in private mode / quota-exceeded — proactive
    // refresh just degrades to 401-driven recovery. Not fatal.
  }
}

function clearExpiry() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ─── Scheduler ──────────────────────────────────────────
function clearTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

async function performRefresh(): Promise<void> {
  try {
    const result = await api
      .post<{ expiresIn: number }>(ENDPOINTS.auth.refresh)
      .then((r) => r.data);
    if (result?.expiresIn) {
      // Re-arm the timer for the next cycle. The new expiresIn is the
      // refresh token's view of "how long the new access token lasts".
      scheduleTokenRefresh(result.expiresIn);
    } else {
      // BE didn't return expiresIn — clear the stored timestamp so
      // subsequent boots don't try to resume against stale data.
      clearExpiry();
    }
  } catch {
    // Silent — if the proactive refresh fails (network blip, refresh
    // token expired), the regular request flow will hit a 401 and the
    // axios interceptor's recovery path takes over (which also kicks
    // the user to /sign-in if the refresh-refresh fails). Keeping this
    // silent avoids a double error toast for the same failure.
    clearExpiry();
  }
}

function scheduleAt(expiresAt: number) {
  clearTimer();
  const delay = Math.max(MIN_DELAY_MS, expiresAt - Date.now() - SAFETY_WINDOW_MS);
  refreshTimer = setTimeout(() => {
    void performRefresh();
  }, delay);
}

// ─── Public API ─────────────────────────────────────────
/**
 * Called by `useLogin.onSuccess` and after each successful refresh.
 * Stores the absolute expiry in localStorage + arms the timer.
 */
export function scheduleTokenRefresh(expiresInSec: number) {
  if (!Number.isFinite(expiresInSec) || expiresInSec <= 0) return;
  const expiresAt = Date.now() + expiresInSec * 1000;
  writeExpiry(expiresAt);
  scheduleAt(expiresAt);
}

/**
 * Called once at app boot. Reads the persisted expiry and resumes the
 * timer. If the token is already past its safety window, refreshes
 * immediately. No-op when there's nothing stored (fresh tab, logged
 * out, or first-ever visit).
 */
export function resumeRefreshIfNeeded() {
  if (typeof window === "undefined") return;
  const expiresAt = readExpiry();
  if (!expiresAt) return;
  if (expiresAt - Date.now() < SAFETY_WINDOW_MS) {
    void performRefresh();
    return;
  }
  scheduleAt(expiresAt);
}

/**
 * Called by `useLogout.onSettled` and the 401-after-refresh failure
 * path in the axios interceptor. Stops any pending background refresh
 * + wipes the stored expiry so a subsequent unauthenticated visit
 * doesn't try to resume against the previous user's data.
 */
export function clearScheduledRefresh() {
  clearTimer();
  clearExpiry();
}
