import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/constants";

export type InviteLink = {
  id: string;
  workspaceId: string;
  token: string;
  role: "ADMIN" | "MEMBER" | "VIEWER";
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  createdById: string;
  createdAt: string;
  createdBy?: { id: string; name: string | null; image: string | null };
};

export type InvitePreview = {
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
  role: "ADMIN" | "MEMBER" | "VIEWER";
  expiresAt: string | null;
  remainingUses: number | null;
};

export type CreateInviteLinkPayload = {
  role?: "ADMIN" | "MEMBER" | "VIEWER";
  maxUses?: number;
  expiresInSec?: number;
};

export const inviteLinksApi = {
  list: (workspaceId: string) =>
    api
      .get<{ links: InviteLink[] }>(ENDPOINTS.workspaces.inviteLinks(workspaceId))
      .then((r) => r.data.links),

  create: (workspaceId: string, body: CreateInviteLinkPayload) =>
    api
      .post<{ message: string; link: InviteLink }>(
        ENDPOINTS.workspaces.inviteLinks(workspaceId),
        body,
      )
      .then((r) => r.data),

  revoke: (workspaceId: string, linkId: string) =>
    api
      .delete<{ message: string }>(
        ENDPOINTS.workspaces.inviteLink(workspaceId, linkId),
      )
      .then((r) => r.data),

  preview: (token: string) =>
    api
      .get<InvitePreview>(ENDPOINTS.workspaces.invitePreview(token))
      .then((r) => r.data),

  join: (token: string) =>
    api
      .post<{
        message: string;
        workspace: { id: string; name: string; slug: string };
        alreadyMember: boolean;
      }>(ENDPOINTS.workspaces.join(token))
      .then((r) => r.data),
};
