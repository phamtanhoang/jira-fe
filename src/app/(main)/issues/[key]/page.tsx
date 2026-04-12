import { createGenerateMetadata } from "@/lib/utils/server";
import IssueDetailPage from "./client";

export const generateMetadata = createGenerateMetadata("meta.issueDetailTitle", "meta.issueDetailDesc");

export default IssueDetailPage;
