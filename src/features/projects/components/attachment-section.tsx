"use client";

import { useCallback, useState } from "react";
import {
  Paperclip,
  Trash2,
  Download,
  FileText,
  X,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useAttachments, useUploadAttachments, useDeleteAttachment } from "../hooks";
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
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const [expanded, setExpanded] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const count = attachments?.length ?? 0;

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) => f.size <= 10 * 1024 * 1024);
      if (files.length > 0) upload(files);
    },
    [upload],
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
            {/* Upload hint */}
            <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-md py-2 text-[12px] text-muted-foreground transition-colors hover:bg-muted/40">
              {uploading ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
              <span>{uploading ? t("common.loading") : t("issue.dropOrClick")}</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </label>

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
