import { createGenerateMetadata } from "@/lib/utils/server";
import { AdminSiteNoticesClient } from "./client";

export const generateMetadata = createGenerateMetadata(
  "admin.siteNotices.meta.title",
  "admin.siteNotices.meta.desc",
);

export default function AdminSiteNoticesPage() {
  return <AdminSiteNoticesClient />;
}
