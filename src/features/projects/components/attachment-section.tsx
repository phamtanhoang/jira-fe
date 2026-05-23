"use client";

import { useCallback, useRef, useState } from "react";
import {
  Paperclip,
  Trash2,
  Download,
  FileText,
  X,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  RotateCw,
  Upload,
} from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  UPLOAD_LIMITS,
  exceedsLargeAttachment,
  isLargeAttachment,
} from "@/lib/constants";
import { toast } from "sonner";
import {
  useAttachments,
  useUploadAttachments,
  useDeleteAttachment,
  useUploadLargeAttachment,
} from "../hooks";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export function AttachmentSection({
  issueId,
  currentUserId,
}: {
  issueId: string;
  currentUserId: string;
}) {
  const { t } = useAppStore();
  const { data: attachments } = useAttachments(issueId);
  const { mutate: upload, isPending: uploading } = useUploadAttachments(issueId);
  const { mutate: deleteAttachment } = useDeleteAttachment(issueId);
  const {
    upload: uploadLarge,
    uploads: largeUploads,
    dismiss: dismissLarge,
    orphans,
    resume: resumeLarge,
    retry: retryLarge,
    dismissOrphan,
  } = useUploadLargeAttachment(issueId);
  const [expanded, setExpanded] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // Hidden file input + the orphan currently waiting on a file re-pick.
  // Resume flow: user clicks "Resume" on an orphan row → we open the
  // picker; on file selected, we hand it to the hook's `resume()`.
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [resumingOrphanId, setResumingOrphanId] = useState<string | null>(null);

  const count = attachments?.length ?? 0;

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const small: File[] = [];
      for (const file of files) {
        if (exceedsLargeAttachment(file)) {
          // Pre-flight check matches BE LARGE_ATTACHMENT.maxSize so we fail
          // fast with a friendly toast instead of paying for the init round-trip.
          toast.error(
            t("issue.uploadTooLarge", {
              max: formatSize(UPLOAD_LIMITS.LARGE_ATTACHMENT.maxSize),
            }),
          );
          continue;
        }
        if (isLargeAttachment(file)) {
          // Chunked path. Fire-and-forget; the hook surfaces progress + errors.
          void uploadLarge(file);
        } else {
          small.push(file);
        }
      }
      if (small.length > 0) upload(small);
    },
    [upload, uploadLarge, t],
  );

  // User clicked "Resume" on an orphaned upload → remember which one,
  // then trigger the hidden file input so they can re-pick the file.
  const handleResumeClick = useCallback((sessionId: string) => {
    setResumingOrphanId(sessionId);
    resumeInputRef.current?.click();
  }, []);

  // File picked for resume → verify match (hook does this) + kick off
  // resume. Reset the input so the same file can be picked twice in a row.
  const handleResumeFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const sessionId = resumingOrphanId;
      // Reset both inputs and state immediately so a second click works.
      if (resumeInputRef.current) resumeInputRef.current.value = "";
      setResumingOrphanId(null);
      if (!file || !sessionId) return;
      void resumeLarge(file, sessionId);
    },
    [resumingOrphanId, resumeLarge],
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="mb-8">
      {/* Header — collapsible */}
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <h3 className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Paperclip className="h-3.5 w-3.5" />
          {t("issue.attachments")}
          {count > 0 && <span className="ml-1 normal-case font-normal">({count})</span>}
        </h3>

        {/* Menu */}
        <DropdownMenu>
          <Button render={<DropdownMenuTrigger />} variant="ghost" size="icon-xs" className="ml-auto h-5 w-5 text-muted-foreground">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => document.getElementById(`file-upload-${issueId}`)?.click()}>
              <Paperclip className="mr-2 h-3.5 w-3.5" />
              {t("issue.dropOrClick")}
            </DropdownMenuItem>
            <input
              id={`file-upload-${issueId}`}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded && (
        <>
          {/* Drop zone wrapping everything */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`rounded-lg border-2 border-dashed p-3 transition-colors duration-150 ${
              dragOver
                ? "border-primary bg-primary/5 dark:bg-primary/10"
                : "border-muted-foreground/20 hover:border-muted-foreground/30"
            }`}
          >
            {/* Upload hint — the global "Loading…" only appears for the
                small single-shot upload because that path has no per-file
                progress UI. Large uploads have their own per-row progress
                bars below, so leaving this header static keeps the UI
                from looking permanently "busy" while chunks stream. */}
            <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-md py-2 text-[12px] text-muted-foreground transition-colors hover:bg-muted/40">
              {uploading ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
              <span>
                {uploading ? t("common.loading") : t("issue.dropOrClick")}
              </span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </label>

            {/* Large upload hint — surfaced under the drop zone so users know
                what's happening when a big file is selected. */}
            <p className="mb-2 text-center text-[10px] text-muted-foreground/70">
              {t("issue.largeUploadHint", {
                soft: formatSize(UPLOAD_LIMITS.ATTACHMENT.maxSize),
                max: formatSize(UPLOAD_LIMITS.LARGE_ATTACHMENT.maxSize),
              })}
            </p>

            {/* Orphaned uploads — sessions persisted to localStorage
                that the server still considers PENDING. Surface a
                "Resume" CTA so the user can pick the file again from
                disk and continue from where they left off. */}
            {orphans.length > 0 && (
              <div className="mb-3 space-y-1.5">
                {orphans.map((o) => (
                  <div
                    key={o.sessionId}
                    className="flex items-center justify-between gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-[11px] dark:border-amber-700 dark:bg-amber-950/40"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{o.fileName}</div>
                      <div className="text-muted-foreground">
                        {t("issue.resumeUploadAvailable", {
                          size: formatSize(o.fileSize),
                        })}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResumeClick(o.sessionId)}
                        className="h-7 text-[11px]"
                      >
                        <Upload className="mr-1 h-3 w-3" />
                        {t("issue.resume")}
                      </Button>
                      <button
                        onClick={() => dismissOrphan(o.sessionId)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title={t("issue.uploadCancel")}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Hidden input shared by all resume buttons — single
                    DOM node, value reset after each pick so the same
                    file can be selected twice in a row. */}
                <input
                  ref={resumeInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleResumeFile}
                />
              </div>
            )}

            {/* In-flight chunked uploads — one row per file with a progress
                bar. Removed automatically on success; errored rows surface a
                dismiss button. */}
            {largeUploads.length > 0 && (
              <div className="mb-3 space-y-1.5">
                {largeUploads.map((u) => (
                  <div
                    key={u.id}
                    className={`rounded-md border bg-card p-2 ${
                      u.status === "error" ? "border-red-300 dark:border-red-700" : ""
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                      <span className="truncate font-medium">{u.fileName}</span>
                      <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                        {u.status === "finalizing" && (
                          <Spinner className="h-3 w-3" />
                        )}
                        {u.status === "error"
                          ? t("issue.uploadFailed")
                          : u.status === "finalizing"
                            ? t("issue.finalizing")
                            : `${u.pct}% · ${formatSize(u.bytesUploaded)} / ${formatSize(u.totalBytes)}`}
                      </span>
                      {u.status === "error" && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => retryLarge(u.id)}
                            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title={t("issue.uploadRetry")}
                          >
                            <RotateCw className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => dismissLarge(u.id)}
                            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title={t("issue.uploadCancel")}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full transition-all duration-200 ${
                          u.status === "error"
                            ? "bg-red-500"
                            : u.status === "finalizing"
                              ? "animate-pulse bg-primary/80"
                              : "bg-primary"
                        }`}
                        style={{ width: `${u.status === "error" ? 100 : u.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Attachment grid inside drop zone */}
            {count > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {attachments!.map((att) => (
                <div
                  key={att.id}
                  className="group relative overflow-hidden rounded-lg border bg-card transition-all duration-150 hover:shadow-md"
                >
                  {/* Thumbnail / file icon */}
                  {isImage(att.mimeType) ? (
                    <button
                      onClick={() => setPreview((att.signedUrl ?? att.fileUrl))}
                      className="block h-28 w-full overflow-hidden bg-muted"
                    >
                      {/* Supabase signed URL with rotating query string —
                          next/image's loader would re-cache every refresh
                          for tiny gain. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={(att.signedUrl ?? att.fileUrl)}
                        alt={att.fileName}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </button>
                  ) : (
                    <a
                      href={(att.signedUrl ?? att.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-28 w-full items-center justify-center bg-muted/50"
                    >
                      <FileText className="h-10 w-10 text-muted-foreground/30" />
                    </a>
                  )}

                  {/* Info bar */}
                  <div className="px-2 py-1.5">
                    <a
                      href={(att.signedUrl ?? att.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-[11px] font-medium hover:text-primary hover:underline"
                    >
                      {att.fileName}
                    </a>
                    <span className="text-[10px] text-muted-foreground">
                      {formatSize(att.fileSize)} · {formatDateShort(att.createdAt)}
                    </span>
                  </div>

                  {/* Hover actions */}
                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <a
                      href={(att.signedUrl ?? att.fileUrl)}
                      download={att.fileName}
                      className="rounded-md bg-black/50 p-1 text-white hover:bg-black/70"
                    >
                      <Download className="h-3 w-3" />
                    </a>
                    {att.uploadedById === currentUserId && (
                      <button
                        onClick={() => deleteAttachment(att.id)}
                        className="rounded-md bg-black/50 p-1 text-white hover:bg-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </>
      )}

      {/* Image preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setPreview(null)}>
          <button onClick={() => setPreview(null)} className="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70">
            <X className="h-5 w-5" />
          </button>
          {/* Lightbox preview — full-bleed, dimensions intrinsic. next/image
              would force fixed sizing here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
}
