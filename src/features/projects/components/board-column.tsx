"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, Trash2, Gauge } from "lucide-react";
import { STATUS_DOT_COLORS } from "@/lib/constants/issue-config";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IssueCard } from "./issue-card";
import type { BoardColumn as BoardColumnType } from "../types";

export function BoardColumn({
  column,
  onMoveIssue,
  onClickIssue,
  onQuickCreate,
  onDeleteColumn,
  onUpdateWipLimit,
}: {
  column: BoardColumnType;
  onMoveIssue: (issueId: string, columnId: string) => void;
  onClickIssue: (issueKey: string) => void;
  onQuickCreate?: (summary: string, columnId: string) => void;
  onDeleteColumn?: (columnId: string) => void;
  onUpdateWipLimit?: (columnId: string, wipLimit: number | null) => void;
}) {
  const { t } = useAppStore();
  const [dragOver, setDragOver] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickSummary, setQuickSummary] = useState("");
  const [editingWip, setEditingWip] = useState(false);
  const [wipValue, setWipValue] = useState(column.wipLimit?.toString() ?? "");

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const issueId = e.dataTransfer.getData("issueId");
    if (issueId) onMoveIssue(issueId, column.id);
  }

  function handleQuickCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!quickSummary.trim() || !onQuickCreate) return;
    onQuickCreate(quickSummary.trim(), column.id);
    setQuickSummary("");
    setShowQuickCreate(false);
  }

  return (
    <div
      className={`flex h-full w-68 shrink-0 flex-col rounded-lg transition-colors ${
        dragOver ? "bg-primary/5 ring-2 ring-primary/20" : "bg-muted/40"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-2 py-2.5">
        <div
          className={`h-2 w-2 rounded-full ${STATUS_DOT_COLORS[column.category] ?? "bg-gray-400"}`}
        />
        <span className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
          {column.name}
        </span>
        <span className="text-[11px] font-medium text-muted-foreground/60">
          {column.issues.length}
        </span>
        {column.wipLimit && column.issues.length > column.wipLimit && (
          <span className="rounded bg-red-100 px-1 text-[10px] font-semibold text-red-600">
            {t("board.wip")}
          </span>
        )}

        <div className="ml-auto flex items-center gap-0.5">
          {onQuickCreate && (
            <button
              onClick={() => setShowQuickCreate(true)}
              className="rounded p-0.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
          {(onDeleteColumn || onUpdateWipLimit) && (
            <DropdownMenu>
              <Button
                render={<DropdownMenuTrigger />}
                variant="ghost"
                size="icon-xs"
                className="h-5 w-5 text-muted-foreground/50 hover:text-foreground"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
              <DropdownMenuContent align="end">
                {onUpdateWipLimit && (
                  <DropdownMenuItem onClick={() => { setEditingWip(true); setWipValue(column.wipLimit?.toString() ?? ""); }}>
                    <Gauge className="mr-2 h-3.5 w-3.5" />
                    {t("project.setWipLimit")}
                  </DropdownMenuItem>
                )}
                {onDeleteColumn && (
                  <DropdownMenuItem
                    onClick={() => onDeleteColumn(column.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    {t("board.deleteColumn")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* WIP limit editor */}
      {editingWip && onUpdateWipLimit && (
        <div className="mx-2 mb-2 flex items-center gap-1.5 rounded border bg-background px-2 py-1.5">
          <span className="text-[10px] text-muted-foreground">{t("project.wipLimit")}:</span>
          <Input
            type="number"
            min="0"
            value={wipValue}
            onChange={(e) => setWipValue(e.target.value)}
            className="h-6 w-14 px-1.5 text-[11px]"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const num = parseInt(wipValue);
                onUpdateWipLimit(column.id, isNaN(num) || num <= 0 ? null : num);
                setEditingWip(false);
              }
              if (e.key === "Escape") setEditingWip(false);
            }}
          />
          <Button
            size="icon-xs"
            variant="ghost"
            className="h-5 w-5"
            onClick={() => {
              const num = parseInt(wipValue);
              onUpdateWipLimit(column.id, isNaN(num) || num <= 0 ? null : num);
              setEditingWip(false);
            }}
          >✓</Button>
        </div>
      )}

      {/* Cards */}
      <div className="flex-1 space-y-1.5 overflow-auto px-1.5 pb-1.5">
        {column.issues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            onClick={() => onClickIssue(issue.key)}
          />
        ))}

        {/* Quick create */}
        {showQuickCreate && onQuickCreate ? (
          <form onSubmit={handleQuickCreate} className="p-1">
            <Input
              placeholder={t("board.quickCreatePlaceholder")}
              value={quickSummary}
              onChange={(e) => setQuickSummary(e.target.value)}
              onBlur={() => {
                if (!quickSummary.trim()) setShowQuickCreate(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowQuickCreate(false);
              }}
              className="h-8 text-[12px]"
              autoFocus
            />
          </form>
        ) : onQuickCreate ? (
          <button
            onClick={() => setShowQuickCreate(true)}
            className="flex w-full items-center gap-1.5 rounded-sm p-2 text-[12px] text-muted-foreground/50 transition-colors hover:bg-muted/60 hover:text-muted-foreground"
          >
            <Plus className="h-3 w-3" />
            {t("board.createIssue")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
