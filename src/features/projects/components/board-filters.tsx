"use client";

import { useState } from "react";
import { Search, X, Filter } from "lucide-react";
import { ISSUE_TYPES, PRIORITIES } from "@/lib/constants/issue-config";
import { getInitials, toggleArrayItem } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
}: {
  filters: BoardFilters;
  onChange: (filters: BoardFilters) => void;
  members: UserPreview[];
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
              <Avatar className="h-full w-full">
                <AvatarFallback className="text-[8px]">
                  {getInitials(m.name)}
                </AvatarFallback>
              </Avatar>
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
