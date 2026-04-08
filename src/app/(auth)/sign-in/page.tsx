import { SignInForm } from "@/features/auth/components";
import { createGenerateMetadata } from "@/lib/utils/metadata";

export const generateMetadata = createGenerateMetadata("meta.signInTitle");

export default function SignInPage() {
  return <SignInForm />;
}
