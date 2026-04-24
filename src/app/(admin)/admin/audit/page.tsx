import { createGenerateMetadata } from "@/lib/utils/server";
import { AdminAuditClient } from "./client";

export const generateMetadata = createGenerateMetadata(
  "admin.audit.meta.title",
  "admin.audit.meta.desc",
);

export default function AdminAuditPage() {
  return <AdminAuditClient />;
}
