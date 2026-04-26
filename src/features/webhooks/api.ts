import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/constants";
import type {
  CreateWebhookPayload,
  UpdateWebhookPayload,
  Webhook,
  WebhookDeliveriesResponse,
  WebhookDeliveryFilters,
} from "./types";

export async function fetchWorkspaceWebhooks(
  workspaceId: string,
): Promise<Webhook[]> {
  const res = await api.get<Webhook[]>(ENDPOINTS.workspaces.webhooks(workspaceId));
  return res.data;
}

export async function createWorkspaceWebhook(
  workspaceId: string,
  payload: CreateWebhookPayload,
): Promise<{ message: string; webhook: Webhook }> {
  const res = await api.post<{ message: string; webhook: Webhook }>(
    ENDPOINTS.workspaces.webhooks(workspaceId),
    payload,
  );
  return res.data;
}

export async function updateWorkspaceWebhook(
  workspaceId: string,
  webhookId: string,
  payload: UpdateWebhookPayload,
): Promise<{ message: string; webhook: Webhook }> {
  const res = await api.patch<{ message: string; webhook: Webhook }>(
    ENDPOINTS.workspaces.webhook(workspaceId, webhookId),
    payload,
  );
  return res.data;
}

export async function deleteWorkspaceWebhook(
  workspaceId: string,
  webhookId: string,
): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(
    ENDPOINTS.workspaces.webhook(workspaceId, webhookId),
  );
  return res.data;
}

export async function testWorkspaceWebhook(
  workspaceId: string,
  webhookId: string,
): Promise<{ message: string }> {
  const res = await api.post<{ message: string }>(
    ENDPOINTS.workspaces.webhookTest(workspaceId, webhookId),
  );
  return res.data;
}

// ─── Admin delivery log ─────────────────────────────────

export async function fetchWebhookDeliveries(
  filters: WebhookDeliveryFilters,
): Promise<WebhookDeliveriesResponse> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== ""),
  );
  const res = await api.get<WebhookDeliveriesResponse>(
    ENDPOINTS.admin.webhookDeliveries,
    { params },
  );
  return res.data;
}

export async function retryWebhookDelivery(
  deliveryId: string,
): Promise<{ message: string }> {
  const res = await api.post<{ message: string }>(
    ENDPOINTS.admin.webhookDeliveryRetry(deliveryId),
  );
  return res.data;
}
