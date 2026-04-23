import { createGenerateMetadata } from "@/lib/utils/server";
import { AdminSettingsClient } from "./client";

export const generateMetadata = createGenerateMetadata(
  "admin.settings.meta.title",
  "admin.settings.meta.desc",
);

export default function AdminSettingsPage() {
  return <AdminSettingsClient />;
}
