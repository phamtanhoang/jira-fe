"use client";

import { useState } from "react";
import { AlertTriangle, Info, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  SETTING_KEYS,
  DEFAULT_ANNOUNCEMENT,
  useSetting,
  useUpdateSetting,
  type AnnouncementSeverity,
  type AnnouncementValue,
} from "@/features/admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export function AnnouncementFormPanel() {
  const { data, isLoading } = useSetting<AnnouncementValue>(
    SETTING_KEYS.APP_ANNOUNCEMENT,
  );
  const update = useUpdateSetting<AnnouncementValue>(
    SETTING_KEYS.APP_ANNOUNCEMENT,
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <AnnouncementForm
      key={data?.updatedAt ?? "new"}
      initial={{
        enabled: data?.value?.enabled ?? DEFAULT_ANNOUNCEMENT.enabled,
        message: data?.value?.message ?? DEFAULT_ANNOUNCEMENT.message,
        severity: data?.value?.severity ?? DEFAULT_ANNOUNCEMENT.severity,
      }}
      onSave={(v) => update.mutate(v)}
      isPending={update.isPending}
    />
  );
}

function AnnouncementForm({
  initial,
  onSave,
  isPending,
}: {
  initial: AnnouncementValue;
  onSave: (value: AnnouncementValue) => void;
  isPending: boolean;
}) {
  const { t } = useAppStore();
  const [form, setForm] = useState<AnnouncementValue>(initial);

  const Icon = SEVERITY_ICON[form.severity];

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3">
        <Toggle
          checked={form.enabled}
          onChange={() => setForm((f) => ({ ...f, enabled: !f.enabled }))}
          variant="success"
          ariaLabel={t("admin.announcement.enabled")}
        />
        <span className="text-sm font-medium">
          {t("admin.announcement.enabled")}
        </span>
      </label>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          {t("admin.announcement.severity")}
        </label>
        <Select
          value={form.severity}
          onValueChange={(v) =>
            setForm((f) => ({ ...f, severity: v as AnnouncementSeverity }))
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="info">
              {t("admin.announcement.severityInfo")}
            </SelectItem>
            <SelectItem value="warn">
              {t("admin.announcement.severityWarn")}
            </SelectItem>
            <SelectItem value="critical">
              {t("admin.announcement.severityCritical")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          {t("admin.announcement.messageLabel")}
        </label>
        <Textarea
          rows={3}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder={t("admin.announcement.messagePlaceholder")}
        />
      </div>

      <div className="space-y-1.5">
        <div className="text-sm font-medium">
          {t("admin.announcement.preview")}
        </div>
        {form.enabled && form.message.trim() ? (
          <div
            className={cn(
              "flex items-center gap-2 rounded-md border px-4 py-2 text-[13px]",
              SEVERITY_CLASSES[form.severity],
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{form.message}</span>
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
            {t("admin.announcement.previewEmpty")}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={() => onSave(form)} disabled={isPending}>
          {isPending ? (
            <>
              <Spinner className="mr-2 h-3.5 w-3.5" />
              {t("common.saving")}
            </>
          ) : (
            t("common.save")
          )}
        </Button>
      </div>
    </div>
  );
}
