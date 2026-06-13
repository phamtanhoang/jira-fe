"use client";

import type { QueryClient, QueryKey } from "@tanstack/react-query";

/**
 * Cross-tab cache invalidation via BroadcastChannel.
 *
 * Problem: TanStack Query lives in each tab's RAM. Tab A creates an issue,
 * tab B is on the board page — until B does a window-focus refetch or a
 * staleTime expires, B shows the stale list. For typical SaaS work where
 * users have multiple tabs open on the same project, that lag is jarring.
 *
 * Solution: every mutation posts the invalidated query keys to a
 * BroadcastChannel; every tab subscribes and calls `invalidateQueries` on
 * receive. The channel is bounded to the same origin (security free) and
 * works offline (just a postMessage between tabs).
 *
 * Falls back silently in browsers without BroadcastChannel (everything
 * except IE).
 *
 * Pairs with `refetchOnWindowFocus: true` on domain data — the channel
 * covers "tab B is visible" while focus-refetch covers "tab B was hidden
 * and just regained focus".
 */
const CHANNEL_NAME = "jira:queries:v1";

type InvalidateMessage = {
  kind: "invalidate";
  keys: QueryKey[];
};

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (typeof BroadcastChannel === "undefined") return null;
  if (channel) return channel;
  channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

/**
 * Broadcast a set of query keys to OTHER tabs so they invalidate. The
 * sending tab still needs to invalidate locally (handled by the React
 * Query mutation's own onSettled / useInvalidatingMutation).
 */
export function broadcastInvalidate(keys: QueryKey[]): void {
  const ch = getChannel();
  if (!ch || keys.length === 0) return;
  const msg: InvalidateMessage = { kind: "invalidate", keys };
  try {
    ch.postMessage(msg);
  } catch {
    // BroadcastChannel throws if the structured clone fails — keys
    // should always be cloneable but guard so a stray non-clone value
    // can't crash mutations.
  }
}

/**
 * Subscribe a QueryClient to remote invalidations. Returns an unsubscribe.
 * Designed to be called once from QueryProvider.
 */
export function subscribeBroadcast(queryClient: QueryClient): () => void {
  const ch = getChannel();
  if (!ch) return () => {};
  function onMessage(ev: MessageEvent<InvalidateMessage>) {
    const data = ev.data;
    if (!data || data.kind !== "invalidate" || !Array.isArray(data.keys)) {
      return;
    }
    for (const key of data.keys) {
      // `exact: false` makes `["issues"]` invalidate every `["issues", *]`
      // variant — same semantics as a same-tab partial-prefix invalidate.
      queryClient.invalidateQueries({ queryKey: key, exact: false });
    }
  }
  ch.addEventListener("message", onMessage);
  return () => ch.removeEventListener("message", onMessage);
}
