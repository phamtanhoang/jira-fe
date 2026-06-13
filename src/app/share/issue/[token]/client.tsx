"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  FileText,
  Lock,
  Paperclip,
  Target,
} from "lucide-react";
import { TYPE_CONFIG, PRIORITY_CONFIG } from "@/lib/constants/issue-config";
import { formatDateShort, formatDateTime } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { issueShareApi } from "@/features/issue-share/api";
import {
  AttachmentLightbox,
  type LightboxAttachment,
} from "@/features/projects/components/attachment-lightbox";
import { RichContent } from "@/components/shared/rich-editor";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";

function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function PublicIssuePage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useAppStore();
  const [preview, setPreview] = useState<LightboxAttachment | null>(null);
  const { data: issue, isLoading, error } = useQuery({
    queryKey: ["public-issue", token],
    queryFn: () => issueShareApi.fetchPublic(token),
    retry: false,
    // 5-min refetch — matches the signed-URL TTL. Without this the URL
    // returned at first load expires before the user clicks an
    // attachment, breaking preview.
    refetchInterval: 4 * 60 * 1000,
    refetchOnWindowFocus: true,
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
        <h1 className="mb-1 text-lg font-semibold">
          {t("share.publicPage.linkUnavailable")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("share.publicPage.linkUnavailableDesc")}
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
        {t("share.publicPage.readOnlyBanner")}
      </div>

      <article className="mx-auto max-w-3xl px-6 py-8">
        {/* Key + type + parent breadcrumb */}
        <div className="mb-3 flex items-center gap-2 text-[13px]">
          <div
            className={`flex h-5 w-5 items-center justify-center rounded ${typeConf.bg}`}
          >
            <TypeIcon className="h-3 w-3 text-white" />
          </div>
          {issue.parent && (
            <>
              <span className="font-mono text-muted-foreground">
                {issue.parent.key}
              </span>
              <span className="text-muted-foreground/40">/</span>
            </>
          )}
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

        {/* Sprint + Epic context */}
        {(issue.sprint || issue.epic) && (
          <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
            {issue.epic && (
              <span className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />
                Epic:
                <span className="text-foreground">
                  {issue.epic.key} {issue.epic.summary}
                </span>
              </span>
            )}
            {issue.sprint && (
              <span className="flex items-center gap-1.5">
                Sprint:
                <span className="text-foreground">{issue.sprint.name}</span>
                <span className="rounded bg-muted px-1.5 py-px text-[10px]">
                  {issue.sprint.status}
                </span>
              </span>
            )}
          </div>
        )}

        {/* People */}
        <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-muted-foreground">
          {issue.reporter && (
            <span className="flex items-center gap-2">
              {t("share.publicPage.reportedBy")}
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
              {t("share.publicPage.assignedTo")}
              <UserAvatar
                user={issue.assignee}
                className="h-5 w-5"
                fallbackClassName="text-[9px]"
              />
              <span className="text-foreground">{issue.assignee.name}</span>
            </span>
          )}
        </div>

        {/* Dates + story points strip */}
        <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-1 rounded-md border bg-card p-3 text-[12px] sm:grid-cols-4">
          <DateRow
            icon={<CalendarDays className="h-3.5 w-3.5" />}
            label={t("share.publicPage.created").replace(/[{:].*$/, "").trim()}
            value={formatDateTime(issue.createdAt)}
          />
          {issue.startDate && (
            <DateRow
              icon={<CalendarDays className="h-3.5 w-3.5" />}
              label="Start"
              value={formatDateShort(issue.startDate)}
            />
          )}
          {issue.dueDate && (
            <DateRow
              icon={<CalendarClock className="h-3.5 w-3.5" />}
              label="Due"
              value={formatDateShort(issue.dueDate)}
            />
          )}
          {issue.completedAt && (
            <DateRow
              icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
              label="Completed"
              value={formatDateShort(issue.completedAt)}
            />
          )}
          {typeof issue.storyPoints === "number" && (
            <DateRow
              icon={<Target className="h-3.5 w-3.5" />}
              label="Story points"
              value={String(issue.storyPoints)}
            />
          )}
        </div>

        {/* Description */}
        {issue.description && (
          <section className="mb-8 rounded-lg border bg-card p-5">
            <RichContent html={issue.description} />
          </section>
        )}

        {/* Attachments — click to preview (image / PDF / video / audio /
            text inline). Signed URLs expire in 5 min; the query refetches
            every 4 min to keep them fresh while the tab is open. */}
        {issue.attachments && issue.attachments.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Paperclip className="mr-1 inline h-3.5 w-3.5" />
              {t("share.publicPage.attachments", {
                count: String(issue.attachments.length),
              })}
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {issue.attachments.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  disabled={!a.signedUrl}
                  onClick={() => {
                    if (a.signedUrl) {
                      setPreview({
                        fileName: a.fileName,
                        mimeType: a.mimeType,
                        url: a.signedUrl,
                      });
                    }
                  }}
                  className="group overflow-hidden rounded-lg border bg-card text-left transition-all duration-150 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex h-24 items-center justify-center bg-muted/50">
                    {isImage(a.mimeType) && a.signedUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.signedUrl}
                        alt={a.fileName}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    ) : (
                      <FileText className="h-8 w-8 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="px-2 py-1.5">
                    <p className="truncate text-[11px] font-medium">
                      {a.fileName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatSize(a.fileSize)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Comments */}
        {issue.comments && issue.comments.length > 0 && (
          <section>
            <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("share.publicPage.comments", {
                count: String(issue.comments.length),
              })}
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

      <AttachmentLightbox attachment={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

function DateRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
