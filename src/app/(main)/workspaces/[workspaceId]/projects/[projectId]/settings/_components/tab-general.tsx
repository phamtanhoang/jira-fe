"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useCurrentUser } from "@/features/auth/hooks";
import { useWorkspace } from "@/features/workspaces/hooks";
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
} from "@/features/projects/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TabGeneral({
  projectId,
  workspaceId,
}: {
  projectId: string;
  workspaceId: string;
}) {
  const router = useRouter();
  const { t } = useAppStore();
  const { user } = useCurrentUser();
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: project } = useProject(projectId);
  const members = project?.members;
  const { mutate: updateProject, isPending: isUpdating } = useUpdateProject();
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [initialized, setInitialized] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
  const canDelete = isWorkspaceManager || myProjectRole === "LEAD";

  // Initialize form values when project loads
  if (project && !initialized) {
    setName(project.name);
    setDescription(project.description ?? "");
    setVisibility(project.visibility);
    setInitialized(true);
  }

  const leadMember = members?.find((m) => m.userId === project?.leadId);

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
    deleteProject(projectId, {
      onSuccess: () => router.push(ROUTES.WORKSPACE(workspaceId)),
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium">{t("common.name")}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("project.namePlaceholder")}
              disabled={!canManage}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium">{t("common.description")}</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="text-[13px]"
              disabled={!canManage}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium">{t("project.visibility")}</label>
            <Select
              value={visibility}
              onValueChange={(v) => v && setVisibility(v as "PUBLIC" | "PRIVATE")}
              disabled={!canManage}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">{t("project.public")}</SelectItem>
                <SelectItem value="PRIVATE">{t("project.private")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium">
              {t("project.lead", { name: "" }).replace(": ", "")}
            </label>
            <Select
              value={project?.leadId ?? ""}
              onValueChange={(v) =>
                v && updateProject({ id: projectId, leadId: v })
              }
              disabled={!canManage}
            >
              <SelectTrigger className="w-64">
                <span className="flex min-w-0 items-center gap-2 truncate">
                  {leadMember ? (
                    <>
                      <UserAvatar
                        user={leadMember.user}
                        className="h-5 w-5"
                        fallbackClassName="text-[9px]"
                      />
                      <span className="truncate">
                        {leadMember.user.name || leadMember.user.email}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </span>
              </SelectTrigger>
              <SelectContent>
                {members?.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    <span className="flex items-center gap-2">
                      <UserAvatar
                        user={m.user}
                        className="h-5 w-5"
                        fallbackClassName="text-[9px]"
                      />
                      {m.user.name || m.user.email}
                    </span>
                  </SelectItem>
                ))}
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
        <Button
          onClick={handleSave}
          disabled={isUpdating || !name.trim() || !canManage}
        >
          {isUpdating ? t("common.loading") : t("common.save")}
        </Button>
        {!canManage && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            {t("project.readOnlyNotice")}
          </p>
        )}
      </div>

      {/* Danger zone */}
      {canDelete && (
        <div className="rounded-lg border border-destructive/20 p-6">
          <h3 className="mb-2 text-[14px] font-semibold text-destructive">
            {t("project.deleteProject")}
          </h3>
          <p className="mb-4 text-[12px] text-muted-foreground">
            {t("project.deleteConfirm")}
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            disabled={isDeleting}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            {t("project.deleteProject")}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("project.deleteProject")}
        description={t("project.deleteConfirm")}
        confirmLabel={t("project.deleteProject")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
