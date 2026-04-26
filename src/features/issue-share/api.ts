import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/constants";

export type ShareToken = {
  id: string;
  issueId: string;
  token: string;
  createdById: string;
  expiresAt: string | null;
  viewCount: number;
  createdAt: string;
};

export type PublicIssue = {
  id: string;
  key: string;
  summary: string;
  description: string | null;
  type: string;
  priority: string;
  createdAt: string;
  reporter?: { id: string; name: string | null; image: string | null };
  assignee?: { id: string; name: string | null; image: string | null } | null;
  boardColumn?: { id: string; name: string; category: string } | null;
  labels?: { label: { id: string; name: string; color: string } }[];
  comments?: {
    id: string;
    content: string;
    createdAt: string;
    author: { id: string; name: string | null; image: string | null };
  }[];
  attachments?: {
    id: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    createdAt: string;
  }[];
};

export const issueShareApi = {
  list: (issueId: string) =>
    api
      .get<{ tokens: ShareToken[] }>(ENDPOINTS.issues.share(issueId))
      .then((r) => r.data.tokens),

  create: (issueId: string, body: { expiresInSec?: number }) =>
    api
      .post<{ message: string; token: ShareToken }>(
        ENDPOINTS.issues.share(issueId),
        body,
      )
      .then((r) => r.data.token),

  revoke: (issueId: string, tokenId: string) =>
    api
      .delete<{ message: string }>(ENDPOINTS.issues.shareById(issueId, tokenId))
      .then((r) => r.data),

  // Public — no auth needed.
  fetchPublic: (token: string) =>
    api
      .get<{ issue: PublicIssue }>(ENDPOINTS.public.issueByToken(token))
      .then((r) => r.data.issue),
};
