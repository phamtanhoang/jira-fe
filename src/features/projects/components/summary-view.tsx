"use client";

import { useMemo } from "react";
import {
  Users,
  BarChart3,
  Target,
  Clock,
  CheckSquare,
} from "lucide-react";
import { TYPE_CONFIG, PRIORITY_CONFIG, AVATAR_GRADIENT } from "@/lib/constants/issue-config";
import { getInitials } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { BurndownChart } from "./burndown-chart";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Board, Issue, ProjectMember } from "../types";

type Props = {
  board: Board;
  allIssues: Issue[];
  members: ProjectMember[];
};

export function SummaryView({ board, allIssues, members }: Props) {
  const { t } = useAppStore();

  const activeSprint = board.sprints.find((s) => s.status === "ACTIVE");

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byAssignee: Record<string, { name: string; count: number }> = {};
    let unassigned = 0;

    for (const issue of allIssues) {
      // By status (via board column category)
      const cat = issue.boardColumn?.category ?? "TODO";
      byStatus[cat] = (byStatus[cat] ?? 0) + 1;

      // By type
      byType[issue.type] = (byType[issue.type] ?? 0) + 1;

      // By priority
      byPriority[issue.priority] = (byPriority[issue.priority] ?? 0) + 1;

      // By assignee
      if (issue.assignee) {
        const key = issue.assigneeId!;
        if (!byAssignee[key]) {
          byAssignee[key] = { name: issue.assignee.name ?? "?", count: 0 };
        }
        byAssignee[key].count++;
      } else {
        unassigned++;
      }
    }

    return { byStatus, byType, byPriority, byAssignee, unassigned, total: allIssues.length };
  }, [allIssues]);

  const donePercent = stats.total > 0 ? Math.round((stats.byStatus.DONE / stats.total) * 100) : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Top stats row */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-[11px] text-muted-foreground">{t("board.summaryTotalIssues")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950">
              <CheckSquare className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.byStatus.DONE ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">{t("board.summaryDone")} ({donePercent}%)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950">
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.byStatus.IN_PROGRESS ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">{t("board.summaryInProgress")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-900">
              <Target className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.byStatus.TODO ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">{t("board.summaryTodo")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Burndown Chart */}
      {activeSprint && (
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-4 text-[13px] font-semibold">Burndown Chart</h3>
            <BurndownChart sprintId={activeSprint.id} />
          </CardContent>
        </Card>
      )}

      {/* Active sprint + status breakdown */}
      <div className="grid grid-cols-2 gap-4">
        {/* Active Sprint */}
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-4 text-[13px] font-semibold">{t("board.summaryActiveSprint")}</h3>
            {activeSprint ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    {activeSprint.name}
                  </Badge>
                </div>
                {activeSprint.goal && (
                  <p className="text-[12px] text-muted-foreground">{activeSprint.goal}</p>
                )}
                {(activeSprint.startDate || activeSprint.endDate) && (
                  <p className="text-[11px] text-muted-foreground">
                    {activeSprint.startDate && new Date(activeSprint.startDate).toLocaleDateString()}
                    {activeSprint.endDate && ` → ${new Date(activeSprint.endDate).toLocaleDateString()}`}
                  </p>
                )}
                {/* Sprint progress bar */}
                <div className="space-y-1.5">
                  <div className="flex h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    {stats.total > 0 && (
                      <>
                        <div className="bg-green-500 transition-all" style={{ width: `${(stats.byStatus.DONE / stats.total) * 100}%` }} />
                        <div className="bg-blue-500 transition-all" style={{ width: `${(stats.byStatus.IN_PROGRESS / stats.total) * 100}%` }} />
                      </>
                    )}
                  </div>
                  <div className="flex gap-4 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" />{t("board.summaryDone")} {stats.byStatus.DONE}</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" />{t("board.summaryInProgress")} {stats.byStatus.IN_PROGRESS}</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-400" />{t("board.summaryTodo")} {stats.byStatus.TODO}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground">{t("board.summaryNoSprint")}</p>
            )}
          </CardContent>
        </Card>

        {/* By Type */}
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-4 text-[13px] font-semibold">{t("board.summaryType")}</h3>
            <div className="space-y-2.5">
              {Object.entries(TYPE_CONFIG).map(([type, conf]) => {
                const count = stats.byType[type] ?? 0;
                if (count === 0) return null;
                const Icon = conf.icon;
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={type} className="flex items-center gap-2.5">
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm ${conf.bg}`}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    <span className="w-16 text-[12px] text-muted-foreground">{t(`issue.types.${type}` as any)}</span>
                    <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div className={`${conf.bg} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-[12px] font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority + Members */}
      <div className="grid grid-cols-2 gap-4">
        {/* By Priority */}
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-4 text-[13px] font-semibold">{t("board.summaryPriority")}</h3>
            <div className="space-y-2.5">
              {(["HIGHEST", "HIGH", "MEDIUM", "LOW", "LOWEST"] as const).map((prio) => {
                const count = stats.byPriority[prio] ?? 0;
                if (count === 0) return null;
                const conf = PRIORITY_CONFIG[prio];
                const Icon = conf.icon;
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={prio} className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 shrink-0 ${conf.color}`} />
                    <span className="w-20 text-[12px] text-muted-foreground">{t(`issue.priorities.${prio}` as any)}</span>
                    <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div className="bg-current transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-[12px] font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Members */}
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-4 flex items-center gap-2 text-[13px] font-semibold">
              <Users className="h-4 w-4" />
              {t("board.summaryMembers")}
              <Badge variant="secondary" className="ml-1 text-[10px]">{members.length}</Badge>
            </h3>
            <div className="space-y-2">
              {members.map((m) => {
                const assigneeStats = stats.byAssignee[m.userId];
                return (
                  <div key={m.id} className="flex items-center gap-2.5">
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className={`${AVATAR_GRADIENT} text-[9px]`}>
                        {getInitials(m.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium">{m.user.name}</p>
                      <p className="text-[10px] text-muted-foreground">{m.role}</p>
                    </div>
                    {assigneeStats && (
                      <span className="text-[11px] text-muted-foreground">
                        {assigneeStats.count} {assigneeStats.count === 1 ? "issue" : "issues"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
