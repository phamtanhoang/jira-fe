export type BreadcrumbType = "nav" | "click" | "api" | "error";

export type Breadcrumb = {
  type: BreadcrumbType;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
};

export type LogLevel = "INFO" | "WARN" | "ERROR";

export type ClientLogPayload = {
  level: LogLevel;
  url: string;
  method?: string;
  statusCode?: number;
  errorMessage?: string;
  errorStack?: string;
  breadcrumbs?: Breadcrumb[];
  requestBody?: Record<string, unknown>;
  responseBody?: Record<string, unknown>;
  userAgent?: string;
  sentryEventId?: string;
};
