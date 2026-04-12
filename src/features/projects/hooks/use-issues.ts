"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleApiError, showMessage } from "@/lib/utils";
import { issuesApi } from "../api";
import type { CreateIssuePayload, MoveIssuePayload } from "../types";

export function useIssues(projectId: string, filters?: Record<string, string>) {
  return useQuery({
    queryKey: ["issues", projectId, filters],
    queryFn: () => issuesApi.list(projectId, filters),
    enabled: !!projectId,
  });
}

export function useIssue(key: string) {
  return useQuery({
    queryKey: ["issue", key],
    queryFn: () => issuesApi.getByKey(key),
    enabled: !!key,
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIssuePayload) => issuesApi.create(data),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ["board", result.issue.projectId] });
      queryClient.invalidateQueries({ queryKey: ["issues", result.issue.projectId] });
    },
    onError: handleApiError,
  });
}

export function useMoveIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: MoveIssuePayload & { id: string }) =>
      issuesApi.move(id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["board", result.issue.projectId] });
      queryClient.invalidateQueries({ queryKey: ["issue"] });
    },
    onError: handleApiError,
  });
}

export function useUpdateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      issuesApi.update(id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["board", result.issue.projectId] });
      queryClient.invalidateQueries({ queryKey: ["issue", result.issue.key] });
    },
    onError: handleApiError,
  });
}

export function useDeleteIssue(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => issuesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
      queryClient.invalidateQueries({ queryKey: ["issues", projectId] });
    },
    onError: handleApiError,
  });
}
