export type LogLevel = "INFO" | "WARN" | "ERROR";

export type RequestLog = {
  id: string;
  /** Dotted-namespace event name, e.g. "auth.login.success". Null on legacy rows. */
  event: string | null;
  level: LogLevel;
  source: string;
  method: string;
  url: string;
  route: string | null;
  statusCode: number | null;
  durationMs: number | null;
  userId: string | null;
  userEmail: string | null;
  ip: string | null;
  userAgent: string | null;
  metadata: unknown;
  requestBody: unknown;
  requestQuery: unknown;
  responseBody: unknown;
  errorMessage: string | null;
  errorStack: string | null;
  breadcrumbs: unknown;
  sentryEventId: string | null;
  createdAt: string;
};

export type LogsListResponse = {
  data: RequestLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
  // Deprecated — kept so old callers don't throw. Use `page` + `totalPages`.
  nextCursor: string | null;
};

export type LogsFilters = {
  /** Filter by exact event name (e.g. "auth.login.success"). */
  event?: string;
  level?: LogLevel;
  method?: string;
  statusCode?: number;
  userEmail?: string;
  excludeUserId?: string;
  errorsOnly?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  take?: number;
};

/**
 * Known event names — mirror of `EVENTS` in the BE service. Used by the
 * filter dropdown so admins can pick from a typed list instead of guessing.
 */
export const EVENT_NAMES = [
  "auth.login.success",
  "auth.login.failed",
  "auth.logout",
  "auth.signup",
  "auth.email.verified",
  "auth.password.changed",
  "auth.password.reset.requested",
  "auth.oauth.linked",
  "auth.oauth.unlinked",
  "authz.denied",
  "ratelimit.hit",
  "quota.exceeded",
  "perf.slow_request",
  "error.5xx",
  "error.uncaught",
] as const;
export type EventName = (typeof EVENT_NAMES)[number];
