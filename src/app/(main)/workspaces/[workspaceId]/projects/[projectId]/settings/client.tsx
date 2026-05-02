"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Settings,
  Users,
  FileText,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useUrlTab } from "@/lib/hooks/use-url-tab";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useCurrentUser } from "@/features/auth/hooks";
import { useWorkspace } from "@/features/workspaces/hooks";
import { useProject } from "@/features/projects/hooks";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const TabGeneral = dynamic(
  () => import("./_components/tab-general").then((m) => m.TabGeneral),
  { loading: () => <Skeleton className="h-64 w-full" /> },
);

const TabMembers = dynamic(
  () => import("./_components/tab-members").then((m) => m.TabMembers),
  { loading: () => <Skeleton className="h-64 w-full" /> },
);

const TabTemplates = dynamic(
  () => import("./_components/tab-templates").then((m) => m.TabTemplates),
  { loading: () => <Skeleton className="h-64 w-full" /> },
);

const TabFields = dynamic(
  () => import("./_components/tab-fields").then((m) => m.TabFields),
  { loading: () => <Skeleton className="h-64 w-full" /> },
);

const TabColumns = dynamic(
  () => import("./_components/tab-columns").then((m) => m.TabColumns),
  { loading: () => <Skeleton className="h-64 w-full" /> },
);

const TabRecurring = dynamic(
  () => import("./_components/tab-recurring").then((m) => m.TabRecurring),
  { loading: () => <Skeleton className="h-64 w-full" /> },
);

const PROJECT_SETTINGS_TABS = [
  "general",
  "members",
  "templates",
  "fields",
  "columns",
  "recurring",
] as const;
type ProjectSettingsTab = (typeof PROJECT_SETTINGS_TABS)[number];

export default function ProjectSettingsPage() {
  const { workspaceId, projectId } = useParams<{
    workspaceId: string;
    projectId: string;
  }>();
  const { t } = useAppStore();
  const { user } = useCurrentUser();
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: project, isLoading } = useProject(projectId);
  const members = project?.members;

  const [tab, setTab] = useUrlTab<ProjectSettingsTab>(
    PROJECT_SETTINGS_TABS,
    "general",
  );

  // Role of the current user inside this project. Workspace OWNER/ADMIN are
  // treated as managers of all projects they oversee, even when they don't
  // have an explicit ProjectMember row.
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
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Settings className="h-6 w-6" />
          {t("project.settings")}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{project?.name}</p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => v && setTab(v as ProjectSettingsTab)}
      >
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
          <TabsTrigger value="templates">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            {t("templates.tab")}
          </TabsTrigger>
          <TabsTrigger value="fields">
            <Settings className="mr-1.5 h-3.5 w-3.5" />
            {t("customFields.tab")}
          </TabsTrigger>
          <TabsTrigger value="columns">
            <Settings className="mr-1.5 h-3.5 w-3.5" />
            {t("project.columns.tab")}
          </TabsTrigger>
          <TabsTrigger value="recurring">
            <Settings className="mr-1.5 h-3.5 w-3.5" />
            {t("recurring.tab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <TabGeneral projectId={projectId} workspaceId={workspaceId} />
        </TabsContent>

        <TabsContent value="members">
          <TabMembers projectId={projectId} workspaceId={workspaceId} />
        </TabsContent>

        <TabsContent value="templates">
          <TabTemplates projectId={projectId} canManage={canManage} />
        </TabsContent>

        <TabsContent value="fields">
          <TabFields projectId={projectId} />
        </TabsContent>

        <TabsContent value="columns">
          <TabColumns projectId={projectId} canManage={canManage} />
        </TabsContent>

        <TabsContent value="recurring">
          <TabRecurring projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
