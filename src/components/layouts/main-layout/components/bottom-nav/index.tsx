"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListTodo, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/lib/stores/use-app-store";

export function BottomNav() {
  const { t } = useAppStore();
  const pathname = usePathname();

  const handleSearchClick = () => {
    // Trigger Cmd+K keyboard shortcut
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  const items = [
    {
      label: t("nav.dashboard"),
      href: ROUTES.DASHBOARD,
      icon: Home,
      active: pathname === ROUTES.DASHBOARD,
    },
    {
      label: t("bottomNav.myIssues"),
      href: ROUTES.WORKSPACES,
      icon: ListTodo,
      active: pathname.startsWith(ROUTES.WORKSPACES),
    },
    {
      label: t("bottomNav.search"),
      icon: Search,
      onClick: handleSearchClick,
      active: false,
    },
    {
      label: t("bottomNav.profile"),
      href: "/profile",
      icon: User,
      active: pathname.startsWith("/profile"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
      <div className="grid grid-cols-4">
        {items.map((item, index) => {
          const Icon = item.icon;
          const content = (
            <>
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  item.active
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  item.active
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              >
                {item.label}
              </span>
            </>
          );

          if (item.onClick) {
            return (
              <button
                key={index}
                type="button"
                onClick={item.onClick}
                className="group flex flex-col items-center justify-center gap-1 py-2.5 transition-colors active:bg-muted"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={index}
              href={item.href!}
              className="group flex flex-col items-center justify-center gap-1 py-2.5 transition-colors active:bg-muted"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
