"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Megaphone, Wrench } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnnouncementFormPanel } from "./announcement-form";
import { MaintenanceFormPanel } from "./maintenance-form";

type Tab = "announcement" | "maintenance";
const TABS: readonly Tab[] = ["announcement", "maintenance"];

export function AdminSiteNoticesClient() {
  const { t } = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab") ?? "announcement";
  const activeTab: Tab = TABS.includes(rawTab as Tab)
    ? (rawTab as Tab)
    : "announcement";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {t("admin.siteNotices.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.siteNotices.description")}
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) =>
          router.replace(`?tab=${v}`, { scroll: false })
        }
      >
        <TabsList>
          <TabsTrigger value="announcement">
            <Megaphone className="mr-1.5 h-3.5 w-3.5" />
            {t("admin.siteNotices.tabAnnouncement")}
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <Wrench className="mr-1.5 h-3.5 w-3.5" />
            {t("admin.siteNotices.tabMaintenance")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="announcement" className="mt-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 border-b pb-3">
              <h2 className="flex items-center gap-2 text-sm font-medium">
                <Megaphone className="h-4 w-4" />
                {t("admin.announcement.title")}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("admin.announcement.description")}
              </p>
            </div>
            <AnnouncementFormPanel />
          </div>
        </TabsContent>
        <TabsContent value="maintenance" className="mt-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 border-b pb-3">
              <h2 className="flex items-center gap-2 text-sm font-medium">
                <Wrench className="h-4 w-4" />
                {t("admin.maintenance.title")}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("admin.maintenance.description")}
              </p>
            </div>
            <MaintenanceFormPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
