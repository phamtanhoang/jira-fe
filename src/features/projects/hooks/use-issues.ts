"use client";

import {
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
  type QueryClient,
} from "@tanstack/react-query";
import { isEqual } from "lodash";
import { STALE_DASHBOARD_WIDGET } from "@/lib/constants/query-stale";
import { handleApiError, showMessage } from "@/lib/utils";
import { useInvalidatingMutation } from "@/lib/react-query/use-invalidating-mutation";
import { issuesApi } from "../api";
import type { Board, CreateIssuePayload, Issue, MoveIssuePayload } from "../types";

// Shared mutation key so consumers can subscribe to "is this issue currently
// being mutated?" via useMutationState. Drag/drop + quick-edit both use it.
const ISSUE_MUTATION_KEY = ["issue-mutate"] as const;

/**
 * Returns the set of issue IDs that currently have an in-flight update or
 * move mutation. Used by IssueCard / IssueRow / detail sidebar to show a
 * spinner overlay while the server round-trip completes.
 */
export function usePendingIssueIds(): Set<string> {
  const variables = useMutationState<unknown>({
    filters: { mutationKey: ISSUE_MUTATION_KEY, status: "pending" },
    select: (m) => m.state.variables,
  });
  const ids = new Set<string>();
  for (const v of variables) {
    const id = (v as { id?: string } | undefined)?.id;
    if (typeof id === "string") ids.add(id);
  }
  return ids;
}

export function useIsIssuePending(issueId: string | undefined): boolean {
  const ids = usePendingIssueIds();
  return !!issueId && ids.has(issueId);
}

export function useIssues(projectId: string, filters?: Record<string, string>) {
  return useQuery({
    queryKey: ["issues", projectId, filters],
    queryFn: () => issuesApi.list(projectId, filters),
    enabled: !!projectId,
  });
}

export function useInfiniteIssues(projectId: string, params: { take: number; sprintId?: string }) {
  return useInfiniteQuery({
    queryKey: ["issues-infinite", projectId, params.sprintId],
    queryFn: ({ pageParam }) =>
      issuesApi.listPaginated(projectId, { ...params, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!projectId,
  });
}

export function useMyDashboard() {
  return useQuery({
    queryKey: ["issues", "me", "dashboard"],
    queryFn: () => issuesApi.myDashboard(),
    staleTime: STALE_DASHBOARD_WIDGET,
  });
}

export function useIssue(key: string) {
  return useQuery({
    queryKey: ["issue", key],
    queryFn: () => issuesApi.getByKey(key),
    enabled: !!key,
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();

  // Can't use `useInvalidatingMutation` here — invalidate keys depend on
  // the response payload (projectId is in the result, not the input vars).
  return useMutation({
    mutationFn: (data: CreateIssuePayload) => issuesApi.create(data),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ["board", result.issue.projectId] });
      queryClient.invalidateQueries({ queryKey: ["issues", result.issue.projectId] });
    },
    onError: handleApiError,
  });
}

// ─── Helpers for optimistic cache updates ────────────────────────────────────

function findIssueInCaches(queryClient: QueryClient, issueId: string): Issue | null {
  for (const [, data] of queryClient.getQueriesData<Board>({ queryKey: ["board"] })) {
    if (!data) continue;
    for (const col of data.columns ?? []) {
      const hit = col.issues?.find((i) => i.id === issueId);
      if (hit) return hit;
    }
  }
  for (const [, data] of queryClient.getQueriesData<Issue[]>({ queryKey: ["issues"] })) {
    if (!Array.isArray(data)) continue;
    const hit = data.find((i) => i.id === issueId);
    if (hit) return hit;
  }
  for (const [, data] of queryClient.getQueriesData<{ pages: { items: Issue[] }[] }>({
    queryKey: ["issues-infinite"],
  })) {
    for (const page of data?.pages ?? []) {
      const hit = page.items?.find((i) => i.id === issueId);
      if (hit) return hit;
    }
  }
  return null;
}

function patchIssueInAllCaches(
  queryClient: QueryClient,
  issueId: string,
  patch: Partial<Issue>,
) {
  queryClient.setQueriesData<Board>({ queryKey: ["board"] }, (old) => {
    if (!old) return old;
    return {
      ...old,
      columns: old.columns.map((col) => ({
        ...col,
        issues: col.issues.map((i) => (i.id === issueId ? { ...i, ...patch } : i)),
      })),
    };
  });

  queryClient.setQueriesData<Issue[]>({ queryKey: ["issues"] }, (old) =>
    Array.isArray(old) ? old.map((i) => (i.id === issueId ? { ...i, ...patch } : i)) : old,
  );

  queryClient.setQueriesData<{ pages: { items: Issue[] }[]; pageParams: unknown[] }>(
    { queryKey: ["issues-infinite"] },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.map((i) => (i.id === issueId ? { ...i, ...patch } : i)),
        })),
      };
    },
  );

  // `useIssue` stores the Issue directly under ["issue", key] (not wrapped
  // in `{ issue: ... }`). Patching the right shape so optimistic updates on
  // the detail page actually take effect — without this, star/watch toggles
  // and quick-edits show stale data until the next refetch.
  queryClient.setQueriesData<Issue>({ queryKey: ["issue"] }, (old) => {
    if (!old || old.id !== issueId) return old;
    return { ...old, ...patch };
  });
}

function moveIssueBetweenColumnsInCache(
  queryClient: QueryClient,
  issueId: string,
  targetColumnId: string,
) {
  queryClient.setQueriesData<Board>({ queryKey: ["board"] }, (old) => {
    if (!old) return old;

    let moved: Issue | null = null;
    const withoutIssue = old.columns.map((col) => {
      const filtered = col.issues.filter((i) => {
        if (i.id === issueId) {
          moved = i;
          return false;
        }
        return true;
      });
      return { ...col, issues: filtered };
    });
    if (!moved) return old;

    return {
      ...old,
      columns: withoutIssue.map((col) =>
        col.id === targetColumnId
          ? { ...col, issues: [...col.issues, { ...(moved as Issue), boardColumnId: targetColumnId }] }
          : col,
      ),
    };
  });
}

// ─── Move (board drag/drop) ──────────────────────────────────────────────────

export function useMoveIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ISSUE_MUTATION_KEY,
    mutationFn: ({ id, ...data }: MoveIssuePayload & { id: string }) =>
      issuesApi.move(id, data),
    onMutate: async ({ id, columnId }) => {
      await queryClient.cancelQueries({ queryKey: ["board"] });

      const snapshot = queryClient.getQueriesData<Board>({ queryKey: ["board"] });
      moveIssueBetweenColumnsInCache(queryClient, id, columnId);
      return { snapshot };
    },
    onError: (err, _vars, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      handleApiError(err);
    },
    onSettled: (result) => {
      const projectId = result?.issue.projectId;
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
      queryClient.invalidateQueries({ queryKey: ["issues", projectId] });
      queryClient.invalidateQueries({ queryKey: ["issues-infinite", projectId] });
      queryClient.invalidateQueries({ queryKey: ["issue"] });
      if (result?.issue.id) {
        queryClient.invalidateQueries({ queryKey: ["activity", result.issue.id] });
      }
    },
  });
}

// ─── Update (quick-edit + backlog sprint drag) ───────────────────────────────

export function useUpdateIssue() {
  const queryClient = useQueryClient();

  return useMutation<
    { issue: Issue; message: string } | null,
    unknown,
    { id: string } & Record<string, unknown>,
    { snapshot: ReturnType<QueryClient["getQueriesData"]>; previous: Issue | null }
  >({
    mutationKey: ISSUE_MUTATION_KEY,
    mutationFn: (payload) => {
      const { id, ...data } = payload;
      if (Object.keys(data).length === 0) {
        return Promise.resolve(null);
      }
      return issuesApi.update(id, data);
    },
    onMutate: async (payload) => {
      const { id, ...data } = payload;

      const previous = findIssueInCaches(queryClient, id);

      // No-op guard: drop fields whose value didn't change
      if (previous) {
        for (const key of Object.keys(data)) {
          if (isEqual((previous as unknown as Record<string, unknown>)[key], data[key])) {
            delete data[key];
          }
        }
      }

      if (Object.keys(data).length === 0) {
        // Nothing to do — mutate payload so mutationFn short-circuits too
        for (const k of Object.keys(payload)) {
          if (k !== "id") delete (payload as Record<string, unknown>)[k];
        }
        return { snapshot: [], previous };
      }

      await queryClient.cancelQueries({ queryKey: ["board"] });
      await queryClient.cancelQueries({ queryKey: ["issues"] });
      await queryClient.cancelQueries({ queryKey: ["issues-infinite"] });
      await queryClient.cancelQueries({ queryKey: ["issue"] });

      const snapshot = [
        ...queryClient.getQueriesData({ queryKey: ["board"] }),
        ...queryClient.getQueriesData({ queryKey: ["issues"] }),
        ...queryClient.getQueriesData({ queryKey: ["issues-infinite"] }),
        ...queryClient.getQueriesData({ queryKey: ["issue"] }),
      ];

      patchIssueInAllCaches(queryClient, id, data as Partial<Issue>);

      return { snapshot, previous };
    },
    onError: (err, _vars, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      handleApiError(err);
    },
    onSettled: (result) => {
      if (!result) return;
      const projectId = result.issue.projectId;
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
      queryClient.invalidateQueries({ queryKey: ["issues", projectId] });
      queryClient.invalidateQueries({ queryKey: ["issues-infinite", projectId] });
      queryClient.invalidateQueries({ queryKey: ["issue", result.issue.key] });
      queryClient.invalidateQueries({ queryKey: ["activity", result.issue.id] });
    },
  });
}

export function useDeleteIssue(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => issuesApi.delete(id),
    // Optimistic remove from board + issue list — feels instant. Snapshot
    // taken in `onMutate`, restored in `onError` if BE rejects.
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["board", projectId] });
      await queryClient.cancelQueries({ queryKey: ["issues", projectId] });

      const boardSnapshot = queryClient.getQueriesData<Board>({
        queryKey: ["board", projectId],
      });
      const issuesSnapshot = queryClient.getQueriesData<Issue[]>({
        queryKey: ["issues", projectId],
      });

      queryClient.setQueriesData<Board>(
        { queryKey: ["board", projectId] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            columns: old.columns.map((col) => ({
              ...col,
              issues: col.issues.filter((i) => i.id !== id),
            })),
          };
        },
      );
      queryClient.setQueriesData<Issue[]>(
        { queryKey: ["issues", projectId] },
        (old) => (Array.isArray(old) ? old.filter((i) => i.id !== id) : old),
      );

      return { boardSnapshot, issuesSnapshot };
    },
    onError: (err, _id, context) => {
      // Rollback both caches on failure.
      if (context) {
        for (const [key, data] of context.boardSnapshot) {
          queryClient.setQueryData(key, data);
        }
        for (const [key, data] of context.issuesSnapshot) {
          queryClient.setQueryData(key, data);
        }
      }
      handleApiError(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
      queryClient.invalidateQueries({ queryKey: ["issues", projectId] });
    },
  });
}

export function useBulkUpdateIssues(projectId: string) {
  return useInvalidatingMutation(
    (data: { issueIds: string[]; sprintId?: string | null; assigneeId?: string | null; priority?: string }) =>
      issuesApi.bulkUpdate(data),
    ["board", projectId],
    {
      successMessage: (result) => result.message,
      extraInvalidateKeys: [["issues", projectId]],
    },
  );
}

export function useBulkDeleteIssues(projectId: string) {
  return useInvalidatingMutation(
    (issueIds: string[]) => issuesApi.bulkDelete(issueIds),
    ["board", projectId],
    {
      successMessage: (result) => result.message,
      extraInvalidateKeys: [["issues", projectId]],
    },
  );
}

// ─── Star / Favorite ────────────────────────────────────────────────────────

const STARRED_KEY = (projectId?: string) =>
  ["issues", "me", "starred", projectId ?? "all"] as const;

export function useMyStarredIssueIds(projectId?: string) {
  return useQuery({
    queryKey: STARRED_KEY(projectId),
    queryFn: () => issuesApi.myStarred(projectId),
    staleTime: STALE_DASHBOARD_WIDGET,
  });
}

// ─── Issue Links ────────────────────────────────────────────────────────────

export function useAddIssueLink(issueKey: string | undefined) {
  return useInvalidatingMutation(
    ({ id, targetIssueId, type }: { id: string; targetIssueId: string; type: import("../types").IssueLinkType }) =>
      issuesApi.addLink(id, { targetIssueId, type }),
    ["issue", issueKey ?? ""],
    {
      successMessage: (result) => result.message,
    },
  );
}

export function useRemoveIssueLink(issueKey: string | undefined) {
  return useInvalidatingMutation(
    ({ id, linkId }: { id: string; linkId: string }) => issuesApi.removeLink(id, linkId),
    ["issue", issueKey ?? ""],
  );
}

// ─── Watch / Subscribe ──────────────────────────────────────────────────────

export function useWatchers(issueId: string | undefined) {
  return useQuery({
    queryKey: ["watchers", issueId],
    queryFn: () => issuesApi.getWatchers(issueId!),
    enabled: !!issueId,
  });
}

export function useToggleWatch() {
  const queryClient = useQueryClient();

  return useMutation<
    { issueId: string; watching: boolean },
    unknown,
    { id: string; watching: boolean },
    { snapshot: ReturnType<QueryClient["getQueriesData"]> }
  >({
    mutationFn: async ({ id, watching }) => {
      const result = watching
        ? await issuesApi.watch(id)
        : await issuesApi.unwatch(id);
      return { issueId: id, watching: result.watching };
    },
    onMutate: async ({ id, watching }) => {
      const snapshot = [
        ...queryClient.getQueriesData({ queryKey: ["board"] }),
        ...queryClient.getQueriesData({ queryKey: ["issues"] }),
        ...queryClient.getQueriesData({ queryKey: ["issue"] }),
      ];
      patchIssueInAllCaches(queryClient, id, { watchedByMe: watching });
      return { snapshot };
    },
    onError: (err, _vars, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      handleApiError(err);
    },
    onSettled: (result) => {
      if (!result?.issueId) return;
      queryClient.invalidateQueries({ queryKey: ["watchers", result.issueId] });
      // Refetch the issue so the detail-page header reconciles with server
      // truth (covers the case where the optimistic patch raced a stale
      // refetch and lost). Cheap because the page is open anyway.
      queryClient.invalidateQueries({ queryKey: ["issue"] });
    },
  });
}

// ─── Star / Favorite ────────────────────────────────────────────────────────

// One mutation that handles both star + unstar with optimistic update of
// `starredByMe` everywhere the issue lives in the cache, plus the cached
// starred-id list.
export function useToggleStar() {
  const queryClient = useQueryClient();

  return useMutation<
    { issueId: string; starred: boolean },
    unknown,
    { id: string; starred: boolean },
    { snapshot: ReturnType<QueryClient["getQueriesData"]> }
  >({
    mutationFn: async ({ id, starred }) => {
      const result = starred
        ? await issuesApi.star(id)
        : await issuesApi.unstar(id);
      return { issueId: id, starred: result.starred };
    },
    onMutate: async ({ id, starred }) => {
      await queryClient.cancelQueries({ queryKey: ["issues", "me", "starred"] });

      const snapshot = [
        ...queryClient.getQueriesData({ queryKey: ["board"] }),
        ...queryClient.getQueriesData({ queryKey: ["issues"] }),
        ...queryClient.getQueriesData({ queryKey: ["issues-infinite"] }),
        ...queryClient.getQueriesData({ queryKey: ["issue"] }),
        ...queryClient.getQueriesData({ queryKey: ["issues", "me", "starred"] }),
        ...queryClient.getQueriesData({ queryKey: ["issues", "me", "dashboard"] }),
      ];

      patchIssueInAllCaches(queryClient, id, { starredByMe: starred });

      // Patch the starred-id list caches so the dashboard widget + filled
      // icons flip without waiting for refetch.
      queryClient.setQueriesData<string[]>(
        { queryKey: ["issues", "me", "starred"] },
        (old) => {
          if (!Array.isArray(old)) return old;
          if (starred) return old.includes(id) ? old : [...old, id];
          return old.filter((x) => x !== id);
        },
      );

      return { snapshot };
    },
    onError: (err, _vars, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      handleApiError(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["issues", "me", "starred"] });
      queryClient.invalidateQueries({ queryKey: ["issues", "me", "dashboard"] });
      // Same rationale as useToggleWatch — reconcile detail-page header.
      queryClient.invalidateQueries({ queryKey: ["issue"] });
    },
  });
}
