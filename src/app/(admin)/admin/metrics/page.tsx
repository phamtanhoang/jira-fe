import { createGenerateMetadata } from "@/lib/utils/server";
import { AdminMetricsClient } from "./client";

export const generateMetadata = createGenerateMetadata(
  "admin.metrics.meta.title",
  "admin.metrics.meta.desc",
);

export default function AdminMetricsPage() {
  return <AdminMetricsClient />;
}
