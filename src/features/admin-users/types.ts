export type Role = "USER" | "ADMIN";

export type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  emailVerified: string | null;
  image: string | null;
  role: Role;
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

export type AdminMetrics = {
  sinceHours: number;
  topRoutes: RouteMetric[];
  methodDistribution: { method: string; count: number }[];
  statusDistribution: { statusCode: number; count: number }[];
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
