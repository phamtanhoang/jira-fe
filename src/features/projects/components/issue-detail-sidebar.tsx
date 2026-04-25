"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, ChevronDown, ChevronRight, Settings } from "lucide-react";
import { TYPE_CONFIG, PRIORITY_CONFIG, STATUS_DOT_COLORS, UNASSIGNED_VALUE } from "@/lib/constants/issue-config";
import type { MessageKey } from "@/lib/config/i18n";
import { formatDate, formatDateShort } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useBoard, useMoveIssue, useIssues, useWatchers, useWorklogs } from "../hooks";
import { WorklogSection } from "./worklog-section";
import { IssueLinksSection } from "./issue-links-section";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/ui/user-avatar";
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
    <div ref={ref} className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-[11px] font-medium text-muted-foreground">{label}</span>
      <div className="min-w-0 flex-1">
        {editing ? (
          children({ close: () => setEditing(false) })
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="group/field flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-[12px] transition-colors duration-150 hover:bg-muted/60 dark:hover:bg-muted/30"
          >
            <span className="flex-1">{displayValue}</span>
            <Pencil className="h-3 w-3 shrink-0 text-muted-foreground/0 transition-colors group-hover/field:text-muted-foreground/50" />
          </button>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-[11px] font-medium text-muted-foreground">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 py-1.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        {icon}
        <span className="uppercase tracking-wide">{title}</span>
      </button>
      {open && <div className="mt-1 space-y-3 pl-1">{children}</div>}
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
  const { data: board } = useBoard(issue.projectId);
  const { mutate: moveIssue } = useMoveIssue();
  const { data: epics } = useIssues(issue.projectId, { type: "EPIC" });

  const typeConf = TYPE_CONFIG[issue.type] ?? TYPE_CONFIG.TASK;
  const TypeIcon = typeConf.icon;
  const prioConf = PRIORITY_CONFIG[issue.priority] ?? PRIORITY_CONFIG.MEDIUM;
  const PrioIcon = prioConf.icon;
  const columns = board?.columns ?? [];

  return (
    <div className="h-full w-full overflow-auto border-l bg-muted/20 p-5">
      <div className="space-y-5">
        <CollapsibleSection title={t("issue.details")} icon={<Settings className="h-3.5 w-3.5" />}>
        {/* Status — click to change column */}
        <EditableField
          label={t("issue.status")}
          displayValue={
            <span className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${STATUS_DOT_COLORS[issue.boardColumn?.category ?? "TODO"]}`} />
              <Badge className="bg-primary/10 text-primary text-[11px] font-semibold">
                {issue.boardColumn?.name ?? t("issue.backlogStatus")}
              </Badge>
            </span>
          }
        >
          {({ close }) => (
            <Select
              value={issue.boardColumnId ?? ""}
              onValueChange={(v) => {
                if (v && v !== issue.boardColumnId) moveIssue({ id: issue.id, columnId: v, position: 0 });
                close();
              }}
              defaultOpen
            >
              <SelectTrigger className="h-8 w-full text-[12px]">
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${STATUS_DOT_COLORS[issue.boardColumn?.category ?? "TODO"]}`} />
                  {issue.boardColumn?.name ?? t("issue.backlogStatus")}
                </span>
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${STATUS_DOT_COLORS[col.category]}`} />
                      {col.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </EditableField>

        {/* Type — click to edit */}
        <EditableField
          label={t("common.type")}
          displayValue={
            <span className="flex items-center gap-2">
              <div className={`flex h-4 w-4 items-center justify-center rounded-sm ${typeConf.bg}`}>
                <TypeIcon className="h-2.5 w-2.5 text-white" />
              </div>
              {t(`issue.types.${issue.type}` as MessageKey)}
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
                  {t(`issue.types.${issue.type}` as MessageKey)}
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
                        {t(`issue.types.${val}` as MessageKey)}
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
              {t(`issue.priorities.${issue.priority}` as MessageKey)}
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
                  {t(`issue.priorities.${issue.priority}` as MessageKey)}
                </span>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_CONFIG).map(([val, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <SelectItem key={val} value={val}>
                      <span className="flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                        {t(`issue.priorities.${val}` as MessageKey)}
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
                <UserAvatar
                  user={issue.assignee}
                  className="h-5 w-5"
                  fallbackClassName="text-[8px]"
                />
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
                    <UserAvatar
                      user={issue.assignee}
                      className="h-4 w-4"
                      fallbackClassName="text-[8px]"
                    />
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
                      <UserAvatar
                        user={m.user}
                        className="h-4 w-4"
                        fallbackClassName="text-[8px]"
                      />
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
            <div className="flex items-center gap-2 px-2 py-1">
              <UserAvatar
                user={issue.reporter}
                className="h-5 w-5"
                fallbackClassName="text-[9px]"
              />
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

        {/* Time estimate — accepts "2h 30m" / "45m" / "1h" forms. Stored as
            seconds; display rounds to the nearest minute. */}
        <EditableField
          label={t("issue.estimate")}
          displayValue={<TimeEstimateDisplay issueId={issue.id} estimate={issue.originalEstimate} />}
        >
          {({ close }) => (
            <Input
              defaultValue={formatDuration(issue.originalEstimate)}
              onBlur={(e) => {
                const sec = parseDuration(e.target.value);
                onUpdate("originalEstimate", sec == null ? null : String(sec));
                close();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const sec = parseDuration((e.target as HTMLInputElement).value);
                  onUpdate("originalEstimate", sec == null ? null : String(sec));
                  close();
                }
              }}
              className="h-8 w-32 text-[12px]"
              placeholder="2h 30m"
              autoFocus
            />
          )}
        </EditableField>

        {/* Epic — click to edit (not for EPIC type) */}
        {issue.type !== "EPIC" && (
          <EditableField
            label={t("issue.epic")}
            displayValue={
              issue.epic ? (
                <span className="flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-purple-600">
                    <span className="text-[8px] text-white">⚡</span>
                  </span>
                  {issue.epic.summary}
                </span>
              ) : (
                <span className="text-muted-foreground/60">{t("issue.noEpic")}</span>
              )
            }
          >
            {({ close }) => (
              <Select
                value={issue.epicId ?? UNASSIGNED_VALUE}
                onValueChange={(v) => {
                  const newVal = v === UNASSIGNED_VALUE ? null : v;
                  if (newVal !== issue.epicId) onUpdate("epicId", newVal);
                  close();
                }}
                defaultOpen
              >
                <SelectTrigger className="h-8 w-full text-[12px]">
                  {issue.epic ? issue.epic.summary : t("issue.noEpic")}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED_VALUE}>{t("issue.noEpic")}</SelectItem>
                  {epics?.filter((e) => e.id !== issue.id).map((epic) => (
                    <SelectItem key={epic.id} value={epic.id}>
                      <span className="flex items-center gap-1.5">
                        <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-purple-600">
                          <span className="text-[8px] text-white">⚡</span>
                        </span>
                        {epic.summary}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </EditableField>
        )}

        {/* Sprint — read only */}
        {issue.sprint && (
          <DetailRow label={t("issue.sprint")}>
            <div className="px-2 py-1 text-[12px]">{issue.sprint.name}</div>
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

        </CollapsibleSection>

        <Separator />

        <IssueLinksSection issue={issue} />

        <Separator />

        <WatchersBlock issueId={issue.id} />

        <Separator />

        <CollapsibleSection title={t("worklog.title")}>
          <WorklogSection issueId={issue.id} currentUserId={currentUserId} />
        </CollapsibleSection>

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

// Display "Xh Ym" string for a seconds value; null/0 → em-dash. Pulls
// worklog totals from the same hook the worklog section uses so a
// progress bar appears once any time is logged.
function TimeEstimateDisplay({
  issueId,
  estimate,
}: {
  issueId: string;
  estimate: number | null;
}) {
  const { data: worklogs } = useWorklogs(issueId);
  const spent = (worklogs ?? []).reduce(
    (s, w) => s + (w.timeSpent ?? 0),
    0,
  );
  if (!estimate && !spent) return <span>—</span>;
  const pct = estimate ? Math.min(100, Math.round((spent / estimate) * 100)) : 0;
  return (
    <span className="flex flex-col">
      <span className="text-[12px]">
        {formatDuration(spent) || "0m"}
        {estimate ? ` / ${formatDuration(estimate)}` : ""}
      </span>
      {estimate ? (
        <span className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-muted">
          <span
            className={`block h-full ${
              spent > estimate ? "bg-red-500" : "bg-primary"
            }`}
            style={{ width: `${pct}%` }}
          />
        </span>
      ) : null}
    </span>
  );
}

// "2h 30m" / "1h" / "45m" / "5400" (raw seconds) → seconds. Returns null
// for empty/invalid input so the BE can clear the field.
function parseDuration(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;
  // Bare number → assume seconds (advanced users)
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed) || null;
  let total = 0;
  const re = /(\d+)\s*([hm])/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(trimmed)) !== null) {
    const n = parseInt(match[1]);
    if (match[2] === "h") total += n * 3600;
    else if (match[2] === "m") total += n * 60;
  }
  return total > 0 ? total : null;
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

// Stacked avatars of users currently watching this issue. Hides itself when
// nobody is watching to avoid an empty-looking section in the sidebar.
function WatchersBlock({ issueId }: { issueId: string }) {
  const { t } = useAppStore();
  const { data: watchers } = useWatchers(issueId);
  const list = watchers ?? [];
  if (list.length === 0) return null;
  const visible = list.slice(0, 6);
  const overflow = list.length - visible.length;
  return (
    <div className="px-2 py-1">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">
          {t("issue.watchers")}
        </span>
        <span className="text-[10px] text-muted-foreground/70 tabular-nums">
          {list.length}
        </span>
      </div>
      <div className="flex -space-x-1.5">
        {visible.map((u) => (
          <UserAvatar
            key={u.id}
            user={u}
            className="h-6 w-6 ring-2 ring-background"
            fallbackClassName="text-[9px]"
          />
        ))}
        {overflow > 0 && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full border bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-background">
            +{overflow}
          </span>
        )}
      </div>
    </div>
  );
}
