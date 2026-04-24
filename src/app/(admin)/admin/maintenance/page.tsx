import { redirect } from "next/navigation";

export default function DeprecatedMaintenancePage() {
  redirect("/admin/site-notices?tab=maintenance");
}
