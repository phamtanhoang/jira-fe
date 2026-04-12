"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Plus,
  PanelLeftClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useWorkspaces } from "@/features/workspaces/hooks";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const { name: appName, logoUrl, authorName, authorUrl, t } = useAppStore();
  const { data: workspaces } = useWorkspaces();

  const navItems = [
    { href: ROUTES.DASHBOARD, label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: ROUTES.WORKSPACES, label: t("nav.workspaces"), icon: FolderKanban },
  ];

  if (collapsed) return null;

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r bg-muted/30">
      {/* Brand + collapse */}
      <div className="flex h-12 items-center justify-between px-4">
        <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt={appName} className="h-6 w-6 rounded" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
              J
            </div>
          )}
          <span className="text-[13px] font-semibold">
            {appName}
          </span>
        </Link>
        <button
          onClick={onToggle}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        {/* Main nav */}
        <div className="px-3 py-1">
          <nav className="space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.75 text-[13px] font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary/8 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="px-3 py-1">
          <Separator />
        </div>

        {/* Workspaces */}
        <div className="px-3 py-1">
          <div className="mb-1 flex items-center justify-between px-2.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("nav.workspaces")}
            </span>
            <Link
              href={ROUTES.WORKSPACES}
              className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title={t("nav.newWorkspace")}
            >
              <Plus className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-0.5">
            {Array.isArray(workspaces) &&
              workspaces.map((ws) => {
                const isActive = pathname.includes(ws.id);
                return (
                  <Link
                    key={ws.id}
                    href={ROUTES.WORKSPACE(ws.id)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                      isActive
                        ? "bg-primary/8 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-semibold",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted-foreground/15 text-muted-foreground",
                      )}
                    >
                      {ws.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate">{ws.name}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground/60">
                      {ws._count?.projects ?? 0}
                    </span>
                  </Link>
                );
              })}
          </div>
        </div>
      </ScrollArea>

      {/* App info footer */}
      <div className="border-t px-4 py-3 text-center">
        <p className="text-[10px] text-muted-foreground/50">
          {t("footer.copyright", { year: new Date().getFullYear().toString(), name: appName })}
          {authorName && (
            <>
              {" · "}
              {t("footer.builtBy")}{" "}
              {authorUrl ? (
                <a
                  href={authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-muted-foreground"
                >
                  {authorName}
                </a>
              ) : (
                authorName
              )}
            </>
          )}
        </p>
      </div>
    </aside>
  );
}
