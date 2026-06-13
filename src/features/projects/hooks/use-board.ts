"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleApiError } from "@/lib/utils";
import { boardsApi } from "../api";
import type { Board, CreateColumnPayload, UpdateColumnPayload } from "../types";

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
      // Issues moved by the BE need their cached board column id refreshed
      // in the `["issues"]` list too — otherwise the backlog / calendar
      // keeps pointing at a deleted column id.
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
      queryClient.invalidateQueries({ queryKey: ["issues", projectId] });
    },
    onError: handleApiError,
  });
}

/**
 * Reorder board columns. Optimistic: rearranges the cached board immediately
 * so the dragged column doesn't snap back while the request is in-flight;
 * rolls back from the snapshot if the request fails, then invalidates so
 * the BE-canonical order wins on the next refetch.
 */
export function useReorderColumns(projectId: string) {
  const queryClient = useQueryClient();
  const boardKey = ["board", projectId] as const;

  return useMutation({
    mutationFn: ({ boardId, columnIds }: { boardId: string; columnIds: string[] }) =>
      boardsApi.reorderColumns(boardId, columnIds),
    onMutate: async ({ columnIds }) => {
      await queryClient.cancelQueries({ queryKey: boardKey });
      const previous = queryClient.getQueryData<Board>(boardKey);
      if (previous) {
        const byId = new Map(previous.columns.map((c) => [c.id, c]));
        // Filter out unknown ids so a stale drag doesn't corrupt the cache.
        const reordered = columnIds
          .map((id) => byId.get(id))
          .filter((c): c is NonNullable<typeof c> => Boolean(c));
        queryClient.setQueryData<Board>(boardKey, {
          ...previous,
          columns: reordered.map((c, i) => ({ ...c, position: i })),
        });
      }
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(boardKey, ctx.previous);
      handleApiError(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: boardKey });
    },
  });
}
