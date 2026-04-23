"use client";

import { useState } from "react";
import { Plus, Trash2, Flag as FlagIcon } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  SETTING_KEYS,
  useSetting,
  useUpdateSetting,
  type FeatureFlags,
} from "@/features/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const KEY_RE = /^[a-z0-9._]+$/;

export function AdminFlagsClient() {
  const { t } = useAppStore();
  const { data, isLoading } = useSetting<FeatureFlags>(
    SETTING_KEYS.APP_FEATURES,
  );
  const update = useUpdateSetting<FeatureFlags>(SETTING_KEYS.APP_FEATURES);

  const flags: FeatureFlags = data?.value ?? {};

  const [newKey, setNewKey] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);

  const entries = Object.entries(flags).sort(([a], [b]) => a.localeCompare(b));

  function commit(next: FeatureFlags) {
    update.mutate(next);
  }

  function toggle(key: string) {
    commit({ ...flags, [key]: !flags[key] });
  }

  function remove(key: string) {
    if (!window.confirm(t("admin.flags.deleteConfirm", { key }))) return;
    const next = { ...flags };
    delete next[key];
    commit(next);
  }

  function add() {
    const key = newKey.trim();
    if (!key) return;
    if (!KEY_RE.test(key)) {
      setKeyError(t("admin.flags.keyHint"));
      return;
    }
    if (key in flags) {
      setKeyError(null);
      return;
    }
    commit({ ...flags, [key]: false });
    setNewKey("");
    setKeyError(null);
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {t("admin.flags.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.flags.description", { key: SETTING_KEYS.APP_FEATURES })}
        </p>
      </div>

      {/* Add flag */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-sm">{t("admin.flags.addTitle")}</CardTitle>
          <CardDescription className="text-xs">
            {t("admin.flags.keyHint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder={t("admin.flags.keyPlaceholder")}
              value={newKey}
              onChange={(e) => {
                setNewKey(e.target.value);
                if (keyError) setKeyError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") add();
              }}
            />
            <Button onClick={add} disabled={update.isPending}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              {t("admin.flags.addCta")}
            </Button>
          </div>
          {keyError && (
            <p className="mt-2 text-xs text-destructive">{keyError}</p>
          )}
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <FlagIcon className="h-5 w-5 text-muted-foreground/40" />
              {t("admin.flags.empty")}
            </div>
          ) : (
            <div className="divide-y">
              {entries.map(([key, enabled]) => (
                <div
                  key={key}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[13px]">{key}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    disabled={update.isPending}
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                      enabled
                        ? "bg-emerald-500"
                        : "bg-muted-foreground/20 dark:bg-muted-foreground/30"
                    }`}
                    aria-pressed={enabled}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                        enabled ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => remove(key)}
                    disabled={update.isPending}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
