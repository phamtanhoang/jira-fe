import { createGenerateMetadata } from "@/lib/utils/server";
import ProfilePage from "./client";

export const generateMetadata = createGenerateMetadata("meta.profileTitle", "meta.profileDesc");

export default ProfilePage;
