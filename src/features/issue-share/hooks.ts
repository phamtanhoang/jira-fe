"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleApiError, showMessage } from "@/lib/utils";
import { issueShareApi } from "./api";

const KEY = (issueId: string) => ["issue-share", issueId] as const;

export function useShareTokens(issueId: string | undefined) {
  return useQuery({
    queryKey: ["issue-share", issueId ?? ""],
    queryFn: () => issueShareApi.list(issueId!),
    enabled: !!issueId,
  });
}

export function useCreateShareToken(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { expiresInSec?: number }) =>
      issueShareApi.create(issueId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY(issueId) });
    },
    onError: handleApiError,
  });
}

export function useRevokeShareToken(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tokenId: string) => issueShareApi.revoke(issueId, tokenId),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: KEY(issueId) });
    },
    onError: handleApiError,
  });
}
