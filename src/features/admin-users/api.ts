import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/constants";
import type {
  AdminAnalytics,
  AdminMetrics,
  AdminStats,
  AdminUser,
  AdminUsersFilters,
  AdminUsersListResponse,
  AdminWorkspacesFilters,
  AdminWorkspacesListResponse,
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
  days: number,
): Promise<AdminAnalytics> {
  const res = await api.get<AdminAnalytics>(ENDPOINTS.admin.analytics, {
    params: { days },
  });
  return res.data;
}

export async function fetchAdminMetrics(
  sinceHours: number,
): Promise<AdminMetrics> {
  const res = await api.get<AdminMetrics>(ENDPOINTS.admin.metrics, {
    params: { sinceHours },
  });
  return res.data;
}

export async function fetchUserActivity(
  sinceHours: number,
): Promise<UserActivity> {
  const res = await api.get<UserActivity>(ENDPOINTS.admin.userActivity, {
    params: { sinceHours },
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
