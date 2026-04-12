import { createGenerateMetadata } from "@/lib/utils/server";
import ProjectSettingsPage from "./client";

export const generateMetadata = createGenerateMetadata("meta.projectSettingsTitle", "meta.projectSettingsDesc");

export default ProjectSettingsPage;
