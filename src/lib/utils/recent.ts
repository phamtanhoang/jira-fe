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

function writeRaw(items: RecentItem[]) {
  if (!isClient()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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
// in the same tab (storage event only fires for cross-tab changes).
function subscribe(callback: () => void) {
  if (!isClient()) return () => {};
  window.addEventListener(STORAGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(STORAGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

const EMPTY: RecentItem[] = [];

export function useRecents(): RecentItem[] {
  return useSyncExternalStore(
    subscribe,
    () => readRaw(),
    () => EMPTY,
  );
}
