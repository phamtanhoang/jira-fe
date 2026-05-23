/**
 * Local persistence for in-flight large uploads, so that the FE can offer
 * to resume them after page reload, tab close, dead battery, etc.
 *
 * Storage shape: a single localStorage key holding a map of pending
 * uploads keyed by `sessionId`. Each entry remembers enough metadata to
 * (a) display "resume X" in the UI, (b) verify the user re-picks the
 * same file (name + size match before resuming), and (c) skip already-
 * uploaded chunks once /status confirms them.
 *
 * File data itself is NEVER persisted — browser security forbids it.
 * Resume requires the user to re-select the same file from disk.
 */

const STORAGE_KEY = "jira:pending-large-uploads:v1";

export type PersistedUpload = {
  sessionId: string;
  issueId: string;
  /** Original filename, used to confirm the user re-picks the same file. */
  fileName: string;
  fileSize: number;
  mimeType: string;
  /** Server expiry (ISO string) — entries past this are dropped on read. */
  expiresAt: string;
  /** Wall-clock when the entry was last touched, for UI sorting. */
  updatedAt: number;
};

function readMap(): Record<string, PersistedUpload> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    // Drop expired entries proactively so consumers don't have to.
    const now = Date.now();
    const out: Record<string, PersistedUpload> = {};
    for (const [id, entry] of Object.entries(
      parsed as Record<string, PersistedUpload>,
    )) {
      if (!entry || typeof entry !== "object") continue;
      const expires = new Date(entry.expiresAt).getTime();
      if (Number.isFinite(expires) && expires > now) {
        out[id] = entry;
      }
    }
    return out;
  } catch {
    // Corrupt JSON — wipe it so we don't keep failing.
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return {};
  }
}

function writeMap(map: Record<string, PersistedUpload>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* localStorage quota or disabled — accept loss of resume capability */
  }
}

export function savePersistedUpload(entry: PersistedUpload): void {
  const map = readMap();
  map[entry.sessionId] = { ...entry, updatedAt: Date.now() };
  writeMap(map);
}

export function removePersistedUpload(sessionId: string): void {
  const map = readMap();
  if (sessionId in map) {
    delete map[sessionId];
    writeMap(map);
  }
}

export function listPersistedUploads(issueId?: string): PersistedUpload[] {
  const map = readMap();
  const all = Object.values(map);
  const filtered = issueId ? all.filter((e) => e.issueId === issueId) : all;
  return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
}

/** True iff the picked file matches what we persisted (name + size). */
export function fileMatchesPersisted(
  file: File,
  entry: PersistedUpload,
): boolean {
  return file.name === entry.fileName && file.size === entry.fileSize;
}

/**
 * Best-effort `navigator.sendBeacon` to the BE abort endpoint for every
 * in-flight session. Browser guarantees the request is queued even as
 * the page is being torn down. We do NOT remove the entry from
 * localStorage here — the next time the page mounts, the resume logic
 * will probe the server and clean up entries that are already gone.
 */
export function beaconAbortAll(sessionIds: string[]): void {
  if (typeof navigator === "undefined" || !navigator.sendBeacon) return;
  for (const sessionId of sessionIds) {
    try {
      // Send an empty body. The BE endpoint reads only the URL param.
      navigator.sendBeacon(
        `/api/attachments/large/${encodeURIComponent(sessionId)}/abort-beacon`,
        new Blob([], { type: "application/octet-stream" }),
      );
    } catch {
      /* swallow — beacons are fire-and-forget */
    }
  }
}
