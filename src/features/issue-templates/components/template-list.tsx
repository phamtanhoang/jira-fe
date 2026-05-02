"use client";

import { Pencil, Trash2 } from "lucide-react";
import { TYPE_CONFIG, PRIORITY_CONFIG } from "@/lib/constants/issue-config";
import { Button } from "@/components/ui/button";
import { RichContent } from "@/components/shared/rich-editor";
import type { IssueTemplate } from "@/features/projects/types";

export function TemplateRow({
  template,
  labels,
  canManage,
  isEditing,
  onEdit,
  onDelete,
}: {
  template: IssueTemplate;
  labels: { id: string; name: string; color: string }[];
  canManage: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (isEditing) return null;
  const typeConf = TYPE_CONFIG[template.type] ?? TYPE_CONFIG.TASK;
  const TypeIcon = typeConf.icon;
  const prio = template.defaultPriority
    ? PRIORITY_CONFIG[template.defaultPriority]
    : null;
  const PrioIcon = prio?.icon;
  const tplLabels = labels.filter((l) =>
    template.defaultLabels.includes(l.id),
  );

  return (
    <div className="group/tpl rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${typeConf.bg}`}
            >
              <TypeIcon className="h-3 w-3 text-white" />
            </div>
            <span className="font-medium">{template.name}</span>
            {prio && PrioIcon && (
              <PrioIcon className={`h-3.5 w-3.5 ${prio.color}`} />
            )}
          </div>
          {tplLabels.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {tplLabels.map((l) => (
                <span
                  key={l.id}
                  className="rounded-sm px-1.5 py-px text-[10px] font-medium"
                  style={{
                    backgroundColor: l.color + "20",
                    color: l.color,
                  }}
                >
                  {l.name}
                </span>
              ))}
            </div>
          )}
          {template.descriptionHtml && (
            <div className="mt-2 line-clamp-2 text-[12px] text-muted-foreground">
              <RichContent html={template.descriptionHtml} />
            </div>
          )}
        </div>
        {canManage && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/tpl:opacity-100">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onEdit}
              aria-label="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onDelete}
              aria-label="Delete"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
