"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  X,
  Trash2,
  MoreHorizontal,
  MessageSquare,
  History,
  Pencil,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { TYPE_CONFIG } from "@/lib/constants/issue-config";
import { useIssue, useUpdateIssue, useDeleteIssue, useProject, useComments } from "../hooks";
import { useWorkspace } from "@/features/workspaces/hooks";
import { useCurrentUser } from "@/features/auth/hooks";
import { useAppStore } from "@/lib/stores/use-app-store";
import { IssueDetailSidebar } from "./issue-detail-sidebar";
import { IssueComments } from "./issue-comments";
import { SubtaskList } from "./subtask-list";
import { AttachmentSection } from "./attachment-section";
import { ActivityFeed } from "./activity-feed";
import { RichEditor, RichContent } from "@/components/shared/rich-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  issueKey: string;
  /** When in modal mode, show expand button + close button */
  modal?: boolean;
  onClose?: () => void;
};

export function IssueDetailContent({ issueKey, modal, onClose }: Props) {
  const router = useRouter();
  const { t } = useAppStore();
  const { user } = useCurrentUser();
  const { data: issue, isLoading } = useIssue(issueKey);
  const { data: project } = useProject(issue?.projectId ?? "");
  const { data: workspace } = useWorkspace(project?.workspaceId ?? "");
  const { data: comments } = useComments(issue?.id ?? "");
  const { mutate: updateIssue } = useUpdateIssue();
  const { mutate: deleteIssue } = useDeleteIssue(issue?.projectId ?? "");

  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(modal ? 280 : 320);

  function saveSummary() {
    if (issue && summaryDraft.trim() && summaryDraft.trim() !== issue.summary) {
      updateIssue({ id: issue.id, summary: summaryDraft.trim() });
    }
    setEditingSummary(false);
  }

  function saveDesc() {
    const newDesc = descDraft.trim() || null;
    if (issue && newDesc !== (issue.description ?? null)) {
      updateIssue({ id: issue.id, description: newDesc });
    }
    setEditingDesc(false);
  }

  function handleUpdate(field: string, value: string | null) {
    if (!issue) return;
    const current = (issue as Record<string, unknown>)[field];
    const currentStr = current != null ? String(current) : null;
    if (value === currentStr) return; // No change — skip API call
    let parsed: unknown = value;
    if (field === "storyPoints") parsed = value ? parseInt(value) : null;
    updateIssue({ id: issue.id, [field]: parsed });
  }

  function handleExpand() {
    onClose?.();
    router.push(ROUTES.ISSUE(issueKey));
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-4 h-6 w-32" />
        <Skeleton className="mb-2 h-8 w-96" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">{t("issue.notFound")}</p>
      </div>
    );
  }

  const typeConf = TYPE_CONFIG[issue.type] ?? TYPE_CONFIG.TASK;
  const TypeIcon = typeConf.icon;

  return (
    <div className="flex h-full flex-col">
      {/* Top bar — full width */}
      <div className="flex shrink-0 items-center justify-between border-b px-5 py-2.5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-[12px]">
          {!modal && workspace && (
            <>
              <Link href={ROUTES.WORKSPACE(workspace.id)} className="text-muted-foreground hover:text-foreground hover:underline">
                {workspace.name}
              </Link>
              <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
            </>
          )}
          {!modal && project && workspace && (
            <>
              <Link href={ROUTES.BOARD(workspace.id, project.id)} className="text-muted-foreground hover:text-foreground hover:underline">
                {project.key}
              </Link>
              <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
            </>
          )}
          {issue.parent && (
            <>
              <Link href={ROUTES.ISSUE(issue.parent.key)} className="text-muted-foreground hover:text-foreground hover:underline">
                {issue.parent.key}
              </Link>
              <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
            </>
          )}
          <div className="flex items-center gap-1.5">
            <div className={`flex h-4.5 w-4.5 items-center justify-center rounded-sm ${typeConf.bg}`}>
              <TypeIcon className="h-2.5 w-2.5 text-white" />
            </div>
            <span className="font-medium text-foreground">{issue.key}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {modal && (
            <>
              <Button variant="ghost" size="icon-xs" onClick={handleExpand} title="Open full page">
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          <DropdownMenu>
            <Button render={<DropdownMenuTrigger />} variant="ghost" size="xs">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => { deleteIssue(issue.id); modal ? onClose?.() : router.back(); }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                {t("issue.deleteIssue")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Body — main + resize + sidebar */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-5">
          {/* Summary — inline edit */}
          {editingSummary ? (
            <div className="mb-5 flex items-center gap-2">
              <Input
                value={summaryDraft}
                onChange={(e) => setSummaryDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveSummary(); if (e.key === "Escape") setEditingSummary(false); }}
                className="text-lg font-semibold"
                autoFocus
              />
              <Button size="xs" onClick={saveSummary}><Check className="h-3.5 w-3.5" /></Button>
              <Button size="xs" variant="ghost" onClick={() => setEditingSummary(false)}><X className="h-3.5 w-3.5" /></Button>
            </div>
          ) : (
            <h1
              className="group/edit mb-5 cursor-pointer rounded-md px-2 py-1 text-lg font-semibold leading-tight transition-colors duration-150 hover:bg-muted/60 dark:hover:bg-muted/30"
              onClick={() => { setEditingSummary(true); setSummaryDraft(issue.summary); }}
            >
              {issue.summary}
              <span className="ml-2 inline-block opacity-0 transition-opacity group-hover/edit:opacity-60">
                <Pencil className="inline h-3.5 w-3.5" />
              </span>
            </h1>
          )}

          {/* Description — inline edit */}
          <div className="mb-6">
            <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("common.description")}
            </h3>
            {editingDesc ? (
              <div className="space-y-2">
                <RichEditor content={descDraft} onChange={setDescDraft} placeholder={t("issue.descPlaceholder")} autoFocus />
                <div className="flex gap-2">
                  <Button size="xs" onClick={saveDesc}>{t("common.save")}</Button>
                  <Button size="xs" variant="ghost" onClick={() => setEditingDesc(false)}>{t("common.cancel")}</Button>
                </div>
              </div>
            ) : (
              <div
                className="group/desc cursor-pointer rounded-md border border-transparent p-3 transition-all duration-150 hover:border-muted-foreground/20 hover:bg-muted/40 dark:hover:bg-muted/20"
                onClick={() => { setEditingDesc(true); setDescDraft(issue.description ?? ""); }}
              >
                {issue.description ? (
                  <RichContent html={issue.description} />
                ) : (
                  <p className="text-sm italic text-muted-foreground/50">{t("issue.clickToAddDesc")}</p>
                )}
                <span className="mt-1 block text-[10px] text-muted-foreground/40 opacity-0 transition-opacity group-hover/desc:opacity-100">
                  <Pencil className="mr-1 inline h-3 w-3" />{t("common.edit")}
                </span>
              </div>
            )}
          </div>

          {/* Attachments */}
          <AttachmentSection issueId={issue.id} currentUserId={user?.id ?? ""} />

          {/* Subtasks */}
          <SubtaskList issue={issue} />

          <Separator className="mb-5" />

          {/* Tabs: Comments / Activity */}
          <Tabs defaultValue="comments">
            <TabsList variant="line" className="mb-4">
              <TabsTrigger value="comments">
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                {t("issue.comments")} {comments?.length ? `(${comments.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="activity">
                <History className="mr-1.5 h-3.5 w-3.5" />
                {t("issue.activity")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments">
              <IssueComments issueId={issue.id} currentUser={{ id: user?.id ?? "", name: user?.name ?? null }} />
            </TabsContent>

            <TabsContent value="activity">
              <ActivityFeed issueId={issue.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Resize handle */}
      <div
        className="group/resize relative w-1.5 shrink-0 cursor-col-resize"
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startWidth = sidebarWidth;
          function onMove(ev: MouseEvent) {
            const delta = startX - ev.clientX;
            setSidebarWidth(Math.max(240, Math.min(500, startWidth + delta)));
          }
          function onUp() {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
          }
          document.addEventListener("mousemove", onMove);
          document.addEventListener("mouseup", onUp);
        }}
      >
        <div className="mx-auto h-full w-px bg-border transition-colors group-hover/resize:w-0.5 group-hover/resize:bg-primary/40 group-active/resize:bg-primary/60" />
      </div>

      {/* Sidebar */}
      <div style={{ width: sidebarWidth }} className="shrink-0">
        <IssueDetailSidebar
          issue={issue}
          members={project?.members ?? []}
          currentUserId={user?.id ?? ""}
          onUpdate={handleUpdate}
        />
      </div>
      </div>
    </div>
  );
}
