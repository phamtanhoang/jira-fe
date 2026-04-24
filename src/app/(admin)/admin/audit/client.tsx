"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";

export function AdminAuditClient() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`${ROUTES.ADMIN_LOGS}?tab=audit`);
  }, [router]);

  return null;
}
