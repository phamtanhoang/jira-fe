"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Trash2, ExternalLink } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { AVATAR_GRADIENT, ROUTES } from "@/lib/constants";
import {
  useAdminDeleteWorkspace,
  useAdminWorkspaces,
  type AdminWorkspaceRow,
  type AdminWorkspacesFilters,
} from "@/features/admin-users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AdminWorkspacesClient() {
  const { t } = useAppStore();

  const [filters, setFilters] = useState<AdminWorkspacesFilters>({ take: 50 });
  const [deleteTarget, setDeleteTarget] = useState<AdminWorkspaceRow | null>(
    null,
  );

  const { data, isLoading } = useAdminWorkspaces(filters);
  const remove = useAdminDeleteWorkspace();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {t("admin.workspaces.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.workspaces.description")}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
        <div className="relative flex-1 min-w-60">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder={t("admin.workspaces.searchPlaceholder")}
            value={filters.search ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                search: e.target.value || undefined,
                cursor: undefined,
              }))
            }
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_auto] gap-2 border-b bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>{t("admin.workspaces.columns.workspace")}</span>
          <span>{t("admin.workspaces.columns.owner")}</span>
          <span>{t("admin.workspaces.columns.members")}</span>
          <span>{t("admin.workspaces.columns.projects")}</span>
          <span>{t("admin.workspaces.columns.storage")}</span>
          <span>{t("admin.workspaces.columns.created")}</span>
          <span className="w-10 text-right">
            {t("admin.workspaces.columns.actions")}
          </span>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : !data?.data.length ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            {t("admin.workspaces.empty")}
          </div>
        ) : (
          data.data.map((w) => (
            <WorkspaceRow
              key={w.id}
              row={w}
              onDelete={() => setDeleteTarget(w)}
            />
          ))
        )}
      </div>

      {data?.hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setFilters((f) => ({
                ...f,
                cursor: data.nextCursor ?? undefined,
              }))
            }
          >
            {t("admin.workspaces.loadMore")}
          </Button>
        </div>
      )}

      {/* Delete confirm */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("admin.workspaces.deleteConfirmTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.workspaces.deleteConfirmDesc", {
                name: deleteTarget?.name ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={remove.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteTarget &&
                remove.mutate(deleteTarget.id, {
                  onSuccess: () => setDeleteTarget(null),
                })
              }
              disabled={remove.isPending}
            >
              {remove.isPending ? (
                <Spinner className="mr-2 h-3.5 w-3.5" />
              ) : (
                <Trash2 className="mr-2 h-3.5 w-3.5" />
              )}
              {t("admin.workspaces.deleteCta")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const v = bytes / Math.pow(k, i);
  return `${v.toFixed(v >= 100 ? 0 : 1)} ${units[i]}`;
}

function WorkspaceRow({
  row,
  onDelete,
}: {
  row: AdminWorkspaceRow;
  onDelete: () => void;
}) {
  const initials = getInitials(row.owner.name, null);

  return (
    <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_auto] items-center gap-2 border-b px-4 py-2.5 text-sm last:border-b-0 hover:bg-muted/30">
      <div className="min-w-0">
        <div className="truncate font-medium">{row.name}</div>
        <div className="truncate text-[11px] text-muted-foreground">
          {row.slug}
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <Avatar className="h-6 w-6 shrink-0">
          {row.owner.image ? (
            <AvatarImage src={row.owner.image} alt={row.owner.name ?? ""} />
          ) : null}
          <AvatarFallback className={cn(AVATAR_GRADIENT, "text-[9px]")}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-xs">{row.owner.name ?? "—"}</span>
      </div>
      <div className="text-xs tabular-nums">{row._count.members}</div>
      <div className="text-xs tabular-nums">{row._count.projects}</div>
      <div className="text-xs tabular-nums text-muted-foreground">
        {formatBytes(row.storageBytes)}
      </div>
      <div className="text-xs text-muted-foreground">
        {formatDate(row.createdAt)}
      </div>
      <div className="flex justify-end gap-1">
        <Link
          href={ROUTES.ADMIN_WORKSPACE_DETAIL(row.id)}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-xs" }),
            "text-muted-foreground",
          )}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
