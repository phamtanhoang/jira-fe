"use client";

import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/constants";
import { useInvalidatingMutation } from "@/lib/react-query/use-invalidating-mutation";
import { handleApiError, showMessage } from "@/lib/utils";
import { issuesApi } from "../api";
import {
  beaconAbortAll,
  fileMatchesPersisted,
  listPersistedUploads,
  removePersistedUpload,
  savePersistedUpload,
  type PersistedUpload,
} from "../upload-storage";

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
 * One row in the in-flight uploads list rendered next to the drop zone.
 *
 * `file` is kept on the row so the user can "Retry" without re-picking
 * from disk. It is NEVER persisted to localStorage — File objects don't
 * survive a tab close anyway, so resume always requires a re-pick.
 */
export type LargeUploadProgress = {
  id: string;
  file: File;
  fileName: string;
  totalBytes: number;
  bytesUploaded: number;
  pct: number;
  /**
   * uploading  — chunks in flight, progress 0–100%.
   * finalizing — all chunks uploaded; BE is assembling + writing DB row.
   * error      — terminal failure. Auto-dismissed after 8s; retry button
   *              re-runs the upload using the same File reference.
   */
  status: "uploading" | "finalizing" | "error";
  /** Server-issued upload session id, once /init returns. */
  sessionId?: string;
  /** When status === "error", a stable code from the response if any. */
  errorCode?: string;
};

/**
 * Orphan = a localStorage-persisted upload session whose server-side
 * state is still PENDING. When the user mounts the page again after a
 * tab close / reload / battery dead, we surface these so they can pick
 * the original file from disk and resume from chunk N+1.
 */
export type OrphanedUpload = PersistedUpload;

export function useUploadLargeAttachment(issueId: string) {
  const queryClient = useQueryClient();
  const [uploads, setUploads] = useState<LargeUploadProgress[]>([]);
  const [orphans, setOrphans] = useState<OrphanedUpload[]>([]);

  // On mount: surface any persisted-but-incomplete uploads for this
  // issue so the user can resume them. We also probe the server to
  // weed out sessions that have since completed / been swept.
  useEffect(() => {
    if (!issueId) return;
    let cancelled = false;
    (async () => {
      const candidates = listPersistedUploads(issueId);
      const stillValid: OrphanedUpload[] = [];
      await Promise.all(
        candidates.map(async (entry) => {
          try {
            const status = await issuesApi.largeUploadStatus(entry.sessionId);
            // Server confirmed still in PENDING (or COMPLETING). Keep it.
            if (
              status.status === "PENDING" ||
              status.status === "COMPLETING"
            ) {
              stillValid.push(entry);
            } else {
              removePersistedUpload(entry.sessionId);
            }
          } catch {
            // 404 / forbidden → server-side gone, drop the persisted entry.
            removePersistedUpload(entry.sessionId);
          }
        }),
      );
      if (!cancelled) setOrphans(stillValid);
    })();
    return () => {
      cancelled = true;
    };
  }, [issueId]);

  // Warn the user before they navigate / close while uploads are in
  // flight, and fire a sendBeacon abort for each — saves BE/Supabase
  // from temp chunks that would only be swept by the cron 5min later.
  useEffect(() => {
    const inflight = uploads.filter(
      (u) => u.status === "uploading" || u.status === "finalizing",
    );
    if (inflight.length === 0) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      // Chrome ignores the custom string and shows its generic dialog.
      e.preventDefault();
      e.returnValue = "";
    };
    const onPageHide = () => {
      const ids = inflight
        .map((u) => u.sessionId)
        .filter((id): id is string => !!id);
      beaconAbortAll(ids);
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [uploads]);

  // Internal runner so `upload` and `resume` share the same try/catch
  // + state-machine logic. `resumeSessionId` is the only difference —
  // when set we ask the API to pick up where the previous session left.
  const runUpload = useCallback(
    async (file: File, resumeSessionId?: string) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      setUploads((prev) => [
        ...prev,
        {
          id,
          file,
          fileName: file.name,
          totalBytes: file.size,
          bytesUploaded: 0,
          pct: 0,
          status: "uploading",
          sessionId: resumeSessionId,
        },
      ]);

      try {
        const result = await issuesApi.uploadLargeAttachment(issueId, file, {
          resumeSessionId,
          onSessionReady: (info) => {
            // Persist so a tab-close mid-upload can be resumed later.
            savePersistedUpload({
              sessionId: info.sessionId,
              issueId,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type || "application/octet-stream",
              expiresAt: info.expiresAt,
              updatedAt: Date.now(),
            });
            setUploads((prev) =>
              prev.map((u) =>
                u.id === id ? { ...u, sessionId: info.sessionId } : u,
              ),
            );
          },
          onProgress: (bytesUploaded, totalBytes) => {
            const pct = totalBytes
              ? Math.min(100, Math.round((bytesUploaded / totalBytes) * 100))
              : 0;
            setUploads((prev) =>
              prev.map((u) =>
                u.id === id && u.status === "uploading"
                  ? { ...u, bytesUploaded, pct }
                  : u,
              ),
            );
          },
          onFinalize: () => {
            setUploads((prev) =>
              prev.map((u) =>
                u.id === id
                  ? {
                      ...u,
                      status: "finalizing",
                      pct: 100,
                      bytesUploaded: u.totalBytes,
                    }
                  : u,
              ),
            );
          },
        });
        // Success — clear FE + localStorage state.
        const sessionId = uploads.find((u) => u.id === id)?.sessionId;
        if (sessionId) removePersistedUpload(sessionId);
        if (resumeSessionId) removePersistedUpload(resumeSessionId);
        await queryClient.invalidateQueries({
          queryKey: attachmentsKey(issueId),
        });
        setUploads((prev) => prev.filter((u) => u.id !== id));
        setOrphans((prev) =>
          prev.filter(
            (o) => o.sessionId !== sessionId && o.sessionId !== resumeSessionId,
          ),
        );
        showMessage(result.message);
      } catch (err) {
        // Reconcile: maybe the attachment actually landed even though we
        // observed an error (BE 500 on a /complete that did succeed in a
        // prior retry). If so, treat as success.
        const previouslyKnown = new Set(
          (
            queryClient.getQueryData<
              Array<{ fileName: string; fileSize: number }>
            >(attachmentsKey(issueId)) ?? []
          ).map((a) => `${a.fileName}|${a.fileSize}`),
        );
        await queryClient.invalidateQueries({
          queryKey: attachmentsKey(issueId),
        });
        const refreshed = queryClient.getQueryData<
          Array<{ fileName: string; fileSize: number }>
        >(attachmentsKey(issueId));
        const showedUpDespiteError = refreshed?.some(
          (a) =>
            a.fileName === file.name &&
            a.fileSize === file.size &&
            !previouslyKnown.has(`${a.fileName}|${a.fileSize}`),
        );
        if (showedUpDespiteError) {
          const sessionId = uploads.find((u) => u.id === id)?.sessionId;
          if (sessionId) removePersistedUpload(sessionId);
          if (resumeSessionId) removePersistedUpload(resumeSessionId);
          setUploads((prev) => prev.filter((u) => u.id !== id));
          return;
        }

        handleApiError(err);
        const errorCode =
          err instanceof AxiosError
            ? (
                (err.response?.data as { errorCode?: string; message?: string })
                  ?.errorCode ??
                (err.response?.data as { message?: string })?.message
              )
            : undefined;
        setUploads((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, status: "error", errorCode } : u,
          ),
        );
        // Auto-dismiss errored row after 8s so it doesn't linger.
        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.id !== id));
        }, 8000);
      }
    },
    [issueId, queryClient, uploads],
  );

  const upload = useCallback(
    (file: File) => runUpload(file),
    [runUpload],
  );

  /**
   * Resume an orphaned upload. Caller must verify with
   * `fileMatchesPersisted` first so the user re-picks the same file.
   */
  const resume = useCallback(
    (file: File, sessionId: string) => {
      const orphan = orphans.find((o) => o.sessionId === sessionId);
      if (orphan && !fileMatchesPersisted(file, orphan)) {
        showMessage("LARGE_UPLOAD_RESUME_FILE_MISMATCH");
        return;
      }
      setOrphans((prev) => prev.filter((o) => o.sessionId !== sessionId));
      return runUpload(file, sessionId);
    },
    [orphans, runUpload],
  );

  /**
   * Re-run an errored upload using the File still held in the row.
   * No need to re-pick from disk — the File object is in memory.
   */
  const retry = useCallback(
    (id: string) => {
      const row = uploads.find((u) => u.id === id);
      if (!row) return;
      setUploads((prev) => prev.filter((u) => u.id !== id));
      void runUpload(row.file);
    },
    [uploads, runUpload],
  );

  const dismiss = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const dismissOrphan = useCallback((sessionId: string) => {
    // Best-effort abort server-side, then drop from local. Use the
    // shared axios client (`api`) so 401/refresh + breadcrumbs apply.
    void api
      .delete(ENDPOINTS.attachments.largeAbort(sessionId))
      .catch(() => undefined);
    removePersistedUpload(sessionId);
    setOrphans((prev) => prev.filter((o) => o.sessionId !== sessionId));
  }, []);

  return {
    upload,
    resume,
    retry,
    uploads,
    orphans,
    dismiss,
    dismissOrphan,
  };
}
