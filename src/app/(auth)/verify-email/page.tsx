import { VerifyEmailForm } from "@/features/auth/components";
import { createGenerateMetadata } from "@/lib/utils/metadata";

export const generateMetadata = createGenerateMetadata("meta.verifyEmailTitle");

export default function VerifyEmailPage() {
  return <VerifyEmailForm />;
}
