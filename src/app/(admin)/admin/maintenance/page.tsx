import { createGenerateMetadata } from "@/lib/utils/server";
import { AdminMaintenanceClient } from "./client";

export const generateMetadata = createGenerateMetadata(
  "admin.maintenance.meta.title",
  "admin.maintenance.meta.desc",
);

export default function AdminMaintenancePage() {
  return <AdminMaintenanceClient />;
}
