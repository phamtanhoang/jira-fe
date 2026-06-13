"use client";

import { useEffect, useRef } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";

/**
 * Realtime event vocabulary — mirror of `jira-be/src/modules/events/events.types.ts`.
 * When adding a new event type, update BOTH sides in the same change.
 */
export type RealtimeEventType =
  | "issue.updated"
  | "issue.created"
  | "issue.deleted"
  | "issue.moved"
  | "comment.added"
  | "comment.updated"
  | "comment.deleted"
  | "attachment.added"
  | "attachment.deleted"
  | "sprint.updated"
  | "board.changed"
  | "notification.created"
  | "worklog.changed";

export interface RealtimeEvent {
  type: RealtimeEventType;
  actorId: string;
  workspaceId?: string;
  projectId?: string;
  issueId?: string;
  issueKey?: string;
  data?: Record<string, unknown>;
}

/**
 * Subscribe to a Server-Sent Events channel and invalidate React Query
 * cache keys on each event.
 *
 * Usage:
 * ```ts
 * useRealtime("/events/issue/" + issueId, (event) => {
 *   if (event.type === "comment.added") return [["comments", issueId]];
 *   if (event.type === "issue.updated") return [["issue", event.issueKey]];
 *   return [];
 * });
 * ```
 *
 * Native EventSource handles reconnect with exponential backoff out of
 * the box, so a flaky network just looks like a brief pause. We pass
 * `withCredentials: true` so the httpOnly auth cookie rides along (SSE
 * can't add Authorization headers).
 *
 * The hook holds an `enabled` argument so callers can keep the channel
 * URL stable while gating the subscription (e.g. skip when issue not
 * loaded yet).
 */
export function useRealtime(
  channelPath: string | null,
  resolveKeys: (event: RealtimeEvent) => QueryKey[],
  options?: { enabled?: boolean },
): void {
  const queryClient = useQueryClient();
  // Hold the resolver in a ref so the EventSource isn't torn down + rebuilt
  // every render — only the URL change should reconnect.
  const resolveRef = useRef(resolveKeys);
  useEffect(() => {
    resolveRef.current = resolveKeys;
  }, [resolveKeys]);

  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled || !channelPath) return;
    if (typeof window === "undefined") return;
    if (typeof EventSource === "undefined") return;

    // Build absolute URL — `/api/events/...` proxies to BE via Next
    // rewrite. EventSource needs absolute or rooted URLs (no relative).
    const url = channelPath.startsWith("/api")
      ? channelPath
      : `/api${channelPath.startsWith("/") ? "" : "/"}${channelPath}`;

    const source = new EventSource(url, { withCredentials: true });

    function onMessage(ev: MessageEvent<string>) {
      try {
        const event = JSON.parse(ev.data) as RealtimeEvent;
        const keys = resolveRef.current(event);
        for (const key of keys) {
          queryClient.invalidateQueries({ queryKey: key, exact: false });
        }
      } catch {
        // Malformed payload — drop silently. Don't crash the consumer
        // because one stray byte arrived.
      }
    }

    source.addEventListener("message", onMessage);
    return () => {
      source.removeEventListener("message", onMessage);
      source.close();
    };
  }, [channelPath, enabled, queryClient]);
}
