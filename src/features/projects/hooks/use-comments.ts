"use client";

import { useQuery } from "@tanstack/react-query";
import { useInvalidatingMutation } from "@/lib/react-query/use-invalidating-mutation";
import { issuesApi } from "../api";

export function useComments(issueId: string) {
  return useQuery({
    queryKey: ["comments", issueId],
    queryFn: () => issuesApi.getComments(issueId),
    enabled: !!issueId,
  });
}

const commentsKey = (issueId: string) => ["comments", issueId];

export function useAddComment(issueId: string) {
  return useInvalidatingMutation(
    (vars: { content: string; parentId?: string }) =>
      issuesApi.addComment(issueId, vars.content, vars.parentId),
    commentsKey(issueId),
  );
}

export function useUpdateComment(issueId: string) {
  return useInvalidatingMutation(
    (vars: { commentId: string; content: string }) =>
      issuesApi.updateComment(vars.commentId, vars.content),
    commentsKey(issueId),
  );
}

export function useDeleteComment(issueId: string) {
  return useInvalidatingMutation(
    (commentId: string) => issuesApi.deleteComment(commentId),
    commentsKey(issueId),
  );
}
