import { createGenerateMetadata } from "@/lib/utils/server";
import UserProfilePage from "./client";

export const generateMetadata = createGenerateMetadata(
  "meta.userProfileTitle",
  "meta.userProfileDesc",
);

export default UserProfilePage;
