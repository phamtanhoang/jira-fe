"use client";

import { useRouter } from "next/navigation";
import {
  PanelLeft,
  LogOut,
  Settings,
  Bell,
  Search,
  HelpCircle,
  User,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useCurrentUser, useLogout } from "@/features/auth/hooks";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header({
  collapsed,
  onToggleSidebar,
}: {
  collapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const router = useRouter();
  const { t } = useAppStore();
  const { user } = useCurrentUser();
  const { mutate: logout } = useLogout();

  const initials = (user?.name ?? user?.email ?? "U").charAt(0).toUpperCase();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-4">
      {/* Left */}
      <div className="flex items-center gap-1">
        {collapsed && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onToggleSidebar}
            className="text-muted-foreground"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        {/* Search placeholder */}
        <Button variant="ghost" size="icon-xs" className="text-muted-foreground">
          <Search className="h-4 w-4" />
        </Button>

        {/* Notifications placeholder */}
        <Button variant="ghost" size="icon-xs" className="relative text-muted-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>

        {/* Help */}
        <Button variant="ghost" size="icon-xs" className="text-muted-foreground">
          <HelpCircle className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Locale */}
        <LocaleSwitcher />

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* User */}
        <DropdownMenu>
          <Button
            render={<DropdownMenuTrigger />}
            variant="ghost"
            size="xs"
            className="gap-2 px-1.5"
          >
            <Avatar className="h-6 w-6 rounded-md">
              <AvatarFallback className="rounded-md bg-primary/10 text-[10px] font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-24 truncate text-[12px] font-medium">
              {user?.name || user?.email || "User"}
            </span>
          </Button>
          <DropdownMenuContent align="end" className="w-56">
            {/* User info */}
            <div className="px-3 py-2">
              <p className="text-[13px] font-semibold">{user?.name || "User"}</p>
              <p className="text-[11px] text-muted-foreground">{user?.email}</p>
            </div>
            <div className="my-1 h-px bg-border" />
            <DropdownMenuItem onClick={() => router.push(ROUTES.PROFILE)}>
              <User className="mr-2 h-4 w-4" />
              {t("profile.title")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("nav.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
