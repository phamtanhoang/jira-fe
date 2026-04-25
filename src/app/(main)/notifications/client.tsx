"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Trash2, Inbox } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { formatDateTime } from "@/lib/utils";
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/hooks";
import type { Notification } from "@/features/notifications/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const { t } = useAppStore();
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useNotifications({
    unread: tab === "unread",
    page,
    pageSize: PAGE_SIZE,
  });
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();
  const { mutate: del } = useDeleteNotification();

  function handleClick(n: Notification) {
    if (!n.readAt) markRead(n.id);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold tracking-tight">
            {t("notifications.title")}
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => markAllRead()}
        >
          <Check className="mr-1.5 h-3.5 w-3.5" />
          {t("notifications.markAllRead")}
        </Button>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab((v as "all" | "unread") ?? "all");
          setPage(1);
        }}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="all">{t("notifications.tabAll")}</TabsTrigger>
          <TabsTrigger value="unread">
            {t("notifications.tabUnread")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : !data?.data.length ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {t("notifications.empty")}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border bg-card">
            {data.data.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`group/n flex cursor-pointer items-start gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-muted/50 ${
                  n.readAt ? "" : "bg-primary/5"
                }`}
              >
                {!n.readAt && (
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{n.title}</p>
                  {n.body && (
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {n.body}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground/70">
                    {formatDateTime(n.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    del(n.id);
                  }}
                  className="rounded p-1.5 text-muted-foreground/40 opacity-0 transition-opacity hover:bg-muted hover:text-destructive group-hover/n:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          {data.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                onChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
