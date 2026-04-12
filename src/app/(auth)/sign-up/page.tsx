import { SignUpForm } from "@/features/auth/components";
import { createGenerateMetadata } from "@/lib/utils/server";

export const generateMetadata = createGenerateMetadata("meta.signUpTitle", "meta.signUpDesc");

export default function SignUpPage() {
  return <SignUpForm />;
}
