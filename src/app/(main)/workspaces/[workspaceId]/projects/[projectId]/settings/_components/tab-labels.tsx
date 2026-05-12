"use client";

import { LabelsManager } from "@/features/projects/components/labels-manager";

export function TabLabels({ projectId }: { projectId: string }) {
  return <LabelsManager projectId={projectId} />;
}
