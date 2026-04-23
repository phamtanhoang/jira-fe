import { createGenerateMetadata } from "@/lib/utils/server";
import { AdminLogsClient } from "./client";

export const generateMetadata = createGenerateMetadata(
  "admin.logs.meta.title",
  "admin.logs.meta.desc",
);

export default function AdminLogsPage() {
  return <AdminLogsClient />;
}
