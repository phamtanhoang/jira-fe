# Large File Upload (FE)

Companion to `jira-be/.claude/rules/large-upload.md`. Lives in `src/features/projects/`.

## Files

- `src/features/projects/api.ts` — `issuesApi.uploadLargeAttachment(issueId, file, options)` + retry helpers
- `src/features/projects/hooks/use-attachments.ts` — `useUploadLargeAttachment(issueId)` hook
- `src/features/projects/upload-storage.ts` — localStorage CRUD + `beaconAbortAll`
- `src/features/projects/components/attachment-section.tsx` — drop zone, progress rows, resume banner, retry button
- `src/lib/constants/upload.ts` — limits mirror of BE (`maxSize=30MB`, `chunkSize=512KB`)

## Decision tree on file pick

```
file.size > UPLOAD_LIMITS.LARGE_ATTACHMENT.maxSize  →  toast "uploadTooLarge", reject
file.size > UPLOAD_LIMITS.ATTACHMENT.maxSize (10MB) →  chunked path (uploadLarge)
file.size ≤ 10MB                                    →  single-shot path (regular upload)
```

The helpers `isLargeAttachment(file)` and `exceedsLargeAttachment(file)` from `@/lib/constants` encode this.

## State machine per row

```
"uploading"   → chunks streaming (progress 0–100%)
"finalizing"  → all chunks up; awaiting BE /complete (5–15s)
"error"       → terminal failure (auto-dismiss after 8s; retry button)
```

`LargeUploadProgress` type lives in `use-attachments.ts`. UI in `attachment-section.tsx` discriminates on `status`.

## Persistence + resume

After `/init` succeeds the hook calls `savePersistedUpload({ sessionId, fileName, fileSize, expiresAt, ... })` to localStorage (`jira:pending-large-uploads:v1`).

On mount, `useUploadLargeAttachment` lists persisted entries for the current `issueId`, probes BE `GET /:sessionId/status` to filter still-resumable sessions, surfaces them as `orphans` for the UI's yellow "Resume" banner.

When the user clicks Resume → file picker opens → on file select, hook calls `resume(file, sessionId)` which verifies `name+size` match then continues the upload from the chunks BE already has.

## Self-healing retries

`uploadLargeAttachment` wraps individual calls in retry helpers:
- `postChunkWithRetry` — 4 attempts on transient (408/425/429/5xx + network). Backoff `[400ms, 1.2s, 3s]`. Resets per-chunk progress to 0 on each attempt so the UI doesn't show stale bytes.
- `postCompleteWithSelfHeal` — receives 409 + `missingChunks: number[]` from BE → re-uploads those → retries `/complete`. Capped at 2 self-heal cycles.

## Tab close handling

`useEffect` mounts:
- `beforeunload` — shows browser's generic "Unsaved changes" dialog if there are uploading or finalizing rows
- `pagehide` — fires `navigator.sendBeacon('/api/attachments/large/:id/abort-beacon')` for each in-flight session so BE can cleanup eagerly

`sendBeacon` is fire-and-forget but the browser guarantees delivery even as the tab is being torn down (unlike fetch which gets cancelled).

## Reconciliation after error

If `uploadLargeAttachment` throws but `invalidateQueries(['attachments', issueId])` reveals the file actually landed (BE 500'd on retry but eventual `/complete` succeeded), the hook silently clears the row instead of showing an error toast. Pattern:

```ts
const previouslyKnown = new Set(
  (queryClient.getQueryData<Attachment[]>(["attachments", issueId]) ?? [])
    .map((a) => `${a.fileName}|${a.fileSize}`)
);
await queryClient.invalidateQueries(...);
const refreshed = queryClient.getQueryData<Attachment[]>(["attachments", issueId]);
const showedUpDespiteError = refreshed?.some(
  (a) => a.fileName === file.name && a.fileSize === file.size
    && !previouslyKnown.has(`${a.fileName}|${a.fileSize}`)
);
if (showedUpDespiteError) {
  setUploads((p) => p.filter((u) => u.id !== id));
  return; // no error toast
}
```

## i18n keys used by the UI

`issue.uploading`, `issue.finalizing`, `issue.uploadCancel`, `issue.uploadRetry`, `issue.uploadFailed`, `issue.uploadTooLarge`, `issue.largeUploadHint`, `issue.resume`, `issue.resumeUploadAvailable`. All must exist in BOTH `vi.json` and `en.json`.

## Things easy to get wrong

- ❌ Hardcoding `5 * 1024 * 1024` somewhere — import from `UPLOAD_LIMITS.LARGE_ATTACHMENT.chunkSize`. Drifting from BE = silent mismatch.
- ❌ Storing the `File` object in `localStorage` — browser security forbids. Persist sessionId only; user re-picks file on resume.
- ❌ Showing `${pct}%` while `status === "finalizing"` — bar shows pulsing indeterminate + "Finalizing…" instead.
- ❌ Calling `removePersistedUpload` BEFORE `/complete` succeeds — if BE fails on the last step, user loses ability to resume.
- ❌ Two file inputs both wired to the same `onChange` — pick file via drop zone OR dropdown menu, not both rendering at once.
