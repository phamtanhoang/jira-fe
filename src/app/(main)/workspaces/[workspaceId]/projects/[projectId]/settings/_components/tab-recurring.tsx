"use client";

import { RecurringRulesPanel } from "@/features/recurring-issues";

export function TabRecurring({ projectId }: { projectId: string }) {
  return <RecurringRulesPanel projectId={projectId} />;
}
