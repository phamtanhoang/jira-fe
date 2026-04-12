import { createGenerateMetadata } from "@/lib/utils/server";
import WorkspaceDetailPage from "./client";

export const generateMetadata = createGenerateMetadata("meta.workspaceDetailTitle", "meta.workspaceDetailDesc");

export default WorkspaceDetailPage;
