"use client";

import { useQuery } from "@tanstack/react-query";
import { useInvalidatingMutation } from "@/lib/react-query/use-invalidating-mutation";
import { issuesApi } from "../api";

export function useActivity(issueId: string) {
  return useQuery({
    queryKey: ["activity", issueId],
    queryFn: () => issuesApi.getActivity(issueId),
    enabled: !!issueId,
  });
}

export function useWorklogs(issueId: string) {
  return useQuery({
    queryKey: ["worklogs", issueId],
    queryFn: () => issuesApi.getWorklogs(issueId),
    enabled: !!issueId,
  });
}

const worklogsKey = (issueId: string) => ["worklogs", issueId];

export function useAddWorklog(issueId: string) {
  return useInvalidatingMutation(
    (data: { timeSpent: number; startedAt: string; description?: string }) =>
      issuesApi.addWorklog(issueId, data),
    worklogsKey(issueId),
  );
}

export function useUpdateWorklog(issueId: string) {
  return useInvalidatingMutation(
    (vars: {
      worklogId: string;
      timeSpent?: number;
      startedAt?: string;
      description?: string;
    }) => {
      const { worklogId, ...data } = vars;
      return issuesApi.updateWorklog(worklogId, data);
    },
    worklogsKey(issueId),
  );
}

export function useDeleteWorklog(issueId: string) {
  return useInvalidatingMutation(
    (worklogId: string) => issuesApi.deleteWorklog(worklogId),
    worklogsKey(issueId),
  );
}
