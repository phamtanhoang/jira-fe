"use client";

import { useQuery } from "@tanstack/react-query";
import { useInvalidatingMutation } from "@/lib/react-query/use-invalidating-mutation";
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
  return useInvalidatingMutation(
    (body: CreateInviteLinkPayload) => inviteLinksApi.create(workspaceId, body),
    KEY(workspaceId),
    { successMessage: (r) => r.message },
  );
}

export function useRevokeInviteLink(workspaceId: string) {
  return useInvalidatingMutation(
    (linkId: string) => inviteLinksApi.revoke(workspaceId, linkId),
    KEY(workspaceId),
    { successMessage: (r) => r.message },
  );
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
  return useInvalidatingMutation(
    (token: string) => inviteLinksApi.join(token),
    ["workspaces"],
    { successMessage: (r) => r.message },
  );
}
