"use client";

import { useState } from "react";
import { Search, X, Filter, Bookmark, Trash2 } from "lucide-react";
import { ISSUE_TYPES, PRIORITIES } from "@/lib/constants/issue-config";
import { toggleArrayItem } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useCurrentUser } from "@/features/auth/hooks";
import {
  useSavedFilters,
  useCreateSavedFilter,
  useDeleteSavedFilter,
} from "@/features/saved-filters/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { UserPreview } from "../types";

export type BoardFilters = {
  search: string;
  types: string[];
  priorities: string[];
  assigneeIds: string[];
};

const EMPTY_FILTERS: BoardFilters = {
  search: "",
  types: [],
  priorities: [],
  assigneeIds: [],
};

export function BoardFilterBar({
  filters,
  onChange,
  members,
  projectId,
}: {
  filters: BoardFilters;
  onChange: (filters: BoardFilters) => void;
  members: UserPreview[];
  /** When provided, enables Saved Filters UI (load + save current). */
  projectId?: string;
}) {
  const { t } = useAppStore();
  const [showFilters, setShowFilters] = useState(false);

  const hasFilters =
    filters.types.length > 0 ||
    filters.priorities.length > 0 ||
    filters.assigneeIds.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("filter.searchIssues")}
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="h-8 pl-8 text-[12px]"
          />
        </div>

        {/* Filter toggle */}
        <Button
          variant={showFilters ? "secondary" : "ghost"}
          size="xs"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="mr-1 h-3 w-3" />
          {t("filter.filters")}
          {hasFilters && (
            <Badge className="ml-1 h-4 min-w-4 px-1 text-[9px]">
              {filters.types.length + filters.priorities.length + filters.assigneeIds.length}
            </Badge>
          )}
        </Button>

        {/* Assignee quick filters */}
        <div className="flex -space-x-1">
          {members.slice(0, 5).map((m) => (
            <button
              key={m.id}
              onClick={() =>
                onChange({
                  ...filters,
                  assigneeIds: toggleArrayItem(filters.assigneeIds, m.id),
                })
              }
              className={`relative h-6 w-6 rounded-full border-2 transition-all ${
                filters.assigneeIds.includes(m.id)
                  ? "border-primary ring-2 ring-primary/20 z-10"
                  : "border-background hover:border-muted-foreground/30"
              }`}
              title={m.name ?? m.email}
            >
              <UserAvatar
                user={m}
                className="h-full w-full"
                fallbackClassName="text-[8px]"
              />
            </button>
          ))}
        </div>

        {/* Clear */}
        {(hasFilters || filters.search) && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="text-muted-foreground"
          >
            <X className="mr-1 h-3 w-3" />
            {t("common.clear")}
          </Button>
        )}

        {projectId && (
          <SavedFiltersMenu
            projectId={projectId}
            filters={filters}
            onApply={onChange}
          />
        )}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 rounded-lg border bg-card p-3">
          {/* Type */}
          <div>
            <span className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
              {t("filter.type")}
            </span>
            <div className="flex flex-wrap gap-1">
              {ISSUE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    onChange({ ...filters, types: toggleArrayItem(filters.types, t) })
                  }
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    filters.types.includes(t)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <span className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
              {t("filter.priority")}
            </span>
            <div className="flex flex-wrap gap-1">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() =>
                    onChange({ ...filters, priorities: toggleArrayItem(filters.priorities, p) })
                  }
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    filters.priorities.includes(p)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { EMPTY_FILTERS };

// Dropdown that lets the user save the current filter combination and
// re-apply it later. Personal filters appear above shared ones.
function SavedFiltersMenu({
  projectId,
  filters,
  onApply,
}: {
  projectId: string;
  filters: BoardFilters;
  onApply: (filters: BoardFilters) => void;
}) {
  const { t } = useAppStore();
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [savingName, setSavingName] = useState("");
  const [shared, setShared] = useState(false);
  const { data: filterList } = useSavedFilters(projectId);
  const { mutate: createFilter, isPending: creating } =
    useCreateSavedFilter(projectId);
  const { mutate: deleteFilter } = useDeleteSavedFilter(projectId);

  function handleSave() {
    if (!savingName.trim()) return;
    createFilter(
      {
        projectId,
        name: savingName.trim(),
        payload: filters as unknown as Record<string, unknown>,
        shared,
      },
      {
        onSuccess: () => {
          setSavingName("");
          setShared(false);
        },
      },
    );
  }

  const mine = (filterList ?? []).filter((f) => f.ownerId === user?.id);
  const shared_ = (filterList ?? []).filter(
    (f) => f.ownerId !== user?.id && f.shared,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Button render={<PopoverTrigger />} variant="ghost" size="xs">
        <Bookmark className="mr-1 h-3 w-3" />
        {t("filter.savedFilters")}
      </Button>
      <PopoverContent align="end" className="w-72 p-2">
        {mine.length > 0 && (
          <div className="mb-2">
            <div className="mb-1 px-1 text-[10px] font-semibold uppercase text-muted-foreground/70">
              {t("filter.myFilters")}
            </div>
            {mine.map((f) => (
              <SavedFilterRow
                key={f.id}
                name={f.name}
                onApply={() => {
                  onApply(f.payload as unknown as BoardFilters);
                  setOpen(false);
                }}
                onDelete={() => deleteFilter(f.id)}
              />
            ))}
          </div>
        )}
        {shared_.length > 0 && (
          <div className="mb-2">
            <div className="mb-1 px-1 text-[10px] font-semibold uppercase text-muted-foreground/70">
              {t("filter.sharedFilters")}
            </div>
            {shared_.map((f) => (
              <SavedFilterRow
                key={f.id}
                name={f.name}
                subtitle={f.owner?.name ?? f.owner?.email}
                onApply={() => {
                  onApply(f.payload as unknown as BoardFilters);
                  setOpen(false);
                }}
              />
            ))}
          </div>
        )}

        <div className="space-y-2 border-t pt-2">
          <div className="text-[10px] font-semibold uppercase text-muted-foreground/70">
            {t("filter.saveCurrent")}
          </div>
          <Input
            value={savingName}
            onChange={(e) => setSavingName(e.target.value)}
            placeholder={t("filter.filterNamePlaceholder")}
            className="h-7 text-[12px]"
          />
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={shared}
              onChange={(e) => setShared(e.target.checked)}
              className="h-3 w-3"
            />
            {t("filter.shareWithProject")}
          </label>
          <Button
            size="xs"
            onClick={handleSave}
            disabled={!savingName.trim() || creating}
            className="w-full"
          >
            {creating ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SavedFilterRow({
  name,
  subtitle,
  onApply,
  onDelete,
}: {
  name: string;
  subtitle?: string | null;
  onApply: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="group/row flex items-center gap-1 rounded px-1 py-1 hover:bg-muted/40">
      <button
        type="button"
        onClick={onApply}
        className="min-w-0 flex-1 truncate text-left text-[12px]"
      >
        {name}
        {subtitle && (
          <span className="ml-1.5 text-[10px] text-muted-foreground/70">
            · {subtitle}
          </span>
        )}
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-0.5 text-muted-foreground/40 opacity-0 hover:text-destructive group-hover/row:opacity-100"
          aria-label="Delete saved filter"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
