import { ResetPasswordForm } from "@/features/auth/components";
import { createGenerateMetadata } from "@/lib/utils";

export const generateMetadata = createGenerateMetadata("meta.resetPasswordTitle");

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
