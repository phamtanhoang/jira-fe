"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { handleApiError } from "@/lib/utils";
import { sprintsApi } from "../api";
import type { UpdateSprintPayload } from "../types";

export function useCreateSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, name }: { boardId: string; name: string }) =>
      sprintsApi.create(boardId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
    },
    onError: handleApiError,
  });
}

export function useUpdateSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateSprintPayload & { id: string }) =>
      sprintsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
    },
    onError: handleApiError,
  });
}

export function useDeleteSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sprintsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
    },
    onError: handleApiError,
  });
}

export function useStartSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sprintsApi.start(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
    },
    onError: handleApiError,
  });
}

export function useCompleteSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sprintsApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
    },
    onError: handleApiError,
  });
}
