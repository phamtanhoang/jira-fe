import type { Metadata } from "next";
import { SignUpForm } from "@/features/auth/components";

export const metadata: Metadata = { title: "Sign Up" };

export default function SignUpPage() {
  return <SignUpForm />;
}
