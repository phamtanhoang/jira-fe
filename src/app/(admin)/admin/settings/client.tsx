"use client";

import { Info, Mail, ShieldCheck } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useUrlTab } from "@/lib/hooks/use-url-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppInfoForm } from "./app-info-form";
import { AppEmailForm } from "./app-email-form";
import { AuthProvidersForm } from "./auth-providers-form";

const TABS = ["app-info", "app-email", "auth-providers"] as const;
type Tab = (typeof TABS)[number];

export function AdminSettingsClient() {
  const { t } = useAppStore();
  const [tab, setTab] = useUrlTab<Tab>(TABS, "app-info");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {t("admin.settings.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.settings.description")}
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => v && setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="app-info">
            <Info className="mr-1.5 h-3.5 w-3.5" />
            {t("admin.settings.tabAppInfo")}
          </TabsTrigger>
          <TabsTrigger value="app-email">
            <Mail className="mr-1.5 h-3.5 w-3.5" />
            {t("admin.settings.tabAppEmail")}
          </TabsTrigger>
          <TabsTrigger value="auth-providers">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            {t("admin.settings.tabAuthProviders")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="app-info" className="mt-4">
          <AppInfoForm />
        </TabsContent>
        <TabsContent value="app-email" className="mt-4">
          <AppEmailForm />
        </TabsContent>
        <TabsContent value="auth-providers" className="mt-4">
          <AuthProvidersForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
