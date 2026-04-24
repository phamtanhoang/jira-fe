const AUTH_BASE = "/auth";
const SETTINGS_BASE = "/settings";
const WORKSPACES_BASE = "/workspaces";
const PROJECTS_BASE = "/projects";
const BOARDS_BASE = "/boards";
const SPRINTS_BASE = "/sprints";
const ISSUES_BASE = "/issues";
const LABELS_BASE = "/labels";
const COMMENTS_BASE = "/comments";
const WORKLOGS_BASE = "/worklogs";
const LOGS_BASE = "/logs";

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
  appInfoLogo: `${SETTINGS_BASE}/app-info/logo`,
  appAnnouncement: `${SETTINGS_BASE}/app-announcement`,
  appMaintenance: `${SETTINGS_BASE}/app-maintenance`,
  byKey: (key: string) => `${SETTINGS_BASE}/${encodeURIComponent(key)}`,
} as const;

const WORKSPACES_ENDPOINTS = {
  base: WORKSPACES_BASE,
  byId: (id: string) => `${WORKSPACES_BASE}/${id}`,
  members: (id: string) => `${WORKSPACES_BASE}/${id}/members`,
  member: (id: string, memberId: string) =>
    `${WORKSPACES_BASE}/${id}/members/${memberId}`,
} as const;

const PROJECTS_ENDPOINTS = {
  base: PROJECTS_BASE,
  byId: (id: string) => `${PROJECTS_BASE}/${id}`,
  members: (id: string) => `${PROJECTS_BASE}/${id}/members`,
  member: (id: string, memberId: string) =>
    `${PROJECTS_BASE}/${id}/members/${memberId}`,
} as const;

const BOARDS_ENDPOINTS = {
  base: BOARDS_BASE,
  byProject: (projectId: string) => `${BOARDS_BASE}/project/${projectId}`,
  columns: (boardId: string) => `${BOARDS_BASE}/${boardId}/columns`,
  column: (boardId: string, columnId: string) =>
    `${BOARDS_BASE}/${boardId}/columns/${columnId}`,
  reorderColumns: (boardId: string) =>
    `${BOARDS_BASE}/${boardId}/columns/reorder`,
} as const;

const SPRINTS_ENDPOINTS = {
  base: SPRINTS_BASE,
  byId: (id: string) => `${SPRINTS_BASE}/${id}`,
  start: (id: string) => `${SPRINTS_BASE}/${id}/start`,
  complete: (id: string) => `${SPRINTS_BASE}/${id}/complete`,
  burndown: (id: string) => `${SPRINTS_BASE}/${id}/burndown`,
} as const;

const ISSUES_ENDPOINTS = {
  base: ISSUES_BASE,
  byId: (id: string) => `${ISSUES_BASE}/${id}`,
  byKey: (key: string) => `${ISSUES_BASE}/key/${key}`,
  myDashboard: `${ISSUES_BASE}/me/dashboard`,
  move: (id: string) => `${ISSUES_BASE}/${id}/move`,
  labels: (id: string, labelId: string) =>
    `${ISSUES_BASE}/${id}/labels/${labelId}`,
  comments: (id: string) => `${ISSUES_BASE}/${id}/comments`,
  worklogs: (id: string) => `${ISSUES_BASE}/${id}/worklogs`,
  activity: (id: string) => `${ISSUES_BASE}/${id}/activity`,
  attachments: (id: string) => `${ISSUES_BASE}/${id}/attachments`,
  bulk: `${ISSUES_BASE}/bulk`,
} as const;

const ATTACHMENTS_BASE = "/attachments";
const ATTACHMENTS_ENDPOINTS = {
  byId: (id: string) => `${ATTACHMENTS_BASE}/${id}`,
} as const;

const LABELS_ENDPOINTS = {
  base: LABELS_BASE,
  byId: (id: string) => `${LABELS_BASE}/${id}`,
} as const;

const COMMENTS_ENDPOINTS = {
  byId: (id: string) => `${COMMENTS_BASE}/${id}`,
} as const;

const WORKLOGS_ENDPOINTS = {
  byId: (id: string) => `${WORKLOGS_BASE}/${id}`,
} as const;

const LOGS_ENDPOINTS = {
  base: LOGS_BASE,
  byId: (id: string) => `${LOGS_BASE}/${id}`,
  client: `${LOGS_BASE}/client`,
} as const;

const USERS_BASE = "/users";
const USERS_ENDPOINTS = {
  base: USERS_BASE,
  byId: (id: string) => `${USERS_BASE}/${id}`,
  role: (id: string) => `${USERS_BASE}/${id}/role`,
  status: (id: string) => `${USERS_BASE}/${id}/status`,
  sessions: (id: string) => `${USERS_BASE}/${id}/sessions`,
  sessionById: (id: string, tokenId: string) =>
    `${USERS_BASE}/${id}/sessions/${tokenId}`,
} as const;

const FEATURE_FLAGS_BASE = "/feature-flags";
const FEATURE_FLAGS_ENDPOINTS = {
  base: FEATURE_FLAGS_BASE,
  byId: (id: string) => `${FEATURE_FLAGS_BASE}/${id}`,
  me: `${FEATURE_FLAGS_BASE}/me`,
} as const;

const ADMIN_BASE = "/admin";
const ADMIN_ENDPOINTS = {
  stats: `${ADMIN_BASE}/stats`,
  analytics: `${ADMIN_BASE}/analytics`,
  metrics: `${ADMIN_BASE}/metrics`,
  userActivity: `${ADMIN_BASE}/user-activity`,
  workspaces: `${ADMIN_BASE}/workspaces`,
  workspaceById: (id: string) => `${ADMIN_BASE}/workspaces/${id}`,
  audit: `${ADMIN_BASE}/audit`,
} as const;

export const ENDPOINTS = {
  auth: AUTH_ENDPOINTS,
  settings: SETTINGS_ENDPOINTS,
  workspaces: WORKSPACES_ENDPOINTS,
  projects: PROJECTS_ENDPOINTS,
  boards: BOARDS_ENDPOINTS,
  sprints: SPRINTS_ENDPOINTS,
  issues: ISSUES_ENDPOINTS,
  labels: LABELS_ENDPOINTS,
  attachments: ATTACHMENTS_ENDPOINTS,
  comments: COMMENTS_ENDPOINTS,
  worklogs: WORKLOGS_ENDPOINTS,
  logs: LOGS_ENDPOINTS,
  users: USERS_ENDPOINTS,
  admin: ADMIN_ENDPOINTS,
  featureFlags: FEATURE_FLAGS_ENDPOINTS,
} as const;
