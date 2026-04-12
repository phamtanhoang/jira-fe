import { createGenerateMetadata } from "@/lib/utils/server";
import WorkspacesPage from "./client";

export const generateMetadata = createGenerateMetadata("meta.workspacesTitle", "meta.workspacesDesc");

export default WorkspacesPage;
