"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { useCurrentUser } from "@/features/auth/hooks";
import { Spinner } from "@/components/ui/spinner";
import { AdminHeader, AdminSidebar } from "./components";

const STORAGE_KEY = "admin-sidebar-collapsed";

function getInitialCollapsed() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

/**
 * Admin shell — gates access to the `/admin/*` route subtree.
 *
 * Auth itself is handled by the auth middleware (cookie check). Role
 * enforcement is BE-authoritative via `@Roles(Role.ADMIN)`; this layout only
 * adds a UX redirect so non-admins don't land on a blank admin page.
 */
export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);

  useEffect(() => {
    if (!isLoading && user && user.role !== "ADMIN") {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [user, isLoading, router]);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  }

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  if (user.role !== "ADMIN") return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar collapsed={collapsed} onToggle={toggle} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader collapsed={collapsed} onToggleSidebar={toggle} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
