import { createGenerateMetadata } from "@/lib/utils/server";
import { AdminFlagsClient } from "./client";

export const generateMetadata = createGenerateMetadata(
  "admin.flags.meta.title",
  "admin.flags.meta.desc",
);

export default function AdminFlagsPage() {
  return <AdminFlagsClient />;
}
