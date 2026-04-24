import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { ROUTES, ENDPOINTS, COOKIE_AUTH, COOKIE_ROLE } from "@/lib/constants";
import { pushBreadcrumb, reportError } from "@/lib/logging";
import { handleApiError } from "@/lib/utils";

function clearSessionAndRedirect() {
  document.cookie = `${COOKIE_AUTH}=;path=/;max-age=0`;
  document.cookie = `${COOKIE_ROLE}=;path=/;max-age=0`;
  // Avoid redirect loops from pages that are already public (sign-in, etc.)
  if (typeof window !== "undefined") {
    const path = window.location.pathname;
    if (!path.startsWith(ROUTES.SIGN_IN)) {
      window.location.href = ROUTES.SIGN_IN;
    }
  }
}

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ─── Send timezone header + breadcrumb ──────────────────────
api.interceptors.request.use((config) => {
  config.headers["x-timezone"] =
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Tag requests originating from admin pages so the BE can skip persisting
  // them to the request log — otherwise the admin's own dashboard reads
  // flood the log they're trying to read.
  if (typeof window !== "undefined") {
    const path = window.location.pathname;
    config.headers["x-origin"] = path.startsWith("/admin") ? "admin" : "app";
  }

  // Don't breadcrumb log traffic on itself
  if (!config.url?.includes(ENDPOINTS.logs.client)) {
    pushBreadcrumb({
      type: "api",
      message: `${(config.method ?? "get").toUpperCase()} ${config.url ?? ""}`,
      data: { method: config.method, url: config.url },
    });
  }
  return config;
});

// ─── Auto Refresh on 401 ────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
}> = [];

function processQueue(error: unknown) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(undefined)));
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    // Don't log or refresh the log-ingestion endpoint itself
    const isLogEndpoint = originalRequest?.url?.includes(
      ENDPOINTS.logs.client,
    );

    const status = error.response?.status;
    const isRefreshEndpoint = originalRequest?.url?.includes(
      ENDPOINTS.auth.refresh,
    );

    // A 401 on the refresh endpoint itself means the refresh token is gone /
    // expired / revoked — session is dead, kick to sign-in. Do NOT queue or
    // retry (that would deadlock the queue waiting on itself).
    if (status === 401 && isRefreshEndpoint) {
      processQueue(error);
      clearSessionAndRedirect();
      return Promise.reject(error);
    }

    if (status !== 401 || !originalRequest || originalRequest._retry) {
      // Not a 401 we can retry — report and reject
      if (!isLogEndpoint) {
        reportError(error, {
          url: originalRequest?.url,
          method: originalRequest?.method?.toUpperCase(),
          statusCode: status,
          level: status && status >= 500 ? "ERROR" : "WARN",
        });
      }
      return Promise.reject(error);
    }

    // Check if user is authenticated before attempting refresh
    const isAuthenticated = document.cookie.includes(`${COOKIE_AUTH}=1`);
    if (!isAuthenticated) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => api(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await api.post(ENDPOINTS.auth.refresh);
      processQueue(null);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      handleApiError(refreshError);
      clearSessionAndRedirect();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
