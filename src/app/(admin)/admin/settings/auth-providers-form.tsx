"use client";

import { useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  DEFAULT_AUTH_PROVIDERS,
  SETTING_KEYS,
  useSetting,
  useUpdateSetting,
  type AuthProvidersValue,
} from "@/features/admin";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

export function AuthProvidersForm() {
  const { t } = useAppStore();
  const { data, isLoading } = useSetting<AuthProvidersValue>(
    SETTING_KEYS.APP_AUTH_PROVIDERS,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" />
          {t("admin.settings.authProviders.title")}
        </CardTitle>
        <CardDescription>
          {t("admin.settings.authProviders.description")}
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
          // Inner form is mounted once data resolves so `useState(initial)`
          // captures the persisted value without an effect-driven sync (which
          // React Compiler flags as cascading renders).
          <ProvidersFormInner
            initial={{
              password: data?.value?.password ?? DEFAULT_AUTH_PROVIDERS.password,
              google: data?.value?.google ?? DEFAULT_AUTH_PROVIDERS.google,
              github: data?.value?.github ?? DEFAULT_AUTH_PROVIDERS.github,
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function ProvidersFormInner({ initial }: { initial: AuthProvidersValue }) {
  const { t } = useAppStore();
  const update = useUpdateSetting<AuthProvidersValue>(
    SETTING_KEYS.APP_AUTH_PROVIDERS,
  );
  const [state, setState] = useState<AuthProvidersValue>(initial);

  // Guard against locking everyone out — at least one provider must remain on.
  const noneEnabled = !state.password && !state.google && !state.github;

  return (
    <>
      <div className="space-y-2">
        <ProviderToggle
          label={t("admin.settings.authProviders.password")}
          hint={t("admin.settings.authProviders.passwordHint")}
          checked={state.password}
          onChange={(v) => setState((s) => ({ ...s, password: v }))}
        />
        <ProviderToggle
          label={t("admin.settings.authProviders.google")}
          hint={t("admin.settings.authProviders.googleHint")}
          checked={state.google}
          onChange={(v) => setState((s) => ({ ...s, google: v }))}
        />
        <ProviderToggle
          label={t("admin.settings.authProviders.github")}
          hint={t("admin.settings.authProviders.githubHint")}
          checked={state.github}
          onChange={(v) => setState((s) => ({ ...s, github: v }))}
        />
      </div>

      {noneEnabled && (
        <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
          {t("admin.settings.authProviders.allDisabledWarning")}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <Button
          onClick={() => update.mutate(state)}
          disabled={update.isPending || noneEnabled}
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

function ProviderToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-md border bg-card px-3 py-2.5 hover:bg-muted/30">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground">{hint}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
    </label>
  );
}
