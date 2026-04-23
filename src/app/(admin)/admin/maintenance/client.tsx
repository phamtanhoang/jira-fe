"use client";

import { useState } from "react";
import { Wrench } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  DEFAULT_MAINTENANCE,
  SETTING_KEYS,
  useSetting,
  useUpdateSetting,
  type MaintenanceValue,
} from "@/features/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AdminMaintenanceClient() {
  const { t } = useAppStore();
  const { data, isLoading } = useSetting<MaintenanceValue>(
    SETTING_KEYS.APP_MAINTENANCE,
  );
  const update = useUpdateSetting<MaintenanceValue>(
    SETTING_KEYS.APP_MAINTENANCE,
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {t("admin.maintenance.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.maintenance.description")}
        </p>
      </div>

      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Wrench className="h-4 w-4" />
            {t("admin.maintenance.title")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("admin.maintenance.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <MaintenanceForm
              key={data?.updatedAt ?? "new"}
              initial={{
                enabled:
                  data?.value?.enabled ?? DEFAULT_MAINTENANCE.enabled,
                message:
                  data?.value?.message ?? DEFAULT_MAINTENANCE.message,
                allowedEmails:
                  data?.value?.allowedEmails ??
                  DEFAULT_MAINTENANCE.allowedEmails,
              }}
              onSave={(v) => update.mutate(v)}
              isPending={update.isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MaintenanceForm({
  initial,
  onSave,
  isPending,
}: {
  initial: MaintenanceValue;
  onSave: (value: MaintenanceValue) => void;
  isPending: boolean;
}) {
  const { t } = useAppStore();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [message, setMessage] = useState(initial.message);
  const [allowedEmailsInput, setAllowedEmailsInput] = useState(
    initial.allowedEmails.join(", "),
  );

  function submit() {
    const allowedEmails = allowedEmailsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onSave({ enabled, message, allowedEmails });
  }

  return (
    <div className="space-y-4">
      {/* Enabled */}
      <label className="flex items-center gap-3">
        <Toggle
          checked={enabled}
          onChange={() => setEnabled((v) => !v)}
          variant="danger"
          ariaLabel={t("admin.maintenance.enabled")}
        />
        <span className="text-sm font-medium">
          {t("admin.maintenance.enabled")}
        </span>
      </label>

      {/* Message */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          {t("admin.maintenance.messageLabel")}
        </label>
        <Textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("admin.maintenance.messagePlaceholder")}
        />
      </div>

      {/* Allowed emails */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          {t("admin.maintenance.allowedEmails")}
        </label>
        <Input
          value={allowedEmailsInput}
          onChange={(e) => setAllowedEmailsInput(e.target.value)}
          placeholder="alice@example.com, bob@example.com"
        />
        <p className="text-[11px] text-muted-foreground">
          {t("admin.maintenance.allowedEmailsHint")}
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={submit} disabled={isPending}>
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
