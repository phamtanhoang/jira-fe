"use client";

import Link from "next/link";
import { ChevronRight, Settings } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateIssueDialog } from "@/features/projects/components/create-issue-dialog";
import type { Sprint } from "@/features/projects/types";

type BoardHeaderProps = {
  workspaceId: string;
  projectId: string;
  workspaceName: string | undefined;
  projectKey: string | undefined;
  projectName: string | undefined;
  activeSprint: Sprint | undefined;
  sprints: Sprint[];
};

export function BoardHeader({
  workspaceId,
  projectId,
  workspaceName,
  projectKey,
  projectName,
  activeSprint,
  sprints,
}: BoardHeaderProps) {
  const { t } = useAppStore();

  return (
    <div className="flex items-center justify-between border-b px-6 py-3">
      <div>
        <div className="mb-0.5 flex items-center gap-1 text-[12px] text-muted-foreground">
          <Link
            href={ROUTES.WORKSPACES}
            className="hover:text-foreground hover:underline"
          >
            {t("nav.workspaces")}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link
            href={ROUTES.WORKSPACE(workspaceId)}
            className="hover:text-foreground hover:underline"
          >
            {workspaceName ?? "..."}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">
            {projectKey ?? "..."}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold">{projectName ?? "Board"}</h1>
          {activeSprint && (
            <Badge
              variant="secondary"
              className="gap-1 text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              {activeSprint.name}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <CreateIssueDialog projectId={projectId} sprints={sprints} />
        <Link href={ROUTES.PROJECT_SETTINGS(workspaceId, projectId)}>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
