import { createGenerateMetadata } from "@/lib/utils/server";
import { AdminThrottleClient } from "./client";

export const generateMetadata = createGenerateMetadata(
  "admin.throttle.meta.title",
  "admin.throttle.meta.desc",
);

export default function AdminThrottlePage() {
  return <AdminThrottleClient />;
}
