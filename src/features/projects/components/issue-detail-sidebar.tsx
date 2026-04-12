"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import { TYPE_CONFIG, PRIORITY_CONFIG, UNASSIGNED_VALUE } from "@/lib/constants/issue-config";
import { getInitials, formatDate, formatDateShort } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { WorklogSection } from "./worklog-section";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { Issue, ProjectMember } from "../types";

// ─── Click-to-edit wrapper ────────────────────────────

function EditableField({
  label,
  displayValue,
  children,
}: {
  label: string;
  displayValue: React.ReactNode;
  children: (props: { close: () => void }) => React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editing) return;
    function onClickOutside(e: MouseEvent) {
      // Don't close if clicking inside portal popups (selects)
      const target = e.target as HTMLElement;
      if (target.closest("[data-slot=select-content]")) return;
      if (ref.current && !ref.current.contains(target)) {
        setEditing(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [editing]);

  return (
    <div ref={ref}>
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
      {editing ? (
        children({ close: () => setEditing(false) })
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="group/field flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors duration-150 hover:bg-muted/60 dark:hover:bg-muted/30"
        >
          <span className="flex-1">{displayValue}</span>
          <Pencil className="h-3 w-3 shrink-0 text-muted-foreground/0 transition-colors group-hover/field:text-muted-foreground/50" />
        </button>
      )}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────

export function IssueDetailSidebar({
  issue,
  members,
  currentUserId,
  onUpdate,
}: {
  issue: Issue;
  members: ProjectMember[];
  currentUserId: string;
  onUpdate: (field: string, value: string | null) => void;
}) {
  const { t } = useAppStore();

  const typeConf = TYPE_CONFIG[issue.type] ?? TYPE_CONFIG.TASK;
  const TypeIcon = typeConf.icon;
  const prioConf = PRIORITY_CONFIG[issue.priority] ?? PRIORITY_CONFIG.MEDIUM;
  const PrioIcon = prioConf.icon;

  return (
    <div className="w-70 shrink-0 overflow-auto border-l bg-muted/20 p-5">
      <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{t("issue.details")}</h3>

      <div className="space-y-4">
        {/* Status — read only */}
        <DetailRow label={t("issue.status")}>
          <div className="px-2 py-1.5">
            <Badge className="bg-primary/10 text-primary text-[11px] font-semibold">
              {issue.boardColumn?.name ?? t("issue.backlogStatus")}
            </Badge>
          </div>
        </DetailRow>

        {/* Type — click to edit */}
        <EditableField
          label={t("common.type")}
          displayValue={
            <span className="flex items-center gap-2">
              <div className={`flex h-4 w-4 items-center justify-center rounded-sm ${typeConf.bg}`}>
                <TypeIcon className="h-2.5 w-2.5 text-white" />
              </div>
              {t(`issue.types.${issue.type}` as any)}
            </span>
          }
        >
          {({ close }) => (
            <Select
              value={issue.type}
              onValueChange={(v) => { if (v) { onUpdate("type", v); close(); } }}
              defaultOpen
            >
              <SelectTrigger className="h-8 w-full text-[12px]">
                <span className="flex items-center gap-2">
                  <div className={`flex h-4 w-4 items-center justify-center rounded-sm ${typeConf.bg}`}>
                    <TypeIcon className="h-2.5 w-2.5 text-white" />
                  </div>
                  {t(`issue.types.${issue.type}` as any)}
                </span>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_CONFIG).map(([val, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <SelectItem key={val} value={val}>
                      <span className="flex items-center gap-2">
                        <div className={`flex h-4 w-4 items-center justify-center rounded-sm ${cfg.bg}`}>
                          <Icon className="h-2.5 w-2.5 text-white" />
                        </div>
                        {t(`issue.types.${val}` as any)}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </EditableField>

        {/* Priority — click to edit */}
        <EditableField
          label={t("issue.priority")}
          displayValue={
            <span className="flex items-center gap-2">
              <PrioIcon className={`h-3.5 w-3.5 ${prioConf.color}`} />
              {t(`issue.priorities.${issue.priority}` as any)}
            </span>
          }
        >
          {({ close }) => (
            <Select
              value={issue.priority}
              onValueChange={(v) => { if (v) { onUpdate("priority", v); close(); } }}
              defaultOpen
            >
              <SelectTrigger className="h-8 w-full text-[12px]">
                <span className="flex items-center gap-2">
                  <PrioIcon className={`h-3.5 w-3.5 ${prioConf.color}`} />
                  {t(`issue.priorities.${issue.priority}` as any)}
                </span>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_CONFIG).map(([val, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <SelectItem key={val} value={val}>
                      <span className="flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                        {t(`issue.priorities.${val}` as any)}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </EditableField>

        {/* Assignee — click to edit */}
        <EditableField
          label={t("issue.assignee")}
          displayValue={
            issue.assignee ? (
              <span className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[8px]">
                    {getInitials(issue.assignee.name)}
                  </AvatarFallback>
                </Avatar>
                {issue.assignee.name || issue.assignee.email}
              </span>
            ) : (
              <span className="text-muted-foreground/60">{t("issue.unassigned")}</span>
            )
          }
        >
          {({ close }) => (
            <Select
              value={issue.assigneeId ?? UNASSIGNED_VALUE}
              onValueChange={(v) => { onUpdate("assigneeId", v === UNASSIGNED_VALUE ? null : v); close(); }}
              defaultOpen
            >
              <SelectTrigger className="h-8 w-full text-[12px]">
                {issue.assignee ? (
                  <span className="flex items-center gap-2">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-[8px]">
                        {getInitials(issue.assignee.name)}
                      </AvatarFallback>
                    </Avatar>
                    {issue.assignee.name || issue.assignee.email}
                  </span>
                ) : (
                  <span className="text-muted-foreground">{t("issue.unassigned")}</span>
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED_VALUE}>{t("issue.unassigned")}</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.user.id} value={m.user.id}>
                    <span className="flex items-center gap-2">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-[8px]">
                          {getInitials(m.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      {m.user.name || m.user.email}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </EditableField>

        {/* Reporter — read only */}
        <DetailRow label={t("issue.reporter")}>
          {issue.reporter && (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[9px]">
                  {getInitials(issue.reporter.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[12px]">{issue.reporter.name}</span>
            </div>
          )}
        </DetailRow>

        {/* Story Points — click to edit */}
        <EditableField
          label={t("issue.storyPoints")}
          displayValue={
            <span>{issue.storyPoints ?? "—"}</span>
          }
        >
          {({ close }) => (
            <Input
              type="number"
              min={0}
              defaultValue={issue.storyPoints ?? ""}
              onBlur={(e) => { onUpdate("storyPoints", e.target.value || null); close(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { onUpdate("storyPoints", (e.target as HTMLInputElement).value || null); close(); } }}
              className="h-8 w-24 text-[12px]"
              placeholder="—"
              autoFocus
            />
          )}
        </EditableField>

        {/* Sprint — read only */}
        {issue.sprint && (
          <DetailRow label={t("issue.sprint")}>
            <div className="px-2 py-1.5 text-[12px]">{issue.sprint.name}</div>
          </DetailRow>
        )}

        {/* Start Date — click to edit */}
        <EditableField
          label={t("issue.startDate")}
          displayValue={
            <span>{issue.startDate ? formatDateShort(issue.startDate) : "—"}</span>
          }
        >
          {({ close }) => (
            <Input
              type="date"
              defaultValue={issue.startDate ? issue.startDate.split("T")[0] : ""}
              onBlur={(e) => { onUpdate("startDate", e.target.value ? new Date(e.target.value).toISOString() : null); close(); }}
              className="h-8 text-[12px]"
              autoFocus
            />
          )}
        </EditableField>

        {/* Due Date — click to edit */}
        <EditableField
          label={t("issue.dueDate")}
          displayValue={
            <span>{issue.dueDate ? formatDateShort(issue.dueDate) : "—"}</span>
          }
        >
          {({ close }) => (
            <Input
              type="date"
              defaultValue={issue.dueDate ? issue.dueDate.split("T")[0] : ""}
              onBlur={(e) => { onUpdate("dueDate", e.target.value ? new Date(e.target.value).toISOString() : null); close(); }}
              className="h-8 text-[12px]"
              autoFocus
            />
          )}
        </EditableField>

        <Separator />

        <WorklogSection issueId={issue.id} currentUserId={currentUserId} />

        <Separator />

        {/* Meta */}
        <div className="space-y-1.5 px-2 text-[11px] text-muted-foreground">
          <p>{t("issue.created", { date: formatDate(issue.createdAt) })}</p>
          <p>{t("issue.updated", { date: formatDate(issue.updatedAt) })}</p>
        </div>
      </div>
    </div>
  );
}
