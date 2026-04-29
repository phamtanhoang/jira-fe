"use client";

import Image from "next/image";
import { useAppStore } from "@/lib/stores/use-app-store";
import { cn } from "@/lib/utils";

export function Header({ className }: { className?: string }) {
  const { name, logoUrl } = useAppStore();

  // Always render the app name — it's the minimum branding. Logo is optional
  // (admin may not have uploaded one yet).
  return (
    <div className={cn("mb-8 flex flex-col items-center gap-2", className)}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={name || "logo"}
          width={48}
          height={48}
          style={{ height: "auto" }}
          priority
          className="rounded"
        />
      ) : null}
    </div>
  );
}
