import { createGenerateMetadata } from "@/lib/utils/server";
import { AdminWorkspacesClient } from "./client";

export const generateMetadata = createGenerateMetadata(
  "admin.workspaces.meta.title",
  "admin.workspaces.meta.desc",
);

export default function AdminWorkspacesPage() {
  return <AdminWorkspacesClient />;
}
