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
  Plus,
  Layers,
  Pencil,
} from "lucide-react";
import { TYPE_CONFIG, STATUS_BADGE_COLORS } from "@/lib/constants/issue-config";
import { useIssue, useUpdateIssue, useDeleteIssue, useCreateIssue, useProject, useComments } from "@/features/projects/hooks";
import { useCurrentUser } from "@/features/auth/hooks";
import { useAppStore } from "@/lib/stores/use-app-store";
import { IssueDetailSidebar } from "@/features/projects/components/issue-detail-sidebar";
import { IssueComments } from "@/features/projects/components/issue-comments";
import { ActivityFeed } from "@/features/projects/components/activity-feed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const { mutate: createIssue } = useCreateIssue();

  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [subtaskSummary, setSubtaskSummary] = useState("");

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
    if (issue) updateIssue({ id: issue.id, [field]: value });
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
            <div className="flex items-center gap-2">
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
                <Textarea
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  rows={5}
                  className="text-sm"
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
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{issue.description}</p>
                ) : (
                  <p className="text-sm italic text-muted-foreground/50">{t("issue.clickToAddDesc")}</p>
                )}
                <span className="mt-1 block text-[10px] text-muted-foreground/40 opacity-0 transition-opacity group-hover/desc:opacity-100">
                  <Pencil className="mr-1 inline h-3 w-3" />{t("common.edit")}
                </span>
              </div>
            )}
          </div>

          {/* Subtasks */}
          {issue.type !== "SUBTASK" && (
            <div className="mb-8">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Layers className="h-3.5 w-3.5" />
                  {t("issue.subtasks")}
                  {issue._count?.children ? ` (${issue._count.children})` : ""}
                </h3>
                <Button size="xs" variant="ghost" onClick={() => setShowSubtaskForm(!showSubtaskForm)}>
                  <Plus className="mr-1 h-3 w-3" />{t("issue.addSubtask")}
                </Button>
              </div>

              {showSubtaskForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!subtaskSummary.trim()) return;
                    createIssue(
                      { projectId: issue.projectId, summary: subtaskSummary.trim(), type: "SUBTASK", parentId: issue.id },
                      { onSuccess: () => { setSubtaskSummary(""); setShowSubtaskForm(false); } },
                    );
                  }}
                  className="mb-3 flex gap-2"
                >
                  <Input
                    value={subtaskSummary}
                    onChange={(e) => setSubtaskSummary(e.target.value)}
                    placeholder={t("issue.subtaskPlaceholder")}
                    className="h-8 text-[12px]"
                    autoFocus
                  />
                  <Button size="xs" type="submit" disabled={!subtaskSummary.trim()}>{t("common.create")}</Button>
                </form>
              )}

              {issue.children && issue.children.length > 0 && (
                <div className="rounded-lg border">
                  {issue.children.map((child) => {
                    const isDone = child.boardColumn?.category === "DONE";
                    return (
                      <div
                        key={child.id}
                        onClick={() => router.push(`/issues/${child.key}`)}
                        className="flex cursor-pointer items-center gap-3 border-b px-3 py-2 text-[12px] last:border-b-0 hover:bg-muted/50"
                      >
                        <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-sky-400">
                          <Layers className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="font-medium text-muted-foreground">{child.key}</span>
                        <span className={`flex-1 truncate ${isDone ? "line-through text-muted-foreground" : ""}`}>
                          {child.summary}
                        </span>
                        {child.boardColumn && (
                          <Badge variant="secondary" className={`text-[10px] ${STATUS_BADGE_COLORS[child.boardColumn.category] ?? ""}`}>
                            {child.boardColumn.name}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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

      {/* Sidebar */}
      <IssueDetailSidebar
        issue={issue}
        members={project?.members ?? []}
        currentUserId={user?.id ?? ""}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
