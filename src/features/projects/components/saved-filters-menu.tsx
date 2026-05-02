"use client";

import { useState } from "react";
import { Bookmark, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useCurrentUser } from "@/features/auth/hooks";
import {
  useSavedFilters,
  useCreateSavedFilter,
  useDeleteSavedFilter,
} from "@/features/saved-filters/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { BoardFilters } from "./board-filters";

// Dropdown that lets the user save the current filter combination and
// re-apply it later. Personal filters appear above shared ones.
export function SavedFiltersMenu({
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
