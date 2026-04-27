"use client";

import { useState } from "react";
import { Plus, Settings, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  useCreateCustomField,
  useCustomFields,
  useDeleteCustomField,
  useUpdateCustomField,
} from "../hooks";
import {
  CUSTOM_FIELD_TYPES,
  type CustomFieldDef,
  type CustomFieldType,
} from "../types";
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
import { Spinner } from "@/components/ui/spinner";

export function CustomFieldsManager({ projectId }: { projectId: string }) {
  const { t } = useAppStore();
  const { data, isLoading } = useCustomFields(projectId);
  const remove = useDeleteCustomField(projectId);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomFieldDef | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Settings className="h-4 w-4" />
            {t("customFields.title")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("customFields.description")}
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {t("customFields.add")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          compact
          icon={Settings}
          title={t("customFields.emptyTitle")}
          description={t("customFields.emptyDesc")}
        />
      ) : (
        <div className="divide-y rounded-md border">
          {data.map((row) => (
            <FieldRow
              key={row.id}
              row={row}
              projectId={projectId}
              onDelete={() => setDeleteTarget(row)}
            />
          ))}
        </div>
      )}

      <CreateFieldDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={t("customFields.deleteTitle")}
        description={t("customFields.deleteDesc", {
          name: deleteTarget?.name ?? "",
        })}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleteTarget) return Promise.resolve();
          return new Promise<void>((resolve, reject) =>
            remove.mutate(deleteTarget.id, {
              onSuccess: () => {
                setDeleteTarget(null);
                resolve();
              },
              onError: (err) => reject(err),
            }),
          );
        }}
      />
    </div>
  );
}

function FieldRow({
  row,
  projectId,
  onDelete,
}: {
  row: CustomFieldDef;
  projectId: string;
  onDelete: () => void;
}) {
  const { t } = useAppStore();
  const update = useUpdateCustomField(projectId);
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 text-xs">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{row.name}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase">
            {row.type}
          </span>
          {row.required && (
            <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
              {t("customFields.required")}
            </span>
          )}
        </div>
        {row.options.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {row.options.map((opt) => (
              <span
                key={opt}
                className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px]"
              >
                {opt}
              </span>
            ))}
          </div>
        )}
      </div>
      <Button
        size="xs"
        variant="ghost"
        onClick={() =>
          update.mutate({
            id: row.id,
            payload: { required: !row.required },
          })
        }
      >
        {row.required
          ? t("customFields.makeOptional")
          : t("customFields.makeRequired")}
      </Button>
      <Button
        size="icon-xs"
        variant="ghost"
        onClick={onDelete}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function CreateFieldDialog({
  open,
  onOpenChange,
  projectId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}) {
  const { t } = useAppStore();
  const create = useCreateCustomField(projectId);
  const [name, setName] = useState("");
  const [type, setType] = useState<CustomFieldType>("TEXT");
  const [optionsRaw, setOptionsRaw] = useState("");
  const [required, setRequired] = useState(false);

  const needsOptions = type === "SELECT" || type === "MULTI_SELECT";
  const options = optionsRaw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const canSubmit =
    name.trim().length > 0 && (!needsOptions || options.length > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    create.mutate(
      {
        projectId,
        name: name.trim(),
        type,
        options: needsOptions ? options : undefined,
        required,
      },
      {
        onSuccess: () => {
          setName("");
          setType("TEXT");
          setOptionsRaw("");
          setRequired(false);
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("customFields.createTitle")}</DialogTitle>
          <DialogDescription>{t("customFields.createDesc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cf-name">{t("customFields.name")}</Label>
            <Input
              id="cf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="Team, Severity, Reviewer…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("customFields.type")}</Label>
            <Select
              value={type}
              onValueChange={(v) => v && setType(v as CustomFieldType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUSTOM_FIELD_TYPES.map((tp) => (
                  <SelectItem key={tp} value={tp}>
                    {tp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {needsOptions && (
            <div className="space-y-1.5">
              <Label htmlFor="cf-options">{t("customFields.options")}</Label>
              <textarea
                id="cf-options"
                value={optionsRaw}
                onChange={(e) => setOptionsRaw(e.target.value)}
                rows={3}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                placeholder={t("customFields.optionsPlaceholder")}
              />
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-card px-3 py-2 text-xs hover:bg-muted/30">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            {t("customFields.requiredLabel")}
          </label>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={create.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || create.isPending}>
            {create.isPending ? <Spinner className="h-4 w-4" /> : null}
            {t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
