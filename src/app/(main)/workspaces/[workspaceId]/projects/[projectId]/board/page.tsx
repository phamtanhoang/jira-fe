import { createGenerateMetadata } from "@/lib/utils/server";
import BoardPage from "./client";

export const generateMetadata = createGenerateMetadata("meta.boardTitle", "meta.boardDesc");

export default BoardPage;
