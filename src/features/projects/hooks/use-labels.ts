"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleApiError } from "@/lib/utils";
import { labelsApi, issuesApi } from "../api";

export function useLabels(projectId: string) {
  return useQuery({
    queryKey: ["labels", projectId],
    queryFn: () => labelsApi.list(projectId),
    enabled: !!projectId,
  });
}

export function useCreateLabel(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, color }: { name: string; color?: string }) =>
      labelsApi.create(projectId, name, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels", projectId] });
    },
    onError: handleApiError,
  });
}

export function useAddIssueLabel(issueId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (labelId: string) => issuesApi.addLabel(issueId, labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue"] });
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
    },
    onError: handleApiError,
  });
}

export function useRemoveIssueLabel(issueId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (labelId: string) => issuesApi.removeLabel(issueId, labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue"] });
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
    },
    onError: handleApiError,
  });
}
