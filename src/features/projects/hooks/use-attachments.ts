"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleApiError, showMessage } from "@/lib/utils";
import { issuesApi } from "../api";

export function useAttachments(issueId: string) {
  return useQuery({
    queryKey: ["attachments", issueId],
    queryFn: () => issuesApi.getAttachments(issueId),
    enabled: !!issueId,
  });
}

export function useUploadAttachments(issueId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (files: File[]) => issuesApi.uploadAttachments(issueId, files),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ["attachments", issueId] });
    },
    onError: handleApiError,
  });
}

export function useDeleteAttachment(issueId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) => issuesApi.deleteAttachment(attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", issueId] });
    },
    onError: handleApiError,
  });
}
