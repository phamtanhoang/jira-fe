import { createGenerateMetadata } from "@/lib/utils/server";
import { AdminWorkspaceDetailClient } from "./client";

export const generateMetadata = createGenerateMetadata(
  "admin.workspaces.meta.detailTitle",
  "admin.workspaces.meta.detailDesc",
);

export default async function AdminWorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminWorkspaceDetailClient id={id} />;
}
