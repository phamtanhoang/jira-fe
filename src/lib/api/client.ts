import axios from "axios";
import { ROUTES, ENDPOINTS } from "@/lib/constants";
import { handleApiError } from "@/lib/utils";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ─── Send timezone header ──────────────────────────────
api.interceptors.request.use((config) => {
  config.headers["x-timezone"] =
    Intl.DateTimeFormat().resolvedOptions().timeZone;
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
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Check if user is authenticated before attempting refresh
    const isAuthenticated = document.cookie.includes("is_authenticated=true");
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
      document.cookie = "is_authenticated=;path=/;max-age=0";
      window.location.href = ROUTES.SIGN_IN;
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
