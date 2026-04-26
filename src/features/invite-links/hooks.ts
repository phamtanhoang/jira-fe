"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleApiError, showMessage } from "@/lib/utils";
import { inviteLinksApi, type CreateInviteLinkPayload } from "./api";

const KEY = (workspaceId: string) => ["invite-links", workspaceId] as const;

export function useInviteLinks(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["invite-links", workspaceId ?? ""],
    queryFn: () => inviteLinksApi.list(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useCreateInviteLink(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateInviteLinkPayload) =>
      inviteLinksApi.create(workspaceId, body),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: KEY(workspaceId) });
    },
    onError: handleApiError,
  });
}

export function useRevokeInviteLink(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) => inviteLinksApi.revoke(workspaceId, linkId),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: KEY(workspaceId) });
    },
    onError: handleApiError,
  });
}

export function useInvitePreview(token: string | undefined) {
  return useQuery({
    queryKey: ["invite-preview", token ?? ""],
    queryFn: () => inviteLinksApi.preview(token!),
    enabled: !!token,
    retry: false,
  });
}

export function useJoinViaInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => inviteLinksApi.join(token),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
    onError: handleApiError,
  });
}
