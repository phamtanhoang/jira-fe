"use client";

import {
  useMutation,
  useQueryClient,
  type MutationFunction,
  type QueryKey,
} from "@tanstack/react-query";
import { handleApiError, showMessage } from "@/lib/utils";

export interface UseInvalidatingMutationOptions<TData> {
  /**
   * Optional: resolve a message key from the server response. If provided
   * and non-empty, a success toast is shown via `showMessage(key)`.
   * Leave undefined to skip toasts (e.g. small background updates).
   */
  successMessage?: (data: TData) => string | undefined;
  /**
   * Additional query keys to invalidate on success (besides the main one).
   */
  extraInvalidateKeys?: QueryKey[];
}

/**
 * Shared mutation wrapper for "call API, on success invalidate a query
 * key, on error toast". Collapses the boilerplate that was repeated across
 * `use-comments`, `use-attachments`, `use-worklogs`, `use-labels`.
 *
 * For mutations that need optimistic updates / rollback (e.g. issue
 * drag/drop, quick-edit), use `useMutation` directly — see
 * `use-issues.ts::useUpdateIssue` for the canonical pattern.
 */
export function useInvalidatingMutation<TVars, TData>(
  mutationFn: MutationFunction<TData, TVars>,
  invalidateKey: QueryKey,
  opts: UseInvalidatingMutationOptions<TData> = {},
) {
  const queryClient = useQueryClient();
  return useMutation<TData, unknown, TVars>({
    mutationFn,
    onSuccess: (data) => {
      const msg = opts.successMessage?.(data);
      if (msg) showMessage(msg);
      queryClient.invalidateQueries({ queryKey: invalidateKey });
      opts.extraInvalidateKeys?.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key }),
      );
    },
    onError: handleApiError,
  });
}
