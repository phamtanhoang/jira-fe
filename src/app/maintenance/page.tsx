import { createGenerateMetadata } from "@/lib/utils/server";
import { MaintenancePageClient } from "./client";

export const generateMetadata = createGenerateMetadata(
  "admin.maintenance.pageTitle",
  "admin.maintenance.pageDefaultMessage",
);

export default function MaintenancePage() {
  return <MaintenancePageClient />;
}
