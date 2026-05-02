"use client";

import { useState } from "react";
import { Search, X, Filter } from "lucide-react";
import { ISSUE_TYPES, PRIORITIES } from "@/lib/constants/issue-config";
import { toggleArrayItem } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useCustomFields } from "@/features/custom-fields/hooks";
import type { CustomFieldDef } from "@/features/custom-fields/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { matchesCustomFieldFilters } from "@/lib/utils/custom-field-filters";
import { SavedFiltersMenu } from "./saved-filters-menu";
import type { UserPreview } from "../types";

export type BoardFilters = {
  search: string;
  types: string[];
  priorities: string[];
  assigneeIds: string[];
  /**
   * Per custom-field filter values, keyed by `CustomFieldDef.id`.
   * - TEXT: substring (case-insensitive)
   * - NUMBER: exact match (string-encoded for serialisation)
   * - DATE: ISO date — matches the same calendar day
   * - SELECT / MULTI_SELECT: array of allowed option values; any-of match
   */
  customFields: Record<string, string | string[]>;
};

const EMPTY_FILTERS: BoardFilters = {
  search: "",
  types: [],
  priorities: [],
  assigneeIds: [],
  customFields: {},
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
  const { data: customFields } = useCustomFields(projectId);

  const customFieldCount = Object.values(filters.customFields ?? {}).filter(
    (v) => (Array.isArray(v) ? v.length > 0 : !!v),
  ).length;
  const hasFilters =
    filters.types.length > 0 ||
    filters.priorities.length > 0 ||
    filters.assigneeIds.length > 0 ||
    customFieldCount > 0;

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
              {filters.types.length +
                filters.priorities.length +
                filters.assigneeIds.length +
                customFieldCount}
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

          {customFields && customFields.length > 0 && (
            <CustomFieldFilters
              fields={customFields}
              values={filters.customFields ?? {}}
              onChange={(next) =>
                onChange({ ...filters, customFields: next })
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

function CustomFieldFilters({
  fields,
  values,
  onChange,
}: {
  fields: CustomFieldDef[];
  values: Record<string, string | string[]>;
  onChange: (next: Record<string, string | string[]>) => void;
}) {
  const { t } = useAppStore();
  const setValue = (id: string, value: string | string[] | undefined) => {
    const next = { ...values };
    if (
      value === undefined ||
      (Array.isArray(value) ? value.length === 0 : value === "")
    ) {
      delete next[id];
    } else {
      next[id] = value;
    }
    onChange(next);
  };

  return (
    <div className="basis-full border-t pt-3">
      <span className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
        {t("filter.customFields")}
      </span>
      <div className="flex flex-wrap gap-3">
        {fields.map((field) => {
          const v = values[field.id];
          if (field.type === "TEXT" || field.type === "NUMBER") {
            return (
              <div key={field.id} className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">
                  {field.name}
                </span>
                <Input
                  type={field.type === "NUMBER" ? "number" : "text"}
                  value={typeof v === "string" ? v : ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  className="h-6 w-32 text-[11px]"
                  placeholder={t("filter.anyValue")}
                />
              </div>
            );
          }
          if (field.type === "DATE") {
            return (
              <div key={field.id} className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">
                  {field.name}
                </span>
                <Input
                  type="date"
                  value={typeof v === "string" ? v : ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  className="h-6 w-36 text-[11px]"
                />
              </div>
            );
          }
          // SELECT / MULTI_SELECT
          const selected = new Set(
            Array.isArray(v) ? v : typeof v === "string" && v ? [v] : [],
          );
          return (
            <div key={field.id}>
              <span className="mb-1 block text-[10px] text-muted-foreground">
                {field.name}
              </span>
              <div className="flex flex-wrap gap-1">
                {field.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      const next = new Set(selected);
                      if (next.has(opt)) {
                        next.delete(opt);
                      } else {
                        next.add(opt);
                      }
                      setValue(
                        field.id,
                        next.size === 0 ? undefined : Array.from(next),
                      );
                    }}
                    className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                      selected.has(opt)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { EMPTY_FILTERS };

export { matchesCustomFieldFilters };
