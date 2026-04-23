"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Info, OctagonAlert, X } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { cn } from "@/lib/utils";
import type {
  AnnouncementSeverity,
  AnnouncementValue,
} from "@/features/admin/types";
import { useSetting, SETTING_KEYS } from "@/features/admin";

/**
 * Per-tab dismissal. The storage key embeds a short hash of the current
 * message so that editing the announcement resets dismissal for everyone.
 */
function hashMessage(m: string): string {
  let h = 0;
  for (let i = 0; i < m.length; i++) h = (h * 31 + m.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

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
  const { t } = useAppStore();
  const { data } = useSetting<AnnouncementValue>(
    SETTING_KEYS.APP_ANNOUNCEMENT,
  );
  const ann = data?.value;

  const [dismissed, setDismissed] = useState(false);
  const storageKey = ann
    ? `announcement-dismissed-v${hashMessage(ann.message)}`
    : "";

  useEffect(() => {
    if (!storageKey) return;
    try {
      setDismissed(sessionStorage.getItem(storageKey) === "1");
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  if (!ann || !ann.enabled || !ann.message.trim() || dismissed) return null;

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
        onClick={() => {
          try {
            sessionStorage.setItem(storageKey, "1");
          } catch {
            /* ignore quota */
          }
          setDismissed(true);
        }}
        className="rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10"
        aria-label={t("admin.common.dismiss")}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
