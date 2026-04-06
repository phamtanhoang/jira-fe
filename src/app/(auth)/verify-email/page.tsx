import type { Metadata } from "next";
import { VerifyEmailForm } from "@/features/auth/components";

export const metadata: Metadata = { title: "Verify Email" };

export default function VerifyEmailPage() {
  return <VerifyEmailForm />;
}
