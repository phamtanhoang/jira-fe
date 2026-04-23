import axios from "axios";
import * as Sentry from "@sentry/nextjs";
import { ENDPOINTS } from "@/lib/constants";
import { snapshotBreadcrumbs } from "./breadcrumbs";
import type { ClientLogPayload, LogLevel } from "./types";

/**
 * Bare axios instance — NO interceptors. Prevents recursion: the main
 * `api` client has an error interceptor that calls reportError, which
 * would otherwise call /logs/client through api, triggering the same
 * interceptor on failure, and so on.
 */
const logClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 5000,
});

type ReportContext = {
  level?: LogLevel;
  url?: string;
  method?: string;
  statusCode?: number;
  requestBody?: Record<string, unknown>;
  responseBody?: Record<string, unknown>;
  includeBreadcrumbs?: boolean;
};

/**
 * Capture an error to Sentry + the backend log endpoint.
 * Fire-and-forget — never throws, swallows all internal errors.
 */
export function reportError(error: unknown, context: ReportContext = {}): void {
  try {
    const level: LogLevel = context.level ?? "ERROR";
    const message = errorMessage(error);
    const stack = errorStack(error);

    let sentryEventId: string | undefined;
    try {
      sentryEventId = Sentry.captureException(error, {
        extra: {
          url: context.url,
          method: context.method,
          statusCode: context.statusCode,
        },
      });
    } catch {
      // Sentry not configured — skip
    }

    const payload: ClientLogPayload = {
      level,
      url: context.url ?? safeWindowUrl(),
      method: context.method,
      statusCode: context.statusCode,
      errorMessage: message,
      errorStack: stack,
      breadcrumbs:
        context.includeBreadcrumbs !== false
          ? snapshotBreadcrumbs()
          : undefined,
      requestBody: context.requestBody,
      responseBody: context.responseBody,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      sentryEventId,
    };

    // Fire-and-forget — don't await, don't chain .catch logic that could throw
    void logClient.post(ENDPOINTS.logs.client, payload).catch(() => {
      // Swallow: log transport failure must not cascade
    });
  } catch {
    // Swallow everything — logging must never break user flow
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function errorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

function safeWindowUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.href;
}
