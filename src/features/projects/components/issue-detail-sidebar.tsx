"use client";

import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { IssueWatchersBlock } from "./issue-watchers-block";
import { WorklogSection } from "./worklog-section";
import { IssueLinksSection } from "./issue-links-section";
import { IssueDetailFields } from "./issue-detail-fields";
import type { Issue, ProjectMember } from "../types";

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 py-1.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        <span className="uppercase tracking-wide">{title}</span>
      </button>
      {open && <div className="mt-1 space-y-3 pl-1">{children}</div>}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────

export function IssueDetailSidebar({
  issue,
  members,
  currentUserId,
  onUpdate,
}: {
  issue: Issue;
  members: ProjectMember[];
  currentUserId: string;
  onUpdate: (field: string, value: string | null) => void;
}) {
  const { t } = useAppStore();

  return (
    <div className="h-full w-full overflow-auto border-l bg-muted/20 p-5">
      <div className="space-y-5">
        <IssueDetailFields
          issue={issue}
          members={members}
          currentUserId={currentUserId}
          onUpdate={onUpdate}
        />

        <Separator />

        <IssueLinksSection issue={issue} />

        <Separator />

        <IssueWatchersBlock issueId={issue.id} />

        <Separator />

        <CollapsibleSection title={t("worklog.title")}>
          <WorklogSection issueId={issue.id} currentUserId={currentUserId} />
        </CollapsibleSection>

        <Separator />

        {/* Meta */}
        <div className="space-y-1.5 px-2 text-[11px] text-muted-foreground">
          <p>{t("issue.created", { date: formatDate(issue.createdAt) })}</p>
          <p>{t("issue.updated", { date: formatDate(issue.updatedAt) })}</p>
        </div>
      </div>
    </div>
  );
}
