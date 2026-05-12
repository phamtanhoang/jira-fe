"use client";

import { useQuery } from "@tanstack/react-query";
import { useInvalidatingMutation } from "@/lib/react-query/use-invalidating-mutation";
import { labelsApi, issuesApi } from "../api";

const KEY = (projectId: string) => ["labels", projectId] as const;

export function useLabels(projectId: string) {
  return useQuery({
    queryKey: KEY(projectId),
    queryFn: () => labelsApi.list(projectId),
    enabled: !!projectId,
  });
}

export function useCreateLabel(projectId: string) {
  return useInvalidatingMutation(
    ({ name, color }: { name: string; color?: string }) =>
      labelsApi.create(projectId, name, color),
    KEY(projectId),
    { successMessage: (r) => r.message },
  );
}

export function useUpdateLabel(projectId: string) {
  return useInvalidatingMutation(
    ({ id, ...data }: { id: string; name?: string; color?: string }) =>
      labelsApi.update(id, data),
    KEY(projectId),
    {
      successMessage: (r) => r.message,
      // Renaming a label changes how cards render — re-fetch board/issues
      // so chips pick up the new name/color without a manual reload.
      extraInvalidateKeys: [
        ["board", projectId],
        ["issues", projectId],
      ],
    },
  );
}

export function useDeleteLabel(projectId: string) {
  return useInvalidatingMutation(
    (id: string) => labelsApi.delete(id),
    KEY(projectId),
    {
      successMessage: (r) => r.message,
      extraInvalidateKeys: [
        ["board", projectId],
        ["issues", projectId],
      ],
    },
  );
}

export function useAddIssueLabel(issueId: string, projectId: string) {
  return useInvalidatingMutation(
    (labelId: string) => issuesApi.addLabel(issueId, labelId),
    ["issue"],
    {
      extraInvalidateKeys: [
        ["board", projectId],
        ["issues", projectId],
      ],
    },
  );
}

export function useRemoveIssueLabel(issueId: string, projectId: string) {
  return useInvalidatingMutation(
    (labelId: string) => issuesApi.removeLabel(issueId, labelId),
    ["issue"],
    {
      extraInvalidateKeys: [
        ["board", projectId],
        ["issues", projectId],
      ],
    },
  );
}
