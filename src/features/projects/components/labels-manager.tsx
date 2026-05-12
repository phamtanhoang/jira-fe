"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useAppStore } from "@/lib/stores/use-app-store";
import { handleApiError } from "@/lib/utils";
import {
  useLabels,
  useCreateLabel,
  useUpdateLabel,
  useDeleteLabel,
} from "../hooks";
import type { Label } from "../types";

// Curated palette — keep tight so projects don't drift into 50 near-duplicate
// reds. Matches Jira's tone (saturated mid-lightness).
const LABEL_COLORS = [
  "#0052cc", // blue
  "#36b37e", // green
  "#ff5630", // red
  "#ffab00", // amber
  "#6554c0", // purple
  "#00b8d9", // teal
  "#ff8b00", // orange
  "#42526e", // slate
  "#403294", // indigo
  "#e91e63", // pink
] as const;

const DEFAULT_COLOR = LABEL_COLORS[0];

function ColorSwatch({
  value,
  selected,
  onClick,
}: {
  value: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Color ${value}`}
      aria-pressed={selected}
      className={`h-7 w-7 rounded-md transition-all hover:scale-110 ${
        selected ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
      }`}
      style={{ backgroundColor: value }}
    />
  );
}

function LabelFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  initial?: Label;
  onSubmit: (data: { name: string; color: string }) => void;
  isPending: boolean;
}) {
  const { t } = useAppStore();
  // Form state initialises from `initial` on mount. The parent passes a
  // `key={initial.id}` when editing so this component remounts (and re-runs
  // useState init) when the user switches between labels.
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? DEFAULT_COLOR);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), color });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial ? t("label.edit") : t("label.create")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="label-name" className="text-xs font-medium">
              {t("label.name")}
            </label>
            <Input
              id="label-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              autoFocus
              placeholder={t("label.namePlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{t("label.color")}</label>
            <div className="flex flex-wrap gap-2">
              {LABEL_COLORS.map((c) => (
                <ColorSwatch
                  key={c}
                  value={c}
                  selected={c === color}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="rounded-md border bg-muted/30 p-3">
            <span className="mr-2 text-xs text-muted-foreground">
              {t("common.preview")}:
            </span>
            <span
              className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {name || t("label.namePlaceholder")}
            </span>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending && <Spinner className="mr-2 h-4 w-4" />}
              {initial ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LabelsManager({ projectId }: { projectId: string }) {
  const { t } = useAppStore();
  const { data: labels = [], isLoading } = useLabels(projectId);
  const createLabel = useCreateLabel(projectId);
  const updateLabel = useUpdateLabel(projectId);
  const deleteLabel = useDeleteLabel(projectId);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Label | null>(null);
  const [deletingLabel, setDeletingLabel] = useState<Label | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{t("label.title")}</h3>
          <p className="text-xs text-muted-foreground">
            {t("label.description")}
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t("label.create")}
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center">
          <Spinner className="mx-auto h-5 w-5" />
        </div>
      ) : labels.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={t("label.emptyTitle")}
          description={t("label.emptyDescription")}
          compact
        />
      ) : (
        <div className="divide-y rounded-md border">
          {labels.map((label) => (
            <div
              key={label.id}
              className="group flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-accent/50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-medium"
                  style={{
                    backgroundColor: `${label.color}20`,
                    color: label.color,
                  }}
                >
                  {label.name}
                </span>
                {label._count?.issues != null && (
                  <span className="text-xs text-muted-foreground">
                    {t("label.usageCount", {
                      count: String(label._count.issues),
                    })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setEditing(label)}
                  aria-label={t("common.edit")}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => setDeletingLabel(label)}
                  aria-label={t("common.delete")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <LabelFormDialog
          open
          onOpenChange={(open) => !open && setCreating(false)}
          isPending={createLabel.isPending}
          onSubmit={({ name, color }) => {
            createLabel.mutate(
              { name, color },
              {
                onSuccess: () => setCreating(false),
                onError: handleApiError,
              },
            );
          }}
        />
      )}

      {editing && (
        <LabelFormDialog
          key={editing.id}
          open
          onOpenChange={(open) => !open && setEditing(null)}
          initial={editing}
          isPending={updateLabel.isPending}
          onSubmit={({ name, color }) => {
            updateLabel.mutate(
              { id: editing.id, name, color },
              {
                onSuccess: () => setEditing(null),
                onError: handleApiError,
              },
            );
          }}
        />
      )}

      <ConfirmDialog
        open={!!deletingLabel}
        onOpenChange={(open) => !open && setDeletingLabel(null)}
        title={t("label.deleteConfirmTitle")}
        description={t("label.deleteConfirmDescription", {
          name: deletingLabel?.name ?? "",
        })}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        onConfirm={async () => {
          if (!deletingLabel) return;
          await new Promise<void>((resolve) => {
            deleteLabel.mutate(deletingLabel.id, {
              onSettled: () => {
                setDeletingLabel(null);
                resolve();
              },
              onError: handleApiError,
            });
          });
        }}
      />
    </div>
  );
}
