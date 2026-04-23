"use client";

import { Info, Mail } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppInfoForm } from "./app-info-form";
import { AppEmailForm } from "./app-email-form";

export function AdminSettingsClient() {
  const { t } = useAppStore();

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

      <Tabs defaultValue="app-info">
        <TabsList>
          <TabsTrigger value="app-info">
            <Info className="mr-1.5 h-3.5 w-3.5" />
            {t("admin.settings.tabAppInfo")}
          </TabsTrigger>
          <TabsTrigger value="app-email">
            <Mail className="mr-1.5 h-3.5 w-3.5" />
            {t("admin.settings.tabAppEmail")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="app-info" className="mt-4">
          <AppInfoForm />
        </TabsContent>
        <TabsContent value="app-email" className="mt-4">
          <AppEmailForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
