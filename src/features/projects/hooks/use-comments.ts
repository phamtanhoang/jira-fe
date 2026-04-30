"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useInvalidatingMutation } from "@/lib/react-query/use-invalidating-mutation";
import { handleApiError } from "@/lib/utils";
import { useCurrentUser } from "@/features/auth/hooks";
import { issuesApi } from "../api";
import type { Comment } from "../types";

export function useComments(issueId: string) {
  return useQuery({
    queryKey: ["comments", issueId],
    queryFn: () => issuesApi.getComments(issueId),
    enabled: !!issueId,
  });
}

const commentsKey = (issueId: string) => ["comments", issueId];

/**
 * Prefix used for the temporary id of an optimistic comment. Lets the UI
 * detect "still saving" rows so it can render them dimmed / no edit button.
 */
export const OPTIMISTIC_COMMENT_PREFIX = "optimistic-";

export function isOptimisticComment(comment: Comment): boolean {
  return comment.id.startsWith(OPTIMISTIC_COMMENT_PREFIX);
}

/**
 * Optimistic add — append a placeholder comment to the cache instantly so
 * the user sees their text immediately. The placeholder carries a synthetic
 * `id` (`optimistic-<nonce>`) so the UI can detect it; the real row replaces
 * it after `onSettled` invalidates.
 */
export function useAddComment(issueId: string) {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: (vars: { content: string; parentId?: string }) =>
      issuesApi.addComment(issueId, vars.content, vars.parentId),

    onMutate: async (vars) => {
      if (!user) return { snapshot: undefined };
      await queryClient.cancelQueries({ queryKey: commentsKey(issueId) });

      const snapshot = queryClient.getQueryData<Comment[]>(
        commentsKey(issueId),
      );
      const optimistic: Comment = {
        id: `${OPTIMISTIC_COMMENT_PREFIX}${Date.now()}`,
        issueId,
        authorId: user.id,
        content: vars.content,
        parentId: vars.parentId ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: user.id,
          name: user.name ?? null,
          email: user.email,
          image: user.image ?? null,
        },
        replies: [],
      };
      queryClient.setQueryData<Comment[]>(
        commentsKey(issueId),
        (old) => (Array.isArray(old) ? [...old, optimistic] : [optimistic]),
      );
      return { snapshot };
    },

    onError: (err, _vars, context) => {
      // Roll back to the pre-mutation snapshot.
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(commentsKey(issueId), context.snapshot);
      }
      handleApiError(err);
    },

    onSettled: () => {
      // Authoritative refetch — replaces optimistic placeholder with real row.
      queryClient.invalidateQueries({ queryKey: commentsKey(issueId) });
    },
  });
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
