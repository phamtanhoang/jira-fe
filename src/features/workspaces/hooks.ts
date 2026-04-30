"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { useInvalidatingMutation } from "@/lib/react-query/use-invalidating-mutation";
import { handleApiError, showMessage } from "@/lib/utils";
import { workspacesApi } from "./api";
import type {
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
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

// Keeps raw useMutation: navigation side-effect after success isn't
// expressible via the helper.
export function useCreateWorkspace() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkspacePayload) => workspacesApi.create(data),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      router.push(ROUTES.WORKSPACE(result.workspace.id));
    },
    onError: handleApiError,
  });
}

// Keeps raw useMutation: invalidates a key derived from input vars.
export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkspacePayload }) =>
      workspacesApi.update(id, data),
    onSuccess: (result, vars) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ["workspaces", vars.id] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
    onError: handleApiError,
  });
}

// Keeps raw useMutation: navigation after delete.
export function useDeleteWorkspace() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workspacesApi.delete(id),
    onSuccess: () => {
      showMessage("WORKSPACE_DELETED");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      router.push(ROUTES.WORKSPACES);
    },
    onError: handleApiError,
  });
}

export function useAddWorkspaceMember(workspaceId: string) {
  return useInvalidatingMutation(
    (data: AddWorkspaceMemberPayload) =>
      workspacesApi.addMember(workspaceId, data),
    ["workspaces", workspaceId],
    { successMessage: (r) => r.message },
  );
}

export function useUpdateWorkspaceMember(workspaceId: string) {
  return useInvalidatingMutation(
    ({ memberId, data }: { memberId: string; data: UpdateWorkspaceMemberPayload }) =>
      workspacesApi.updateMember(workspaceId, memberId, data),
    ["workspaces", workspaceId],
    { successMessage: (r) => r.message },
  );
}

export function useRemoveWorkspaceMember(workspaceId: string) {
  return useInvalidatingMutation(
    (memberId: string) => workspacesApi.removeMember(workspaceId, memberId),
    ["workspaces", workspaceId],
    { successMessage: () => "MEMBER_REMOVED" },
  );
}
