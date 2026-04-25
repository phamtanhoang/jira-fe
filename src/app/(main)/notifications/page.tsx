import { createGenerateMetadata } from "@/lib/utils/server";
import NotificationsPage from "./client";

export const generateMetadata = createGenerateMetadata(
  "meta.notificationsTitle",
  "meta.notificationsDesc",
);

export default NotificationsPage;
