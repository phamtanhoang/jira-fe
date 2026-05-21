import { AxiosError } from "axios";
import { api } from "@/lib/api";
import { ENDPOINTS, UPLOAD_LIMITS } from "@/lib/constants";
import type {
  Project,
  ProjectMember,
  Board,
  Issue,
  CreateProjectPayload,
  UpdateProjectPayload,
  AddProjectMemberPayload,
  UpdateProjectMemberPayload,
  CreateIssuePayload,
  MoveIssuePayload,
  MyDashboard,
  CreateColumnPayload,
  UpdateColumnPayload,
  UpdateSprintPayload,
  Comment,
  Label,
  Activity,
  Worklog,
  Attachment,
  UserPreview,
} from "./types";

// ─── Large upload helpers ────────────────────────────────────────────
// Module-level so the `issuesApi.uploadLargeAttachment` method (defined
// below) can reference them. Both retry the wrapped request on transient
// failure (network drop, 5xx, 408 timeout) — BE already retries chunk
// PUTs to Supabase internally, but a flaky reverse proxy or the
// `/complete` assembly step can still fail, so a second tier of retries
// on FE turns a hard error into a slow upload.

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const RETRY_BACKOFF_MS = [400, 1200, 3000] as const; // exponential-ish

function isRetryable(err: unknown): boolean {
  if (!(err instanceof AxiosError)) return false;
  // Aborted by user / signal — never retry.
  if (err.code === "ERR_CANCELED" || err.name === "CanceledError") return false;
  // Pure network failure (no response yet) — likely transient.
  if (!err.response) return true;
  return RETRYABLE_STATUS.has(err.response.status);
}

async function postChunkWithRetry(args: {
  sessionId: string;
  index: number;
  blob: Blob;
  signal?: AbortSignal;
  onProgress: (bytesLoaded: number) => void;
}): Promise<void> {
  for (let attempt = 0; attempt <= RETRY_BACKOFF_MS.length; attempt++) {
    if (args.signal?.aborted) throw new Error("Upload aborted");
    const form = new FormData();
    form.append("chunk", args.blob, `chunk-${args.index}`);
    try {
      await api.post(
        ENDPOINTS.attachments.largeChunk(args.sessionId),
        form,
        {
          params: { index: args.index },
          headers: { "Content-Type": "multipart/form-data" },
          signal: args.signal,
          onUploadProgress: (e) => args.onProgress(e.loaded),
        },
      );
      return;
    } catch (err) {
      if (attempt >= RETRY_BACKOFF_MS.length || !isRetryable(err)) throw err;
      // Reset progress for this slot — re-upload will report from zero.
      args.onProgress(0);
      await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS[attempt]));
    }
  }
}

/**
 * Call `/complete` with self-healing: if BE reports missing chunks
 * (409 + `missingChunks` array), re-upload those chunks and retry.
 * Caps at 2 self-heal cycles to bound worst-case duration.
 */
async function postCompleteWithSelfHeal(args: {
  sessionId: string;
  file: File;
  chunkSize: number;
  signal?: AbortSignal;
  onChunkBytes: (index: number, bytes: number) => void;
}): Promise<{ message: string; attachment: Attachment }> {
  const MAX_SELF_HEAL = 2;
  for (let healAttempt = 0; healAttempt <= MAX_SELF_HEAL; healAttempt++) {
    try {
      // Transient 5xx still gets a basic retry round on top of self-heal.
      return await postCompleteRetryTransient(args.sessionId);
    } catch (err) {
      const missing = extractMissingChunks(err);
      if (!missing || healAttempt >= MAX_SELF_HEAL) throw err;
      // Re-upload only the chunks BE says it doesn't have.
      for (const idx of missing) {
        if (args.signal?.aborted) throw new Error("Upload aborted");
        const start = idx * args.chunkSize;
        const end = Math.min(start + args.chunkSize, args.file.size);
        const blob = args.file.slice(start, end);
        await postChunkWithRetry({
          sessionId: args.sessionId,
          index: idx,
          blob,
          signal: args.signal,
          onProgress: (loaded) =>
            args.onChunkBytes(idx, Math.min(loaded, blob.size)),
        });
        args.onChunkBytes(idx, blob.size);
      }
    }
  }
  throw new Error("Complete self-heal exited without resolving");
}

async function postCompleteRetryTransient(sessionId: string) {
  for (let attempt = 0; attempt <= RETRY_BACKOFF_MS.length; attempt++) {
    try {
      const res = await api.post<{ message: string; attachment: Attachment }>(
        ENDPOINTS.attachments.largeComplete(sessionId),
      );
      return res.data;
    } catch (err) {
      // 409 with missing chunks is self-heal territory — bubble up
      // immediately so the outer loop can re-upload, not retry blindly.
      if (extractMissingChunks(err)) throw err;
      if (attempt >= RETRY_BACKOFF_MS.length || !isRetryable(err)) throw err;
      await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS[attempt]));
    }
  }
  throw new Error("Complete retry loop exited without resolving");
}

function extractMissingChunks(err: unknown): number[] | null {
  if (!(err instanceof AxiosError)) return null;
  if (err.response?.status !== 409) return null;
  const data = err.response.data as
    | { missingChunks?: unknown; message?: unknown }
    | undefined;
  if (!data || !Array.isArray(data.missingChunks)) return null;
  const out: number[] = [];
  for (const v of data.missingChunks) {
    if (typeof v === "number" && Number.isInteger(v) && v >= 0) out.push(v);
  }
  return out.length > 0 ? out : null;
}

export const projectsApi = {
  list: (workspaceId: string) =>
    api
      .get<Project[]>(ENDPOINTS.projects.base, { params: { workspaceId } })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<Project>(ENDPOINTS.projects.byId(id)).then((r) => r.data),

  create: (data: CreateProjectPayload) =>
    api
      .post<{ message: string; project: Project }>(
        ENDPOINTS.projects.base,
        data,
      )
      .then((r) => r.data),

  update: (id: string, data: UpdateProjectPayload) =>
    api
      .patch<{ message: string; project: Project }>(
        ENDPOINTS.projects.byId(id),
        data,
      )
      .then((r) => r.data),

  delete: (id: string) =>
    api.delete(ENDPOINTS.projects.byId(id)).then((r) => r.data),

  getMembers: (id: string) =>
    api
      .get<ProjectMember[]>(ENDPOINTS.projects.members(id))
      .then((r) => r.data),

  addMember: (id: string, data: AddProjectMemberPayload) =>
    api
      .post<{ message: string; member: ProjectMember }>(
        ENDPOINTS.projects.members(id),
        data,
      )
      .then((r) => r.data),

  bulkAddMembers: (
    id: string,
    data: { userIds: string[]; role?: "ADMIN" | "DEVELOPER" | "VIEWER" },
  ) =>
    api
      .post<{
        message: string;
        added: number;
        skipped: number;
        members: ProjectMember[];
      }>(`${ENDPOINTS.projects.members(id)}/bulk`, data)
      .then((r) => r.data),

  updateMember: (id: string, memberId: string, data: UpdateProjectMemberPayload) =>
    api
      .patch<{ message: string; member: ProjectMember }>(
        ENDPOINTS.projects.member(id, memberId),
        data,
      )
      .then((r) => r.data),

  removeMember: (id: string, memberId: string) =>
    api
      .delete(ENDPOINTS.projects.member(id, memberId))
      .then((r) => r.data),
};

export const boardsApi = {
  getByProject: (projectId: string) =>
    api
      .get<Board>(ENDPOINTS.boards.byProject(projectId))
      .then((r) => r.data),

  reorderColumns: (boardId: string, columnIds: string[]) =>
    api
      .patch(ENDPOINTS.boards.reorderColumns(boardId), { columnIds })
      .then((r) => r.data),

  addColumn: (boardId: string, data: CreateColumnPayload) =>
    api
      .post(ENDPOINTS.boards.columns(boardId), data)
      .then((r) => r.data),

  updateColumn: (boardId: string, columnId: string, data: UpdateColumnPayload) =>
    api
      .patch(ENDPOINTS.boards.column(boardId, columnId), data)
      .then((r) => r.data),

  deleteColumn: (boardId: string, columnId: string) =>
    api
      .delete(ENDPOINTS.boards.column(boardId, columnId))
      .then((r) => r.data),
};

type PaginatedResponse = {
  data: Issue[];
  nextCursor: string | null;
  hasMore: boolean;
};

export const issuesApi = {
  list: (projectId: string, filters?: Record<string, string>) =>
    api
      .get<Issue[]>(ENDPOINTS.issues.base, {
        params: { projectId, ...filters },
      })
      .then((r) => r.data),

  myDashboard: () =>
    api
      .get<MyDashboard>(ENDPOINTS.issues.myDashboard)
      .then((r) => r.data),

  listPaginated: (projectId: string, params: { take: number; cursor?: string; sprintId?: string }) =>
    api
      .get<PaginatedResponse>(ENDPOINTS.issues.base, {
        params: { projectId, ...params },
      })
      .then((r) => r.data),

  getByKey: (key: string) =>
    api.get<Issue>(ENDPOINTS.issues.byKey(key)).then((r) => r.data),

  create: (data: CreateIssuePayload) =>
    api
      .post<{ message: string; issue: Issue }>(ENDPOINTS.issues.base, data)
      .then((r) => r.data),

  update: (id: string, data: Partial<Issue>) =>
    api
      .patch<{ message: string; issue: Issue }>(
        ENDPOINTS.issues.byId(id),
        data,
      )
      .then((r) => r.data),

  move: (id: string, data: MoveIssuePayload) =>
    api
      .patch<{ message: string; issue: Issue }>(
        ENDPOINTS.issues.move(id),
        data,
      )
      .then((r) => r.data),

  delete: (id: string) =>
    api.delete(ENDPOINTS.issues.byId(id)).then((r) => r.data),

  bulkUpdate: (data: { issueIds: string[]; sprintId?: string | null; assigneeId?: string | null; priority?: string }) =>
    api.patch<{ message: string; count: number }>(ENDPOINTS.issues.bulk, data).then((r) => r.data),

  bulkDelete: (issueIds: string[]) =>
    api.delete<{ message: string; count: number }>(ENDPOINTS.issues.bulk, { data: { issueIds } }).then((r) => r.data),

  getComments: (issueId: string) =>
    api
      .get<Comment[]>(ENDPOINTS.issues.comments(issueId))
      .then((r) => r.data),

  addComment: (issueId: string, content: string, parentId?: string) =>
    api
      .post<{ message: string; comment: Comment }>(
        ENDPOINTS.issues.comments(issueId),
        { content, parentId },
      )
      .then((r) => r.data),

  updateComment: (commentId: string, content: string) =>
    api
      .patch<{ message: string; comment: Comment }>(
        ENDPOINTS.comments.byId(commentId),
        { content },
      )
      .then((r) => r.data),

  deleteComment: (commentId: string) =>
    api.delete(ENDPOINTS.comments.byId(commentId)).then((r) => r.data),

  getActivity: (
    issueId: string,
    opts?: { cursor?: string; take?: number },
  ) =>
    api
      .get<{
        data: Activity[];
        nextCursor: string | null;
        hasMore: boolean;
      }>(ENDPOINTS.issues.activity(issueId), {
        params: opts ? { cursor: opts.cursor, take: opts.take } : undefined,
      })
      .then((r) => r.data),

  getWorklogs: (issueId: string) =>
    api
      .get<Worklog[]>(ENDPOINTS.issues.worklogs(issueId))
      .then((r) => r.data),

  addWorklog: (issueId: string, data: { timeSpent: number; startedAt: string; description?: string }) =>
    api
      .post<{ message: string; worklog: Worklog }>(
        ENDPOINTS.issues.worklogs(issueId),
        data,
      )
      .then((r) => r.data),

  updateWorklog: (worklogId: string, data: { timeSpent?: number; startedAt?: string; description?: string }) =>
    api
      .patch<{ message: string; worklog: Worklog }>(
        ENDPOINTS.worklogs.byId(worklogId),
        data,
      )
      .then((r) => r.data),

  deleteWorklog: (worklogId: string) =>
    api.delete(ENDPOINTS.worklogs.byId(worklogId)).then((r) => r.data),

  addLabel: (issueId: string, labelId: string) =>
    api
      .post(ENDPOINTS.issues.labels(issueId, labelId))
      .then((r) => r.data),

  getAttachments: (issueId: string) =>
    api
      .get<Attachment[]>(ENDPOINTS.issues.attachments(issueId))
      .then((r) => r.data),

  uploadAttachments: (issueId: string, files: File[]) => {
    const formData = new FormData();
    for (const file of files) formData.append("files", file);
    return api
      .post<{ message: string; attachments: Attachment[] }>(
        ENDPOINTS.issues.attachments(issueId),
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      )
      .then((r) => r.data);
  },

  /**
   * Chunked upload for a single large file. Splits the file into
   * `LARGE_ATTACHMENT.chunkSize` slices, uploads them sequentially with
   * per-chunk progress, and finalizes the upload to create the Attachment
   * row. On any failure mid-upload, best-effort aborts the server-side
   * session so leftover chunks are cleaned up.
   */
  uploadLargeAttachment: async (
    issueId: string,
    file: File,
    options: {
      onProgress?: (bytesUploaded: number, totalBytes: number) => void;
      signal?: AbortSignal;
    } = {},
  ) => {
    const { chunkSize } = UPLOAD_LIMITS.LARGE_ATTACHMENT;
    const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));

    const init = await api
      .post<{
        message: string;
        sessionId: string;
        chunkSize: number;
        totalChunks: number;
        expiresAt: string;
      }>(ENDPOINTS.attachments.largeInit, {
        issueId,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        totalChunks,
      })
      .then((r) => r.data);

    const sessionId = init.sessionId;
    // Aggregate progress across chunks. We keep one slot per chunk so
    // re-entrant onUploadProgress events update only their own slot and
    // never double-count.
    const chunkBytes = new Array<number>(init.totalChunks).fill(0);
    const reportProgress = () => {
      if (!options.onProgress) return;
      const total = chunkBytes.reduce((a, b) => a + b, 0);
      options.onProgress(Math.min(total, file.size), file.size);
    };

    try {
      for (let i = 0; i < init.totalChunks; i++) {
        if (options.signal?.aborted) throw new Error("Upload aborted");
        const start = i * init.chunkSize;
        const end = Math.min(start + init.chunkSize, file.size);
        const blob = file.slice(start, end);

        await postChunkWithRetry({
          sessionId,
          index: i,
          blob,
          signal: options.signal,
          onProgress: (loaded) => {
            chunkBytes[i] = Math.min(loaded, blob.size);
            reportProgress();
          },
        });
        // Server acknowledged: lock the slot at full chunk size so a late
        // progress event from another chunk can't shrink the total.
        chunkBytes[i] = blob.size;
        reportProgress();
      }

      // `/complete` is self-healing: BE inspects Supabase, finds chunks
      // it thought it received but were silently dropped (free-tier
      // gremlins), and replies 409 + `missingChunks`. We re-upload only
      // those, then call /complete again. Capped at 2 cycles plus the
      // transient 5xx retries inside.
      return await postCompleteWithSelfHeal({
        sessionId,
        file,
        chunkSize: init.chunkSize,
        signal: options.signal,
        onChunkBytes: (idx, bytes) => {
          chunkBytes[idx] = bytes;
          reportProgress();
        },
      });
    } catch (err) {
      // Best-effort cleanup so abandoned chunks don't sit on the server
      // until the TTL cron sweeps them.
      api.delete(ENDPOINTS.attachments.largeAbort(sessionId)).catch(() => {});
      throw err;
    }
  },

  deleteAttachment: (attachmentId: string) =>
    api.delete(ENDPOINTS.attachments.byId(attachmentId)).then((r) => r.data),

  removeLabel: (issueId: string, labelId: string) =>
    api
      .delete(ENDPOINTS.issues.labels(issueId, labelId))
      .then((r) => r.data),

  myStarred: (projectId?: string) =>
    api
      .get<{ issueIds: string[] }>(ENDPOINTS.issues.myStarred, {
        params: projectId ? { projectId } : undefined,
      })
      .then((r) => r.data.issueIds),

  star: (issueId: string) =>
    api
      .post<{ message: string; starred: true }>(ENDPOINTS.issues.star(issueId))
      .then((r) => r.data),

  unstar: (issueId: string) =>
    api
      .delete<{ message: string; starred: false }>(
        ENDPOINTS.issues.star(issueId),
      )
      .then((r) => r.data),

  watch: (issueId: string) =>
    api
      .post<{ message: string; watching: true }>(
        ENDPOINTS.issues.watch(issueId),
      )
      .then((r) => r.data),

  unwatch: (issueId: string) =>
    api
      .delete<{ message: string; watching: false }>(
        ENDPOINTS.issues.watch(issueId),
      )
      .then((r) => r.data),

  getWatchers: (issueId: string) =>
    api
      .get<{ watchers: UserPreview[] }>(ENDPOINTS.issues.watchers(issueId))
      .then((r) => r.data.watchers),

  addLink: (
    issueId: string,
    data: { targetIssueId: string; type: import("./types").IssueLinkType },
  ) =>
    api
      .post<{ message: string; link: import("./types").IssueLink }>(
        ENDPOINTS.issues.links(issueId),
        data,
      )
      .then((r) => r.data),

  removeLink: (issueId: string, linkId: string) =>
    api
      .delete<{ message: string }>(ENDPOINTS.issues.link(issueId, linkId))
      .then((r) => r.data),
};

export const labelsApi = {
  list: (projectId: string) =>
    api
      .get<Label[]>(ENDPOINTS.labels.base, { params: { projectId } })
      .then((r) => r.data),

  create: (projectId: string, name: string, color?: string) =>
    api
      .post<{ message: string; label: Label }>(ENDPOINTS.labels.base, {
        projectId,
        name,
        color,
      })
      .then((r) => r.data),

  update: (id: string, data: { name?: string; color?: string }) =>
    api
      .patch<{ message: string; label: Label }>(ENDPOINTS.labels.byId(id), data)
      .then((r) => r.data),

  delete: (id: string) =>
    api
      .delete<{ message: string }>(ENDPOINTS.labels.byId(id))
      .then((r) => r.data),
};

export const sprintsApi = {
  create: (boardId: string, name: string) =>
    api
      .post(ENDPOINTS.sprints.base, { boardId, name })
      .then((r) => r.data),

  update: (id: string, data: UpdateSprintPayload) =>
    api
      .patch(ENDPOINTS.sprints.byId(id), data)
      .then((r) => r.data),

  delete: (id: string) =>
    api.delete(ENDPOINTS.sprints.byId(id)).then((r) => r.data),

  start: (id: string) =>
    api.post(ENDPOINTS.sprints.start(id)).then((r) => r.data),

  complete: (id: string) =>
    api.post(ENDPOINTS.sprints.complete(id)).then((r) => r.data),

  burndown: (id: string) =>
    api
      .get<{ totalPoints: number; days: { date: string; ideal: number; actual: number }[] }>(
        ENDPOINTS.sprints.burndown(id),
      )
      .then((r) => r.data),

  velocity: (boardId: string) =>
    api
      .get<{
        data: {
          sprintId: string;
          name: string;
          endDate: string | null;
          committed: number;
          completed: number;
        }[];
        predicted: number;
      }>(ENDPOINTS.sprints.velocity(boardId))
      .then((r) => r.data),

  cfd: (boardId: string, days = 30) =>
    api
      .get<{
        data: {
          day: string;
          TODO: number;
          IN_PROGRESS: number;
          DONE: number;
        }[];
      }>(ENDPOINTS.sprints.cfd(boardId), { params: { days } })
      .then((r) => r.data),
};
