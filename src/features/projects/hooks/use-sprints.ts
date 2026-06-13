"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleApiError, showMessage } from "@/lib/utils";
import { sprintsApi } from "../api";
import type { UpdateSprintPayload } from "../types";

export function useSprintBurndown(sprintId: string | undefined) {
  return useQuery({
    queryKey: ["sprint-burndown", sprintId],
    queryFn: () => sprintsApi.burndown(sprintId!),
    enabled: !!sprintId,
  });
}

export function useVelocity(boardId: string | undefined) {
  return useQuery({
    queryKey: ["velocity", boardId],
    queryFn: () => sprintsApi.velocity(boardId!),
    enabled: !!boardId,
  });
}

export function useCfd(boardId: string | undefined, days = 30) {
  return useQuery({
    queryKey: ["cfd", boardId, days],
    queryFn: () => sprintsApi.cfd(boardId!, days),
    enabled: !!boardId,
  });
}

/**
 * Sprint mutations all affect the dashboard widget (`["dashboard"]`),
 * sprint dropdowns (`["sprints", projectId]`), and the global issues
 * list (`["issues", projectId]`) — invalidating only the board view
 * left those stale until manual refresh.
 */
function invalidateSprintScopes(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
) {
  queryClient.invalidateQueries({ queryKey: ["board", projectId] });
  queryClient.invalidateQueries({ queryKey: ["sprints", projectId] });
  queryClient.invalidateQueries({ queryKey: ["issues", projectId] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}

export function useCreateSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, name }: { boardId: string; name: string }) =>
      sprintsApi.create(boardId, name),
    onSuccess: (r) => {
      invalidateSprintScopes(queryClient, projectId);
      if (r?.message) showMessage(r.message);
    },
    onError: handleApiError,
  });
}

export function useUpdateSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateSprintPayload & { id: string }) =>
      sprintsApi.update(id, data),
    onSuccess: (r) => {
      invalidateSprintScopes(queryClient, projectId);
      if (r?.message) showMessage(r.message);
    },
    onError: handleApiError,
  });
}

export function useDeleteSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sprintsApi.delete(id),
    onSuccess: (r) => {
      invalidateSprintScopes(queryClient, projectId);
      if (r?.message) showMessage(r.message);
    },
    onError: handleApiError,
  });
}

export function useStartSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sprintsApi.start(id),
    onSuccess: (r) => {
      invalidateSprintScopes(queryClient, projectId);
      if (r?.message) showMessage(r.message);
    },
    onError: handleApiError,
  });
}

export function useCompleteSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sprintsApi.complete(id),
    onSuccess: (r) => {
      invalidateSprintScopes(queryClient, projectId);
      if (r?.message) showMessage(r.message);
    },
    onError: handleApiError,
  });
}
