import { createGenerateMetadata } from "@/lib/utils/server";
import { AdminAnnouncementClient } from "./client";

export const generateMetadata = createGenerateMetadata(
  "admin.announcement.meta.title",
  "admin.announcement.meta.desc",
);

export default function AdminAnnouncementPage() {
  return <AdminAnnouncementClient />;
}
