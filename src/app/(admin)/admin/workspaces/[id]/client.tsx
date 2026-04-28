"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bug,
  CalendarDays,
  FolderKanban,
  HardDrive,
  Mail,
  Paperclip,
  Users,
} from "lucide-react";
import { AVATAR_GRADIENT } from "@/lib/constants/issue-config";
import { ROUTES } from "@/lib/constants";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useAdminWorkspaceDetail } from "@/features/admin-users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const v = bytes / Math.pow(k, i);
  return `${v.toFixed(v >= 100 ? 0 : 1)} ${units[i]}`;
}

export function AdminWorkspaceDetailClient({ id }: { id: string }) {
  const { t } = useAppStore();
  const { data, isLoading, isError } = useAdminWorkspaceDetail(id);

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-5xl p-6">
        <EmptyState
          title={t("admin.workspaces.detail.notFoundTitle")}
          description={t("admin.workspaces.detail.notFoundDesc")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-6">
      <Link
        href={ROUTES.ADMIN_WORKSPACES}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "w-fit",
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        {t("admin.workspaces.detail.back")}
      </Link>

      {isLoading || !data ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <>
          <Card>
            <CardContent className="flex items-start gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg font-semibold text-primary">
                {data.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-semibold">{data.name}</h1>
                <p className="text-xs text-muted-foreground">/{data.slug}</p>
                {data.description && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {data.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {t("admin.workspaces.detail.createdOn", {
                      date: formatDate(data.createdAt),
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Avatar className="h-4 w-4">
                      {data.owner.image ? (
                        <AvatarImage
                          src={data.owner.image}
                          alt={data.owner.name ?? data.owner.email}
                        />
                      ) : null}
                      <AvatarFallback
                        className={cn(AVATAR_GRADIENT, "text-[8px]")}
                      >
                        {getInitials(data.owner.name, data.owner.email)}
                      </AvatarFallback>
                    </Avatar>
                    {data.owner.name ?? data.owner.email}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatTile
              icon={<Users className="h-4 w-4" />}
              label={t("admin.workspaces.detail.members")}
              value={data.counts.members}
            />
            <StatTile
              icon={<FolderKanban className="h-4 w-4" />}
              label={t("admin.workspaces.detail.projects")}
              value={data.counts.projects}
            />
            <StatTile
              icon={<Bug className="h-4 w-4" />}
              label={t("admin.workspaces.detail.issues")}
              value={data.counts.issues}
              sub={t("admin.workspaces.detail.openCount", {
                count: String(data.counts.issuesOpen),
              })}
            />
            <StatTile
              icon={<Paperclip className="h-4 w-4" />}
              label={t("admin.workspaces.detail.attachments")}
              value={data.counts.attachments}
            />
            <StatTile
              icon={<HardDrive className="h-4 w-4" />}
              label={t("admin.workspaces.detail.storage")}
              value={formatBytes(data.storage.bytes)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FolderKanban className="h-4 w-4" />
                  {t("admin.workspaces.detail.recentProjects")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {data.recentProjects.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    {t("admin.workspaces.detail.noProjects")}
                  </p>
                ) : (
                  <div className="divide-y">
                    {data.recentProjects.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 px-4 py-2 text-xs"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-semibold text-primary">
                          {p.key}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{p.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {formatDate(p.createdAt)}
                          </div>
                        </div>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {p._count.issues}{" "}
                          {t("admin.workspaces.detail.issuesShort")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  {t("admin.workspaces.detail.recentMembers")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {data.recentMembers.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    {t("admin.workspaces.detail.noMembers")}
                  </p>
                ) : (
                  <div className="divide-y">
                    {data.recentMembers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 px-4 py-2 text-xs"
                      >
                        <Avatar className="h-6 w-6 shrink-0">
                          {m.user.image ? (
                            <AvatarImage
                              src={m.user.image}
                              alt={m.user.name ?? m.user.email}
                            />
                          ) : null}
                          <AvatarFallback
                            className={cn(AVATAR_GRADIENT, "text-[10px]")}
                          >
                            {getInitials(m.user.name, m.user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">
                            {m.user.name ?? m.user.email}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{m.user.email}</span>
                          </div>
                        </div>
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase">
                          {m.role}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
        <div className="mt-1.5 text-2xl font-semibold tabular-nums">
          {value}
        </div>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
