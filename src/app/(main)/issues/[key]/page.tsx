"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bug,
  BookOpen,
  CheckSquare,
  Layers,
  Zap,
  Send,
  Calendar,
  User,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronsUp,
  ChevronsDown,
  MessageSquare,
  Pencil,
  Check,
  X,
  Trash2,
  MoreHorizontal,
  History,
} from "lucide-react";
import {
  useIssue,
  useComments,
  useAddComment,
  useUpdateComment,
  useDeleteComment,
  useUpdateIssue,
  useDeleteIssue,
  useProject,
} from "@/features/projects/hooks";
import { useCurrentUser } from "@/features/auth/hooks";
import { useAppStore } from "@/lib/stores/use-app-store";
import { ActivityFeed } from "@/features/projects/components/activity-feed";
import { WorklogSection } from "@/features/projects/components/worklog-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TYPE_CONFIG: Record<string, { icon: React.ElementType; bg: string; label: string }> = {
  EPIC: { icon: Zap, bg: "bg-purple-600", label: "Epic" },
  STORY: { icon: BookOpen, bg: "bg-emerald-500", label: "Story" },
  BUG: { icon: Bug, bg: "bg-red-500", label: "Bug" },
  TASK: { icon: CheckSquare, bg: "bg-blue-500", label: "Task" },
  SUBTASK: { icon: Layers, bg: "bg-sky-400", label: "Subtask" },
};

const PRIORITY_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  HIGHEST: { icon: ChevronsUp, color: "text-red-600", label: "Highest" },
  HIGH: { icon: ArrowUp, color: "text-red-500", label: "High" },
  MEDIUM: { icon: Minus, color: "text-orange-400", label: "Medium" },
  LOW: { icon: ArrowDown, color: "text-blue-500", label: "Low" },
  LOWEST: { icon: ChevronsDown, color: "text-blue-400", label: "Lowest" },
};

export default function IssueDetailPage() {
  const { key } = useParams<{ key: string }>();
  const router = useRouter();
  const { t } = useAppStore();
  const { user } = useCurrentUser();
  const { data: issue, isLoading } = useIssue(key);
  const { data: project } = useProject(issue?.projectId ?? "");
  const { data: comments } = useComments(issue?.id ?? "");
  const { mutate: addComment, isPending: commenting } = useAddComment(issue?.id ?? "");
  const { mutate: updateComment } = useUpdateComment(issue?.id ?? "");
  const { mutate: deleteComment } = useDeleteComment(issue?.id ?? "");
  const { mutate: updateIssue } = useUpdateIssue();
  const { mutate: deleteIssue } = useDeleteIssue(issue?.projectId ?? "");

  const [commentText, setCommentText] = useState("");
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentDraft, setEditCommentDraft] = useState("");

  function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !issue) return;
    addComment({ content: commentText.trim() }, { onSuccess: () => setCommentText("") });
  }

  function saveSummary() {
    if (issue && summaryDraft.trim() && summaryDraft.trim() !== issue.summary) {
      updateIssue({ id: issue.id, summary: summaryDraft.trim() });
    }
    setEditingSummary(false);
  }

  function saveDesc() {
    if (issue) {
      updateIssue({ id: issue.id, description: descDraft.trim() || null });
    }
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
        <p className="text-muted-foreground">Issue not found</p>
      </div>
    );
  }

  const typeConf = TYPE_CONFIG[issue.type] ?? TYPE_CONFIG.TASK;
  const TypeIcon = typeConf.icon;
  const members = project?.members ?? [];

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
              className="mb-6 cursor-pointer rounded-md px-1 py-0.5 text-xl font-semibold leading-tight hover:bg-muted/50"
              onClick={() => { setEditingSummary(true); setSummaryDraft(issue.summary); }}
            >
              {issue.summary}
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
                className="group cursor-pointer rounded-md p-3 hover:bg-muted/30"
                onClick={() => { setEditingDesc(true); setDescDraft(issue.description ?? ""); }}
              >
                {issue.description ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{issue.description}</p>
                ) : (
                  <p className="text-sm italic text-muted-foreground/50">
                    {t("issue.clickToAddDesc")}
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator className="mb-6" />

          {/* Tabs: Comments / Activity / Worklogs */}
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
              {/* Comment input */}
              <form onSubmit={handleComment} className="mb-6">
                <div className="flex gap-3">
                  <Avatar className="mt-1 h-7 w-7 shrink-0">
                    <AvatarFallback className="text-[10px]">
                      {(user?.name ?? "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder={t("issue.addComment")}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={2}
                      className="mb-2 resize-none text-sm"
                    />
                    {commentText.trim() && (
                      <Button type="submit" size="sm" disabled={commenting}>
                        <Send className="mr-1.5 h-3 w-3" />{t("common.save")}
                      </Button>
                    )}
                  </div>
                </div>
              </form>

              {/* Comment list */}
              <div className="space-y-4">
                {comments?.map((comment) => (
                  <div key={comment.id} className="group flex gap-3">
                    <Avatar className="mt-0.5 h-7 w-7 shrink-0">
                      <AvatarFallback className="text-[10px]">
                        {(comment.author.name ?? "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-baseline gap-2">
                        <span className="text-[13px] font-semibold">{comment.author.name}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {comment.authorId === user?.id && (
                          <div className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => { setEditingCommentId(comment.id); setEditCommentDraft(comment.content); }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => deleteComment(comment.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editCommentDraft}
                            onChange={(e) => setEditCommentDraft(e.target.value)}
                            rows={2}
                            className="text-sm"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button size="xs" onClick={() => { updateComment({ commentId: comment.id, content: editCommentDraft.trim() }); setEditingCommentId(null); }}>
                              {t("common.save")}
                            </Button>
                            <Button size="xs" variant="ghost" onClick={() => setEditingCommentId(null)}>{t("common.cancel")}</Button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/80">
                          {comment.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <ActivityFeed issueId={issue.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Detail sidebar */}
      <div className="w-70 shrink-0 overflow-auto border-l bg-muted/20 p-5">
        <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{t("issue.details")}</h3>

        <div className="space-y-5">
          {/* Status */}
          <DetailRow label={t("issue.status")}>
            <Badge className="bg-primary/10 text-primary text-[11px] font-semibold">
              {issue.boardColumn?.name ?? t("issue.backlogStatus")}
            </Badge>
          </DetailRow>

          {/* Type */}
          <DetailRow label={t("common.type")}>
            <Select value={issue.type} onValueChange={(v) => v && handleUpdate("type", v)}>
              <SelectTrigger className="h-7 w-full text-[12px]">
                {(() => {
                  const cfg = TYPE_CONFIG[issue.type] ?? TYPE_CONFIG.TASK;
                  const Icon = cfg.icon;
                  return (
                    <span className="flex items-center gap-2">
                      <div className={`flex h-4 w-4 items-center justify-center rounded-sm ${cfg.bg}`}>
                        <Icon className="h-2.5 w-2.5 text-white" />
                      </div>
                      {t(`issue.types.${issue.type}` as any)}
                    </span>
                  );
                })()}
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_CONFIG).map(([val, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <SelectItem key={val} value={val}>
                      <span className="flex items-center gap-2">
                        <div className={`flex h-4 w-4 items-center justify-center rounded-sm ${cfg.bg}`}>
                          <Icon className="h-2.5 w-2.5 text-white" />
                        </div>
                        {t(`issue.types.${val}` as any)}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </DetailRow>

          {/* Priority */}
          <DetailRow label={t("issue.priority")}>
            <Select value={issue.priority} onValueChange={(v) => v && handleUpdate("priority", v)}>
              <SelectTrigger className="h-7 w-full text-[12px]">
                {(() => {
                  const cfg = PRIORITY_CONFIG[issue.priority] ?? PRIORITY_CONFIG.MEDIUM;
                  const Icon = cfg.icon;
                  return (
                    <span className="flex items-center gap-2">
                      <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                      {t(`issue.priorities.${issue.priority}` as any)}
                    </span>
                  );
                })()}
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_CONFIG).map(([val, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <SelectItem key={val} value={val}>
                      <span className="flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                        {t(`issue.priorities.${val}` as any)}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </DetailRow>

          {/* Assignee */}
          <DetailRow label={t("issue.assignee")}>
            <Select
              value={issue.assigneeId ?? "__none__"}
              onValueChange={(v) => handleUpdate("assigneeId", v === "__none__" ? null : v)}
            >
              <SelectTrigger className="h-7 w-full text-[12px]">
                {issue.assignee ? (
                  <span className="flex items-center gap-2">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-[8px]">
                        {(issue.assignee.name ?? "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {issue.assignee.name || issue.assignee.email}
                  </span>
                ) : (
                  <span className="text-muted-foreground">{t("issue.unassigned")}</span>
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t("issue.unassigned")}</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.user.id} value={m.user.id}>
                    <span className="flex items-center gap-2">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-[8px]">
                          {(m.user.name ?? "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {m.user.name || m.user.email}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DetailRow>

          {/* Reporter */}
          <DetailRow label={t("issue.reporter")}>
            {issue.reporter && (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[9px]">
                    {(issue.reporter.name ?? "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[13px]">{issue.reporter.name}</span>
              </div>
            )}
          </DetailRow>

          {/* Story Points */}
          <DetailRow label={t("issue.storyPoints")}>
            <Input
              type="number"
              min={0}
              value={issue.storyPoints ?? ""}
              onChange={(e) => handleUpdate("storyPoints", e.target.value || null)}
              className="h-7 w-20 text-[12px]"
              placeholder="—"
            />
          </DetailRow>

          {/* Sprint */}
          {issue.sprint && (
            <DetailRow label={t("issue.sprint")}>
              <span className="text-[13px]">{issue.sprint.name}</span>
            </DetailRow>
          )}

          {/* Due Date */}
          <DetailRow label={t("issue.dueDate")}>
            <Input
              type="date"
              value={issue.dueDate ? issue.dueDate.split("T")[0] : ""}
              onChange={(e) => handleUpdate("dueDate", e.target.value ? new Date(e.target.value).toISOString() : null)}
              className="h-7 text-[12px]"
            />
          </DetailRow>

          <Separator />

          {/* Time tracking */}
          <WorklogSection issueId={issue.id} currentUserId={user?.id ?? ""} />

          <Separator />

          {/* Meta */}
          <div className="space-y-1.5 text-[11px] text-muted-foreground">
            <p>{t("issue.created", { date: new Date(issue.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) })}</p>
            <p>{t("issue.updated", { date: new Date(issue.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
