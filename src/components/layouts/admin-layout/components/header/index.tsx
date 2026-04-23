"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { PanelLeft, LogOut, User, Moon, Sun, ShieldCheck } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { getInitials } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useCurrentUser, useLogout } from "@/features/auth/hooks";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AdminHeader({
  collapsed,
  onToggleSidebar,
}: {
  collapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { t } = useAppStore();
  const { user } = useCurrentUser();
  const { mutate: logout } = useLogout();

  const initials = getInitials(user?.name, user?.email);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur">
      {/* Left — collapse toggle (when collapsed) + admin badge */}
      <div className="flex items-center gap-2">
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
        <Badge
          variant="outline"
          className="h-6 gap-1.5 border-amber-500/30 bg-amber-500/10 px-2 text-[11px] font-semibold text-amber-700 dark:text-amber-400"
        >
          <ShieldCheck className="h-3 w-3" />
          {t("admin.badge")}
        </Badge>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <LocaleSwitcher />

        <Separator orientation="vertical" className="mx-1 h-5" />

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
              {user?.name}
            </span>
          </Button>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-[13px] font-semibold">{user?.name}</p>
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
