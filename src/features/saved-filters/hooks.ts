"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleApiError, showMessage } from "@/lib/utils";
import { savedFiltersApi } from "./api";

const KEY = (projectId: string) => ["saved-filters", projectId] as const;

export function useSavedFilters(projectId: string | undefined) {
  return useQuery({
    queryKey: ["saved-filters", projectId ?? ""],
    queryFn: () => savedFiltersApi.list(projectId!),
    enabled: !!projectId,
  });
}

export function useCreateSavedFilter(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: savedFiltersApi.create,
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: KEY(projectId) });
    },
    onError: handleApiError,
  });
}

export function useUpdateSavedFilter(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      payload?: Record<string, unknown>;
      shared?: boolean;
    }) => savedFiltersApi.update(id, data),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: KEY(projectId) });
    },
    onError: handleApiError,
  });
}

export function useDeleteSavedFilter(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => savedFiltersApi.delete(id),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: KEY(projectId) });
    },
    onError: handleApiError,
  });
}
