"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleApiError, showMessage } from "@/lib/utils";
import {
  createThrottleOverride,
  deleteThrottleOverride,
  fetchThrottleOverrides,
  updateThrottleOverride,
} from "./api";
import type {
  CreateThrottleOverridePayload,
  UpdateThrottleOverridePayload,
} from "./types";

const KEY = ["admin-throttle-overrides"] as const;

export function useThrottleOverrides() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => fetchThrottleOverrides(),
  });
}

export function useCreateThrottleOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateThrottleOverridePayload) =>
      createThrottleOverride(payload),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: KEY });
    },
    onError: handleApiError,
  });
}

export function useUpdateThrottleOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateThrottleOverridePayload;
    }) => updateThrottleOverride(id, payload),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: KEY });
    },
    onError: handleApiError,
  });
}

export function useDeleteThrottleOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteThrottleOverride(id),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: KEY });
    },
    onError: handleApiError,
  });
}
