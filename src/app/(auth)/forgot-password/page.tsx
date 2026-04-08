import { ForgotPasswordForm } from "@/features/auth/components";
import { createGenerateMetadata } from "@/lib/utils/metadata";

export const generateMetadata = createGenerateMetadata("meta.forgotPasswordTitle");

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
