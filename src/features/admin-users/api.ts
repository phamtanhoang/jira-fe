import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/constants";
import type {
  AdminStats,
  AdminUser,
  AdminUsersFilters,
  AdminUsersListResponse,
  Role,
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

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await api.get<AdminStats>(ENDPOINTS.admin.stats);
  return res.data;
}
