"use client";

import { useState } from "react";
import type { Workspace } from "@/features/workspaces/types";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Users,
  Kanban,
  LayoutGrid,
  ChevronRight,
  Rocket,
  Settings,
  Trash2,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useCurrentUser } from "@/features/auth/hooks";
import {
  useWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
} from "@/features/workspaces/hooks";
import { useProjects, useCreateProject } from "@/features/projects/hooks";
import { AddMemberDialog } from "@/features/workspaces/components/add-member-dialog";
import { MembersList } from "@/features/workspaces/components/members-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useUrlTab } from "@/lib/hooks/use-url-tab";

const WS_TABS = ["projects", "members", "settings"] as const;
type WsTab = (typeof WS_TABS)[number];
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PROJECT_COLORS = [
  "from-blue-500 to-cyan-500",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-green-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-sky-500 to-indigo-500",
];

export default function WorkspaceDetailPage() {
  const { t } = useAppStore();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user } = useCurrentUser();
  const { data: workspace, isLoading: wsLoading } = useWorkspace(workspaceId);
  const { data: projects, isLoading: projLoading } = useProjects(workspaceId);
  const { mutate: createProject, isPending } = useCreateProject();
  const { mutate: updateWorkspace, isPending: isUpdatingWs } = useUpdateWorkspace();
  const { mutate: deleteWorkspace, isPending: isDeletingWs } = useDeleteWorkspace();

  const [open, setOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [projectType, setProjectType] = useState<"SCRUM" | "KANBAN">("SCRUM");

  const [deleteWsOpen, setDeleteWsOpen] = useState(false);
  const [tab, setTab] = useUrlTab<WsTab>(WS_TABS, "projects");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!projectName.trim() || !projectKey.trim()) return;
    createProject(
      {
        name: projectName.trim(),
        key: projectKey.trim().toUpperCase(),
        workspaceId,
        type: projectType,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setProjectName("");
          setProjectKey("");
        },
      },
    );
  }

  function handleNameChange(val: string) {
    setProjectName(val);
    if (!projectKey || projectKey === projectName.trim().slice(0, 4).toUpperCase()) {
      setProjectKey(val.trim().slice(0, 4).toUpperCase().replace(/[^A-Z]/g, ""));
    }
  }

  if (wsLoading) {
    return (
      <div className="mx-auto max-w-5xl px-8 py-8">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="mb-8 h-4 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const currentUserRole = workspace?.members?.find(
    (m) => m.userId === user?.id,
  )?.role;
  const canManageMembers =
    currentUserRole === "OWNER" || currentUserRole === "ADMIN";
  const canEditWorkspace = canManageMembers;
  const canDeleteWorkspace = currentUserRole === "OWNER";

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-1 flex items-center gap-1 text-[12px] text-muted-foreground">
        <Link href={ROUTES.WORKSPACES} className="hover:text-foreground hover:underline">
          {t("nav.workspaces")}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">{workspace?.name}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{workspace?.name}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {workspace?.description || t("workspace.manageDesc")}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => v && setTab(v as WsTab)}>
        <div className="mb-6 flex items-center justify-between">
          <TabsList variant="line">
            <TabsTrigger value="projects">
              <LayoutGrid className="mr-1.5 h-4 w-4" />
              {t("workspace.projects")}
              {projects?.length ? (
                <Badge variant="secondary" className="ml-1.5 px-1.5 text-[10px]">
                  {projects.length}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="mr-1.5 h-4 w-4" />
              {t("workspace.members")}
              {workspace?.members?.length ? (
                <Badge variant="secondary" className="ml-1.5 px-1.5 text-[10px]">
                  {workspace.members.length}
                </Badge>
              ) : null}
            </TabsTrigger>
            {canEditWorkspace && (
              <TabsTrigger value="settings">
                <Settings className="mr-1.5 h-4 w-4" />
                {t("workspace.settings")}
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <div className="mb-5 flex justify-end">
            <Dialog open={open} onOpenChange={setOpen}>
              <Button render={<DialogTrigger />} size="sm">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {t("project.newProject")}
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("project.createProject")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium">{t("common.name")}</label>
                    <Input
                      placeholder={t("project.namePlaceholder")}
                      value={projectName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium">{t("project.key")}</label>
                    <Input
                      placeholder={t("project.keyPlaceholder")}
                      value={projectKey}
                      onChange={(e) =>
                        setProjectKey(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5))
                      }
                      maxLength={5}
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t("project.keyHint", { key: projectKey || "KEY" })}
                    </p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium">{t("common.type")}</label>
                    <Select value={projectType} onValueChange={(v) => v && setProjectType(v as "SCRUM" | "KANBAN")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SCRUM">
                          <span className="flex items-center gap-2"><Kanban className="h-3.5 w-3.5" /> {t("project.scrum")}</span>
                        </SelectItem>
                        <SelectItem value="KANBAN">
                          <span className="flex items-center gap-2"><LayoutGrid className="h-3.5 w-3.5" /> {t("project.kanban")}</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isPending || !projectName.trim() || projectKey.length < 2}
                  >
                    {isPending ? t("common.creating") : t("project.createProject")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {projLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : !projects?.length ? (
            <div className="rounded-xl border border-dashed border-muted-foreground/20 bg-muted/30 py-16 text-center">
              <Rocket className="mx-auto mb-4 h-10 w-10 text-muted-foreground/25" />
              <p className="mb-1 text-sm font-semibold">{t("project.noProjects")}</p>
              <p className="mb-5 text-[13px] text-muted-foreground">
                {t("project.noProjectsDesc")}
              </p>
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {t("project.createProject")}
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((proj, i) => (
                <Link
                  key={proj.id}
                  href={ROUTES.BOARD(workspaceId, proj.id)}
                >
                  <div className="group overflow-hidden rounded-xl border bg-card transition-all hover:border-primary/20 hover:shadow-md">
                    {/* Gradient top */}
                    <div className={`h-1 bg-linear-to-r ${PROJECT_COLORS[i % PROJECT_COLORS.length]}`} />

                    <div className="p-4">
                      <div className="mb-3 flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br ${PROJECT_COLORS[i % PROJECT_COLORS.length]} text-[11px] font-bold text-white shadow-sm`}>
                          {proj.key}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-[14px] font-semibold group-hover:text-primary">
                            {proj.name}
                          </h3>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px]">
                              {proj.type === "SCRUM" ? (
                                <><Kanban className="h-2.5 w-2.5" /> Scrum</>
                              ) : (
                                <><LayoutGrid className="h-2.5 w-2.5" /> Kanban</>
                              )}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {proj.description && (
                        <p className="mb-3 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                          {proj.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between border-t pt-3 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {proj._count?.members ?? 0}
                          </span>
                          {proj.lead && (
                            <span className="truncate">
                              Lead: {proj.lead.name || "—"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-[13px] text-muted-foreground">
              {t("workspace.manageMembers")}
            </p>
            {canManageMembers && <AddMemberDialog workspaceId={workspaceId} />}
          </div>

          {workspace?.members ? (
            <MembersList
              members={workspace.members}
              currentUserId={user?.id ?? ""}
              workspaceId={workspaceId}
            />
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        {canEditWorkspace && workspace && (
          <TabsContent value="settings">
            <WorkspaceSettingsForm
              key={workspace.id}
              workspace={workspace}
              isUpdating={isUpdatingWs}
              isDeleting={isDeletingWs}
              canDelete={canDeleteWorkspace}
              onSave={(data) => updateWorkspace({ id: workspaceId, data })}
              onDeleteClick={() => setDeleteWsOpen(true)}
            />
          </TabsContent>
        )}
      </Tabs>

      <ConfirmDialog
        open={deleteWsOpen}
        onOpenChange={setDeleteWsOpen}
        title={t("workspace.deleteWorkspace")}
        description={t("workspace.deleteConfirm")}
        confirmLabel={t("workspace.deleteWorkspace")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        loading={isDeletingWs}
        onConfirm={() => deleteWorkspace(workspaceId)}
      />
    </div>
  );
}

function WorkspaceSettingsForm({
  workspace,
  isUpdating,
  isDeleting,
  canDelete,
  onSave,
  onDeleteClick,
}: {
  workspace: Workspace;
  isUpdating: boolean;
  isDeleting: boolean;
  canDelete: boolean;
  onSave: (data: { name: string; description?: string }) => void;
  onDeleteClick: () => void;
}) {
  const { t } = useAppStore();
  // Remounted via parent `key={workspace.id}` whenever the workspace changes,
  // so `useState` initial values seed from props and we don't need the
  // setState-in-effect pattern the React compiler forbids.
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description ?? "");

  const dirty =
    name !== workspace.name || description !== (workspace.description ?? "");

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6">
        <h3 className="mb-4 text-[14px] font-semibold">
          {t("workspace.general")}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium">
              {t("common.name")}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("workspace.namePlaceholder")}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium">
              {t("common.description")}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="text-[13px]"
            />
          </div>
        </div>
        <Separator className="my-5" />
        <Button
          onClick={() =>
            onSave({
              name: name.trim(),
              description: description.trim() || undefined,
            })
          }
          disabled={isUpdating || !name.trim() || !dirty}
        >
          {isUpdating ? t("common.loading") : t("common.save")}
        </Button>
      </div>

      {canDelete && (
        <div className="rounded-lg border border-destructive/20 p-6">
          <h3 className="mb-2 text-[14px] font-semibold text-destructive">
            {t("workspace.deleteWorkspace")}
          </h3>
          <p className="mb-4 text-[12px] text-muted-foreground">
            {t("workspace.deleteConfirm")}
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteClick}
            disabled={isDeleting}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            {t("workspace.deleteWorkspace")}
          </Button>
        </div>
      )}
    </div>
  );
}
