export type WebhookEvent =
  | "issue.created"
  | "issue.updated"
  | "issue.deleted"
  | "issue.moved"
  | "comment.created";

export const WEBHOOK_EVENTS: WebhookEvent[] = [
  "issue.created",
  "issue.updated",
  "issue.deleted",
  "issue.moved",
  "comment.created",
];

export type Webhook = {
  id: string;
  workspaceId: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  enabled: boolean;
  createdById: string | null;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateWebhookPayload = {
  name: string;
  url: string;
  events: string[];
  enabled?: boolean;
};

export type UpdateWebhookPayload = Partial<CreateWebhookPayload>;

export type WebhookDelivery = {
  id: string;
  webhookId: string;
  eventType: string;
  payload: unknown;
  statusCode: number | null;
  status: "PENDING" | "SUCCESS" | "FAILED";
  error: string | null;
  attempts: number;
  deliveredAt: string | null;
  createdAt: string;
  webhook: {
    id: string;
    name: string;
    url: string;
    workspaceId: string;
  };
};

export type WebhookDeliveriesResponse = {
  data: WebhookDelivery[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
  nextCursor: null;
};

export type WebhookDeliveryFilters = {
  webhookId?: string;
  status?: "PENDING" | "SUCCESS" | "FAILED";
  page?: number;
  pageSize?: number;
};
