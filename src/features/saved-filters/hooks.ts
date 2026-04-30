"use client";

import { useQuery } from "@tanstack/react-query";
import { useInvalidatingMutation } from "@/lib/react-query/use-invalidating-mutation";
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
  return useInvalidatingMutation(savedFiltersApi.create, KEY(projectId), {
    successMessage: (r) => r.message,
  });
}

export function useUpdateSavedFilter(projectId: string) {
  return useInvalidatingMutation(
    ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      payload?: Record<string, unknown>;
      shared?: boolean;
    }) => savedFiltersApi.update(id, data),
    KEY(projectId),
    { successMessage: (r) => r.message },
  );
}

export function useDeleteSavedFilter(projectId: string) {
  return useInvalidatingMutation(
    (id: string) => savedFiltersApi.delete(id),
    KEY(projectId),
    { successMessage: (r) => r.message },
  );
}
