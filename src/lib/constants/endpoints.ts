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
  sessions: `${AUTH_BASE}/sessions`,
  session: (sessionId: string) => `${AUTH_BASE}/sessions/${sessionId}`,
  sessionsRevokeOthers: `${AUTH_BASE}/sessions/revoke-others`,
  sessionsRevokeAll: `${AUTH_BASE}/sessions/revoke-all`,
  oauthProviders: `${AUTH_BASE}/oauth/providers`,
  oauthAccounts: `${AUTH_BASE}/oauth/accounts`,
  oauthAccountByProvider: (provider: string) =>
    `${AUTH_BASE}/oauth/accounts/${provider}`,
  oauthGoogle: `${AUTH_BASE}/google`,
  oauthGithub: `${AUTH_BASE}/github`,
  tokens: `${AUTH_BASE}/tokens`,
  tokenById: (id: string) => `${AUTH_BASE}/tokens/${id}`,
  dataExport: `${AUTH_BASE}/data-export`,
  deletionRequest: `${AUTH_BASE}/deletion-request`,
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
  inviteLinks: (id: string) => `${WORKSPACES_BASE}/${id}/invite-links`,
  inviteLink: (id: string, linkId: string) =>
    `${WORKSPACES_BASE}/${id}/invite-links/${linkId}`,
  invitePreview: (token: string) =>
    `${WORKSPACES_BASE}/join/${token}/preview`,
  join: (token: string) => `${WORKSPACES_BASE}/join/${token}`,
  webhooks: (id: string) => `${WORKSPACES_BASE}/${id}/webhooks`,
  webhook: (id: string, webhookId: string) =>
    `${WORKSPACES_BASE}/${id}/webhooks/${webhookId}`,
  webhookTest: (id: string, webhookId: string) =>
    `${WORKSPACES_BASE}/${id}/webhooks/${webhookId}/test`,
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
  velocity: (boardId: string) => `${SPRINTS_BASE}/velocity/${boardId}`,
  cfd: (boardId: string) => `${SPRINTS_BASE}/cfd/${boardId}`,
} as const;

const ISSUES_ENDPOINTS = {
  base: ISSUES_BASE,
  byId: (id: string) => `${ISSUES_BASE}/${id}`,
  byKey: (key: string) => `${ISSUES_BASE}/key/${key}`,
  myDashboard: `${ISSUES_BASE}/me/dashboard`,
  myStarred: `${ISSUES_BASE}/me/starred`,
  exportCsv: `${ISSUES_BASE}/export.csv`,
  star: (id: string) => `${ISSUES_BASE}/${id}/star`,
  watch: (id: string) => `${ISSUES_BASE}/${id}/watch`,
  watchers: (id: string) => `${ISSUES_BASE}/${id}/watchers`,
  links: (id: string) => `${ISSUES_BASE}/${id}/links`,
  link: (id: string, linkId: string) => `${ISSUES_BASE}/${id}/links/${linkId}`,
  share: (id: string) => `${ISSUES_BASE}/${id}/share`,
  shareById: (id: string, tokenId: string) =>
    `${ISSUES_BASE}/${id}/share/${tokenId}`,
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
  profile: (id: string) => `${USERS_BASE}/${id}/profile`,
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

const NOTIFICATIONS_BASE = "/notifications";
const NOTIFICATIONS_ENDPOINTS = {
  base: NOTIFICATIONS_BASE,
  byId: (id: string) => `${NOTIFICATIONS_BASE}/${id}`,
  read: (id: string) => `${NOTIFICATIONS_BASE}/${id}/read`,
  readAll: `${NOTIFICATIONS_BASE}/read-all`,
  unreadCount: `${NOTIFICATIONS_BASE}/unread-count`,
  preferences: `${NOTIFICATIONS_BASE}/preferences`,
} as const;

const PUSH_BASE = "/push";
const PUSH_ENDPOINTS = {
  config: `${PUSH_BASE}/config`,
  subscribe: `${PUSH_BASE}/subscribe`,
} as const;

const PUBLIC_BASE = "/public";
const PUBLIC_ENDPOINTS = {
  issueByToken: (token: string) => `${PUBLIC_BASE}/issues/${token}`,
} as const;

const SAVED_FILTERS_BASE = "/saved-filters";
const SAVED_FILTERS_ENDPOINTS = {
  base: SAVED_FILTERS_BASE,
  byId: (id: string) => `${SAVED_FILTERS_BASE}/${id}`,
} as const;

const ISSUE_TEMPLATES_BASE = "/issue-templates";
const ISSUE_TEMPLATES_ENDPOINTS = {
  base: ISSUE_TEMPLATES_BASE,
  byId: (id: string) => `${ISSUE_TEMPLATES_BASE}/${id}`,
} as const;

const CUSTOM_FIELDS_BASE = "/custom-fields";
const CUSTOM_FIELDS_ENDPOINTS = {
  base: CUSTOM_FIELDS_BASE,
  byId: (id: string) => `${CUSTOM_FIELDS_BASE}/${id}`,
} as const;

const RECURRING_ISSUES_BASE = "/recurring-issues";
const RECURRING_ISSUES_ENDPOINTS = {
  base: RECURRING_ISSUES_BASE,
  byId: (id: string) => `${RECURRING_ISSUES_BASE}/${id}`,
} as const;

const ADMIN_BASE = "/admin";
const ADMIN_ENDPOINTS = {
  stats: `${ADMIN_BASE}/stats`,
  health: `${ADMIN_BASE}/health`,
  analytics: `${ADMIN_BASE}/analytics`,
  metrics: `${ADMIN_BASE}/metrics`,
  userActivity: `${ADMIN_BASE}/user-activity`,
  workspaces: `${ADMIN_BASE}/workspaces`,
  workspaceById: (id: string) => `${ADMIN_BASE}/workspaces/${id}`,
  audit: `${ADMIN_BASE}/audit`,
  auditExport: `${ADMIN_BASE}/audit/export.csv`,
  mailLogs: `${ADMIN_BASE}/mail-logs`,
  mailLogById: (id: string) => `${ADMIN_BASE}/mail-logs/${id}`,
  mailLogStats: `${ADMIN_BASE}/mail-logs/stats`,
  mailLogConfig: `${ADMIN_BASE}/mail-logs/config-status`,
  mailTest: `${ADMIN_BASE}/mail-logs/test`,
  mailTemplateTest: `${ADMIN_BASE}/mail-logs/template-test`,
  mailTemplateSchema: `${ADMIN_BASE}/mail-logs/template-schema`,
  usersBulkInvite: `${ADMIN_BASE}/users/bulk-invite`,
  throttleOverrides: `${ADMIN_BASE}/throttle-overrides`,
  throttleOverrideById: (id: string) =>
    `${ADMIN_BASE}/throttle-overrides/${id}`,
  webhookDeliveries: `${ADMIN_BASE}/webhook-deliveries`,
  webhookDeliveryRetry: (id: string) =>
    `${ADMIN_BASE}/webhook-deliveries/${id}/retry`,
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
  notifications: NOTIFICATIONS_ENDPOINTS,
  savedFilters: SAVED_FILTERS_ENDPOINTS,
  issueTemplates: ISSUE_TEMPLATES_ENDPOINTS,
  customFields: CUSTOM_FIELDS_ENDPOINTS,
  recurringIssues: RECURRING_ISSUES_ENDPOINTS,
  push: PUSH_ENDPOINTS,
  public: PUBLIC_ENDPOINTS,
} as const;
