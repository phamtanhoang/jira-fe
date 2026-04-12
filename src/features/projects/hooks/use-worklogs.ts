"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleApiError } from "@/lib/utils";
import { issuesApi } from "../api";

export function useActivity(issueId: string) {
  return useQuery({
    queryKey: ["activity", issueId],
    queryFn: () => issuesApi.getActivity(issueId),
    enabled: !!issueId,
  });
}

export function useWorklogs(issueId: string) {
  return useQuery({
    queryKey: ["worklogs", issueId],
    queryFn: () => issuesApi.getWorklogs(issueId),
    enabled: !!issueId,
  });
}

export function useAddWorklog(issueId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { timeSpent: number; startedAt: string; description?: string }) =>
      issuesApi.addWorklog(issueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worklogs", issueId] });
    },
    onError: handleApiError,
  });
}

export function useUpdateWorklog(issueId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ worklogId, ...data }: { worklogId: string; timeSpent?: number; startedAt?: string; description?: string }) =>
      issuesApi.updateWorklog(worklogId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worklogs", issueId] });
    },
    onError: handleApiError,
  });
}

export function useDeleteWorklog(issueId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (worklogId: string) => issuesApi.deleteWorklog(worklogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worklogs", issueId] });
    },
    onError: handleApiError,
  });
}
