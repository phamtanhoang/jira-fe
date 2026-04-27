"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleApiError, showMessage } from "@/lib/utils";
import {
  createCustomField,
  deleteCustomField,
  fetchCustomFields,
  updateCustomField,
} from "./api";
import type {
  CreateCustomFieldPayload,
  UpdateCustomFieldPayload,
} from "./types";

const key = (projectId: string) => ["custom-fields", projectId] as const;

export function useCustomFields(projectId: string | undefined) {
  return useQuery({
    queryKey: projectId ? key(projectId) : ["custom-fields", "_"],
    queryFn: () => fetchCustomFields(projectId as string),
    enabled: !!projectId,
  });
}

export function useCreateCustomField(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomFieldPayload) =>
      createCustomField(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key(projectId) });
    },
    onError: handleApiError,
  });
}

export function useUpdateCustomField(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCustomFieldPayload;
    }) => updateCustomField(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key(projectId) });
    },
    onError: handleApiError,
  });
}

export function useDeleteCustomField(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCustomField(id),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: key(projectId) });
    },
    onError: handleApiError,
  });
}
