export type LogLevel = "INFO" | "WARN" | "ERROR";

export type RequestLog = {
  id: string;
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
  nextCursor: string | null;
  hasMore: boolean;
};

export type LogsFilters = {
  level?: LogLevel;
  method?: string;
  statusCode?: number;
  userEmail?: string;
  excludeUserId?: string;
  errorsOnly?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  take?: number;
};
