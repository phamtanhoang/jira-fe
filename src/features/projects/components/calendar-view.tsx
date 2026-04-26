"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PRIORITY_CONFIG, TYPE_CONFIG } from "@/lib/constants/issue-config";
import { useAppStore } from "@/lib/stores/use-app-store";
import { Button } from "@/components/ui/button";
import type { Issue } from "../types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Build the 42-cell month grid (6 rows × 7 cols, weeks Mon→Sun). */
function buildMonthGrid(year: number, month: number): { date: Date; iso: string; inMonth: boolean }[] {
  // First day of month, then back up to Monday of that week.
  const first = new Date(year, month, 1);
  const dayOfWeek = (first.getDay() + 6) % 7; // 0=Mon..6=Sun
  const start = new Date(year, month, 1 - dayOfWeek);
  const cells: { date: Date; iso: string; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({
      date: d,
      iso: d.toISOString().slice(0, 10),
      inMonth: d.getMonth() === month,
    });
  }
  return cells;
}

function isoOf(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  return new Date(d).toISOString().slice(0, 10);
}

type Props = {
  issues: Issue[];
  onClickIssue: (issue: Issue) => void;
  onUpdateIssue: (id: string, data: { dueDate: string | null }) => void;
};

export function CalendarView({ issues, onClickIssue, onUpdateIssue }: Props) {
  const { t } = useAppStore();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [dragOverIso, setDragOverIso] = useState<string | null>(null);

  const cells = useMemo(
    () => buildMonthGrid(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  );

  const issuesByDay = useMemo(() => {
    const map = new Map<string, Issue[]>();
    for (const issue of issues) {
      const iso = isoOf(issue.dueDate);
      if (!iso) continue;
      const arr = map.get(iso);
      if (arr) arr.push(issue);
      else map.set(iso, [issue]);
    }
    return map;
  }, [issues]);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleString(
    undefined,
    { month: "long", year: "numeric" },
  );

  const goPrev = () =>
    setCursor((c) => {
      const m = c.month - 1;
      if (m < 0) return { year: c.year - 1, month: 11 };
      return { year: c.year, month: m };
    });
  const goNext = () =>
    setCursor((c) => {
      const m = c.month + 1;
      if (m > 11) return { year: c.year + 1, month: 0 };
      return { year: c.year, month: m };
    });
  const goToday = () => {
    const d = new Date();
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  const handleDrop = (iso: string, issueId: string) => {
    setDragOverIso(null);
    // Re-scheduling to the same day is a no-op.
    const target = issues.find((i) => i.id === issueId);
    if (!target) return;
    const currentIso = isoOf(target.dueDate);
    if (currentIso === iso) return;
    onUpdateIssue(issueId, { dueDate: new Date(iso).toISOString() });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={goPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={goNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            {t("calendar.today")}
          </Button>
          <h2 className="ml-2 text-base font-semibold capitalize tabular-nums">
            {monthLabel}
          </h2>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {t("calendar.dragHint")}
        </p>
      </div>

      <div className="grid grid-cols-7 border-b text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-1.5">
            {t(`calendar.day.${d}` as `calendar.day.Mon`)}
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 grid-rows-6 overflow-auto border-l border-t">
        {cells.map((cell) => {
          const dayIssues = issuesByDay.get(cell.iso) ?? [];
          const isToday = cell.iso === todayIso;
          const isDragOver = dragOverIso === cell.iso;
          return (
            <div
              key={cell.iso}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverIso(cell.iso);
              }}
              onDragLeave={() => {
                if (dragOverIso === cell.iso) setDragOverIso(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/issue-id");
                if (id) handleDrop(cell.iso, id);
              }}
              className={[
                "min-h-[110px] border-r border-b p-1.5 transition-colors",
                cell.inMonth ? "bg-background" : "bg-muted/30",
                isDragOver ? "bg-primary/10" : "",
              ].join(" ")}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={[
                    "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : cell.inMonth
                        ? "text-foreground"
                        : "text-muted-foreground",
                  ].join(" ")}
                >
                  {cell.date.getDate()}
                </span>
              </div>
              <div className="space-y-1">
                {dayIssues.slice(0, 3).map((issue) => (
                  <CalendarIssueChip
                    key={issue.id}
                    issue={issue}
                    onClick={() => onClickIssue(issue)}
                  />
                ))}
                {dayIssues.length > 3 && (
                  <p className="px-1.5 text-[10px] text-muted-foreground">
                    +{dayIssues.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarIssueChip({
  issue,
  onClick,
}: {
  issue: Issue;
  onClick: () => void;
}) {
  const typeConf = TYPE_CONFIG[issue.type as keyof typeof TYPE_CONFIG];
  const prioConf =
    PRIORITY_CONFIG[issue.priority as keyof typeof PRIORITY_CONFIG];
  const TypeIcon = typeConf?.icon;
  const PrioIcon = prioConf?.icon;
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/issue-id", issue.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onClick}
      className="flex w-full cursor-grab items-center gap-1 rounded-sm border bg-card px-1.5 py-1 text-left text-[11px] hover:bg-muted/50 active:cursor-grabbing"
    >
      {TypeIcon && (
        <span
          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm ${typeConf.bg}`}
        >
          <TypeIcon className="h-2.5 w-2.5 text-white" />
        </span>
      )}
      <span className="truncate font-medium">{issue.summary}</span>
      {PrioIcon && (
        <PrioIcon className={`h-3 w-3 shrink-0 ${prioConf.color}`} />
      )}
    </button>
  );
}
