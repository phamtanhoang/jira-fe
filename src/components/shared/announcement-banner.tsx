"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, Info, OctagonAlert, X } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { cn } from "@/lib/utils";
import type {
  AnnouncementSeverity,
  AnnouncementValue,
} from "@/features/admin/types";
import { usePublicAnnouncement } from "@/features/admin";

const SEVERITY_CLASSES: Record<AnnouncementSeverity, string> = {
  info: "bg-blue-500/10 text-blue-900 border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-100",
  warn: "bg-amber-500/10 text-amber-900 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100",
  critical:
    "bg-red-500/10 text-red-900 border-red-500/30 dark:bg-red-950/40 dark:text-red-100",
};

const SEVERITY_ICON: Record<AnnouncementSeverity, React.ElementType> = {
  info: Info,
  warn: AlertTriangle,
  critical: OctagonAlert,
};

export function AnnouncementBanner() {
  const { data: ann } = usePublicAnnouncement();
  const pathname = usePathname();

  if (!ann || !ann.enabled || !ann.message.trim()) return null;

  // Remount on every route change AND whenever the admin edits the message —
  // dismissal is purely in-memory for the current mount, so navigating to
  // another page (or saving a new message) brings the banner back.
  return <BannerBody key={`${pathname}::${ann.message}`} ann={ann} />;
}

function BannerBody({ ann }: { ann: AnnouncementValue }) {
  const { t } = useAppStore();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const Icon = SEVERITY_ICON[ann.severity];

  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b px-4 py-2 text-[13px]",
        SEVERITY_CLASSES[ann.severity],
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{ann.message}</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10"
        aria-label={t("admin.common.dismiss")}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
