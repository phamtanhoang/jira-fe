"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScrollText,
  Settings,
  Users,
  Flag,
  Megaphone,
  LineChart,
  Activity,
  Briefcase,
  PanelLeftClose,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/lib/stores/use-app-store";
import { usePublicMaintenance } from "@/features/admin";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type Item = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

export function AdminSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const { name: appName, logoUrl, t } = useAppStore();
  const { data: maintenance } = usePublicMaintenance();
  const maintenanceOn = !!maintenance?.enabled;

  const groups: { label: string; items: Item[] }[] = [
    {
      label: t("admin.nav.groupOverview"),
      items: [
        {
          href: ROUTES.ADMIN,
          label: t("admin.nav.overview"),
          icon: LayoutDashboard,
          exact: true,
        },
        {
          href: ROUTES.ADMIN_ANALYTICS,
          label: t("admin.nav.analytics"),
          icon: LineChart,
        },
      ],
    },
    {
      label: t("admin.nav.groupOperations"),
      items: [
        {
          href: ROUTES.ADMIN_METRICS,
          label: t("admin.nav.metrics"),
          icon: Activity,
        },
        {
          href: ROUTES.ADMIN_LOGS,
          label: t("admin.nav.logs"),
          icon: ScrollText,
        },
        {
          href: ROUTES.ADMIN_USERS,
          label: t("admin.nav.users"),
          icon: Users,
        },
        {
          href: ROUTES.ADMIN_WORKSPACES,
          label: t("admin.nav.workspaces"),
          icon: Briefcase,
        },
      ],
    },
    {
      label: t("admin.nav.groupConfiguration"),
      items: [
        {
          href: ROUTES.ADMIN_FLAGS,
          label: t("admin.nav.flags"),
          icon: Flag,
        },
        {
          href: ROUTES.ADMIN_SITE_NOTICES,
          label: t("admin.nav.siteNotices"),
          icon: Megaphone,
        },
        {
          href: ROUTES.ADMIN_SETTINGS,
          label: t("admin.nav.settings"),
          icon: Settings,
        },
      ],
    },
  ];

  if (collapsed) return null;

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r bg-linear-to-b from-amber-50/40 via-background to-background dark:from-amber-950/20 dark:via-background dark:to-background">
      {/* Brand + admin badge */}
      <div className="flex h-12 items-center justify-between px-4">
        <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt={appName} className="h-6 w-6 rounded" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
              {appName?.charAt(0).toUpperCase() || "A"}
            </div>
          )}
          <span className="text-[13px] font-semibold">{appName}</span>
        </Link>
        <button
          onClick={onToggle}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Admin badge */}
      <div className="px-4 pb-2">
        <Badge
          variant="outline"
          className="h-6 gap-1.5 border-amber-500/30 bg-amber-500/10 px-2 text-[11px] font-semibold text-amber-700 dark:text-amber-400"
        >
          <ShieldCheck className="h-3 w-3" />
          {t("admin.badge")}
        </Badge>
      </div>

      <div className="px-3">
        <Separator />
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3 px-3 py-2">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </div>
              <nav className="space-y-0.5">
                {group.items.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-1.75 text-[13px] font-medium transition-colors",
                        active
                          ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.href === ROUTES.ADMIN_SITE_NOTICES &&
                        maintenanceOn && (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-red-500"
                            aria-label="maintenance active"
                          />
                        )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Exit admin */}
      <div className="border-t p-3">
        <Link
          href={ROUTES.DASHBOARD}
          className="flex items-center gap-2 rounded-md px-2.5 py-1.75 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("admin.exit")}
        </Link>
      </div>
    </aside>
  );
}
