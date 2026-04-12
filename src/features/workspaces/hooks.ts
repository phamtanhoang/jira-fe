"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { handleApiError, showMessage } from "@/lib/utils";
import { workspacesApi } from "./api";
import type {
  CreateWorkspacePayload,
  AddWorkspaceMemberPayload,
  UpdateWorkspaceMemberPayload,
} from "./types";

export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: workspacesApi.list,
  });
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: ["workspaces", id],
    queryFn: () => workspacesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateWorkspace() {
  const router = useRouter();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkspacePayload) => workspacesApi.create(data),
    onSuccess: (result) => {
      showMessage(result.message);
      qc.invalidateQueries({ queryKey: ["workspaces"] });
      router.push(ROUTES.WORKSPACE(result.workspace.id));
    },
    onError: handleApiError,
  });
}

export function useDeleteWorkspace() {
  const router = useRouter();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workspacesApi.delete(id),
    onSuccess: () => {
      showMessage("WORKSPACE_DELETED");
      qc.invalidateQueries({ queryKey: ["workspaces"] });
      router.push(ROUTES.WORKSPACES);
    },
    onError: handleApiError,
  });
}

export function useAddWorkspaceMember(workspaceId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: AddWorkspaceMemberPayload) =>
      workspacesApi.addMember(workspaceId, data),
    onSuccess: (result) => {
      showMessage(result.message);
      qc.invalidateQueries({ queryKey: ["workspaces", workspaceId] });
    },
    onError: handleApiError,
  });
}

export function useUpdateWorkspaceMember(workspaceId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: UpdateWorkspaceMemberPayload }) =>
      workspacesApi.updateMember(workspaceId, memberId, data),
    onSuccess: (result) => {
      showMessage(result.message);
      qc.invalidateQueries({ queryKey: ["workspaces", workspaceId] });
    },
    onError: handleApiError,
  });
}

export function useRemoveWorkspaceMember(workspaceId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) =>
      workspacesApi.removeMember(workspaceId, memberId),
    onSuccess: () => {
      showMessage("MEMBER_REMOVED");
      qc.invalidateQueries({ queryKey: ["workspaces", workspaceId] });
    },
    onError: handleApiError,
  });
}
