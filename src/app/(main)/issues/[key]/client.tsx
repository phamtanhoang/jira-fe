"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  X,
  Trash2,
  MoreHorizontal,
  MessageSquare,
  History,
  Pencil,
  ChevronRight,
} from "lucide-react";
import { TYPE_CONFIG } from "@/lib/constants/issue-config";
import { useIssue, useUpdateIssue, useDeleteIssue, useProject, useComments } from "@/features/projects/hooks";
import { useCurrentUser } from "@/features/auth/hooks";
import { useAppStore } from "@/lib/stores/use-app-store";
import { IssueDetailSidebar } from "@/features/projects/components/issue-detail-sidebar";
import { IssueComments } from "@/features/projects/components/issue-comments";
import { SubtaskList } from "@/features/projects/components/subtask-list";
import { AttachmentSection } from "@/features/projects/components/attachment-section";
import { ActivityFeed } from "@/features/projects/components/activity-feed";
import { RichEditor, RichContent } from "@/components/shared/rich-editor";
import { Badge } from "@/components/ui/badge";
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

export default function IssueDetailPage() {
  const { key } = useParams<{ key: string }>();
  const router = useRouter();
  const { t } = useAppStore();
  const { user } = useCurrentUser();
  const { data: issue, isLoading } = useIssue(key);
  const { data: project } = useProject(issue?.projectId ?? "");
  const { data: comments } = useComments(issue?.id ?? "");
  const { mutate: updateIssue } = useUpdateIssue();
  const { mutate: deleteIssue } = useDeleteIssue(issue?.projectId ?? "");

  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(320);

  function saveSummary() {
    if (issue && summaryDraft.trim() && summaryDraft.trim() !== issue.summary) {
      updateIssue({ id: issue.id, summary: summaryDraft.trim() });
    }
    setEditingSummary(false);
  }

  function saveDesc() {
    if (issue) updateIssue({ id: issue.id, description: descDraft.trim() || null });
    setEditingDesc(false);
  }

  function handleUpdate(field: string, value: string | null) {
    if (!issue) return;
    let parsed: unknown = value;
    if (field === "storyPoints") parsed = value ? parseInt(value) : null;
    updateIssue({ id: issue.id, [field]: parsed });
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
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{t("issue.notFound")}</p>
      </div>
    );
  }

  const typeConf = TYPE_CONFIG[issue.type] ?? TYPE_CONFIG.TASK;
  const TypeIcon = typeConf.icon;

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b px-6 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="xs" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1.5">
              {/* Parent breadcrumb for subtasks */}
              {issue.parent && (
                <>
                  <button
                    onClick={() => router.push(`/issues/${issue.parent!.key}`)}
                    className="text-[12px] text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {issue.parent.key}
                  </button>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                </>
              )}
              <div className={`flex h-5 w-5 items-center justify-center rounded-sm ${typeConf.bg}`}>
                <TypeIcon className="h-3 w-3 text-white" />
              </div>
              <span className="text-[13px] font-medium text-muted-foreground">{issue.key}</span>
            </div>
          </div>
          <DropdownMenu>
            <Button render={<DropdownMenuTrigger />} variant="ghost" size="xs">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => { deleteIssue(issue.id); router.back(); }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                {t("issue.deleteIssue")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="px-8 py-6">
          {/* Summary — inline edit */}
          {editingSummary ? (
            <div className="mb-6 flex items-center gap-2">
              <Input
                value={summaryDraft}
                onChange={(e) => setSummaryDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveSummary(); if (e.key === "Escape") setEditingSummary(false); }}
                className="text-xl font-semibold"
                autoFocus
              />
              <Button size="xs" onClick={saveSummary}><Check className="h-3.5 w-3.5" /></Button>
              <Button size="xs" variant="ghost" onClick={() => setEditingSummary(false)}><X className="h-3.5 w-3.5" /></Button>
            </div>
          ) : (
            <h1
              className="group/edit mb-6 cursor-pointer rounded-md px-2 py-1 text-xl font-semibold leading-tight transition-colors duration-150 hover:bg-muted/60 dark:hover:bg-muted/30"
              onClick={() => { setEditingSummary(true); setSummaryDraft(issue.summary); }}
            >
              {issue.summary}
              <span className="ml-2 inline-block opacity-0 transition-opacity group-hover/edit:opacity-60">
                <Pencil className="inline h-3.5 w-3.5" />
              </span>
            </h1>
          )}

          {/* Description — inline edit */}
          <div className="mb-8">
            <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("common.description")}
            </h3>
            {editingDesc ? (
              <div className="space-y-2">
                <RichEditor
                  content={descDraft}
                  onChange={setDescDraft}
                  placeholder={t("issue.descPlaceholder")}
                  autoFocus
                />
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

          <Separator className="mb-6" />

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
        className="w-1 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-primary/20 active:bg-primary/30"
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startWidth = sidebarWidth;
          function onMove(ev: MouseEvent) {
            const delta = startX - ev.clientX;
            setSidebarWidth(Math.max(260, Math.min(500, startWidth + delta)));
          }
          function onUp() {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
          }
          document.addEventListener("mousemove", onMove);
          document.addEventListener("mouseup", onUp);
        }}
      />

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
  );
}
