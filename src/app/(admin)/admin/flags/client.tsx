"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Flag as FlagIcon,
  Edit2,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import {
  useFlags,
  useCreateFlag,
  useUpdateFlag,
  useDeleteFlag,
  type FeatureFlag,
  type FlagConditions,
} from "@/features/feature-flags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FormState = {
  id?: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  roles: string;
  emails: string;
  workspaceIds: string;
};

const EMPTY_FORM: FormState = {
  key: "",
  name: "",
  description: "",
  enabled: false,
  rolloutPercentage: 0,
  roles: "",
  emails: "",
  workspaceIds: "",
};

export function AdminFlagsClient() {
  const { t } = useAppStore();
  const { data: flags, isLoading } = useFlags();
  const createFlag = useCreateFlag();
  const updateFlag = useUpdateFlag();
  const deleteFlag = useDeleteFlag();

  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<FeatureFlag | null>(null);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  }

  function openEdit(flag: FeatureFlag) {
    setForm({
      id: flag.id,
      key: flag.key,
      name: flag.name,
      description: flag.description ?? "",
      enabled: flag.enabled,
      rolloutPercentage: flag.rolloutPercentage,
      roles: (flag.conditions?.roles ?? []).join(", "),
      emails: (flag.conditions?.emails ?? []).join(", "),
      workspaceIds: (flag.conditions?.workspaceIds ?? []).join(", "),
    });
    setEditorOpen(true);
  }

  function save() {
    const parsedRoles = form.roles
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s === "USER" || s === "ADMIN") as ("USER" | "ADMIN")[];
    const emails = form.emails
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const workspaceIds = form.workspaceIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const conditions: FlagConditions = {};
    if (parsedRoles.length) conditions.roles = parsedRoles;
    if (emails.length) conditions.emails = emails;
    if (workspaceIds.length) conditions.workspaceIds = workspaceIds;

    const input = {
      name: form.name,
      description: form.description || undefined,
      enabled: form.enabled,
      rolloutPercentage: form.rolloutPercentage,
      conditions: Object.keys(conditions).length ? conditions : undefined,
    };

    if (form.id) {
      updateFlag.mutate(
        { id: form.id, input },
        { onSuccess: () => setEditorOpen(false) },
      );
    } else {
      createFlag.mutate(
        { key: form.key, ...input },
        { onSuccess: () => setEditorOpen(false) },
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t("admin.flags.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.flags.description")}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          {t("admin.flags.addCta")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !flags?.length ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <FlagIcon className="h-5 w-5 text-muted-foreground/40" />
              {t("admin.flags.empty")}
            </div>
          ) : (
            <div className="divide-y">
              {flags.map((flag) => (
                <FlagRow
                  key={flag.id}
                  flag={flag}
                  onEdit={() => openEdit(flag)}
                  onToggle={() =>
                    updateFlag.mutate({
                      id: flag.id,
                      input: { enabled: !flag.enabled },
                    })
                  }
                  onDelete={() => setDeleteTarget(flag)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {form.id ? t("admin.flags.editTitle") : t("admin.flags.addTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.flags.dialogDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t("admin.flags.formKey")}
              </label>
              <Input
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                placeholder={t("admin.flags.keyPlaceholder")}
                disabled={!!form.id}
              />
              <p className="text-[11px] text-muted-foreground">
                {t("admin.flags.keyHint")}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t("admin.flags.formName")}
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Beta boards"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t("admin.flags.formDescription")}
              </label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder={t("admin.flags.descPlaceholder")}
              />
            </div>

            <div className="flex items-center gap-3">
              <Toggle
                checked={form.enabled}
                onChange={() =>
                  setForm((f) => ({ ...f, enabled: !f.enabled }))
                }
                variant="success"
                ariaLabel="enabled"
              />
              <span className="text-sm font-medium">
                {t("admin.flags.formEnabled")}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t("admin.flags.formRollout")} — {form.rolloutPercentage}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={form.rolloutPercentage}
                onChange={(e) =>
                  setForm({
                    ...form,
                    rolloutPercentage: parseInt(e.target.value, 10),
                  })
                }
                className="w-full"
              />
              <p className="text-[11px] text-muted-foreground">
                {t("admin.flags.formRolloutHint")}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t("admin.flags.formRoles")}
              </label>
              <Input
                value={form.roles}
                onChange={(e) => setForm({ ...form, roles: e.target.value })}
                placeholder="USER, ADMIN"
              />
              <p className="text-[11px] text-muted-foreground">
                {t("admin.flags.formRolesHint")}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t("admin.flags.formEmails")}
              </label>
              <Input
                value={form.emails}
                onChange={(e) => setForm({ ...form, emails: e.target.value })}
                placeholder="alice@example.com, bob@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t("admin.flags.formWorkspaceIds")}
              </label>
              <Input
                value={form.workspaceIds}
                onChange={(e) =>
                  setForm({ ...form, workspaceIds: e.target.value })
                }
                placeholder="uuid-1, uuid-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={save}
              disabled={createFlag.isPending || updateFlag.isPending}
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.flags.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("admin.flags.deleteConfirm", { key: deleteTarget?.key ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteTarget &&
                deleteFlag.mutate(deleteTarget.id, {
                  onSuccess: () => setDeleteTarget(null),
                })
              }
              disabled={deleteFlag.isPending}
            >
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FlagRow({
  flag,
  onEdit,
  onToggle,
  onDelete,
}: {
  flag: FeatureFlag;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { t } = useAppStore();
  const hasConditions =
    (flag.conditions?.roles?.length ?? 0) +
      (flag.conditions?.emails?.length ?? 0) +
      (flag.conditions?.workspaceIds?.length ?? 0) >
    0;

  return (
    <div className="flex items-center gap-3 px-4 py-3 text-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[13px] font-medium">{flag.key}</span>
          {hasConditions && (
            <Badge variant="outline" className="text-[10px]">
              {t("admin.flags.hasConditions")}
            </Badge>
          )}
          {flag.rolloutPercentage > 0 && flag.rolloutPercentage < 100 && (
            <Badge variant="outline" className="text-[10px] tabular-nums">
              {flag.rolloutPercentage}%
            </Badge>
          )}
        </div>
        <div className="truncate text-[11px] text-muted-foreground">
          {flag.name}
          {flag.description ? ` — ${flag.description}` : ""}
        </div>
      </div>
      <Toggle
        checked={flag.enabled}
        onChange={onToggle}
        variant="success"
        ariaLabel={flag.key}
      />
      <DropdownMenu>
        <Button
          render={<DropdownMenuTrigger />}
          variant="ghost"
          size="icon-xs"
          className={cn("text-muted-foreground")}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Edit2 className="mr-2 h-3.5 w-3.5" />
            {t("common.edit")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            {t("common.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
