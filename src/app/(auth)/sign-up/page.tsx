import { SignUpForm } from "@/features/auth/components";
import { createGenerateMetadata } from "@/lib/utils/server";

export const generateMetadata = createGenerateMetadata("meta.signUpTitle");

export default function SignUpPage() {
  return <SignUpForm />;
}
