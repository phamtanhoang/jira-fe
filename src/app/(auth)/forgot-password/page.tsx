import { ForgotPasswordForm } from "@/features/auth/components";
import { createGenerateMetadata } from "@/lib/utils/server";

export const generateMetadata = createGenerateMetadata("meta.forgotPasswordTitle", "meta.forgotPasswordDesc");

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
