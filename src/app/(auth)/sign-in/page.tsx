import { SignInForm } from "@/features/auth/components";
import { createGenerateMetadata } from "@/lib/utils/server";

export const generateMetadata = createGenerateMetadata("meta.signInTitle", "meta.signInDesc");

export default function SignInPage() {
  return <SignInForm />;
}
