import { SignUpForm } from "@/features/auth/components";
import { createGenerateMetadata } from "@/lib/utils/metadata";

export const generateMetadata = createGenerateMetadata("meta.signUpTitle");

export default function SignUpPage() {
  return <SignUpForm />;
}
