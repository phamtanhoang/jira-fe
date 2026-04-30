"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleApiError, showMessage } from "@/lib/utils";
import {
  createRecurringRule,
  deleteRecurringRule,
  fetchRecurringRules,
  updateRecurringRule,
} from "./api";
import type {
  CreateRecurringRulePayload,
  UpdateRecurringRulePayload,
} from "./types";

const key = (projectId: string) => ["recurring-issues", projectId] as const;

export function useRecurringRules(projectId: string | undefined) {
  return useQuery({
    queryKey: projectId ? key(projectId) : ["recurring-issues", "_"],
    queryFn: () => fetchRecurringRules(projectId as string),
    enabled: !!projectId,
  });
}

export function useCreateRecurringRule(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRecurringRulePayload) =>
      createRecurringRule(payload),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: key(projectId) });
    },
    onError: handleApiError,
  });
}

export function useUpdateRecurringRule(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateRecurringRulePayload;
    }) => updateRecurringRule(id, payload),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: key(projectId) });
    },
    onError: handleApiError,
  });
}

export function useDeleteRecurringRule(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRecurringRule(id),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: key(projectId) });
    },
    onError: handleApiError,
  });
}
