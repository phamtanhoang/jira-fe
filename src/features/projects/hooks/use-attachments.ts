"use client";

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useInvalidatingMutation } from "@/lib/react-query/use-invalidating-mutation";
import { handleApiError, showMessage } from "@/lib/utils";
import { issuesApi } from "../api";

export function useAttachments(issueId: string) {
  return useQuery({
    queryKey: ["attachments", issueId],
    queryFn: () => issuesApi.getAttachments(issueId),
    enabled: !!issueId,
  });
}

const attachmentsKey = (issueId: string) => ["attachments", issueId];

export function useUploadAttachments(issueId: string) {
  return useInvalidatingMutation(
    (files: File[]) => issuesApi.uploadAttachments(issueId, files),
    attachmentsKey(issueId),
    { successMessage: (r) => r.message },
  );
}

export function useDeleteAttachment(issueId: string) {
  return useInvalidatingMutation(
    (attachmentId: string) => issuesApi.deleteAttachment(attachmentId),
    attachmentsKey(issueId),
  );
}

/**
 * Per-file progress entry surfaced by `useUploadLargeAttachment`. Each
 * call to `upload()` adds an entry; on success or failure the entry is
 * removed (success) or marked errored (failure).
 */
export type LargeUploadProgress = {
  id: string;
  fileName: string;
  totalBytes: number;
  bytesUploaded: number;
  pct: number;
  status: "uploading" | "error";
};

/**
 * Hook for chunked uploads of files that exceed the single-shot limit.
 * Returns:
 *   - `upload(file)` — kicks off a chunked upload; safe to call concurrently
 *     for multiple files (each gets its own progress row).
 *   - `uploads` — live progress rows for in-flight uploads; consumers
 *     render this as a progress list.
 *
 * On completion we invalidate `["attachments", issueId]` so the attachment
 * list refetches without the consumer wiring its own invalidation.
 */
export function useUploadLargeAttachment(issueId: string) {
  const queryClient = useQueryClient();
  const [uploads, setUploads] = useState<LargeUploadProgress[]>([]);

  const upload = useCallback(
    async (file: File) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      setUploads((prev) => [
        ...prev,
        {
          id,
          fileName: file.name,
          totalBytes: file.size,
          bytesUploaded: 0,
          pct: 0,
          status: "uploading",
        },
      ]);

      try {
        const result = await issuesApi.uploadLargeAttachment(issueId, file, {
          onProgress: (bytesUploaded, totalBytes) => {
            const pct = totalBytes
              ? Math.min(100, Math.round((bytesUploaded / totalBytes) * 100))
              : 0;
            setUploads((prev) =>
              prev.map((u) =>
                u.id === id ? { ...u, bytesUploaded, pct } : u,
              ),
            );
          },
        });
        await queryClient.invalidateQueries({
          queryKey: attachmentsKey(issueId),
        });
        setUploads((prev) => prev.filter((u) => u.id !== id));
        showMessage(result.message);
      } catch (err) {
        handleApiError(err);
        setUploads((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: "error" } : u)),
        );
      }
    },
    [issueId, queryClient],
  );

  const dismiss = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  return { upload, uploads, dismiss };
}
