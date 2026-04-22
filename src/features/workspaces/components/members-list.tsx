"use client";

import { useState } from "react";
import type { MessageKey } from "@/lib/config/i18n";
import { MoreHorizontal, Shield, ShieldCheck, Eye, Crown, UserMinus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useUpdateWorkspaceMember, useRemoveWorkspaceMember } from "../hooks";
import type { WorkspaceMember } from "../types";

const ROLE_ICON = {
  OWNER: { icon: Crown, variant: "default" as const },
  ADMIN: { icon: ShieldCheck, variant: "secondary" as const },
  MEMBER: { icon: Shield, variant: "outline" as const },
  VIEWER: { icon: Eye, variant: "outline" as const },
};

function MemberRow({
  member,
  currentUserRole,
  workspaceId,
}: {
  member: WorkspaceMember;
  currentUserRole: WorkspaceMember["role"] | null;
  workspaceId: string;
}) {
  const { t } = useAppStore();
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState(member.role);

  const { mutate: updateMember, isPending: updating } =
    useUpdateWorkspaceMember(workspaceId);
  const { mutate: removeMember, isPending: removing } =
    useRemoveWorkspaceMember(workspaceId);

  const canManage =
    (currentUserRole === "OWNER" || currentUserRole === "ADMIN") &&
    member.role !== "OWNER";

  const roleConfig = ROLE_ICON[member.role];
  const RoleIcon = roleConfig.icon;

  function handleRoleChange() {
    if (newRole === member.role) {
      setShowRoleDialog(false);
      return;
    }
    updateMember(
      { memberId: member.id, data: { role: newRole as "ADMIN" | "MEMBER" | "VIEWER" } },
      { onSuccess: () => setShowRoleDialog(false) },
    );
  }

  function handleRemove() {
    removeMember(member.id, {
      onSuccess: () => setShowRemoveConfirm(false),
    });
  }

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar>
            {member.user.image && <AvatarImage src={member.user.image} />}
            <AvatarFallback>
              {(member.user.name || member.user.email).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {member.user.name || t("workspace.unnamed")}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {member.user.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={roleConfig.variant} className="gap-1">
            <RoleIcon className="h-3 w-3" />
            {t(`workspace.roles.${member.role}` as MessageKey)}
          </Badge>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {new Date(member.joinedAt).toLocaleDateString()}
          </span>

          {canManage && (
            <DropdownMenu>
              <Button
                render={<DropdownMenuTrigger />}
                variant="ghost"
                size="icon-sm"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setNewRole(member.role);
                    setShowRoleDialog(true);
                  }}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {t("workspace.changeRole")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setShowRemoveConfirm(true)}
                >
                  <UserMinus className="mr-2 h-4 w-4" />
                  {t("workspace.removeMember")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Change Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("workspace.changeRole")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("workspace.changeRoleFor")}{" "}
            <span className="font-medium text-foreground">
              {member.user.name || member.user.email}
            </span>
          </p>
          <Select
            value={newRole}
            onValueChange={(v) => v && setNewRole(v as WorkspaceMember["role"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">{t("workspace.roles.ADMIN")}</SelectItem>
              <SelectItem value="MEMBER">{t("workspace.roles.MEMBER")}</SelectItem>
              <SelectItem value="VIEWER">{t("workspace.roles.VIEWER")}</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRoleDialog(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleRoleChange} disabled={updating}>
              {updating ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirm Dialog */}
      <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("workspace.removeMember")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("workspace.removeMemberConfirm", { name: member.user.name || member.user.email })}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRemoveConfirm(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={removing}
            >
              {removing ? t("common.removing") : t("workspace.removeMember")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function MembersList({
  members,
  currentUserId,
  workspaceId,
}: {
  members: WorkspaceMember[];
  currentUserId: string;
  workspaceId: string;
}) {
  const currentMember = members.find((m) => m.userId === currentUserId);
  const currentUserRole = currentMember?.role ?? null;

  // Sort: OWNER first, then ADMIN, then MEMBER, then VIEWER
  const roleOrder = { OWNER: 0, ADMIN: 1, MEMBER: 2, VIEWER: 3 };
  const sorted = [...members].sort(
    (a, b) => roleOrder[a.role] - roleOrder[b.role],
  );

  return (
    <div className="space-y-2">
      {sorted.map((member) => (
        <MemberRow
          key={member.id}
          member={member}
          currentUserRole={currentUserRole}
          workspaceId={workspaceId}
        />
      ))}
    </div>
  );
}
