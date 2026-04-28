import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/constants";
import type {
  AdminAnalytics,
  AdminHealth,
  AdminMetrics,
  AdminStats,
  AdminUser,
  AdminUsersFilters,
  AdminUsersListResponse,
  AdminWorkspaceDetail,
  AdminWorkspacesFilters,
  AdminWorkspacesListResponse,
  BulkInviteResult,
  Role,
  SessionsResponse,
  UserActivity,
} from "./types";

export async function fetchUsers(
  filters: AdminUsersFilters,
): Promise<AdminUsersListResponse> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== ""),
  );
  const res = await api.get<AdminUsersListResponse>(ENDPOINTS.users.base, {
    params,
  });
  return res.data;
}

export async function updateUserRole(
  id: string,
  role: Role,
): Promise<{ message: string; user: AdminUser }> {
  const res = await api.patch<{ message: string; user: AdminUser }>(
    ENDPOINTS.users.role(id),
    { role },
  );
  return res.data;
}

export async function deleteUser(id: string): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(ENDPOINTS.users.byId(id));
  return res.data;
}

export async function setUserActive(
  id: string,
  active: boolean,
): Promise<{ message: string; user: AdminUser }> {
  const res = await api.patch<{ message: string; user: AdminUser }>(
    ENDPOINTS.users.status(id),
    { active },
  );
  return res.data;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await api.get<AdminStats>(ENDPOINTS.admin.stats);
  return res.data;
}

export async function fetchAdminAnalytics(
  sinceHours: number,
): Promise<AdminAnalytics> {
  const res = await api.get<AdminAnalytics>(ENDPOINTS.admin.analytics, {
    params: { sinceHours },
  });
  return res.data;
}

export async function fetchAdminMetrics(
  sinceHours: number,
  takes: { topRoutes: number; slowest: number } = {
    topRoutes: 10,
    slowest: 10,
  },
): Promise<AdminMetrics> {
  const res = await api.get<AdminMetrics>(ENDPOINTS.admin.metrics, {
    params: {
      sinceHours,
      topRoutesTake: takes.topRoutes,
      slowestTake: takes.slowest,
    },
  });
  return res.data;
}

export async function fetchUserActivity(
  sinceHours: number,
  takes: { recent: number; top: number },
): Promise<UserActivity>;
export async function fetchUserActivity(
  sinceHours: number,
  take?: number,
): Promise<UserActivity>;
export async function fetchUserActivity(
  sinceHours: number,
  arg2?: number | { recent: number; top: number },
): Promise<UserActivity> {
  const params: Record<string, number> = { sinceHours };
  if (typeof arg2 === "number") {
    params.take = arg2;
  } else if (arg2) {
    // Map onto the metrics DTO's per-list params so BE doesn't need a new
    // contract for this endpoint.
    params.slowestTake = arg2.recent;
    params.topRoutesTake = arg2.top;
  }
  const res = await api.get<UserActivity>(ENDPOINTS.admin.userActivity, {
    params,
  });
  return res.data;
}

export async function fetchAdminWorkspaces(
  filters: AdminWorkspacesFilters,
): Promise<AdminWorkspacesListResponse> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== ""),
  );
  const res = await api.get<AdminWorkspacesListResponse>(
    ENDPOINTS.admin.workspaces,
    { params },
  );
  return res.data;
}

export async function adminDeleteWorkspace(
  id: string,
): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(
    ENDPOINTS.admin.workspaceById(id),
  );
  return res.data;
}

export async function fetchAdminWorkspaceDetail(
  id: string,
): Promise<AdminWorkspaceDetail> {
  const res = await api.get<AdminWorkspaceDetail>(
    ENDPOINTS.admin.workspaceById(id),
  );
  return res.data;
}

export async function fetchAdminHealth(): Promise<AdminHealth> {
  const res = await api.get<AdminHealth>(ENDPOINTS.admin.health);
  return res.data;
}

export async function bulkInviteUsers(
  emails: string[],
  message?: string,
): Promise<BulkInviteResult> {
  const res = await api.post<BulkInviteResult>(
    ENDPOINTS.admin.usersBulkInvite,
    { emails, message },
  );
  return res.data;
}

export async function fetchUserSessions(
  userId: string,
): Promise<SessionsResponse> {
  const res = await api.get<SessionsResponse>(
    ENDPOINTS.users.sessions(userId),
  );
  return res.data;
}

export async function revokeUserSession(
  userId: string,
  tokenId: string,
): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(
    ENDPOINTS.users.sessionById(userId, tokenId),
  );
  return res.data;
}

export async function revokeAllUserSessions(
  userId: string,
): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(
    ENDPOINTS.users.sessions(userId),
  );
  return res.data;
}
