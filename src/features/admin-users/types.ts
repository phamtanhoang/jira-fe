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
