"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      updateUserRole(id, role),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
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

export function useAdminMetrics(sinceHours: number, take = 10) {
  return useQuery({
    queryKey: ["admin-metrics", sinceHours, take],
    queryFn: () => fetchAdminMetrics(sinceHours, take),
  });
}

export function useUserActivity(sinceHours: number, take = 30) {
  return useQuery({
    queryKey: ["admin-user-activity", sinceHours, take],
    queryFn: () => fetchUserActivity(sinceHours, take),
  });
}

export function useAdminWorkspaces(filters: AdminWorkspacesFilters) {
  return useQuery({
    queryKey: ["admin-workspaces", filters],
    queryFn: () => fetchAdminWorkspaces(filters),
  });
}

export function useAdminDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminDeleteWorkspace(id),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ["admin-workspaces"] });
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
