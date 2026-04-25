"use client";

import { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useWorkspaces } from "@/features/workspaces/hooks";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/constants";
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

// Match issue key pattern: 2-5 uppercase letters + dash + number
const ISSUE_KEY_REGEX = /^[A-Z]{2,5}-\d+$/i;

export function CommandPalette() {
  const router = useRouter();
  const { t } = useAppStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [searching, setSearching] = useState(false);
  const { data: workspaces } = useWorkspaces();
  const recents = useRecents();
  const showRecents = open && !query.trim() && recents.length > 0;

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

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setIssues([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const trimmed = query.trim();

        // If matches issue key pattern (e.g. PROJ-42), search by key directly
        if (ISSUE_KEY_REGEX.test(trimmed)) {
          const res = await api.get<Issue>(ENDPOINTS.issues.byKey(trimmed.toUpperCase()));
          setIssues(res.data ? [res.data] : []);
        } else {
          // Text search — no global search API, so skip issues
          // Only workspace search happens client-side below
          setIssues([]);
        }
      } catch {
        setIssues([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery("");
      router.push(path);
    },
    [router],
  );

  // Filter workspaces client-side
  const filteredWorkspaces = query.trim()
    ? (workspaces ?? []).filter((ws: Workspace) =>
        ws.name.toLowerCase().includes(query.toLowerCase()),
      )
    : (workspaces ?? []).slice(0, 5);

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

      {/* Dialog overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          <div
            className="fixed inset-0 bg-black/40 dark:bg-black/60 supports-backdrop-filter:backdrop-blur-sm"
            onClick={() => { setOpen(false); setQuery(""); }}
          />
          <Command
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border bg-popover shadow-2xl dark:shadow-none"
            shouldFilter={false}
          >
            {/* Input */}
            <div className="flex items-center gap-2.5 border-b px-4">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder={t("common.search") + "..."}
                className="h-12 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground/50"
              />
              {searching && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
              )}
            </div>

            {/* Results */}
            <Command.List className="max-h-80 overflow-auto p-1.5">
              {!showRecents && (
                <Command.Empty className="py-8 text-center text-[13px] text-muted-foreground">
                  {t("common.noResults")}
                </Command.Empty>
              )}

              {/* Recent items — shown only when query is empty */}
              {showRecents && (
                <Command.Group
                  heading={
                    <div className="flex items-center justify-between px-2.5 py-1">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {t("common.recent")}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearRecents();
                        }}
                        className="flex items-center gap-1 rounded text-[10px] text-muted-foreground/70 hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                        {t("common.clear")}
                      </button>
                    </div>
                  }
                >
                  {recents.map((item) => {
                    if (item.type === "ISSUE") {
                      const Icon = ISSUE_ICONS[item.issueType ?? ""] ?? CheckSquare;
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
                <Command.Group heading={
                  <span className="px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    Issues
                  </span>
                }>
                  {issues.slice(0, 8).map((issue) => {
                    const Icon = ISSUE_ICONS[issue.type] ?? CheckSquare;
                    return (
                      <Command.Item
                        key={issue.id}
                        value={issue.key}
                        onSelect={() => handleSelect(ROUTES.ISSUE(issue.key))}
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors aria-selected:bg-accent"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="shrink-0 font-medium text-muted-foreground">{issue.key}</span>
                        <span className="min-w-0 flex-1 truncate">{issue.summary}</span>
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              )}

              {/* Workspaces */}
              {filteredWorkspaces.length > 0 && (
                <Command.Group heading={
                  <span className="px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {t("nav.workspaces")}
                  </span>
                }>
                  {filteredWorkspaces.slice(0, 5).map((ws: Workspace) => (
                    <Command.Item
                      key={ws.id}
                      value={ws.name}
                      onSelect={() => handleSelect(ROUTES.WORKSPACE(ws.id))}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors aria-selected:bg-accent"
                    >
                      <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{ws.name}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>

            {/* Footer */}
            <div className="flex items-center gap-4 border-t px-4 py-2 text-[10px] text-muted-foreground/60">
              <span><kbd className="rounded border px-1 font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="rounded border px-1 font-mono">↵</kbd> select</span>
              <span><kbd className="rounded border px-1 font-mono">esc</kbd> close</span>
              <span className="ml-auto text-[9px]">Type issue key (e.g. PROJ-1) to search</span>
            </div>
          </Command>
        </div>
      )}
    </>
  );
}
