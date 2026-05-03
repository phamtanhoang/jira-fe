"use client";

import { useState } from "react";
import {
  Trash2,
  Search,
  UserPlus,
  LayoutGrid,
} from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useCurrentUser } from "@/features/auth/hooks";
import { useTableDensity } from "@/lib/hooks/use-table-density";
import {
  useInfiniteAdminUsers,
  useUpdateUserRole,
  useDeleteUser,
  useSetUserActive,
  BulkInviteDialog,
  type AdminUser,
  type AdminUsersFilters,
  type Role,
} from "@/features/admin-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRow } from "./_components/user-row";

const VERIFIED_ANY = "__any_verified__";
const ROLE_ANY = "__any_role__";

export function AdminUsersClient() {
  const { t } = useAppStore();
  const { user: currentUser } = useCurrentUser();
  const { density, setDensity } = useTableDensity();

  const [filters, setFilters] = useState<
    Omit<AdminUsersFilters, "cursor">
  >({ take: 50 });
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bulkInviteOpen, setBulkInviteOpen] = useState(false);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteAdminUsers(filters);
  // Concatenated rows across all loaded pages — keeping this flat lets the
  // existing render path treat it like the old single-page response.
  const rows = data?.pages.flatMap((p) => p.data) ?? [];
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const setActive = useSetUserActive();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t("admin.users.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.users.description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" size="sm" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                {t("admin.users.density.label")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDensity("compact")}>
                {density === "compact" && "✓ "}
                {t("admin.users.density.compact")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDensity("comfortable")}>
                {density === "comfortable" && "✓ "}
                {t("admin.users.density.comfortable")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setBulkInviteOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            {t("admin.users.bulkInvite.openButton")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
        <div className="relative flex-1 min-w-60">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder={t("admin.users.filters.searchPlaceholder")}
            value={filters.search ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                search: e.target.value || undefined,
              }))
            }
          />
        </div>

        <Select
          value={filters.role ?? ROLE_ANY}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              role: v === ROLE_ANY ? undefined : (v as Role),
            }))
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ROLE_ANY}>
              {t("admin.users.filters.allRoles")}
            </SelectItem>
            <SelectItem value="USER">USER</SelectItem>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={
            filters.verified === undefined
              ? VERIFIED_ANY
              : filters.verified
                ? "yes"
                : "no"
          }
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              verified:
                v === VERIFIED_ANY ? undefined : v === "yes" ? true : false,
            }))
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={VERIFIED_ANY}>
              {t("admin.users.filters.allVerified")}
            </SelectItem>
            <SelectItem value="yes">
              {t("admin.users.filters.verifiedYes")}
            </SelectItem>
            <SelectItem value="no">
              {t("admin.users.filters.verifiedNo")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="sticky top-0 bg-background/95 backdrop-blur z-10 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 border-b px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>{t("admin.users.columns.user")}</span>
          <span>{t("admin.users.columns.role")}</span>
          <span>{t("admin.users.columns.status")}</span>
          <span>{t("admin.users.columns.verified")}</span>
          <span>{t("admin.users.columns.joined")}</span>
          <span className="w-10 text-right">
            {t("admin.users.columns.actions")}
          </span>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            {t("admin.users.empty")}
          </div>
        ) : (
          rows.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              isSelf={u.id === currentUser?.id}
              expanded={expandedId === u.id}
              density={density}
              onToggleExpand={() =>
                setExpandedId((prev) => (prev === u.id ? null : u.id))
              }
              onPromote={() =>
                updateRole.mutate({
                  id: u.id,
                  role: u.role === "ADMIN" ? "USER" : "ADMIN",
                })
              }
              onToggleActive={() =>
                setActive.mutate({ id: u.id, active: !u.active })
              }
              onDelete={() => setDeleteTarget(u)}
              selfLabel={t("admin.users.selfBadge")}
            />
          ))
        )}
      </div>

      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <Spinner className="mr-1.5 h-3.5 w-3.5" />
            ) : null}
            {t("admin.users.loadMore")}
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
              {t("admin.users.actions.deleteConfirmTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.users.actions.deleteConfirmDesc", {
                email: deleteTarget?.email ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteUser.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteTarget &&
                deleteUser.mutate(deleteTarget.id, {
                  onSuccess: () => setDeleteTarget(null),
                })
              }
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? (
                <Spinner className="mr-2 h-3.5 w-3.5" />
              ) : (
                <Trash2 className="mr-2 h-3.5 w-3.5" />
              )}
              {t("admin.users.actions.deleteCta")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkInviteDialog open={bulkInviteOpen} onOpenChange={setBulkInviteOpen} />
    </div>
  );
}
