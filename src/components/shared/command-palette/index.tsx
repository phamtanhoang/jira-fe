"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  LayoutGrid,
  Bug,
  BookOpen,
  CheckSquare,
  Layers,
  Zap,
  Clock,
  X,
  Hash,
  Loader2,
  Sparkles,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useWorkspaces } from "@/features/workspaces/hooks";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/constants";
import { DEBOUNCE } from "@/lib/constants/ui";
import { useRecents, clearRecents } from "@/lib/utils";
import type { Issue } from "@/features/projects/types";
import type { Workspace } from "@/features/workspaces/types";

const ISSUE_ICONS: Record<string, React.ElementType> = {
  EPIC: Zap,
  STORY: BookOpen,
  BUG: Bug,
  TASK: CheckSquare,
  SUBTASK: Layers,
};

// Match issue key pattern (e.g. PROJ-42). When a user types something
// that looks like a key, we resolve it directly via the by-key endpoint
// — much cheaper than full text search.
const ISSUE_KEY_REGEX = /^[A-Z]{2,5}-\d+$/i;

// BE-side global text search requires at least 2 characters (avoids
// scanning the whole issue table on a single letter). Match that here so
// we never fire a query the server will reject.
const MIN_SEARCH_CHARS = 2;

export function CommandPalette() {
  const router = useRouter();
  const { t } = useAppStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [searching, setSearching] = useState(false);
  const { data: workspaces } = useWorkspaces();
  const recents = useRecents();

  const trimmed = query.trim();
  const showRecents = open && trimmed.length === 0 && recents.length > 0;

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Debounced search — issues only. Workspace search is client-side
  // because the workspace list is already in cache.
  useEffect(() => {
    if (trimmed.length === 0) {
      setIssues([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        // Issue-key shortcut: typing "PROJ-42" jumps straight to the
        // by-key endpoint. Faster, exact, no scan.
        if (ISSUE_KEY_REGEX.test(trimmed)) {
          const res = await api.get<Issue>(
            ENDPOINTS.issues.byKey(trimmed.toUpperCase()),
          );
          setIssues(res.data ? [res.data] : []);
          return;
        }
        // Otherwise: global text search against summary + description.
        // BE filters by membership server-side and rejects <2 chars.
        if (trimmed.length < MIN_SEARCH_CHARS) {
          setIssues([]);
          return;
        }
        const res = await api.get<Issue[]>(ENDPOINTS.issues.base, {
          params: { search: trimmed, take: 10 },
        });
        setIssues(Array.isArray(res.data) ? res.data.slice(0, 10) : []);
      } catch {
        // 404 / 403 / etc. — surface as "no results" rather than a toast.
        // Global search failures shouldn't pop a generic error message.
        setIssues([]);
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE.SEARCH);

    return () => clearTimeout(timer);
  }, [trimmed]);

  const handleSelect = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery("");
      router.push(path);
    },
    [router],
  );

  // Filter workspaces client-side. Empty query → top 5 recent.
  const filteredWorkspaces = useMemo(() => {
    const all = workspaces ?? [];
    if (!trimmed) return all.slice(0, 5);
    const lower = trimmed.toLowerCase();
    return all
      .filter((ws: Workspace) => ws.name.toLowerCase().includes(lower))
      .slice(0, 5);
  }, [workspaces, trimmed]);

  const hasAnyResult =
    issues.length > 0 || filteredWorkspaces.length > 0 || showRecents;
  const isTooShort =
    trimmed.length > 0 &&
    trimmed.length < MIN_SEARCH_CHARS &&
    !ISSUE_KEY_REGEX.test(trimmed);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-1.5 text-[12px] text-muted-foreground shadow-xs transition-all hover:bg-muted hover:shadow-sm dark:bg-muted/20 dark:hover:bg-muted/40"
      >
        <Search className="h-3.5 w-3.5" />
        <span>{t("common.search")}</span>
        <kbd className="ml-4 rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/70">
          Ctrl K
        </kbd>
      </button>

      {/* Dialog overlay — z-[200] so it sits above sticky headers, dropdowns,
          and any other z-50 popovers in the app. */}
      {open && (
        <div className="fixed inset-0 z-200 flex items-start justify-center pt-[15vh]">
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 supports-backdrop-filter:backdrop-blur-sm"
            onClick={() => {
              setOpen(false);
              setQuery("");
            }}
          />
          <Command
            className="relative z-10 mx-4 w-full max-w-xl overflow-hidden rounded-2xl border bg-popover shadow-2xl dark:shadow-none"
            shouldFilter={false}
          >
            {/* Input */}
            <div className="flex items-center gap-2.5 border-b px-4">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder={t("search.placeholder")}
                className="h-12 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground/50"
              />
              {searching && (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground/60" />
              )}
              {trimmed && !searching && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded p-0.5 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={t("common.clear")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Results */}
            <Command.List className="max-h-[60vh] overflow-auto p-1.5">
              {/* Empty + hint states. cmdk's <Command.Empty> only renders
                  when there are no items — we provide custom messages
                  for: 1) typing too short, 2) no matches, 3) idle state
                  with no recents. */}
              {isTooShort ? (
                <div className="flex flex-col items-center gap-1.5 py-10 text-center">
                  <Sparkles className="h-5 w-5 text-muted-foreground/40" />
                  <p className="text-[13px] text-muted-foreground">
                    {t("search.keepTyping")}
                  </p>
                </div>
              ) : !hasAnyResult && trimmed && !searching ? (
                <div className="flex flex-col items-center gap-1.5 py-10 text-center">
                  <Search className="h-5 w-5 text-muted-foreground/40" />
                  <p className="text-[13px] text-muted-foreground">
                    {t("search.noResultsFor", { query: trimmed })}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60">
                    {t("search.tryDifferent")}
                  </p>
                </div>
              ) : !hasAnyResult && !searching ? (
                <div className="flex flex-col items-center gap-1.5 py-10 text-center">
                  <Search className="h-5 w-5 text-muted-foreground/40" />
                  <p className="text-[13px] text-muted-foreground">
                    {t("search.startTyping")}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60">
                    {t("search.searchHint")}
                  </p>
                </div>
              ) : null}

              {/* Recent items — shown only when query is empty */}
              {showRecents && (
                <Command.Group
                  heading={
                    <div className="flex items-center justify-between px-2.5 py-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                        {t("common.recent")}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearRecents();
                        }}
                        className="flex items-center gap-1 rounded text-[10px] text-muted-foreground/60 transition-colors hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                        {t("common.clear")}
                      </button>
                    </div>
                  }
                >
                  {recents.map((item) => {
                    if (item.type === "ISSUE") {
                      const Icon =
                        ISSUE_ICONS[item.issueType ?? ""] ?? CheckSquare;
                      return (
                        <Command.Item
                          key={`ISSUE:${item.id}`}
                          value={`recent-${item.id}`}
                          onSelect={() => handleSelect(ROUTES.ISSUE(item.key))}
                          className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors aria-selected:bg-accent"
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="shrink-0 font-medium text-muted-foreground">
                            {item.key}
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {item.summary}
                          </span>
                          <Clock className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                        </Command.Item>
                      );
                    }
                    return (
                      <Command.Item
                        key={`PROJECT:${item.id}`}
                        value={`recent-${item.id}`}
                        onSelect={() =>
                          handleSelect(
                            ROUTES.BOARD(item.workspaceId, item.id),
                          )
                        }
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors aria-selected:bg-accent"
                      >
                        <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="shrink-0 font-medium text-muted-foreground">
                          {item.key}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {item.name}
                        </span>
                        <Clock className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              )}

              {/* Issues */}
              {issues.length > 0 && (
                <Command.Group
                  heading={
                    <div className="flex items-center justify-between px-2.5 py-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                        {t("issue.issues")}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50">
                        {issues.length}
                      </span>
                    </div>
                  }
                >
                  {issues.map((issue) => {
                    const Icon = ISSUE_ICONS[issue.type] ?? CheckSquare;
                    return (
                      <Command.Item
                        key={issue.id}
                        value={issue.key}
                        onSelect={() => handleSelect(ROUTES.ISSUE(issue.key))}
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors aria-selected:bg-accent"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="shrink-0 font-mono text-[11px] font-medium text-muted-foreground">
                          {issue.key}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {issue.summary}
                        </span>
                        {issue.boardColumn && (
                          <span className="ml-auto shrink-0 rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {issue.boardColumn.name}
                          </span>
                        )}
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              )}

              {/* Workspaces */}
              {filteredWorkspaces.length > 0 && (
                <Command.Group
                  heading={
                    <div className="flex items-center justify-between px-2.5 py-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                        {t("nav.workspaces")}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50">
                        {filteredWorkspaces.length}
                      </span>
                    </div>
                  }
                >
                  {filteredWorkspaces.map((ws: Workspace) => (
                    <Command.Item
                      key={ws.id}
                      value={`ws-${ws.id}`}
                      onSelect={() => handleSelect(ROUTES.WORKSPACE(ws.id))}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors aria-selected:bg-accent"
                    >
                      <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{ws.name}</span>
                      {ws._count?.projects !== undefined && (
                        <span className="ml-auto shrink-0 text-[10px] text-muted-foreground/60">
                          {t("search.projectsCount", {
                            count: String(ws._count.projects),
                          })}
                        </span>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t bg-muted/30 px-4 py-2 text-[10px] text-muted-foreground/70 dark:bg-muted/10">
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-background px-1 font-mono">
                  ↑↓
                </kbd>
                {t("search.navigate")}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-background px-1 font-mono">
                  ↵
                </kbd>
                {t("search.select")}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-background px-1 font-mono">
                  esc
                </kbd>
                {t("search.close")}
              </span>
              <span className="ml-auto flex items-center gap-1 text-[9px]">
                <Hash className="h-2.5 w-2.5" />
                {t("search.keyHint")}
              </span>
            </div>
          </Command>
        </div>
      )}
    </>
  );
}
