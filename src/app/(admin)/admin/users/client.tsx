"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Shield,
  ShieldCheck,
  Trash2,
  Search,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Monitor,
  UserPlus,
} from "lucide-react";
import { AVATAR_GRADIENT } from "@/lib/constants/issue-config";
import { cn, formatDate, formatDateTime, getInitials } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useCurrentUser } from "@/features/auth/hooks";
import {
  useInfiniteAdminUsers,
  useUpdateUserRole,
  useDeleteUser,
  useSetUserActive,
  useUserSessions,
  useRevokeSession,
  useRevokeAllSessions,
  BulkInviteDialog,
  type AdminUser,
  type AdminUsersFilters,
  type Role,
} from "@/features/admin-users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const VERIFIED_ANY = "__any_verified__";
const ROLE_ANY = "__any_role__";

export function AdminUsersClient() {
  const { t } = useAppStore();
  const { user: currentUser } = useCurrentUser();

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
        <Button onClick={() => setBulkInviteOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          {t("admin.users.bulkInvite.openButton")}
        </Button>
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
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 border-b bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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

function UserRow({
  user,
  isSelf,
  expanded,
  onToggleExpand,
  onPromote,
  onToggleActive,
  onDelete,
  selfLabel,
}: {
  user: AdminUser;
  isSelf: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onPromote: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  selfLabel: string;
}) {
  const { t } = useAppStore();
  const verified = !!user.emailVerified;
  const initials = getInitials(user.name, user.email);

  return (
    <div className="border-b last:border-b-0">
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted/30">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleExpand}
          className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-expanded={expanded}
          aria-label={t("admin.sessions.title")}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
        <Avatar className="h-8 w-8 shrink-0">
          {user.image ? (
            <AvatarImage src={user.image} alt={user.name ?? user.email} />
          ) : null}
          <AvatarFallback className={cn(AVATAR_GRADIENT, "text-[11px]")}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-medium">
              {user.name || user.email}
            </span>
            {isSelf && (
              <span className="text-[10px] text-muted-foreground/70">
                {selfLabel}
              </span>
            )}
          </div>
          <div className="truncate text-[11px] text-muted-foreground">
            {user.email}
          </div>
        </div>
      </div>

      <div>
        <Badge
          variant="outline"
          className={cn(
            "gap-1 text-[11px]",
            user.role === "ADMIN"
              ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              : "",
          )}
        >
          {user.role === "ADMIN" ? (
            <ShieldCheck className="h-3 w-3" />
          ) : (
            <Shield className="h-3 w-3" />
          )}
          {user.role}
        </Badge>
      </div>

      <div>
        <Badge
          variant="outline"
          className={cn(
            "gap-1 text-[11px]",
            user.active
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
          )}
        >
          {user.active
            ? t("admin.users.statusActive")
            : t("admin.users.statusInactive")}
        </Badge>
      </div>

      <div className="flex items-center gap-1 text-xs">
        {verified ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-muted-foreground">
              {t("admin.users.filters.verifiedYes")}
            </span>
          </>
        ) : (
          <>
            <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
            <span className="text-muted-foreground">
              {t("admin.users.filters.verifiedNo")}
            </span>
          </>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        {formatDate(user.createdAt)}
      </div>

      <div className="flex justify-end">
        <DropdownMenu>
          <Button
            render={<DropdownMenuTrigger />}
            variant="ghost"
            size="icon-xs"
            disabled={isSelf}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onPromote} disabled={isSelf}>
              {user.role === "ADMIN" ? (
                <>
                  <Shield className="mr-2 h-3.5 w-3.5" />
                  {t("admin.users.actions.makeUser")}
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                  {t("admin.users.actions.makeAdmin")}
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleActive} disabled={isSelf}>
              {user.active ? (
                <>
                  <Circle className="mr-2 h-3.5 w-3.5" />
                  {t("admin.users.actions.deactivate")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                  {t("admin.users.actions.activate")}
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              disabled={isSelf}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              {t("admin.users.actions.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
      {expanded && (
        <SessionsPanel userId={user.id} userEmail={user.email} />
      )}
    </div>
  );
}

function SessionsPanel({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail: string;
}) {
  const { t } = useAppStore();
  const { data, isLoading } = useUserSessions(userId);
  const revoke = useRevokeSession();
  const revokeAll = useRevokeAllSessions();
  const [revokeAllOpen, setRevokeAllOpen] = useState(false);

  const sessions = data?.data ?? [];

  return (
    <div className="bg-muted/20 px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground">
          <Monitor className="h-3.5 w-3.5" />
          {t("admin.sessions.title")}
        </div>
        {sessions.length > 0 && (
          <Button
            variant="outline"
            size="xs"
            onClick={() => setRevokeAllOpen(true)}
            disabled={revokeAll.isPending}
          >
            {t("admin.sessions.revokeAll")}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-16 items-center justify-center">
          <Spinner className="h-4 w-4" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-2 text-center text-xs text-muted-foreground">
          {t("admin.sessions.noSessions")}
        </div>
      ) : (
        <div className="space-y-1">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-md border bg-card px-3 py-1.5 text-xs"
            >
              <div className="flex flex-col text-[11px]">
                <span className="text-muted-foreground">
                  {t("admin.sessions.created", {
                    date: formatDateTime(s.createdAt),
                  })}
                </span>
                <span className="text-muted-foreground/70">
                  {t("admin.sessions.expires", {
                    date: formatDateTime(s.expiresAt),
                  })}
                </span>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() =>
                  revoke.mutate({ userId, tokenId: s.id })
                }
                disabled={revoke.isPending}
                className="text-muted-foreground hover:text-destructive"
              >
                {t("admin.sessions.revoke")}
              </Button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={revokeAllOpen}
        onOpenChange={setRevokeAllOpen}
        title={t("admin.sessions.revokeAll")}
        description={t("admin.sessions.revokeAllConfirm", { email: userEmail })}
        confirmLabel={t("admin.sessions.revokeAll")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        loading={revokeAll.isPending}
        onConfirm={() =>
          new Promise<void>((resolve, reject) =>
            revokeAll.mutate(userId, {
              onSuccess: () => resolve(),
              onError: (err) => reject(err),
            }),
          )
        }
      />
    </div>
  );
}
