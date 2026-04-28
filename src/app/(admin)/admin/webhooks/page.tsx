import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

// The Webhook deliveries view now lives as a tab inside System Logs. Keep
// this route as a permanent redirect so old bookmarks / docs still resolve.
export default function AdminWebhookDeliveriesPage() {
  redirect(`${ROUTES.ADMIN_LOGS}?tab=webhooks`);
}
