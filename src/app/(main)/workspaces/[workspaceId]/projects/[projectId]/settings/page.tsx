"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Settings,
  Users,
  Trash2,
  UserPlus,
  Shield,
  X,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useCurrentUser } from "@/features/auth/hooks";
import { useWorkspace } from "@/features/workspaces/hooks";
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
  useProjectMembers,
  useAddProjectMember,
  useUpdateProjectMember,
  useRemoveProjectMember,
} from "@/features/projects/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { getInitials } from "@/lib/utils";
import type { ProjectMember } from "@/features/projects/types";

const ROLE_COLORS: Record<string, string> = {
  LEAD: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
  DEVELOPER: "bg-green-100 text-green-700",
  VIEWER: "bg-gray-100 text-gray-600",
};

export default function ProjectSettingsPage() {
  const { workspaceId, projectId } = useParams<{
    workspaceId: string;
    projectId: string;
  }>();
  const router = useRouter();
  const { t } = useAppStore();
  const { user } = useCurrentUser();
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: project, isLoading } = useProject(projectId);
  const { data: members } = useProjectMembers(projectId);
  const { mutate: updateProject, isPending: isUpdating } = useUpdateProject();
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject();
  const { mutate: addMember, isPending: isAddingMember } = useAddProjectMember(projectId);
  const { mutate: updateMember } = useUpdateProjectMember(projectId);
  const { mutate: removeMember } = useRemoveProjectMember(projectId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [initialized, setInitialized] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"ADMIN" | "DEVELOPER" | "VIEWER">("DEVELOPER");

  // Initialize form values when project loads
  if (project && !initialized) {
    setName(project.name);
    setDescription(project.description ?? "");
    setVisibility(project.visibility);
    setInitialized(true);
  }

  function handleSave() {
    if (!name.trim()) return;
    updateProject({
      id: projectId,
      name: name.trim(),
      description: description.trim() || undefined,
      visibility,
    });
  }

  function handleDelete() {
    if (!window.confirm(t("project.deleteConfirm"))) return;
    deleteProject(projectId, {
      onSuccess: () => router.push(ROUTES.WORKSPACE(workspaceId)),
    });
  }

  function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    addMember(
      { email: memberEmail.trim(), role: memberRole },
      {
        onSuccess: () => {
          setAddOpen(false);
          setMemberEmail("");
        },
      },
    );
  }

  function handleChangeRole(member: ProjectMember, role: "ADMIN" | "DEVELOPER" | "VIEWER") {
    updateMember({ memberId: member.id, role });
  }

  function handleRemoveMember(member: ProjectMember) {
    if (!window.confirm(t("project.removeMemberConfirm"))) return;
    removeMember(member.id);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-8">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="mb-8 h-4 w-72" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-1 flex items-center gap-1 text-[12px] text-muted-foreground">
        <Link href={ROUTES.WORKSPACES} className="hover:text-foreground hover:underline">{t("nav.workspaces")}</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={ROUTES.WORKSPACE(workspaceId)} className="hover:text-foreground hover:underline">{workspace?.name ?? "..."}</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={ROUTES.BOARD(workspaceId, projectId)} className="hover:text-foreground hover:underline">{project?.key ?? "..."}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">{t("project.settings")}</span>
      </div>

      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Settings className="h-6 w-6" />
          {t("project.settings")}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{project?.name}</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList variant="line" className="mb-6">
          <TabsTrigger value="general">
            <Settings className="mr-1.5 h-3.5 w-3.5" />
            {t("project.general")}
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="mr-1.5 h-3.5 w-3.5" />
            {t("project.members")}
            {members?.length ? (
              <Badge variant="secondary" className="ml-1.5 px-1.5 text-[10px]">{members.length}</Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <div className="space-y-6">
            <div className="rounded-lg border p-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium">{t("common.name")}</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("project.namePlaceholder")}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium">{t("common.description")}</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="text-[13px]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium">{t("project.visibility")}</label>
                  <Select value={visibility} onValueChange={(v) => v && setVisibility(v as "PUBLIC" | "PRIVATE")}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">{t("project.public")}</SelectItem>
                      <SelectItem value="PRIVATE">{t("project.private")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <div className="text-[12px] text-muted-foreground">
                    <span className="font-medium">{t("project.key")}:</span> {project?.key}
                    {" · "}
                    <span className="font-medium">{t("common.type")}:</span> {project?.type}
                  </div>
                </div>
              </div>
              <Separator className="my-5" />
              <Button onClick={handleSave} disabled={isUpdating || !name.trim()}>
                {isUpdating ? t("common.loading") : t("common.save")}
              </Button>
            </div>

            {/* Danger zone */}
            <div className="rounded-lg border border-destructive/20 p-6">
              <h3 className="mb-2 text-[14px] font-semibold text-destructive">{t("project.deleteProject")}</h3>
              <p className="mb-4 text-[12px] text-muted-foreground">
                {t("project.deleteConfirm")}
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                {t("project.deleteProject")}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-muted-foreground">
                {t("project.members")} ({members?.length ?? 0})
              </p>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <Button render={<DialogTrigger />} size="sm">
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  {t("project.addMember")}
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("project.addMember")}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddMember} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-[13px] font-medium">Email</label>
                      <Input
                        type="email"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        placeholder="user@example.com"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[13px] font-medium">{t("project.changeRole")}</label>
                      <Select value={memberRole} onValueChange={(v) => v && setMemberRole(v as typeof memberRole)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="DEVELOPER">Developer</SelectItem>
                          <SelectItem value="VIEWER">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full" disabled={isAddingMember || !memberEmail.trim()}>
                      {isAddingMember ? t("common.loading") : t("project.addMember")}
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
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-linear-to-br from-teal-400 to-cyan-500 text-[11px] font-bold text-white">
                      {getInitials(member.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{member.user.name}</p>
                    <p className="text-[11px] text-muted-foreground">{member.user.email}</p>
                  </div>

                  <Badge variant="secondary" className={`text-[10px] ${ROLE_COLORS[member.role] ?? ""}`}>
                    <Shield className="mr-1 h-3 w-3" />
                    {member.role}
                  </Badge>

                  {member.role !== "LEAD" && member.userId !== user?.id && (
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
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="DEVELOPER">Developer</SelectItem>
                          <SelectItem value="VIEWER">Viewer</SelectItem>
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
