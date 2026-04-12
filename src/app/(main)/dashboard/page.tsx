import { createGenerateMetadata } from "@/lib/utils/server";
import DashboardPage from "./client";

export const generateMetadata = createGenerateMetadata("meta.dashboardTitle", "meta.dashboardDesc");

export default DashboardPage;
