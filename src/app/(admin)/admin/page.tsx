import { createGenerateMetadata } from "@/lib/utils/server";
import { AdminOverviewClient } from "./client";

export const generateMetadata = createGenerateMetadata(
  "admin.overview.meta.title",
  "admin.overview.meta.desc",
);

export default function AdminOverviewPage() {
  return <AdminOverviewClient />;
}
