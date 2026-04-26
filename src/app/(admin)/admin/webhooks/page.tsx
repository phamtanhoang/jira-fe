import { createGenerateMetadata } from "@/lib/utils/server";
import { AdminWebhookDeliveriesClient } from "./client";

export const generateMetadata = createGenerateMetadata(
  "admin.webhookDeliveries.meta.title",
  "admin.webhookDeliveries.meta.desc",
);

export default function AdminWebhookDeliveriesPage() {
  return <AdminWebhookDeliveriesClient />;
}
