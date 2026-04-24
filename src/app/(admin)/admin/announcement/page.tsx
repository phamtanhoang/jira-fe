import { redirect } from "next/navigation";

export default function DeprecatedAnnouncementPage() {
  redirect("/admin/site-notices?tab=announcement");
}
