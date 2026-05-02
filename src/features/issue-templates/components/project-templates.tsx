"use client";

import { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useLabels } from "@/features/projects/hooks";
import {
  useDeleteIssueTemplate,
  useIssueTemplates,
} from "../hooks";
import { TemplateForm } from "./template-editor-dialog";
import { TemplateRow } from "./template-list";

export function ProjectTemplates({
  projectId,
  canManage,
}: {
  projectId: string;
  canManage: boolean;
}) {
  const { t } = useAppStore();
  const { data: templates, isLoading } = useIssueTemplates(projectId);
  const { data: labels } = useLabels(projectId);
  const { mutate: deleteTpl } = useDeleteIssueTemplate(projectId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  const list = templates ?? [];
  const editing = editingId ? list.find((x) => x.id === editingId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">
            {t("templates.title")}
          </h2>
          <p className="text-[12px] text-muted-foreground">
            {t("templates.subtitle")}
          </p>
        </div>
        {canManage && !creating && !editing && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t("templates.newTemplate")}
          </Button>
        )}
      </div>

      {/* Edit / create form */}
      {(creating || editing) && (
        <TemplateForm
          projectId={projectId}
          initial={editing ?? null}
          labels={labels ?? []}
          onClose={() => {
            setCreating(false);
            setEditingId(null);
          }}
        />
      )}

      {/* List */}
      {list.length === 0 && !creating ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {t("templates.empty")}
          </p>
          {canManage && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCreating(true)}
              className="mt-2"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {t("templates.newTemplate")}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((tpl) => (
            <TemplateRow
              key={tpl.id}
              template={tpl}
              labels={labels ?? []}
              canManage={canManage}
              isEditing={editingId === tpl.id}
              onEdit={() => {
                setCreating(false);
                setEditingId(tpl.id);
              }}
              onDelete={() => setDeleteId(tpl.id)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t("templates.confirmDeleteTitle")}
        description={t("templates.confirmDeleteDesc")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        onConfirm={() => {
          if (deleteId) {
            deleteTpl(deleteId);
            setDeleteId(null);
          }
        }}
      />
    </div>
  );
}
