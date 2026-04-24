"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleApiError, showMessage } from "@/lib/utils";
import {
  createFlag,
  deleteFlag,
  fetchMyFlags,
  listFlags,
  updateFlag,
} from "./api";
import type { CreateFlagInput, UpdateFlagInput } from "./types";

export function useFlags() {
  return useQuery({
    queryKey: ["feature-flags"],
    queryFn: () => listFlags(),
  });
}

export function useCreateFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFlagInput) => createFlag(input),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      queryClient.invalidateQueries({ queryKey: ["my-flags"] });
    },
    onError: handleApiError,
  });
}

export function useUpdateFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFlagInput }) =>
      updateFlag(id, input),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      queryClient.invalidateQueries({ queryKey: ["my-flags"] });
    },
    onError: handleApiError,
  });
}

export function useDeleteFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFlag(id),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      queryClient.invalidateQueries({ queryKey: ["my-flags"] });
    },
    onError: handleApiError,
  });
}

/**
 * Consume a flag by key. Reads from a single `/feature-flags/me` call cached
 * per session; returns `false` while loading so UI stays conservative.
 */
export function useFeatureFlag(key: string): boolean {
  const { data } = useQuery({
    queryKey: ["my-flags"],
    queryFn: () => fetchMyFlags(),
  });
  return data?.[key] ?? false;
}
