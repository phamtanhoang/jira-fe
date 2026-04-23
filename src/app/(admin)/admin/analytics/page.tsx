import { createGenerateMetadata } from "@/lib/utils/server";
import { AdminAnalyticsClient } from "./client";

export const generateMetadata = createGenerateMetadata(
  "admin.analytics.meta.title",
  "admin.analytics.meta.desc",
);

export default function AdminAnalyticsPage() {
  return <AdminAnalyticsClient />;
}
