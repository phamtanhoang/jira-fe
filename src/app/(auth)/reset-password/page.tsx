import { ResetPasswordForm } from "@/features/auth/components";
import { createGenerateMetadata } from "@/lib/utils/server";

export const generateMetadata = createGenerateMetadata("meta.resetPasswordTitle", "meta.resetPasswordDesc");

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
