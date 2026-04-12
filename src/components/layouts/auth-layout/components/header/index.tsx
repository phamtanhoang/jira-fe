"use client";

import { useAppStore } from "@/lib/stores/use-app-store";
import Image from "next/image";

export function Header({ className }: { className?: string }) {
  const { name, logoUrl } = useAppStore();
  return (
    <div className={className}>
      {logoUrl && (
        <div className="mb-8">
          <Image
            src={logoUrl}
            alt={name}
            width={40}
            height={40}
            style={{ height: "auto" }}
            priority
          />
        </div>
      )}
    </div>
  );
}
