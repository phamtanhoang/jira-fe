"use client";

import { ProjectColumnsManager } from "@/features/projects/components/project-columns-manager";

export function TabColumns({
  projectId,
  canManage,
}: {
  projectId: string;
  canManage: boolean;
}) {
  return <ProjectColumnsManager projectId={projectId} canManage={canManage} />;
}
