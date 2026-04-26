"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWebhookPayload) =>
      createWorkspaceWebhook(workspaceId, payload),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: wsKey(workspaceId) });
    },
    onError: handleApiError,
  });
}

export function useUpdateWebhook(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      webhookId,
      payload,
    }: {
      webhookId: string;
      payload: UpdateWebhookPayload;
    }) => updateWorkspaceWebhook(workspaceId, webhookId, payload),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: wsKey(workspaceId) });
    },
    onError: handleApiError,
  });
}

export function useDeleteWebhook(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (webhookId: string) =>
      deleteWorkspaceWebhook(workspaceId, webhookId),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: wsKey(workspaceId) });
    },
    onError: handleApiError,
  });
}

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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deliveryId: string) => retryWebhookDelivery(deliveryId),
    onSuccess: (result) => {
      showMessage(result.message);
      queryClient.invalidateQueries({ queryKey: DELIVERIES_KEY });
    },
    onError: handleApiError,
  });
}
