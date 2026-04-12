"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleApiError, showMessage } from "@/lib/utils";
import {
  projectsApi,
  boardsApi,
  issuesApi,
  labelsApi,
  sprintsApi,
} from "./api";
import type {
  CreateProjectPayload,
  UpdateProjectPayload,
  AddProjectMemberPayload,
  UpdateProjectMemberPayload,
  CreateIssuePayload,
  MoveIssuePayload,
  CreateColumnPayload,
  UpdateColumnPayload,
  UpdateSprintPayload,
} from "./types";

// ─── Projects ───────────────────────────────────────────

export function useProjects(workspaceId: string) {
  return useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => projectsApi.list(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectPayload) => projectsApi.create(data),
    onSuccess: (result) => {
      showMessage(result.message);
      qc.invalidateQueries({ queryKey: ["projects", result.project.workspaceId] });
    },
    onError: handleApiError,
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateProjectPayload & { id: string }) =>
      projectsApi.update(id, data),
    onSuccess: (result) => {
      showMessage(result.message);
      qc.invalidateQueries({ queryKey: ["project", result.project.id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: handleApiError,
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: handleApiError,
  });
}

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: () => projectsApi.getMembers(projectId),
    enabled: !!projectId,
  });
}

export function useAddProjectMember(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: AddProjectMemberPayload) =>
      projectsApi.addMember(projectId, data),
    onSuccess: (result) => {
      showMessage(result.message);
      qc.invalidateQueries({ queryKey: ["projectMembers", projectId] });
      qc.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: handleApiError,
  });
}

export function useUpdateProjectMember(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, ...data }: UpdateProjectMemberPayload & { memberId: string }) =>
      projectsApi.updateMember(projectId, memberId, data),
    onSuccess: (result) => {
      showMessage(result.message);
      qc.invalidateQueries({ queryKey: ["projectMembers", projectId] });
    },
    onError: handleApiError,
  });
}

export function useRemoveProjectMember(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) =>
      projectsApi.removeMember(projectId, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projectMembers", projectId] });
      qc.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: handleApiError,
  });
}

// ─── Board ──────────────────────────────────────────────

export function useBoard(projectId: string) {
  return useQuery({
    queryKey: ["board", projectId],
    queryFn: () => boardsApi.getByProject(projectId),
    enabled: !!projectId,
  });
}

// ─── Issues ─────────────────────────────────────────────

export function useIssues(projectId: string, filters?: Record<string, string>) {
  return useQuery({
    queryKey: ["issues", projectId, filters],
    queryFn: () => issuesApi.list(projectId, filters),
    enabled: !!projectId,
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
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIssuePayload) => issuesApi.create(data),
    onSuccess: (result) => {
      showMessage(result.message);
      qc.invalidateQueries({ queryKey: ["board", result.issue.projectId] });
      qc.invalidateQueries({ queryKey: ["issues", result.issue.projectId] });
    },
    onError: handleApiError,
  });
}

export function useMoveIssue() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: MoveIssuePayload & { id: string }) =>
      issuesApi.move(id, data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["board", result.issue.projectId] });
    },
    onError: handleApiError,
  });
}

export function useUpdateIssue() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      issuesApi.update(id, data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["board", result.issue.projectId] });
      qc.invalidateQueries({ queryKey: ["issue", result.issue.key] });
    },
    onError: handleApiError,
  });
}

// ─── Comments ───────────────────────────────────────────

export function useComments(issueId: string) {
  return useQuery({
    queryKey: ["comments", issueId],
    queryFn: () => issuesApi.getComments(issueId),
    enabled: !!issueId,
  });
}

export function useAddComment(issueId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: string }) =>
      issuesApi.addComment(issueId, content, parentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", issueId] });
    },
    onError: handleApiError,
  });
}

export function useUpdateComment(issueId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      issuesApi.updateComment(commentId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", issueId] });
    },
    onError: handleApiError,
  });
}

export function useDeleteComment(issueId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => issuesApi.deleteComment(commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", issueId] });
    },
    onError: handleApiError,
  });
}

// ─── Activity ───────────────────────────────────────────

export function useActivity(issueId: string) {
  return useQuery({
    queryKey: ["activity", issueId],
    queryFn: () => issuesApi.getActivity(issueId),
    enabled: !!issueId,
  });
}

// ─── Worklogs ───────────────────────────────────────────

export function useWorklogs(issueId: string) {
  return useQuery({
    queryKey: ["worklogs", issueId],
    queryFn: () => issuesApi.getWorklogs(issueId),
    enabled: !!issueId,
  });
}

export function useAddWorklog(issueId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { timeSpent: number; startedAt: string; description?: string }) =>
      issuesApi.addWorklog(issueId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["worklogs", issueId] });
    },
    onError: handleApiError,
  });
}

export function useDeleteWorklog(issueId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (worklogId: string) => issuesApi.deleteWorklog(worklogId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["worklogs", issueId] });
    },
    onError: handleApiError,
  });
}

// ─── Labels ─────────────────────────────────────────────

export function useLabels(projectId: string) {
  return useQuery({
    queryKey: ["labels", projectId],
    queryFn: () => labelsApi.list(projectId),
    enabled: !!projectId,
  });
}

export function useCreateLabel(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ name, color }: { name: string; color?: string }) =>
      labelsApi.create(projectId, name, color),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["labels", projectId] });
    },
    onError: handleApiError,
  });
}

export function useAddIssueLabel(issueId: string, projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (labelId: string) => issuesApi.addLabel(issueId, labelId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issue"] });
      qc.invalidateQueries({ queryKey: ["board", projectId] });
    },
    onError: handleApiError,
  });
}

export function useRemoveIssueLabel(issueId: string, projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (labelId: string) => issuesApi.removeLabel(issueId, labelId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issue"] });
      qc.invalidateQueries({ queryKey: ["board", projectId] });
    },
    onError: handleApiError,
  });
}

// ─── Board Columns ──────────────────────────────────────

export function useAddColumn(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, ...data }: CreateColumnPayload & { boardId: string }) =>
      boardsApi.addColumn(boardId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board", projectId] });
    },
    onError: handleApiError,
  });
}

export function useUpdateColumn(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      boardId,
      columnId,
      ...data
    }: UpdateColumnPayload & { boardId: string; columnId: string }) =>
      boardsApi.updateColumn(boardId, columnId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board", projectId] });
    },
    onError: handleApiError,
  });
}

export function useDeleteColumn(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, columnId }: { boardId: string; columnId: string }) =>
      boardsApi.deleteColumn(boardId, columnId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board", projectId] });
    },
    onError: handleApiError,
  });
}

export function useDeleteIssue(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => issuesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board", projectId] });
      qc.invalidateQueries({ queryKey: ["issues", projectId] });
    },
    onError: handleApiError,
  });
}

// ─── Sprints ────────────────────────────────────────────

export function useUpdateSprint(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateSprintPayload & { id: string }) =>
      sprintsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board", projectId] });
    },
    onError: handleApiError,
  });
}

export function useDeleteSprint(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sprintsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board", projectId] });
    },
    onError: handleApiError,
  });
}

export function useCreateSprint(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, name }: { boardId: string; name: string }) =>
      sprintsApi.create(boardId, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board", projectId] });
    },
    onError: handleApiError,
  });
}

export function useStartSprint(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sprintsApi.start(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board", projectId] });
    },
    onError: handleApiError,
  });
}

export function useCompleteSprint(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sprintsApi.complete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board", projectId] });
    },
    onError: handleApiError,
  });
}
