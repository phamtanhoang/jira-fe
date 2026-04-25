"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleApiError, showMessage } from "@/lib/utils";
import {
  issueTemplatesApi,
  type CreateTemplatePayload,
  type UpdateTemplatePayload,
} from "./api";

const KEY = (projectId: string) => ["issue-templates", projectId] as const;

export function useIssueTemplates(projectId: string | undefined) {
  return useQuery({
    queryKey: ["issue-templates", projectId ?? ""],
    queryFn: () => issueTemplatesApi.list(projectId!),
    enabled: !!projectId,
  });
}

export function useCreateIssueTemplate(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTemplatePayload) => issueTemplatesApi.create(data),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: KEY(projectId) });
    },
    onError: handleApiError,
  });
}

export function useUpdateIssueTemplate(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateTemplatePayload) =>
      issueTemplatesApi.update(id, data),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: KEY(projectId) });
    },
    onError: handleApiError,
  });
}

export function useDeleteIssueTemplate(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => issueTemplatesApi.delete(id),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: KEY(projectId) });
    },
    onError: handleApiError,
  });
}
