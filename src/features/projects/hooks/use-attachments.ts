"use client";

import { useQuery } from "@tanstack/react-query";
import { useInvalidatingMutation } from "@/lib/react-query/use-invalidating-mutation";
import { issuesApi } from "../api";

export function useAttachments(issueId: string) {
  return useQuery({
    queryKey: ["attachments", issueId],
    queryFn: () => issuesApi.getAttachments(issueId),
    enabled: !!issueId,
  });
}

const attachmentsKey = (issueId: string) => ["attachments", issueId];

export function useUploadAttachments(issueId: string) {
  return useInvalidatingMutation(
    (files: File[]) => issuesApi.uploadAttachments(issueId, files),
    attachmentsKey(issueId),
    { successMessage: (r) => r.message },
  );
}

export function useDeleteAttachment(issueId: string) {
  return useInvalidatingMutation(
    (attachmentId: string) => issuesApi.deleteAttachment(attachmentId),
    attachmentsKey(issueId),
  );
}
