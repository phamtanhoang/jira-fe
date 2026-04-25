export const ROUTES = {
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  VERIFY_EMAIL: "/verify-email",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  DASHBOARD: "/dashboard",
  WORKSPACES: "/workspaces",
  WORKSPACE: (id: string) => `/workspaces/${id}`,
  BOARD: (workspaceId: string, projectId: string) =>
    `/workspaces/${workspaceId}/projects/${projectId}/board`,
  PROJECT_SETTINGS: (workspaceId: string, projectId: string) =>
    `/workspaces/${workspaceId}/projects/${projectId}/settings`,
  ISSUE: (key: string) => `/issues/${key}`,
  NOTIFICATIONS: "/notifications",
  PROFILE: "/profile",
  ADMIN: "/admin",
  ADMIN_LOGS: "/admin/logs",
  ADMIN_SETTINGS: "/admin/settings",
  ADMIN_USERS: "/admin/users",
  ADMIN_FLAGS: "/admin/flags",
  ADMIN_ANNOUNCEMENT: "/admin/announcement",
  ADMIN_SITE_NOTICES: "/admin/site-notices",
  ADMIN_ANALYTICS: "/admin/analytics",
  ADMIN_METRICS: "/admin/metrics",
  ADMIN_WORKSPACES: "/admin/workspaces",
  ADMIN_MAINTENANCE: "/admin/maintenance",
  ADMIN_AUDIT: "/admin/audit",
  MAINTENANCE: "/maintenance",
} as const;

export const PUBLIC_ROUTES = [
  ROUTES.SIGN_IN,
  ROUTES.SIGN_UP,
  ROUTES.VERIFY_EMAIL,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
] as const;
