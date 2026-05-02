"use client";

import { useState } from "react";
import { UserPlus, Shield, X } from "lucide-react";
import type { MessageKey } from "@/lib/config/i18n";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useCurrentUser } from "@/features/auth/hooks";
import { useWorkspace } from "@/features/workspaces/hooks";
import {
  useProject,
  useBulkAddProjectMembers,
  useUpdateProjectMember,
  useRemoveProjectMember,
} from "@/features/projects/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ProjectMember } from "@/features/projects/types";

const ROLE_COLORS: Record<string, string> = {
  LEAD: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
  DEVELOPER: "bg-green-100 text-green-700",
  VIEWER: "bg-gray-100 text-gray-600",
};

export function TabMembers({
  projectId,
  workspaceId,
}: {
  projectId: string;
  workspaceId: string;
}) {
  const { t } = useAppStore();
  const { user } = useCurrentUser();
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: project } = useProject(projectId);
  const members = project?.members;
  const { mutate: bulkAddMembers, isPending: isAddingMember } =
    useBulkAddProjectMembers(projectId);
  const { mutate: updateMember } = useUpdateProjectMember(projectId);
  const { mutate: removeMember } = useRemoveProjectMember(projectId);

  const [addOpen, setAddOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [memberRole, setMemberRole] = useState<"ADMIN" | "DEVELOPER" | "VIEWER">("DEVELOPER");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberToRemove, setMemberToRemove] = useState<ProjectMember | null>(null);

  const myProjectRole = members?.find((m) => m.userId === user?.id)?.role;
  const myWorkspaceRole = workspace?.members?.find(
    (m) => m.userId === user?.id,
  )?.role;
  const isWorkspaceManager =
    myWorkspaceRole === "OWNER" || myWorkspaceRole === "ADMIN";
  const canManage =
    isWorkspaceManager ||
    myProjectRole === "LEAD" ||
    myProjectRole === "ADMIN";

  const projectMemberIds = new Set(members?.map((m) => m.userId) ?? []);
  const eligibleWsMembers = (workspace?.members ?? [])
    .filter((m) => !projectMemberIds.has(m.userId))
    .filter((m) => {
      if (!memberSearch.trim()) return true;
      const q = memberSearch.trim().toLowerCase();
      return (
        (m.user.name ?? "").toLowerCase().includes(q) ||
        m.user.email.toLowerCase().includes(q)
      );
    });

  function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (selectedUserIds.length === 0) return;
    bulkAddMembers(
      { userIds: selectedUserIds, role: memberRole },
      {
        onSuccess: () => {
          setAddOpen(false);
          setSelectedUserIds([]);
          setMemberSearch("");
        },
      },
    );
  }

  function handleChangeRole(member: ProjectMember, role: "ADMIN" | "DEVELOPER" | "VIEWER") {
    updateMember({ memberId: member.id, role });
  }

  function handleRemoveMember(member: ProjectMember) {
    setMemberToRemove(member);
  }

  function confirmRemoveMember() {
    if (!memberToRemove) return;
    removeMember(memberToRemove.id, {
      onSettled: () => setMemberToRemove(null),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          {t("project.members")} ({members?.length ?? 0})
        </p>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          {canManage && (
            <Button render={<DialogTrigger />} size="sm">
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              {t("project.addMember")}
            </Button>
          )}
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("project.addMember")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium">
                  {t("project.selectMembers")}
                </label>
                <Input
                  placeholder={t("common.search")}
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  autoFocus
                />
                <div className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-md border p-1">
                  {eligibleWsMembers.length === 0 ? (
                    <p className="px-2 py-4 text-center text-[12px] text-muted-foreground">
                      {t("project.noEligibleMembers")}
                    </p>
                  ) : (
                    eligibleWsMembers.map((m) => {
                      const checked = selectedUserIds.includes(m.userId);
                      return (
                        <label
                          key={m.userId}
                          className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setSelectedUserIds((prev) =>
                                e.target.checked
                                  ? [...prev, m.userId]
                                  : prev.filter((id) => id !== m.userId),
                              );
                            }}
                            className="h-4 w-4 shrink-0 accent-primary"
                          />
                          <UserAvatar
                            user={m.user}
                            className="h-6 w-6"
                            fallbackClassName="text-[10px]"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium">
                              {m.user.name || m.user.email}
                            </span>
                            {m.user.name && (
                              <span className="block truncate text-[11px] text-muted-foreground">
                                {m.user.email}
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
                {selectedUserIds.length > 0 && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {t("project.selectedCount", {
                      count: String(selectedUserIds.length),
                    })}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium">
                  {t("project.changeRole")}
                </label>
                <Select
                  value={memberRole}
                  onValueChange={(v) =>
                    v && setMemberRole(v as typeof memberRole)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">
                      {t("project.roles.ADMIN")}
                    </SelectItem>
                    <SelectItem value="DEVELOPER">
                      {t("project.roles.DEVELOPER")}
                    </SelectItem>
                    <SelectItem value="VIEWER">
                      {t("project.roles.VIEWER")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isAddingMember || selectedUserIds.length === 0}
              >
                {isAddingMember
                  ? t("common.loading")
                  : t("project.addMember")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-1">
        {members?.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 rounded-lg border px-4 py-3"
          >
            <UserAvatar
              user={member.user}
              className="h-8 w-8"
              fallbackClassName="bg-linear-to-br from-teal-400 to-cyan-500 text-[11px] font-bold text-white"
              plain
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{member.user.name}</p>
              <p className="text-[11px] text-muted-foreground">{member.user.email}</p>
            </div>

            <Badge variant="secondary" className={`text-[10px] ${ROLE_COLORS[member.role] ?? ""}`}>
              <Shield className="mr-1 h-3 w-3" />
              {t(`project.roles.${member.role}` as MessageKey)}
            </Badge>

            {canManage && member.role !== "LEAD" && member.userId !== user?.id && (
              <div className="flex items-center gap-1">
                <Select
                  value={member.role}
                  onValueChange={(v) =>
                    v && handleChangeRole(member, v as "ADMIN" | "DEVELOPER" | "VIEWER")
                  }
                >
                  <SelectTrigger className="h-7 w-28 text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">{t("project.roles.ADMIN")}</SelectItem>
                    <SelectItem value="DEVELOPER">{t("project.roles.DEVELOPER")}</SelectItem>
                    <SelectItem value="VIEWER">{t("project.roles.VIEWER")}</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemoveMember(member)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title={t("project.removeMember")}
        description={t("project.removeMemberConfirm")}
        confirmLabel={t("project.removeMember")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        onConfirm={confirmRemoveMember}
      />
    </div>
  );
}
