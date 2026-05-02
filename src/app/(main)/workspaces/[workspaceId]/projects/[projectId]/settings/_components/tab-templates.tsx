"use client";

import { ProjectTemplates } from "@/features/issue-templates/components/project-templates";

export function TabTemplates({
  projectId,
  canManage,
}: {
  projectId: string;
  canManage: boolean;
}) {
  return <ProjectTemplates projectId={projectId} canManage={canManage} />;
}
