/**
 * FE-side mirror of the BE `UPLOAD_LIMITS` constants in
 * `jira-be/src/core/constants/upload.constant.ts`. Used for pre-upload
 * validation and to decide when a file should go through the chunked
 * (large) upload pipeline instead of the single-shot one.
 *
 * Keep in sync with BE. If BE changes a number, change it here too.
 */

const MB = 1024 * 1024;

export const UPLOAD_LIMITS = {
  /** Single-shot attachment limits — POST /issues/:id/attachments. */
  ATTACHMENT: {
    maxSize: 10 * MB,
    maxFiles: 10,
  },
  /** Chunked / resumable attachment limits — POST /attachments/large/*. */
  LARGE_ATTACHMENT: {
    maxSize: 200 * MB,
    chunkSize: 5 * MB,
    /** Concurrency cap when uploading chunks in parallel. */
    parallelChunks: 3,
  },
  AVATAR: {
    maxSize: 2 * MB,
  },
  LOGO: {
    maxSize: 2 * MB,
  },
} as const;

/** True when the file must go through the chunked upload pipeline. */
export function isLargeAttachment(file: File): boolean {
  return file.size > UPLOAD_LIMITS.ATTACHMENT.maxSize;
}

/** True when the file is too big even for chunked upload. */
export function exceedsLargeAttachment(file: File): boolean {
  return file.size > UPLOAD_LIMITS.LARGE_ATTACHMENT.maxSize;
}
