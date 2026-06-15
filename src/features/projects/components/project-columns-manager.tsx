"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Columns3, GripVertical, Plus, Trash2 } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  useAddColumn,
  useBoard,
  useDeleteColumn,
  useReorderColumns,
  useUpdateColumn,
} from "../hooks";
import type { BoardColumn } from "../types";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = ["TODO", "IN_PROGRESS", "DONE"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_BADGES: Record<Category, string> = {
  TODO: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  DONE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

/**
 * Per-project workflow editor. Backed by `BoardColumn` (already dynamic in
 * the schema). Validates that at least one DONE column exists before
 * allowing the deletion of the last one — issues need somewhere to land
 * when marked complete.
 */
export function ProjectColumnsManager({
  projectId,
  canManage,
}: {
  projectId: string;
  canManage: boolean;
}) {
  const { t } = useAppStore();
  const { data: board, isLoading } = useBoard(projectId);
  const addColumn = useAddColumn(projectId);
  const update = useUpdateColumn(projectId);
  const remove = useDeleteColumn(projectId);
  const reorder = useReorderColumns(projectId);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BoardColumn | null>(null);

  const columns = board?.columns ?? [];
  const doneCount = columns.filter((c) => c.category === "DONE").length;

  // 6px activation distance lets the user click into the rename input or
  // category dropdown without accidentally starting a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const tryDelete = (col: BoardColumn) => {
    if (col.category === "DONE" && doneCount <= 1) {
      // Last DONE column — block here so users get a clear reason rather
      // than a backend 409. BE also enforces but FE-side check is friendlier.
      toast.error(t("project.columns.cannotDeleteLastDone"));
      return;
    }
    setDeleteTarget(col);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!board || !over || active.id === over.id) return;
    const oldIndex = columns.findIndex((c) => c.id === active.id);
    const newIndex = columns.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(columns, oldIndex, newIndex);
    reorder.mutate({
      boardId: board.id,
      columnIds: next.map((c) => c.id),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Columns3 className="h-4 w-4" />
            {t("project.columns.title")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("project.columns.description")}
          </p>
        </div>
        {canManage && (
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("project.columns.add")}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : columns.length === 0 ? (
        <EmptyState
          compact
          icon={Columns3}
          title={t("project.columns.emptyTitle")}
          description={t("project.columns.emptyDesc")}
        />
      ) : (
        <div className="divide-y rounded-md border">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={columns.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {columns.map((col, idx) => (
                <ColumnRow
                  key={col.id}
                  col={col}
                  position={idx + 1}
                  canManage={canManage}
                  onCategoryChange={(cat) =>
                    board &&
                    update.mutate({
                      boardId: board.id,
                      columnId: col.id,
                      category: cat,
                    })
                  }
                  onRename={(name) =>
                    board &&
                    update.mutate({
                      boardId: board.id,
                      columnId: col.id,
                      name,
                    })
                  }
                  onDelete={() => tryDelete(col)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      <CreateColumnDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        boardId={board?.id ?? ""}
        onSubmit={(payload) => {
          if (!board) return;
          addColumn.mutate(
            { boardId: board.id, ...payload },
            { onSuccess: () => setCreateOpen(false) },
          );
        }}
        pending={addColumn.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={t("project.columns.deleteTitle")}
        description={t("project.columns.deleteDesc", {
          name: deleteTarget?.name ?? "",
        })}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleteTarget || !board) return Promise.resolve();
          return new Promise<void>((resolve, reject) =>
            remove.mutate(
              { boardId: board.id, columnId: deleteTarget.id },
              {
                onSuccess: () => {
                  setDeleteTarget(null);
                  resolve();
                },
                onError: (err) => reject(err),
              },
            ),
          );
        }}
      />
    </div>
  );
}

function ColumnRow({
  col,
  position,
  canManage,
  onCategoryChange,
  onRename,
  onDelete,
}: {
  col: BoardColumn;
  position: number;
  canManage: boolean;
  onCategoryChange: (cat: Category) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const { t } = useAppStore();
  const [name, setName] = useState(col.name);
  const dirty = name.trim() !== col.name;

  // useSortable wires this row into the parent <SortableContext>. We attach
  // `listeners` to a dedicated drag handle (NOT the whole row) so clicks on
  // the Input / Select don't accidentally start a drag.
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: col.id, disabled: !canManage });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-3 py-2.5 text-xs bg-background"
    >
      {canManage ? (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={t("project.columns.dragHandle")}
          className="flex h-7 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      ) : (
        // Keep layout aligned for VIEWER/DEVELOPER who can't reorder.
        <span className="w-5 shrink-0" />
      )}
      <span className="w-6 shrink-0 text-center text-[11px] text-muted-foreground tabular-nums">
        {position}
      </span>
      <Input
        value={name}
        disabled={!canManage}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          if (dirty && name.trim().length > 0) onRename(name.trim());
          else if (!name.trim()) setName(col.name);
        }}
        className="h-7 min-w-0 flex-1 text-xs"
      />
      <Select
        value={col.category}
        disabled={!canManage}
        onValueChange={(v) => v && onCategoryChange(v as Category)}
      >
        <SelectTrigger className="h-7 w-40 shrink-0 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_BADGES[c]}`}
              >
                {t(`project.columns.category.${c}`)}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="flex-1 text-[10px] text-muted-foreground">
        {t("project.columns.issuesIn", {
          count: String(col.issues?.length ?? 0),
        })}
      </span>
      {canManage && (
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

function CreateColumnDialog({
  open,
  onOpenChange,
  boardId,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  onSubmit: (payload: { name: string; category: Category }) => void;
  pending: boolean;
}) {
  const { t } = useAppStore();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("TODO");
  const canSubmit = name.trim().length > 0 && boardId.length > 0;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("project.columns.addTitle")}</DialogTitle>
          <DialogDescription>
            {t("project.columns.addDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="col-name">{t("common.name")}</Label>
            <Input
              id="col-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="Code review, QA, …"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("project.columns.category.label")}</Label>
            <Select
              value={category}
              onValueChange={(v) => v && setCategory(v as Category)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`project.columns.category.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              {t("project.columns.categoryHint")}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => onSubmit({ name: name.trim(), category })}
            disabled={!canSubmit || pending}
          >
            {t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
