"use client";

import { Bell } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "../hooks";

// Mirror of the NotificationType union in BE — drives the matrix rows.
const TYPES = [
  { type: "ISSUE_ASSIGNED", labelKey: "notifPrefs.typeIssueAssigned" as const },
  { type: "ISSUE_UPDATED", labelKey: "notifPrefs.typeIssueUpdated" as const },
  {
    type: "ISSUE_TRANSITIONED",
    labelKey: "notifPrefs.typeIssueTransitioned" as const,
  },
  { type: "COMMENT_CREATED", labelKey: "notifPrefs.typeComment" as const },
  { type: "MENTION_ISSUE", labelKey: "notifPrefs.typeMentionIssue" as const },
  { type: "MENTION_COMMENT", labelKey: "notifPrefs.typeMentionComment" as const },
  { type: "WATCH_ACTIVITY", labelKey: "notifPrefs.typeWatchActivity" as const },
];

const CHANNELS = ["inApp", "email"] as const;

// Default policy — mirrors BE shouldNotify() fallback. Keeps the UI honest
// when a row hasn't been written yet.
const DEFAULT_INAPP = true;
const DEFAULT_EMAIL = false;

export function NotificationPreferences() {
  const { t } = useAppStore();
  const { data: prefs, isLoading } = useNotificationPreferences();
  const { mutate: update } = useUpdateNotificationPreferences();

  function valueFor(type: string, channel: "inApp" | "email"): boolean {
    const row = prefs?.find((p) => p.type === type);
    if (!row) return channel === "inApp" ? DEFAULT_INAPP : DEFAULT_EMAIL;
    return channel === "inApp" ? row.inApp : row.email;
  }

  function toggle(type: string, channel: "inApp" | "email") {
    const next = !valueFor(type, channel);
    update({ [type]: { [channel]: next } });
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-semibold">{t("notifPrefs.title")}</h2>
      </div>
      <p className="mb-4 text-[12px] text-muted-foreground">
        {t("notifPrefs.subtitle")}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="py-2 text-left font-medium">
                {t("notifPrefs.event")}
              </th>
              <th className="w-24 py-2 text-center font-medium">
                {t("notifPrefs.inApp")}
              </th>
              <th className="w-24 py-2 text-center font-medium">
                {t("notifPrefs.email")}
              </th>
            </tr>
          </thead>
          <tbody>
            {TYPES.map((row) => (
              <tr key={row.type} className="border-b last:border-b-0">
                <td className="py-2.5">{t(row.labelKey)}</td>
                {CHANNELS.map((ch) => (
                  <td key={ch} className="text-center">
                    <input
                      type="checkbox"
                      disabled={isLoading}
                      checked={valueFor(row.type, ch)}
                      onChange={() => toggle(row.type, ch)}
                      className="h-4 w-4 cursor-pointer accent-primary"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground/70">
        {t("notifPrefs.emailNote")}
      </p>
    </div>
  );
}
