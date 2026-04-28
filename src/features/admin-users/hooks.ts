"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { handleApiError, showMessage } from "@/lib/utils";
import {
  adminDeleteWorkspace,
  bulkInviteUsers,
  deleteUser,
  fetchAdminAnalytics,
  fetchAdminHealth,
  fetchAdminMetrics,
  fetchAdminStats,
  fetchAdminWorkspaceDetail,
  fetchAdminWorkspaces,
  fetchUserActivity,
  fetchUserSessions,
  fetchUsers,
  revokeAllUserSessions,
  revokeUserSession,
  setUserActive,
  updateUserRole,
} from "./api";
import type {
  AdminUsersFilters,
  AdminWorkspacesFilters,
  Role,
} from "./types";

export function useAdminUsers(filters: AdminUsersFilters) {
  return useQuery({
    queryKey: ["admin-users", filters],
    queryFn: () => fetchUsers(filters),
  });
}

/**
 * Cursor-paginated infinite list. Filters DO change the queryKey (so a new
 * search resets the pages); only the cursor advances within a single result
 * set. Concatenated rows live in `pages.flatMap((p) => p.data)`.
 */
export function useInfiniteAdminUsers(
  filters: Omit<AdminUsersFilters, "cursor">,
) {
  return useInfiniteQuery({
    queryKey: ["admin-users-infinite", filters],
    queryFn: ({ pageParam }) =>
      fetchUsers({ ...filters, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      updateUserRole(id, role),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: handleApiError,
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: handleApiError,
  });
}

export function useSetUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setUserActive(id, active),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: handleApiError,
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchAdminStats(),
  });
}

export function useAdminAnalytics(days: number) {
  return useQuery({
    queryKey: ["admin-analytics", days],
    queryFn: () => fetchAdminAnalytics(days),
  });
}

export function useAdminMetrics(
  sinceHours: number,
  takes: { topRoutes: number; slowest: number } = {
    topRoutes: 10,
    slowest: 10,
  },
) {
  return useQuery({
    queryKey: ["admin-metrics", sinceHours, takes.topRoutes, takes.slowest],
    queryFn: () => fetchAdminMetrics(sinceHours, takes),
  });
}

export function useUserActivity(
  sinceHours: number,
  takes: { recent: number; top: number } = { recent: 30, top: 30 },
) {
  return useQuery({
    queryKey: ["admin-user-activity", sinceHours, takes.recent, takes.top],
    queryFn: () => fetchUserActivity(sinceHours, takes),
  });
}

export function useAdminWorkspaces(filters: AdminWorkspacesFilters) {
  return useQuery({
    queryKey: ["admin-workspaces", filters],
    queryFn: () => fetchAdminWorkspaces(filters),
  });
}

/** Cursor-paginated infinite list — see `useInfiniteAdminUsers`. */
export function useInfiniteAdminWorkspaces(
  filters: Omit<AdminWorkspacesFilters, "cursor">,
) {
  return useInfiniteQuery({
    queryKey: ["admin-workspaces-infinite", filters],
    queryFn: ({ pageParam }) =>
      fetchAdminWorkspaces({
        ...filters,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
  });
}

export function useAdminDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminDeleteWorkspace(id),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ["admin-workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["admin-workspaces-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: handleApiError,
  });
}

export function useUserSessions(userId: string | null) {
  return useQuery({
    queryKey: ["admin-user-sessions", userId],
    queryFn: () => fetchUserSessions(userId as string),
    enabled: !!userId,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, tokenId }: { userId: string; tokenId: string }) =>
      revokeUserSession(userId, tokenId),
    onSuccess: (result, { userId }) => {
      showMessage(result.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-user-sessions", userId],
      });
    },
    onError: handleApiError,
  });
}

export function useAdminHealth() {
  return useQuery({
    queryKey: ["admin-health"],
    queryFn: () => fetchAdminHealth(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useAdminWorkspaceDetail(id: string | null) {
  return useQuery({
    queryKey: ["admin-workspace-detail", id],
    queryFn: () => fetchAdminWorkspaceDetail(id as string),
    enabled: !!id,
  });
}

export function useBulkInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      emails,
      message,
    }: {
      emails: string[];
      message?: string;
    }) => bulkInviteUsers(emails, message),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: handleApiError,
  });
}

export function useRevokeAllSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => revokeAllUserSessions(userId),
    onSuccess: (result, userId) => {
      showMessage(result.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-user-sessions", userId],
      });
    },
    onError: handleApiError,
  });
}
