import { SignUpForm } from "@/features/auth/components";
import { createGenerateMetadata } from "@/lib/utils";

export const generateMetadata = createGenerateMetadata("meta.signUpTitle");

export default function SignUpPage() {
  return <SignUpForm />;
}
