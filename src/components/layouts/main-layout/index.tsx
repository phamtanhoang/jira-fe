"use client";

import { useCallback, useState } from "react";
import type { QueryKey } from "@tanstack/react-query";
import { Sidebar, Header } from "./components";
import { BottomNav } from "./components/bottom-nav";
import { AnnouncementBanner } from "@/components/shared/announcement-banner";
import { useRealtime, type RealtimeEvent } from "@/lib/realtime/use-realtime";

const STORAGE_KEY = "sidebar-collapsed";

function getInitialCollapsed() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  }

  // Subscribe to the per-user SSE channel so notifications + watched-issue
  // events refresh the bell badge + notifications page in realtime —
  // no more 10-min polling lag. The BE filters by `recipientId` so each
  // user only receives events addressed to them.
  const resolveUserEvents = useCallback(
    (event: RealtimeEvent): QueryKey[] => {
      if (event.type === "notification.created") {
        return [["notifications"], ["notifications", "unread-count"]];
      }
      return [];
    },
    [],
  );
  useRealtime("/events/me", resolveUserEvents);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header collapsed={collapsed} onToggleSidebar={toggle} />
        <AnnouncementBanner />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
