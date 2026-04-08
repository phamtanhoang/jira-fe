const AUTH_BASE = "/auth";
const SETTINGS_BASE = "/settings";

const AUTH_ENDPOINTS = {
  auth: AUTH_BASE,
  signIn: `${AUTH_BASE}/login`,
  signUp: `${AUTH_BASE}/register`,
  verifyEmail: `${AUTH_BASE}/verify-email`,
  forgotPassword: `${AUTH_BASE}/forgot-password`,
  resetPassword: `${AUTH_BASE}/reset-password`,
  logOut: `${AUTH_BASE}/logout`,
  refresh: `${AUTH_BASE}/refresh`,
  me: `${AUTH_BASE}/me`,
} as const;

const SETTINGS_ENDPOINTS = {
  settings: SETTINGS_BASE,
  appInfo: `${SETTINGS_BASE}/app-info`,
} as const;

export const ENDPOINTS = {
  auth: AUTH_ENDPOINTS,
  settings: SETTINGS_ENDPOINTS,
} as const;
