export type Role = "USER" | "ADMIN";

export type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  emailVerified: string | null;
  image: string | null;
  role: Role;
  active: boolean;
  deactivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    ownedWorkspaces: number;
    assignedIssues: number;
    comments: number;
  };
};

export type AdminUsersListResponse = {
  data: AdminUser[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type AdminUsersFilters = {
  search?: string;
  role?: Role;
  verified?: boolean;
  cursor?: string;
  take?: number;
};

export type RecentSignup = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
};

export type TopWorkspace = {
  id: string;
  name: string;
  slug: string;
  owner: { id: string; name: string | null; image: string | null };
  _count: { projects: number; members: number };
};

export type AdminStats = {
  users: {
    total: number;
    admins: number;
    newLast7Days: number;
    unverified: number;
  };
  workspaces: { total: number };
  projects: { total: number };
  issues: { total: number };
  logs: { last24h: { INFO: number; WARN: number; ERROR: number } };
  recentSignups: RecentSignup[];
  topWorkspaces: TopWorkspace[];
  activeUsers24h: number;
};

export type DailyCount = { date: string; count: number };
export type DailyLogRow = {
  date: string;
  INFO: number;
  WARN: number;
  ERROR: number;
};

export type AdminAnalytics = {
  days: number;
  signups: DailyCount[];
  issuesCreated: DailyCount[];
  newWorkspaces: DailyCount[];
  comments: DailyCount[];
  worklogs: DailyCount[];
  activeUsers: DailyCount[];
  requestsByLevel: DailyLogRow[];
};

export type RouteMetric = {
  route: string;
  count: number;
  errorCount: number;
  p50: number;
  p95: number;
  p99: number;
};

export type SlowRequestRow = {
  id: string;
  url: string;
  method: string;
  statusCode: number | null;
  durationMs: number;
  userEmail: string | null;
  createdAt: string;
};

export type HourlyErrorPoint = {
  bucket: string;
  count: number;
};

export type AdminMetrics = {
  sinceHours: number;
  topRoutes: RouteMetric[];
  methodDistribution: { method: string; count: number }[];
  statusDistribution: { statusCode: number; count: number }[];
  slowestRequests: SlowRequestRow[];
  errorTrendHourly: HourlyErrorPoint[];
};

export type UserActivityTopUser = {
  userId: string | null;
  userEmail: string | null;
  count: number;
  lastSeen: string | null;
};

export type UserActivityTopRoute = {
  route: string | null;
  method: string;
  count: number;
};

export type UserActivityRecent = {
  id: string;
  method: string;
  url: string;
  route: string | null;
  statusCode: number | null;
  userEmail: string | null;
  createdAt: string;
};

export type UserActivity = {
  sinceHours: number;
  totalRequests: number;
  topUsers: UserActivityTopUser[];
  topRoutes: UserActivityTopRoute[];
  recent: UserActivityRecent[];
};

export type AdminWorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  owner: { id: string; name: string | null; image: string | null };
  _count: { projects: number; members: number };
};

export type AdminWorkspacesListResponse = {
  data: AdminWorkspaceRow[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type AdminWorkspacesFilters = {
  search?: string;
  cursor?: string;
  take?: number;
};

export type SessionRow = {
  id: string;
  createdAt: string;
  expiresAt: string;
};

export type SessionsResponse = {
  data: SessionRow[];
};

export type AdminHealth = {
  checkedAt: string;
  checkDurationMs: number;
  db: { ok: boolean; latencyMs: number; error?: string };
  mail: { configured: boolean; from: string | null };
  supabase: { configured: boolean; ok: boolean; error?: string };
  sentry: { configured: boolean; active: boolean };
  runtime: {
    nodeVersion: string;
    uptimeSec: number;
    memoryMB: number;
    env: string;
  };
};

export type AdminWorkspaceDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  counts: {
    members: number;
    projects: number;
    issues: number;
    issuesOpen: number;
    attachments: number;
  };
  storage: { bytes: number };
  recentProjects: {
    id: string;
    name: string;
    key: string;
    createdAt: string;
    _count: { issues: number };
  }[];
  recentMembers: {
    id: string;
    role: string;
    joinedAt: string;
    user: { id: string; name: string | null; email: string; image: string | null };
  }[];
};

export type BulkInviteResult = {
  message: string;
  invited: number;
  skipped: number;
  invalid: number;
};
