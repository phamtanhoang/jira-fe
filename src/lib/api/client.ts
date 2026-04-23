import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { ROUTES, ENDPOINTS, COOKIE_AUTH } from "@/lib/constants";
import { pushBreadcrumb, reportError } from "@/lib/logging";
import { handleApiError } from "@/lib/utils";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ─── Send timezone header + breadcrumb ──────────────────────
api.interceptors.request.use((config) => {
  config.headers["x-timezone"] =
    Intl.DateTimeFormat().resolvedOptions().timeZone;

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
      document.cookie = `${COOKIE_AUTH}=;path=/;max-age=0`;
      window.location.href = ROUTES.SIGN_IN;
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
