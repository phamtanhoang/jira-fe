"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useInvalidatingMutation } from "@/lib/react-query/use-invalidating-mutation";
import { handleApiError, showMessage } from "@/lib/utils";
import { projectsApi } from "../api";
import type {
  CreateProjectPayload,
  UpdateProjectPayload,
  AddProjectMemberPayload,
  UpdateProjectMemberPayload,
} from "../types";

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectPayload) => projectsApi.create(data),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ["projects", result.project.workspaceId] });
    },
    onError: handleApiError,
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateProjectPayload & { id: string }) =>
      projectsApi.update(id, data),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ["project", result.project.id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: handleApiError,
  });
}

export function useDeleteProject() {
  return useInvalidatingMutation(
    (id: string) => projectsApi.delete(id),
    ["projects"],
  );
}

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: () => projectsApi.getMembers(projectId),
    enabled: !!projectId,
  });
}

export function useBulkAddProjectMembers(projectId: string) {
  return useInvalidatingMutation(
    (data: { userIds: string[]; role?: "ADMIN" | "DEVELOPER" | "VIEWER" }) =>
      projectsApi.bulkAddMembers(projectId, data),
    ["projectMembers", projectId],
    {
      successMessage: (r) => r.message,
      extraInvalidateKeys: [["project", projectId]],
    },
  );
}

export function useAddProjectMember(projectId: string) {
  return useInvalidatingMutation(
    (data: AddProjectMemberPayload) =>
      projectsApi.addMember(projectId, data),
    ["projectMembers", projectId],
    {
      successMessage: (r) => r.message,
      extraInvalidateKeys: [["project", projectId]],
    },
  );
}

export function useUpdateProjectMember(projectId: string) {
  return useInvalidatingMutation(
    ({ memberId, ...data }: UpdateProjectMemberPayload & { memberId: string }) =>
      projectsApi.updateMember(projectId, memberId, data),
    ["projectMembers", projectId],
    {
      successMessage: (r) => r.message,
      extraInvalidateKeys: [["project", projectId]],
    },
  );
}

export function useRemoveProjectMember(projectId: string) {
  return useInvalidatingMutation(
    (memberId: string) => projectsApi.removeMember(projectId, memberId),
    ["projectMembers", projectId],
    {
      extraInvalidateKeys: [["project", projectId]],
    },
  );
}
