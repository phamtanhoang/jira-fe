"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Check, Trash2, Inbox } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/lib/stores/use-app-store";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from "../hooks";
import type { Notification } from "../types";

export function NotificationsBell() {
  const router = useRouter();
  const { t } = useAppStore();
  const [open, setOpen] = useState(false);
  const { data: unread } = useUnreadCount();
  const { data: list, isLoading } = useNotifications({ pageSize: 20 });
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: markingAll } =
    useMarkAllNotificationsRead();
  const { mutate: del } = useDeleteNotification();

  const count = unread?.count ?? 0;
  const items = list?.data ?? [];

  function handleItemClick(n: Notification) {
    if (!n.readAt) markRead(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Button
        render={<PopoverTrigger />}
        variant="ghost"
        size="icon-xs"
        className="relative text-muted-foreground"
        aria-label={t("notifications.title")}
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Button>
      <PopoverContent align="end" className="w-96 p-0" sideOffset={6}>
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-[13px] font-semibold">
            {t("notifications.title")}
          </span>
          <div className="flex items-center gap-1">
            {count > 0 && (
              <button
                disabled={markingAll}
                onClick={() => markAllRead()}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Check className="h-3 w-3" />
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>
        </div>

        <div className="max-h-96 overflow-auto">
          {isLoading ? (
            <div className="px-3 py-8 text-center text-[12px] text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : items.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <Inbox className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-[12px] text-muted-foreground">
                {t("notifications.empty")}
              </p>
            </div>
          ) : (
            items.map((n) => (
              <NotificationRow
                key={n.id}
                n={n}
                onClick={() => handleItemClick(n)}
                onDelete={() => del(n.id)}
              />
            ))
          )}
        </div>

        <Link
          href={ROUTES.NOTIFICATIONS}
          onClick={() => setOpen(false)}
          className="block border-t px-3 py-2 text-center text-[11px] text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          {t("notifications.viewAll")}
        </Link>
      </PopoverContent>
    </Popover>
  );
}

function NotificationRow({
  n,
  onClick,
  onDelete,
}: {
  n: Notification;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`group/n relative flex cursor-pointer gap-2.5 border-b px-3 py-2.5 last:border-b-0 hover:bg-muted/50 ${
        n.readAt ? "" : "bg-primary/5"
      }`}
    >
      {!n.readAt && (
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug">{n.title}</p>
        {n.body && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {n.body}
          </p>
        )}
        <p className="mt-1 text-[10px] text-muted-foreground/60">
          {formatDateTime(n.createdAt)}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute right-2 top-2 rounded p-1 text-muted-foreground/40 opacity-0 transition-opacity hover:bg-muted hover:text-destructive group-hover/n:opacity-100"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
