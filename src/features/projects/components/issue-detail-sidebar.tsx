"use client";

import { TYPE_CONFIG, PRIORITY_CONFIG, UNASSIGNED_VALUE } from "@/lib/constants/issue-config";
import { getInitials, formatDate } from "@/lib/utils";
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

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

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

  return (
    <div className="w-70 shrink-0 overflow-auto border-l bg-muted/20 p-5">
      <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{t("issue.details")}</h3>

      <div className="space-y-5">
        {/* Status */}
        <DetailRow label={t("issue.status")}>
          <Badge className="bg-primary/10 text-primary text-[11px] font-semibold">
            {issue.boardColumn?.name ?? t("issue.backlogStatus")}
          </Badge>
        </DetailRow>

        {/* Type */}
        <DetailRow label={t("common.type")}>
          <Select value={issue.type} onValueChange={(v) => v && onUpdate("type", v)}>
            <SelectTrigger className="h-7 w-full text-[12px]">
              {(() => {
                const cfg = TYPE_CONFIG[issue.type] ?? TYPE_CONFIG.TASK;
                const Icon = cfg.icon;
                return (
                  <span className="flex items-center gap-2">
                    <div className={`flex h-4 w-4 items-center justify-center rounded-sm ${cfg.bg}`}>
                      <Icon className="h-2.5 w-2.5 text-white" />
                    </div>
                    {t(`issue.types.${issue.type}` as any)}
                  </span>
                );
              })()}
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
        </DetailRow>

        {/* Priority */}
        <DetailRow label={t("issue.priority")}>
          <Select value={issue.priority} onValueChange={(v) => v && onUpdate("priority", v)}>
            <SelectTrigger className="h-7 w-full text-[12px]">
              {(() => {
                const cfg = PRIORITY_CONFIG[issue.priority] ?? PRIORITY_CONFIG.MEDIUM;
                const Icon = cfg.icon;
                return (
                  <span className="flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    {t(`issue.priorities.${issue.priority}` as any)}
                  </span>
                );
              })()}
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
        </DetailRow>

        {/* Assignee */}
        <DetailRow label={t("issue.assignee")}>
          <Select
            value={issue.assigneeId ?? UNASSIGNED_VALUE}
            onValueChange={(v) => onUpdate("assigneeId", v === UNASSIGNED_VALUE ? null : v)}
          >
            <SelectTrigger className="h-7 w-full text-[12px]">
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
        </DetailRow>

        {/* Reporter */}
        <DetailRow label={t("issue.reporter")}>
          {issue.reporter && (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[9px]">
                  {getInitials(issue.reporter.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[13px]">{issue.reporter.name}</span>
            </div>
          )}
        </DetailRow>

        {/* Story Points */}
        <DetailRow label={t("issue.storyPoints")}>
          <Input
            type="number"
            min={0}
            value={issue.storyPoints ?? ""}
            onChange={(e) => onUpdate("storyPoints", e.target.value || null)}
            className="h-7 w-20 text-[12px]"
            placeholder="—"
          />
        </DetailRow>

        {/* Sprint */}
        {issue.sprint && (
          <DetailRow label={t("issue.sprint")}>
            <span className="text-[13px]">{issue.sprint.name}</span>
          </DetailRow>
        )}

        {/* Due Date */}
        <DetailRow label={t("issue.dueDate")}>
          <Input
            type="date"
            value={issue.dueDate ? issue.dueDate.split("T")[0] : ""}
            onChange={(e) => onUpdate("dueDate", e.target.value ? new Date(e.target.value).toISOString() : null)}
            className="h-7 text-[12px]"
          />
        </DetailRow>

        <Separator />

        <WorklogSection issueId={issue.id} currentUserId={currentUserId} />

        <Separator />

        {/* Meta */}
        <div className="space-y-1.5 text-[11px] text-muted-foreground">
          <p>{t("issue.created", { date: formatDate(issue.createdAt) })}</p>
          <p>{t("issue.updated", { date: formatDate(issue.updatedAt) })}</p>
        </div>
      </div>
    </div>
  );
}
