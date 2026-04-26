"use client";

import { useState } from "react";
import { Gauge, Save } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  DEFAULT_QUOTAS,
  SETTING_KEYS,
  useSetting,
  useUpdateSetting,
  type QuotasValue,
} from "@/features/admin";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

export function QuotasForm() {
  const { t } = useAppStore();
  const { data, isLoading } = useSetting<QuotasValue>(SETTING_KEYS.APP_QUOTAS);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="h-4 w-4" />
          {t("admin.settings.quotas.title")}
        </CardTitle>
        <CardDescription>
          {t("admin.settings.quotas.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <QuotasFormInner
            initial={{
              maxProjectsPerWorkspace:
                data?.value?.maxProjectsPerWorkspace ??
                DEFAULT_QUOTAS.maxProjectsPerWorkspace,
              maxMembersPerWorkspace:
                data?.value?.maxMembersPerWorkspace ??
                DEFAULT_QUOTAS.maxMembersPerWorkspace,
              maxStorageGB:
                data?.value?.maxStorageGB ?? DEFAULT_QUOTAS.maxStorageGB,
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function QuotasFormInner({ initial }: { initial: QuotasValue }) {
  const { t } = useAppStore();
  const update = useUpdateSetting<QuotasValue>(SETTING_KEYS.APP_QUOTAS);
  const [state, setState] = useState<QuotasValue>(initial);

  return (
    <>
      <div className="space-y-3">
        <NumberField
          label={t("admin.settings.quotas.projects")}
          hint={t("admin.settings.quotas.projectsHint")}
          value={state.maxProjectsPerWorkspace}
          onChange={(v) =>
            setState((s) => ({ ...s, maxProjectsPerWorkspace: v }))
          }
        />
        <NumberField
          label={t("admin.settings.quotas.members")}
          hint={t("admin.settings.quotas.membersHint")}
          value={state.maxMembersPerWorkspace}
          onChange={(v) =>
            setState((s) => ({ ...s, maxMembersPerWorkspace: v }))
          }
        />
        <NumberField
          label={t("admin.settings.quotas.storage")}
          hint={t("admin.settings.quotas.storageHint")}
          value={state.maxStorageGB}
          onChange={(v) => setState((s) => ({ ...s, maxStorageGB: v }))}
          suffix="GB"
        />
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          onClick={() => update.mutate(state)}
          disabled={update.isPending}
        >
          {update.isPending ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {t("common.save")}
        </Button>
      </div>
    </>
  );
}

function NumberField({
  label,
  hint,
  value,
  onChange,
  suffix,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (next: number) => void;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
          className="w-32"
        />
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
      <p className="text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}
