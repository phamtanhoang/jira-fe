"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { Workspace, WorkspaceMember } from "@/features/workspaces/types";
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
  BarChart3,
  FolderKanban,
  UserCheck,
  TrendingUp,
  Activity,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { getTileGradient } from "@/lib/utils";
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
import { InviteLinksPanel } from "@/features/invite-links/components/invite-links-panel";
import { WebhooksPanel } from "@/features/webhooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useUrlTab } from "@/lib/hooks/use-url-tab";
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
import { ProjectCard } from "./_components/project-card";

const WS_TABS = ["summary", "projects", "members", "settings"] as const;
type WsTab = (typeof WS_TABS)[number];

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
  const [projectType, setProjectType] = useState<"SCRUM" | "KANBAN">("SCRUM");

  const [deleteWsOpen, setDeleteWsOpen] = useState(false);
  const [tab, setTab] = useUrlTab<WsTab>(WS_TABS, "summary");

  // Project key is BE-generated from the name and auto-suffixed on collision
  // — the user no longer has to invent + maintain a unique 2-5 letter code
  // in the middle of the create dialog.
  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!projectName.trim()) return;
    createProject(
      {
        name: projectName.trim(),
        workspaceId,
        type: projectType,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setProjectName("");
        },
      },
    );
  }

  if (wsLoading) {
    return (
      <div className="px-8 py-8">
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
        <h1 className="text-2xl font-semibold tracking-tight">{workspace?.name}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {workspace?.description || t("workspace.manageDesc")}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => v && setTab(v as WsTab)}>
        <div className="mb-6 flex items-center justify-between">
          <TabsList variant="line">
            <TabsTrigger value="summary">
              <BarChart3 className="mr-1.5 h-4 w-4" />
              {t("workspace.summary")}
            </TabsTrigger>
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

        {/* Summary Tab */}
        <TabsContent value="summary">
          <WorkspaceSummary
            projects={projects ?? []}
            members={workspace?.members ?? []}
            onGoToProjects={() => setTab("projects")}
            onGoToMembers={() => setTab("members")}
            workspaceId={workspaceId}
          />
        </TabsContent>

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
                      onChange={(e) => setProjectName(e.target.value)}
                      autoFocus
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t("project.keyAutoHint")}
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
                    disabled={isPending || !projectName.trim()}
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
              {projects.map((proj) => (
                <ProjectCard
                  key={proj.id}
                  proj={proj}
                  workspaceId={workspaceId}
                  colorClass={getTileGradient(proj.id)}
                />
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

          {canManageMembers && (
            <>
              <Separator className="my-6" />
              <InviteLinksPanel workspaceId={workspaceId} />
            </>
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
            <Separator className="my-6" />
            <WebhooksPanel workspaceId={workspaceId} />
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

function WorkspaceSummary({
  projects,
  members,
  onGoToProjects,
  onGoToMembers,
  workspaceId,
}: {
  projects: Array<{
    id: string;
    name: string;
    key: string;
    type: "SCRUM" | "KANBAN";
    issueCounter?: number;
  }>;
  members: WorkspaceMember[];
  onGoToProjects: () => void;
  onGoToMembers: () => void;
  workspaceId: string;
}) {
  const { t } = useAppStore();
  const membersCount = members.length;
  const scrumCount = projects.filter((p) => p.type === "SCRUM").length;
  const kanbanCount = projects.filter((p) => p.type === "KANBAN").length;

  // Use issueCounter as a proxy for activity — it's the monotonic key
  // sequence (PROJ-1, PROJ-2, …), so a high value means many issues have
  // been created. Cheap, no extra round-trip.
  const mostActive = [...projects]
    .filter((p) => (p.issueCounter ?? 0) > 0)
    .sort((a, b) => (b.issueCounter ?? 0) - (a.issueCounter ?? 0))
    .slice(0, 5);

  const roleBuckets: Array<{
    role: WorkspaceMember["role"];
    label: string;
    count: number;
    tone: string;
  }> = (["OWNER", "ADMIN", "MEMBER", "VIEWER"] as const).map((role) => ({
    role,
    label: t(`workspace.roles.${role}`),
    count: members.filter((m) => m.role === role).length,
    tone:
      role === "OWNER"
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
        : role === "ADMIN"
          ? "bg-primary/15 text-primary"
          : role === "MEMBER"
            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            : "bg-muted text-muted-foreground",
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={onGoToProjects}
          className="flex items-start gap-4 rounded-xl border bg-card p-5 text-left transition-all hover:border-primary/40 hover:shadow-sm"
        >
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-2xl font-semibold tabular-nums">{projects.length}</div>
            <div className="text-[12px] text-muted-foreground">
              {t("workspace.totalProjects")}
            </div>
            {projects.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Kanban className="h-3 w-3" /> {scrumCount} {t("project.scrum")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <LayoutGrid className="h-3 w-3" /> {kanbanCount} {t("project.kanban")}
                </span>
              </div>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={onGoToMembers}
          className="flex items-start gap-4 rounded-xl border bg-card p-5 text-left transition-all hover:border-primary/40 hover:shadow-sm"
        >
          <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
            <UserCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-2xl font-semibold tabular-nums">{membersCount}</div>
            <div className="text-[12px] text-muted-foreground">
              {t("workspace.totalMembers")}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {roleBuckets
                .filter((b) => b.count > 0)
                .map((b) => (
                  <span
                    key={b.role}
                    className={cn(
                      "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
                      b.tone,
                    )}
                  >
                    {b.count} {b.label}
                  </span>
                ))}
            </div>
          </div>
        </button>

        <div className="flex items-start gap-4 rounded-xl border bg-card p-5">
          <div className="rounded-lg bg-violet-500/10 p-2.5 text-violet-600 dark:text-violet-400">
            <Activity className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-2xl font-semibold tabular-nums">
              {projects.reduce((s, p) => s + (p.issueCounter ?? 0), 0)}
            </div>
            <div className="text-[12px] text-muted-foreground">
              {t("workspace.totalIssuesCreated")}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Most active projects (proxy: issueCounter) */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h3 className="flex items-center gap-2 text-[13px] font-semibold">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              {t("workspace.mostActiveProjects")}
            </h3>
            <button
              type="button"
              onClick={onGoToProjects}
              className="text-[11px] text-primary hover:underline"
            >
              {t("common.viewAll")}
            </button>
          </div>
          {mostActive.length === 0 ? (
            <div className="px-5 py-8 text-center text-[12px] text-muted-foreground">
              {t("workspace.noActivityYet")}
            </div>
          ) : (
            <ul className="divide-y">
              {mostActive.map((p, idx) => (
                <li key={p.id}>
                  <Link
                    href={ROUTES.BOARD(workspaceId, p.id)}
                    className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold tabular-nums text-muted-foreground">
                        {idx + 1}
                      </span>
                      <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                        {p.key}
                      </span>
                      <span className="truncate text-[13px] font-medium">
                        {p.name}
                      </span>
                    </div>
                    <span className="ml-3 shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {p.issueCounter ?? 0} {t("workspace.issuesLabel")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent team members — proxy for "most active members" using joinedAt */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h3 className="flex items-center gap-2 text-[13px] font-semibold">
              <UserCheck className="h-4 w-4 text-primary" />
              {t("workspace.recentMembers")}
            </h3>
            <button
              type="button"
              onClick={onGoToMembers}
              className="text-[11px] text-primary hover:underline"
            >
              {t("common.viewAll")}
            </button>
          </div>
          {members.length === 0 ? (
            <div className="px-5 py-8 text-center text-[12px] text-muted-foreground">
              {t("workspace.noMembersYet")}
            </div>
          ) : (
            <ul className="divide-y">
              {[...members]
                .sort(
                  (a, b) =>
                    new Date(b.joinedAt).getTime() -
                    new Date(a.joinedAt).getTime(),
                )
                .slice(0, 5)
                .map((m) => (
                  <li
                    key={m.userId}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <UserAvatar
                        user={m.user}
                        className="h-7 w-7"
                        fallbackClassName="text-[10px]"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium">
                          {m.user.name || m.user.email}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {t(`workspace.roles.${m.role}`)} ·{" "}
                          {new Date(m.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
