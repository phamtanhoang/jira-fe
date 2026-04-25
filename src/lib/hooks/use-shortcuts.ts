"use client";

import { useEffect } from "react";

// Custom event names dispatched by global shortcut handler.
// Components subscribe to these instead of binding their own keydown
// listeners — keeps a single source of truth.
export const SHORTCUT_EVENTS = {
  OPEN_CREATE_ISSUE: "shortcuts:open-create-issue",
  TOGGLE_CHEATSHEET: "shortcuts:toggle-cheatsheet",
} as const;

export type ShortcutAction =
  | { kind: "navigate"; path: string }
  | { kind: "event"; name: string };

// Two-key "leader" sequences (g + X) are matched within this window.
const LEADER_TIMEOUT_MS = 800;

function dispatch(name: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name));
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

type Bindings = {
  // Single-key bindings (e.g. "?" for cheatsheet, "c" for create issue)
  single?: Record<string, ShortcutAction>;
  // Leader sequences keyed by leader key. e.g. { g: { d: navigate, p: navigate } }
  leader?: Record<string, Record<string, ShortcutAction>>;
};

export function useShortcuts(
  bindings: Bindings,
  navigate: (path: string) => void,
) {
  useEffect(() => {
    let leaderKey: string | null = null;
    let leaderTimer: ReturnType<typeof setTimeout> | null = null;

    function clearLeader() {
      leaderKey = null;
      if (leaderTimer) {
        clearTimeout(leaderTimer);
        leaderTimer = null;
      }
    }

    function run(action: ShortcutAction) {
      if (action.kind === "navigate") navigate(action.path);
      else dispatch(action.name);
    }

    function onKeyDown(e: KeyboardEvent) {
      // Skip when typing — but still allow "?" since users may want it
      // anywhere except input fields.
      if (isEditableTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      // Continue an in-flight leader sequence.
      if (leaderKey && bindings.leader?.[leaderKey]?.[key]) {
        e.preventDefault();
        run(bindings.leader[leaderKey][key]);
        clearLeader();
        return;
      }
      // A new leader keypress arms the sequence.
      if (bindings.leader?.[key]) {
        clearLeader();
        leaderKey = key;
        leaderTimer = setTimeout(clearLeader, LEADER_TIMEOUT_MS);
        return;
      }
      // Single-key bindings — "?" needs the original e.key to preserve case.
      const rawKey = e.key === "?" ? "?" : key;
      if (bindings.single?.[rawKey]) {
        e.preventDefault();
        run(bindings.single[rawKey]);
        clearLeader();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      clearLeader();
    };
  }, [bindings, navigate]);
}

// Subscribe to a shortcut-emitted event. Returns an unsubscribe.
export function onShortcutEvent(name: string, handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(name, handler);
  return () => window.removeEventListener(name, handler);
}
