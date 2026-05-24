"use client";

import { useMemo, useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Toggle } from "@/components/ui/toggle";
import { Spinner } from "@/components/ui/spinner";
import { useAppStore } from "@/lib/stores/use-app-store";
import { showMessage } from "@/lib/utils";
import { useSetting, useUpdateSetting } from "../hooks";
import {
  DEFAULT_LOGGING_CONFIG,
  SETTING_KEYS,
  type LoggingConfigValue,
} from "../types";

const CHANNELS: Array<{
  key: Exclude<keyof LoggingConfigValue, "enabled">;
  labelKey: `admin.logs.config.channel.${
    | "requestLog"
    | "adminAudit"
    | "mailLog"
    | "webhookDelivery"}`;
}> = [
  { key: "requestLog", labelKey: "admin.logs.config.channel.requestLog" },
  { key: "adminAudit", labelKey: "admin.logs.config.channel.adminAudit" },
  { key: "mailLog", labelKey: "admin.logs.config.channel.mailLog" },
  {
    key: "webhookDelivery",
    labelKey: "admin.logs.config.channel.webhookDelivery",
  },
];

/**
 * Inline popover on `/admin/logs` letting the admin toggle individual
 * logging channels (RequestLog, AdminAudit, MailLog, WebhookDelivery)
 * to control DB row growth. Master `enabled` switch short-circuits all
 * channels at once. Activity log (issue activity feed) is intentionally
 * NOT toggleable — it's domain data, not "logging".
 */
export function LoggingConfigToggle() {
  const { t } = useAppStore();
  const { data: row, isLoading } = useSetting<LoggingConfigValue>(
    SETTING_KEYS.APP_LOGGING_CONFIG,
  );
  const { mutate, isPending } = useUpdateSetting<LoggingConfigValue>(
    SETTING_KEYS.APP_LOGGING_CONFIG,
  );

  // Local override holds the latest user click so the toggle UI flips
  // instantly without waiting for the mutation to resolve. `null` means
  // "use whatever the server says". On a fresh refresh, the override is
  // cleared via React Query's query key invalidation.
  const [override, setOverride] = useState<LoggingConfigValue | null>(null);
  const draft = useMemo<LoggingConfigValue>(
    () => override ?? row?.value ?? DEFAULT_LOGGING_CONFIG,
    [override, row?.value],
  );

  const update = (patch: Partial<LoggingConfigValue>) => {
    const next = { ...draft, ...patch };
    setOverride(next);
    mutate(next, {
      onSuccess: () => {
        showMessage("SETTINGS_UPDATED");
        setOverride(null);
      },
    });
  };

  return (
    <Popover>
      <Button
        render={<PopoverTrigger />}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Settings2 className="h-4 w-4" />
        {t("admin.logs.config.button")}
      </Button>
      <PopoverContent align="end" className="w-72 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">
              {t("admin.logs.config.title")}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {t("admin.logs.config.description")}
            </div>
          </div>
          {(isPending || isLoading) && <Spinner className="h-3 w-3" />}
        </div>

        {/* Master switch */}
        <div className="mb-2 flex items-center justify-between rounded-md border bg-muted/30 p-2">
          <div className="text-xs">
            <div className="font-medium">
              {t("admin.logs.config.master.label")}
            </div>
            <div className="text-muted-foreground">
              {t("admin.logs.config.master.help")}
            </div>
          </div>
          <Toggle
            checked={draft.enabled}
            onChange={() => update({ enabled: !draft.enabled })}
            ariaLabel="master logging toggle"
          />
        </div>

        {/* Per-channel switches */}
        <div className="space-y-1.5">
          {CHANNELS.map(({ key, labelKey }) => (
            <div
              key={key}
              className={`flex items-center justify-between rounded-md p-2 text-xs ${
                draft.enabled ? "" : "opacity-40"
              }`}
            >
              <span className="font-medium">{t(labelKey)}</span>
              <Toggle
                checked={draft[key]}
                onChange={() => update({ [key]: !draft[key] })}
                disabled={!draft.enabled || isPending}
                ariaLabel={`${key} toggle`}
              />
            </div>
          ))}
        </div>

        <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
          {t("admin.logs.config.footnote")}
        </p>
      </PopoverContent>
    </Popover>
  );
}
