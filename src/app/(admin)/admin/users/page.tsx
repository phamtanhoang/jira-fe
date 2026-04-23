import { createGenerateMetadata } from "@/lib/utils/server";
import { AdminUsersClient } from "./client";

export const generateMetadata = createGenerateMetadata(
  "admin.users.meta.title",
  "admin.users.meta.desc",
);

export default function AdminUsersPage() {
  return <AdminUsersClient />;
}
