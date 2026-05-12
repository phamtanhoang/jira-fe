"use client";

import { useState, useMemo } from "react";
import { Plus, X, Tag } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  useLabels,
  useAddIssueLabel,
  useRemoveIssueLabel,
} from "../hooks";
import type { Issue } from "../types";

/**
 * Inline labels editor for the issue detail sidebar.
 *
 * Renders the issue's current labels as chips with an inline ✕ remove button,
 * plus a "+ Add" affordance that opens a searchable picker over the project's
 * label catalog. Clicking a catalog item toggles assignment.
 */
export function IssueLabelsSection({ issue }: { issue: Issue }) {
  const { t } = useAppStore();
  const projectId = issue.projectId;
  const { data: allLabels = [], isLoading: loadingCatalog } =
    useLabels(projectId);
  const addLabel = useAddIssueLabel(issue.id, projectId);
  const removeLabel = useRemoveIssueLabel(issue.id, projectId);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const assignedIds = useMemo(
    () => new Set(issue.labels?.map((il) => il.label.id) ?? []),
    [issue.labels],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allLabels;
    return allLabels.filter((l) => l.name.toLowerCase().includes(q));
  }, [allLabels, search]);

  const toggle = (labelId: string) => {
    if (assignedIds.has(labelId)) {
      removeLabel.mutate(labelId);
    } else {
      addLabel.mutate(labelId);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {issue.labels?.map((il) => (
          <span
            key={il.label.id}
            className="group/chip inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium"
            style={{
              backgroundColor: `${il.label.color}20`,
              color: il.label.color,
            }}
          >
            {il.label.name}
            <button
              type="button"
              onClick={() => removeLabel.mutate(il.label.id)}
              className="ml-0.5 rounded-sm p-0.5 opacity-60 transition-opacity hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
              aria-label={t("label.remove", { name: il.label.name })}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            className="inline-flex items-center gap-1 rounded-sm border border-dashed border-border px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            aria-label={t("label.addLabel")}
          >
            <Plus className="h-3 w-3" />
            {issue.labels && issue.labels.length > 0
              ? t("label.add")
              : t("label.addLabel")}
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-0">
            <div className="border-b p-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("label.searchPlaceholder")}
                autoFocus
                className="h-8 text-sm"
              />
            </div>
            <div className="max-h-60 overflow-auto p-1">
              {loadingCatalog ? (
                <div className="py-4 text-center">
                  <Spinner className="mx-auto h-4 w-4" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-1.5 py-6 text-center text-muted-foreground">
                  <Tag className="h-5 w-5 opacity-40" />
                  <p className="text-xs">
                    {search ? t("label.noResults") : t("label.emptyTitle")}
                  </p>
                  <p className="text-[11px]">{t("label.manageHint")}</p>
                </div>
              ) : (
                filtered.map((label) => {
                  const checked = assignedIds.has(label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => toggle(label.id)}
                      className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent ${
                        checked ? "bg-accent/50" : ""
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="flex-1 truncate">{label.name}</span>
                      {checked && (
                        <span className="text-[10px] font-medium text-primary">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
