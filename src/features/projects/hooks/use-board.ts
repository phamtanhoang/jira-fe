"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleApiError } from "@/lib/utils";
import { boardsApi } from "../api";
import type { CreateColumnPayload, UpdateColumnPayload } from "../types";

export function useBoard(projectId: string) {
  return useQuery({
    queryKey: ["board", projectId],
    queryFn: () => boardsApi.getByProject(projectId),
    enabled: !!projectId,
  });
}

export function useAddColumn(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, ...data }: CreateColumnPayload & { boardId: string }) =>
      boardsApi.addColumn(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
    },
    onError: handleApiError,
  });
}

export function useUpdateColumn(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boardId,
      columnId,
      ...data
    }: UpdateColumnPayload & { boardId: string; columnId: string }) =>
      boardsApi.updateColumn(boardId, columnId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
    },
    onError: handleApiError,
  });
}

export function useDeleteColumn(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, columnId }: { boardId: string; columnId: string }) =>
      boardsApi.deleteColumn(boardId, columnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
    },
    onError: handleApiError,
  });
}
