import type { Metadata } from "next";
import { SignInForm } from "@/features/auth/components";

export const metadata: Metadata = { title: "Sign In" };

export default function SignInPage() {
  return <SignInForm />;
}
