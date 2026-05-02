"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FileText, Lock, Paperclip } from "lucide-react";
import { TYPE_CONFIG, PRIORITY_CONFIG } from "@/lib/constants/issue-config";
import { formatDateTime } from "@/lib/utils";
import { issueShareApi } from "@/features/issue-share/api";
import { RichContent } from "@/components/shared/rich-editor";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicIssuePage() {
  const { token } = useParams<{ token: string }>();
  const { data: issue, isLoading, error } = useQuery({
    queryKey: ["public-issue", token],
    queryFn: () => issueShareApi.fetchPublic(token),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Skeleton className="mb-4 h-8 w-32" />
        <Skeleton className="mb-3 h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <Lock className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
        <h1 className="mb-1 text-lg font-semibold">Link unavailable</h1>
        <p className="text-sm text-muted-foreground">
          This share link is invalid, expired, or has been revoked.
        </p>
      </div>
    );
  }

  const typeConf =
    TYPE_CONFIG[issue.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.TASK;
  const TypeIcon = typeConf.icon;
  const prioConf =
    PRIORITY_CONFIG[issue.priority as keyof typeof PRIORITY_CONFIG] ??
    PRIORITY_CONFIG.MEDIUM;
  const PrioIcon = prioConf.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Read-only banner */}
      <div className="border-b bg-amber-50 px-4 py-2 text-center text-[12px] text-amber-900 dark:bg-amber-950 dark:text-amber-200">
        <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
        Read-only public view — sign in for full access
      </div>

      <article className="mx-auto max-w-3xl px-6 py-8">
        {/* Key + type */}
        <div className="mb-3 flex items-center gap-2 text-[13px]">
          <div
            className={`flex h-5 w-5 items-center justify-center rounded ${typeConf.bg}`}
          >
            <TypeIcon className="h-3 w-3 text-white" />
          </div>
          <span className="font-mono text-muted-foreground">{issue.key}</span>
          <PrioIcon className={`ml-auto h-4 w-4 ${prioConf.color}`} />
          {issue.boardColumn && (
            <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium">
              {issue.boardColumn.name}
            </span>
          )}
        </div>

        <h1 className="mb-4 text-2xl font-semibold tracking-tight">
          {issue.summary}
        </h1>

        {/* Labels */}
        {issue.labels && issue.labels.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {issue.labels.map((il) => (
              <span
                key={il.label.id}
                className="rounded-sm px-1.5 py-px text-[11px] font-medium"
                style={{
                  backgroundColor: il.label.color + "20",
                  color: il.label.color,
                }}
              >
                {il.label.name}
              </span>
            ))}
          </div>
        )}

        {/* People */}
        <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-muted-foreground">
          {issue.reporter && (
            <span className="flex items-center gap-2">
              Reported by
              <UserAvatar
                user={issue.reporter}
                className="h-5 w-5"
                fallbackClassName="text-[9px]"
              />
              <span className="text-foreground">{issue.reporter.name}</span>
            </span>
          )}
          {issue.assignee && (
            <span className="flex items-center gap-2">
              Assigned to
              <UserAvatar
                user={issue.assignee}
                className="h-5 w-5"
                fallbackClassName="text-[9px]"
              />
              <span className="text-foreground">{issue.assignee.name}</span>
            </span>
          )}
          <span>Created {formatDateTime(issue.createdAt)}</span>
        </div>

        {/* Description */}
        {issue.description && (
          <section className="mb-8 rounded-lg border bg-card p-5">
            <RichContent html={issue.description} />
          </section>
        )}

        {/* Attachments — names only, no download links to avoid storage URL leaks */}
        {issue.attachments && issue.attachments.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Paperclip className="mr-1 inline h-3.5 w-3.5" />
              Attachments ({issue.attachments.length})
            </h2>
            <ul className="space-y-1">
              {issue.attachments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-2 rounded border bg-card px-3 py-2 text-[13px]"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{a.fileName}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {Math.round(a.fileSize / 1024)} KB
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Comments */}
        {issue.comments && issue.comments.length > 0 && (
          <section>
            <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              Comments ({issue.comments.length})
            </h2>
            <div className="space-y-4">
              {issue.comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <UserAvatar
                    user={c.author}
                    className="mt-0.5 h-7 w-7 shrink-0"
                    fallbackClassName="text-[10px]"
                  />
                  <div className="min-w-0 flex-1 rounded-lg border bg-card p-3">
                    <div className="mb-1 flex items-baseline gap-2">
                      <span className="text-[13px] font-semibold">
                        {c.author.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDateTime(c.createdAt)}
                      </span>
                    </div>
                    <RichContent
                      html={c.content}
                      className="text-[13px] text-foreground/80"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
