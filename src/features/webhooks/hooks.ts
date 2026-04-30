"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useInvalidatingMutation } from "@/lib/react-query/use-invalidating-mutation";
import { handleApiError, showMessage } from "@/lib/utils";
import {
  createWorkspaceWebhook,
  deleteWorkspaceWebhook,
  fetchWebhookDeliveries,
  fetchWorkspaceWebhooks,
  retryWebhookDelivery,
  testWorkspaceWebhook,
  updateWorkspaceWebhook,
} from "./api";
import type {
  CreateWebhookPayload,
  UpdateWebhookPayload,
  WebhookDeliveryFilters,
} from "./types";

const wsKey = (id: string) => ["webhooks", "workspace", id] as const;
const DELIVERIES_KEY = ["admin-webhook-deliveries"] as const;

export function useWorkspaceWebhooks(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceId ? wsKey(workspaceId) : ["webhooks", "workspace", "_"],
    queryFn: () => fetchWorkspaceWebhooks(workspaceId as string),
    enabled: !!workspaceId,
  });
}

export function useCreateWebhook(workspaceId: string) {
  return useInvalidatingMutation(
    (payload: CreateWebhookPayload) =>
      createWorkspaceWebhook(workspaceId, payload),
    wsKey(workspaceId),
    { successMessage: (r) => r.message },
  );
}

export function useUpdateWebhook(workspaceId: string) {
  return useInvalidatingMutation(
    ({ webhookId, payload }: { webhookId: string; payload: UpdateWebhookPayload }) =>
      updateWorkspaceWebhook(workspaceId, webhookId, payload),
    wsKey(workspaceId),
    { successMessage: (r) => r.message },
  );
}

export function useDeleteWebhook(workspaceId: string) {
  return useInvalidatingMutation(
    (webhookId: string) => deleteWorkspaceWebhook(workspaceId, webhookId),
    wsKey(workspaceId),
    { successMessage: (r) => r.message },
  );
}

// Test endpoint doesn't mutate cache — keeps raw useMutation just for toast.
export function useTestWebhook(workspaceId: string) {
  return useMutation({
    mutationFn: (webhookId: string) =>
      testWorkspaceWebhook(workspaceId, webhookId),
    onSuccess: (result) => showMessage(result.message),
    onError: handleApiError,
  });
}

// ─── Admin delivery log ─────────────────────────────────

export function useWebhookDeliveries(filters: WebhookDeliveryFilters) {
  return useQuery({
    queryKey: [...DELIVERIES_KEY, filters],
    queryFn: () => fetchWebhookDeliveries(filters),
    refetchInterval: 15_000,
  });
}

export function useRetryDelivery() {
  return useInvalidatingMutation(
    (deliveryId: string) => retryWebhookDelivery(deliveryId),
    DELIVERIES_KEY,
    { successMessage: (r) => r.message },
  );
}
