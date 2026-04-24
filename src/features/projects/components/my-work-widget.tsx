"use client";

import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, Inbox } from "lucide-react";
import { TYPE_CONFIG, PRIORITY_CONFIG } from "@/lib/constants/issue-config";
import { formatDateShort, safeArray } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useMyDashboard } from "../hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TruncatedText } from "@/components/ui/truncated-text";
import type { Issue } from "../types";

export function MyWorkWidget() {
  const { t } = useAppStore();
  const { data, isLoading } = useMyDashboard();

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  const assigned = safeArray<Issue>(data, "assigned");
  const overdue = safeArray<Issue>(data, "overdue");
  const dueSoon = safeArray<Issue>(data, "dueSoon");

  if (assigned.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={CheckCircle2}
            title={t("myWork.emptyTitle")}
            description={t("myWork.emptyHint")}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stat row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label={t("myWork.statAssigned")}
          value={assigned.length}
          icon={Inbox}
          tone="default"
        />
        <StatTile
          label={t("myWork.statOverdue")}
          value={overdue.length}
          icon={AlertTriangle}
          tone={overdue.length > 0 ? "danger" : "default"}
        />
        <StatTile
          label={t("myWork.statDueSoon")}
          value={dueSoon.length}
          icon={CalendarClock}
          tone={dueSoon.length > 0 ? "warn" : "default"}
        />
      </div>

      {/* Top assigned list (max 6) */}
      <Card>
        <CardContent className="p-0">
          {assigned.slice(0, 6).map((issue) => (
            <IssueListRow key={issue.id} issue={issue} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  tone: "default" | "warn" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400"
      : tone === "warn"
        ? "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400"
        : "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400";
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[12px] font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
    </div>
  );
}

function IssueListRow({ issue }: { issue: Issue }) {
  const typeConf = TYPE_CONFIG[issue.type] ?? TYPE_CONFIG.TASK;
  const TypeIcon = typeConf.icon;
  const prioConf = PRIORITY_CONFIG[issue.priority] ?? PRIORITY_CONFIG.MEDIUM;
  const PrioIcon = prioConf.icon;
  const isOverdue = !!issue.dueDate && new Date(issue.dueDate) < new Date();

  return (
    <Link
      href={`/issues/${issue.key}`}
      className="group flex items-center gap-3 border-b px-4 py-2.5 text-sm last:border-b-0 hover:bg-muted/30"
    >
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${typeConf.bg}`}>
        <TypeIcon className="h-3 w-3 text-white" />
      </div>
      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
        {issue.key}
      </span>
      <TruncatedText
        text={issue.summary}
        className="flex-1 text-[13px] group-hover:text-primary"
      />
      <PrioIcon className={`h-3.5 w-3.5 shrink-0 ${prioConf.color}`} />
      {issue.dueDate && (
        <Badge
          variant="outline"
          className={`shrink-0 text-[10px] ${
            isOverdue
              ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
              : "text-muted-foreground"
          }`}
        >
          {formatDateShort(issue.dueDate)}
        </Badge>
      )}
    </Link>
  );
}
