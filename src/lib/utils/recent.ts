"use client";

// localStorage-backed ring buffer of the user's recently-opened entities.
// Used by Cmd+K to render "Recent" when input is empty. Keep dependencies
// minimal — this is loaded by the global header.

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "recent-items.v1";
const MAX_ITEMS = 10;
const STORAGE_EVENT = "recent-items:change";

export type RecentIssue = {
  type: "ISSUE";
  id: string;
  key: string;
  summary: string;
  issueType?: string;
  openedAt: number;
};

export type RecentProject = {
  type: "PROJECT";
  id: string;
  name: string;
  key: string;
  workspaceId: string;
  openedAt: number;
};

export type RecentItem = RecentIssue | RecentProject;

function isClient() {
  return typeof window !== "undefined";
}

function readRaw(): RecentItem[] {
  if (!isClient()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RecentItem[];
  } catch {
    return [];
  }
}

// Snapshot cache: useSyncExternalStore polls getSnapshot every render and
// re-renders whenever the returned reference changes (Object.is). readRaw()
// allocates a fresh array each call, so without caching React would treat
// every snapshot as new → infinite render loop. We invalidate the cache only
// when push/clear runs (or another tab fires a storage event).
let cachedSnapshot: RecentItem[] = [];
let snapshotDirty = true;

function invalidateSnapshot() {
  snapshotDirty = true;
}

function getSnapshot(): RecentItem[] {
  if (!snapshotDirty) return cachedSnapshot;
  cachedSnapshot = readRaw();
  snapshotDirty = false;
  return cachedSnapshot;
}

function writeRaw(items: RecentItem[]) {
  if (!isClient()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    invalidateSnapshot();
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
  } catch {
    // Quota exceeded or storage disabled — silent
  }
}

function dedupKey(item: RecentItem) {
  return `${item.type}:${item.id}`;
}

// `Omit<RecentItem, "openedAt">` flattens the discriminated union and loses
// the per-variant fields (TS distributes Omit only for some union shapes).
// Spelling out each variant keeps the discrimination intact for callers.
export type PushRecentInput =
  | Omit<RecentIssue, "openedAt">
  | Omit<RecentProject, "openedAt">;

export function pushRecent(item: PushRecentInput) {
  const next: RecentItem = { ...item, openedAt: Date.now() };
  const existing = readRaw();
  const filtered = existing.filter((x) => dedupKey(x) !== dedupKey(next));
  const merged = [next, ...filtered].slice(0, MAX_ITEMS);
  writeRaw(merged);
}

export function clearRecents() {
  writeRaw([]);
}

export function getRecents(): RecentItem[] {
  return readRaw();
}

// Subscribe to changes so React components re-render when push/clear happens
// in the same tab (storage event only fires for cross-tab changes). Always
// invalidate the cache before notifying so the next getSnapshot reads fresh
// data — without this, a `storage` event from another tab would notify React
// but getSnapshot would still return the stale cached array.
function subscribe(callback: () => void) {
  if (!isClient()) return () => {};
  function onChange() {
    invalidateSnapshot();
    callback();
  }
  window.addEventListener(STORAGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(STORAGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const EMPTY: RecentItem[] = [];

export function useRecents(): RecentItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}
