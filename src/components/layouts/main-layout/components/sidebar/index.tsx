"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Clock,
  LayoutGrid,
  Bug,
  BookOpen,
  CheckSquare,
  Layers,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn, getInitials, getTileGradient, useRecents } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useCurrentUser } from "@/features/auth/hooks";
import { useWorkspaces } from "@/features/workspaces/hooks";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

// Same map cmdk uses — issue-type icon for Recent rows. Defined here too so
// Sidebar doesn't reach into a component's internals just to mirror the look.
const ISSUE_ICONS: Record<string, LucideIcon> = {
  EPIC: Zap,
  STORY: BookOpen,
  BUG: Bug,
  TASK: CheckSquare,
  SUBTASK: Layers,
};

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
  const { user } = useCurrentUser();
  const recents = useRecents().slice(0, 5);

  const navItems = [
    { href: ROUTES.DASHBOARD, label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: ROUTES.WORKSPACES, label: t("nav.workspaces"), icon: FolderKanban },
    ...(user?.role === "ADMIN"
      ? [{ href: ROUTES.ADMIN, label: t("nav.admin"), icon: ShieldCheck }]
      : []),
  ];

  if (collapsed) {
    return (
      <aside className="flex h-screen w-16 shrink-0 flex-col items-center border-r bg-card/40 backdrop-blur-sm border-border/40 py-3 gap-1">
        {/* Logo */}
        <Link href={ROUTES.DASHBOARD} className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={appName} className="h-6 w-6 rounded" />
          ) : (
            appName?.charAt(0).toUpperCase() || "?"
          )}
        </Link>

        <TooltipProvider delay={0}>
          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                render={
                  <Link href={item.href} />
                }
              >
                <item.icon className="h-4.5 w-4.5" />
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}

          {/* Workspace icons — seeded gradient per workspace id so two
              workspaces with the same first letter don't look identical. */}
          {Array.isArray(workspaces) && workspaces.slice(0, 5).map((ws) => {
            const isActive = pathname.includes(ws.id);
            const gradient = getTileGradient(ws.id);
            return (
              <Tooltip key={ws.id}>
                <TooltipTrigger
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded bg-linear-to-br text-[10px] font-semibold text-white shadow-sm transition-all",
                    gradient,
                    isActive
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "opacity-85 hover:opacity-100",
                  )}
                  render={
                    <Link href={ROUTES.WORKSPACE(ws.id)} />
                  }
                >
                  {getInitials(ws.name)}
                </TooltipTrigger>
                <TooltipContent side="right">{ws.name}</TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>

        {/* Expand button at bottom */}
        <div className="mt-auto">
          <TooltipProvider delay={0}>
            <Tooltip>
              <TooltipTrigger
                onClick={onToggle}
                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r bg-card/40 backdrop-blur-sm">
      {/* Brand + collapse */}
      <div className="flex h-12 items-center justify-between px-4">
        <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2">
          {logoUrl ? (
            // Admin-supplied logo URL — see admin-layout/sidebar for why we
            // skip next/image here.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={appName} className="h-6 w-6 rounded" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
              {appName?.charAt(0).toUpperCase() || "?"}
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

        {/* Recent — last 5 issues/projects the user opened. Reads from the
            localStorage ring buffer that Cmd+K already populates, so no new
            data source. Replaces the prior "My Work" section which just
            duplicated filters already on /dashboard + the header bell. */}
        {recents.length > 0 && (
          <div className="px-3 py-1">
            <div className="mb-1 flex items-center gap-1.5 px-2.5 text-[11px] font-medium text-muted-foreground">
              <Clock className="h-3 w-3" />
              {t("nav.recent")}
            </div>
            <nav className="space-y-0.5">
              {recents.map((item) => {
                const href =
                  item.type === "ISSUE"
                    ? ROUTES.ISSUE(item.key)
                    : ROUTES.BOARD(item.workspaceId, item.id);
                const Icon: LucideIcon =
                  item.type === "ISSUE"
                    ? ISSUE_ICONS[item.issueType ?? ""] ?? CheckSquare
                    : LayoutGrid;
                const label = item.type === "ISSUE" ? item.summary : item.name;
                const isActive = pathname === href;
                return (
                  <Link
                    key={`${item.type}:${item.id}`}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                      isActive
                        ? "bg-primary/8 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground/70">
                      {item.key}
                    </span>
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

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
                const gradient = getTileGradient(ws.id);
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
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded bg-linear-to-br text-[10px] font-semibold text-white shadow-sm",
                        gradient,
                      )}
                    >
                      {getInitials(ws.name)}
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
