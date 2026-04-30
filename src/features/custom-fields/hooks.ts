"use client";

import { useQuery } from "@tanstack/react-query";
import { useInvalidatingMutation } from "@/lib/react-query/use-invalidating-mutation";
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
  return useInvalidatingMutation(
    (payload: CreateCustomFieldPayload) => createCustomField(payload),
    key(projectId),
  );
}

export function useUpdateCustomField(projectId: string) {
  return useInvalidatingMutation(
    ({ id, payload }: { id: string; payload: UpdateCustomFieldPayload }) =>
      updateCustomField(id, payload),
    key(projectId),
  );
}

export function useDeleteCustomField(projectId: string) {
  return useInvalidatingMutation(
    (id: string) => deleteCustomField(id),
    key(projectId),
    { successMessage: (r) => r.message },
  );
}
