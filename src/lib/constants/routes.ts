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
  PROFILE: "/profile",
} as const;

export const PUBLIC_ROUTES = [
  ROUTES.SIGN_IN,
  ROUTES.SIGN_UP,
  ROUTES.VERIFY_EMAIL,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
] as const;
