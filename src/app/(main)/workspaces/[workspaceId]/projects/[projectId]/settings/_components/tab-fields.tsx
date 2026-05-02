"use client";

import { CustomFieldsManager } from "@/features/custom-fields";

export function TabFields({ projectId }: { projectId: string }) {
  return <CustomFieldsManager projectId={projectId} />;
}
