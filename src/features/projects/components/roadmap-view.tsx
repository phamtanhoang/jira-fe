"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  GripHorizontal,
  Link2,
  LocateFixed,
} from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { Board, Issue } from "../types";

const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 32;
const SPRINT_BAND_HEIGHT = 22;
const LEFT_GUTTER = 220;
const MIN_WIDTH = 800;
const DAY_MS = 24 * 60 * 60 * 1000;

// Density → pixels per day. Compact fits a quarter on screen; Spacious shows
// fine-grained week detail. Default = Comfortable.
const DENSITY_PX_PER_DAY = { compact: 3, comfortable: 6, spacious: 12 } as const;
type Density = keyof typeof DENSITY_PX_PER_DAY;

type Props = {
  board: Board;
  allIssues: Issue[];
  onClickIssue: (issue: Issue) => void;
  onUpdateIssue: (
    id: string,
    data: { startDate?: string | null; dueDate?: string | null },
  ) => void;
};

type DragState = {
  issueId: string;
  mode: "move" | "resize-start" | "resize-end";
  startX: number;
  origStart: number;
  origEnd: number;
};

export function RoadmapView({
  board,
  allIssues,
  onClickIssue,
  onUpdateIssue,
}: Props) {
  const { t } = useAppStore();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const didInitialScrollRef = useRef(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [previewDates, setPreviewDates] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(
    () => new Set<string>(),
  );
  const [density, setDensity] = useState<Density>("comfortable");

  const epics = useMemo(
    () => allIssues.filter((i) => i.type === "EPIC"),
    [allIssues],
  );

  const childrenByEpic = useMemo(() => {
    const map = new Map<
      string,
      { issue: Issue; start: number; end: number }[]
    >();
    for (const issue of allIssues) {
      if (issue.type === "EPIC") continue;
      const epicId = issue.epicId ?? issue.parentId;
      if (!epicId) continue;
      const start = issue.startDate
        ? new Date(issue.startDate).getTime()
        : null;
      const end = issue.dueDate ? new Date(issue.dueDate).getTime() : null;
      if (start === null && end === null) continue;
      const row = {
        issue,
        start: start ?? (end ?? 0) - 7 * DAY_MS,
        end: end ?? (start ?? 0) + 7 * DAY_MS,
      };
      const list = map.get(epicId) ?? [];
      list.push(row);
      map.set(epicId, list);
    }
    return map;
  }, [allIssues]);

  // For progress fill on epic bar: ratio of children whose column category is DONE.
  // Walks ALL children (incl. those without dates), so dateless subtasks still count.
  const progressByEpic = useMemo(() => {
    const counts = new Map<string, { done: number; total: number }>();
    for (const issue of allIssues) {
      if (issue.type === "EPIC") continue;
      const epicId = issue.epicId ?? issue.parentId;
      if (!epicId) continue;
      const c = counts.get(epicId) ?? { done: 0, total: 0 };
      c.total += 1;
      if (issue.boardColumn?.category === "DONE") c.done += 1;
      counts.set(epicId, c);
    }
    return counts;
  }, [allIssues]);

  const drawable = useMemo(() => {
    const epicRows = epics
      .map((e) => {
        const start = e.startDate ? new Date(e.startDate).getTime() : null;
        const end = e.dueDate ? new Date(e.dueDate).getTime() : null;
        return { issue: e, start, end };
      })
      .filter((r) => r.start !== null || r.end !== null)
      .map((r) => ({
        kind: "epic" as const,
        issue: r.issue,
        start: r.start ?? (r.end ?? 0) - 14 * DAY_MS,
        end: r.end ?? (r.start ?? 0) + 14 * DAY_MS,
      }));

    const rows: Array<{
      kind: "epic" | "child";
      issue: Issue;
      start: number;
      end: number;
      hasChildren?: boolean;
    }> = [];
    for (const epic of epicRows) {
      const children = childrenByEpic.get(epic.issue.id) ?? [];
      rows.push({ ...epic, hasChildren: children.length > 0 });
      if (expandedEpics.has(epic.issue.id)) {
        for (const c of children) {
          rows.push({ kind: "child", ...c });
        }
      }
    }
    return rows;
  }, [epics, expandedEpics, childrenByEpic]);

  const window = useMemo(() => {
    if (drawable.length === 0) {
      const now = Date.now();
      return { min: now - 30 * DAY_MS, max: now + 30 * DAY_MS };
    }
    let min = Infinity;
    let max = -Infinity;
    for (const r of drawable) {
      if (r.start < min) min = r.start;
      if (r.end > max) max = r.end;
    }
    for (const s of board.sprints) {
      if (s.startDate) min = Math.min(min, new Date(s.startDate).getTime());
      if (s.endDate) max = Math.max(max, new Date(s.endDate).getTime());
    }
    return { min: min - 14 * DAY_MS, max: max + 14 * DAY_MS };
  }, [drawable, board.sprints]);

  const pxPerDay = DENSITY_PX_PER_DAY[density];
  const timelineWidth = Math.max(
    MIN_WIDTH - LEFT_GUTTER,
    ((window.max - window.min) / DAY_MS) * pxPerDay,
  );
  const totalWidth = LEFT_GUTTER + timelineWidth;
  const heightContent =
    HEADER_HEIGHT + SPRINT_BAND_HEIGHT + drawable.length * ROW_HEIGHT;

  const xOf = (ms: number) =>
    LEFT_GUTTER + ((ms - window.min) / DAY_MS) * pxPerDay;

  const dxToDays = (dx: number) => dx / pxPerDay;

  const monthTicks = useMemo(() => {
    const ticks: { x: number; label: string; isQuarter: boolean }[] = [];
    const cursor = new Date(window.min);
    cursor.setDate(1);
    cursor.setHours(0, 0, 0, 0);
    while (cursor.getTime() < window.max) {
      ticks.push({
        x: xOf(cursor.getTime()),
        label: cursor.toLocaleString(undefined, {
          month: "short",
          year: "2-digit",
        }),
        isQuarter: cursor.getMonth() % 3 === 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return ticks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.min, window.max, pxPerDay]);

  // Weekend shading bands — covers Sat+Sun of every week in the window.
  // Skipped on compact density (would render thousands of thin bars on a
  // multi-year roadmap and dominate the visual).
  const weekendBands = useMemo(() => {
    if (density === "compact") return [] as { x: number; w: number }[];
    const bands: { x: number; w: number }[] = [];
    const cursor = new Date(window.min);
    cursor.setHours(0, 0, 0, 0);
    // Snap to first upcoming Saturday.
    const day = cursor.getDay();
    const daysToSat = (6 - day + 7) % 7;
    cursor.setDate(cursor.getDate() + daysToSat);
    while (cursor.getTime() < window.max) {
      bands.push({
        x: xOf(cursor.getTime()),
        w: 2 * pxPerDay,
      });
      cursor.setDate(cursor.getDate() + 7);
    }
    return bands;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.min, window.max, pxPerDay, density]);

  const barRects = useMemo(() => {
    const map = new Map<string, { x1: number; x2: number; y: number }>();
    drawable.forEach((row, idx) => {
      const x1 = xOf(row.start);
      const x2 = xOf(row.end);
      const y =
        HEADER_HEIGHT + SPRINT_BAND_HEIGHT + idx * ROW_HEIGHT + ROW_HEIGHT / 2;
      map.set(row.issue.id, { x1, x2, y });
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawable, totalWidth, window.min, window.max]);

  const blockArrows = useMemo(() => {
    const arrows: { fromId: string; toId: string }[] = [];
    for (const e of epics) {
      const out = e.outboundLinks ?? [];
      for (const link of out) {
        if (link.type !== "BLOCKS") continue;
        const target = link.target;
        if (!target) continue;
        if (target.type !== "EPIC") continue;
        if (!barRects.has(e.id) || !barRects.has(target.id)) continue;
        arrows.push({ fromId: e.id, toId: target.id });
      }
    }
    return arrows;
  }, [epics, barRects]);

  const scrollToToday = () => {
    const node = containerRef.current;
    if (!node) return;
    const todayX = xOf(Date.now());
    const target = todayX - node.clientWidth / 2;
    node.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  };

  // Auto-center on today on first paint (only when today is in-window).
  useEffect(() => {
    if (didInitialScrollRef.current) return;
    if (drawable.length === 0) return;
    const todayMs = Date.now();
    if (todayMs < window.min || todayMs > window.max) {
      didInitialScrollRef.current = true;
      return;
    }
    const node = containerRef.current;
    if (!node) return;
    const todayX = xOf(todayMs);
    node.scrollLeft = Math.max(0, todayX - node.clientWidth / 2);
    didInitialScrollRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawable.length, window.min, window.max, pxPerDay]);

  if (drawable.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={GripHorizontal}
          title={t("roadmap.emptyTitle")}
          description={t("roadmap.emptyDesc")}
        />
      </div>
    );
  }

  // ─── Drag handlers ───────────────────────────────────────

  const handleMouseDown =
    (issueId: string, mode: DragState["mode"], origStart: number, origEnd: number) =>
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragState({
        issueId,
        mode,
        startX: e.clientX,
        origStart,
        origEnd,
      });
      setPreviewDates({ start: origStart, end: origEnd });
    };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState) return;
    const dx = e.clientX - dragState.startX;
    const dDays = dxToDays(dx);
    const dMs = dDays * DAY_MS;
    let next: { start: number; end: number };
    if (dragState.mode === "move") {
      next = {
        start: dragState.origStart + dMs,
        end: dragState.origEnd + dMs,
      };
    } else if (dragState.mode === "resize-start") {
      const newStart = Math.min(
        dragState.origEnd - DAY_MS,
        dragState.origStart + dMs,
      );
      next = { start: newStart, end: dragState.origEnd };
    } else {
      const newEnd = Math.max(
        dragState.origStart + DAY_MS,
        dragState.origEnd + dMs,
      );
      next = { start: dragState.origStart, end: newEnd };
    }
    setPreviewDates(next);
  };

  const handleMouseUp = () => {
    if (!dragState || !previewDates) {
      setDragState(null);
      return;
    }
    const start = roundToDay(previewDates.start);
    const end = roundToDay(previewDates.end);
    if (start !== dragState.origStart || end !== dragState.origEnd) {
      onUpdateIssue(dragState.issueId, {
        startDate: new Date(start).toISOString(),
        dueDate: new Date(end).toISOString(),
      });
    }
    setDragState(null);
    setPreviewDates(null);
  };

  // ─── Render ──────────────────────────────────────────────

  const todayInWindow =
    Date.now() >= window.min && Date.now() <= window.max;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-3 py-1.5 text-xs">
        <div className="flex items-center gap-1">
          <span className="mr-1 text-muted-foreground">
            {t("roadmap.density")}:
          </span>
          {(["compact", "comfortable", "spacious"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDensity(d)}
              className={`rounded px-2 py-0.5 transition-colors ${
                density === d
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t(`roadmap.density_${d}`)}
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={scrollToToday}
          disabled={!todayInWindow}
          className="h-7 gap-1.5 text-xs"
        >
          <LocateFixed className="h-3.5 w-3.5" />
          {t("roadmap.today")}
        </Button>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width={totalWidth}
          height={heightContent}
          className="select-none"
          style={{ userSelect: "none" }}
        >
          {/* Weekend shading */}
          {weekendBands.map((band, idx) => (
            <rect
              key={`w-${idx}`}
              x={band.x}
              y={HEADER_HEIGHT}
              width={band.w}
              height={heightContent - HEADER_HEIGHT}
              fill="currentColor"
              fillOpacity={0.03}
            />
          ))}

          {/* Month grid + labels */}
          {monthTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={tick.x}
                x2={tick.x}
                y1={HEADER_HEIGHT}
                y2={heightContent}
                stroke="currentColor"
                strokeOpacity={tick.isQuarter ? 0.18 : 0.08}
              />
              <text
                x={tick.x + 4}
                y={HEADER_HEIGHT - 8}
                fontSize={11}
                fontWeight={tick.isQuarter ? 600 : 400}
                fill="currentColor"
                opacity={0.7}
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Today line + label */}
          {todayInWindow && (
            <g>
              <line
                x1={xOf(Date.now())}
                x2={xOf(Date.now())}
                y1={HEADER_HEIGHT}
                y2={heightContent}
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="3 2"
              />
              <rect
                x={xOf(Date.now()) - 22}
                y={HEADER_HEIGHT - 18}
                width={44}
                height={14}
                rx={3}
                fill="#ef4444"
              />
              <text
                x={xOf(Date.now())}
                y={HEADER_HEIGHT - 7}
                fontSize={10}
                fontWeight={600}
                fill="#fff"
                textAnchor="middle"
              >
                {t("roadmap.today")}
              </text>
            </g>
          )}

          {/* Sprint bands */}
          {board.sprints
            .filter((s) => s.startDate && s.endDate)
            .map((s) => {
              const x1 = xOf(new Date(s.startDate!).getTime());
              const x2 = xOf(new Date(s.endDate!).getTime());
              const fill =
                s.status === "ACTIVE"
                  ? "#3b82f6"
                  : s.status === "COMPLETED"
                    ? "#10b981"
                    : "#94a3b8";
              return (
                <g key={s.id}>
                  <rect
                    x={x1}
                    y={HEADER_HEIGHT}
                    width={Math.max(2, x2 - x1)}
                    height={SPRINT_BAND_HEIGHT - 4}
                    rx={3}
                    fill={fill}
                    fillOpacity={0.18}
                    stroke={fill}
                    strokeOpacity={0.6}
                  />
                  <text
                    x={x1 + 4}
                    y={HEADER_HEIGHT + 14}
                    fontSize={10}
                    fill={fill}
                    fillOpacity={0.95}
                  >
                    {s.name}
                  </text>
                </g>
              );
            })}

          {/* Left gutter background — sits above weekend/grid lines */}
          <rect
            x={0}
            y={0}
            width={LEFT_GUTTER}
            height={heightContent}
            fill="var(--background, #fff)"
          />
          <line
            x1={LEFT_GUTTER}
            x2={LEFT_GUTTER}
            y1={0}
            y2={heightContent}
            stroke="currentColor"
            strokeOpacity={0.15}
          />

          {/* Row separators in the timeline area */}
          {drawable.map((_, idx) => {
            const y = HEADER_HEIGHT + SPRINT_BAND_HEIGHT + (idx + 1) * ROW_HEIGHT;
            return (
              <line
                key={`sep-${idx}`}
                x1={LEFT_GUTTER}
                x2={totalWidth}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.05}
              />
            );
          })}

          {/* Epic rows + nested children */}
          {drawable.map((row, idx) => {
            const yTop = HEADER_HEIGHT + SPRINT_BAND_HEIGHT + idx * ROW_HEIGHT;
            const isDragging = dragState?.issueId === row.issue.id;
            const start = isDragging ? previewDates!.start : row.start;
            const end = isDragging ? previewDates!.end : row.end;
            const x1 = xOf(start);
            const x2 = xOf(end);
            const barWidth = Math.max(8, x2 - x1);
            const isChild = row.kind === "child";
            const fill = isChild ? "#3b82f6" : "#7c3aed";
            const isExpanded = expandedEpics.has(row.issue.id);
            const progress = !isChild ? progressByEpic.get(row.issue.id) : null;
            const progressPct =
              progress && progress.total > 0
                ? progress.done / progress.total
                : 0;
            const dateLabel = `${formatShort(start)} → ${formatShort(end)}`;
            return (
              <g key={row.issue.id}>
                {/* Issue label on the left gutter */}
                <foreignObject
                  x={isChild ? 28 : 4}
                  y={yTop + 4}
                  width={LEFT_GUTTER - (isChild ? 32 : 8)}
                  height={ROW_HEIGHT - 8}
                >
                  <div className="flex h-full w-full items-center gap-1">
                    {!isChild && row.hasChildren && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedEpics((prev) => {
                            const next = new Set(prev);
                            if (next.has(row.issue.id)) next.delete(row.issue.id);
                            else next.add(row.issue.id);
                            return next;
                          })
                        }
                        className="flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:bg-muted/60"
                        aria-label={
                          isExpanded
                            ? t("roadmap.collapseChildren")
                            : t("roadmap.expandChildren")
                        }
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onClickIssue(row.issue)}
                      className={`flex h-full min-w-0 flex-1 items-center gap-1 rounded text-left hover:bg-muted/50 ${
                        isChild ? "text-[11px]" : "text-xs font-medium"
                      }`}
                    >
                      <span className="truncate font-mono text-[10px] text-muted-foreground">
                        {row.issue.key}
                      </span>
                      <span className="truncate">{row.issue.summary}</span>
                    </button>
                    {!isChild && progress && progress.total > 0 && (
                      <span className="ml-1 shrink-0 rounded bg-muted px-1 text-[10px] text-muted-foreground">
                        {progress.done}/{progress.total}
                      </span>
                    )}
                  </div>
                </foreignObject>

                {isChild ? (
                  <rect
                    x={x1}
                    y={yTop + 12}
                    width={Math.max(6, x2 - x1)}
                    height={ROW_HEIGHT - 24}
                    rx={3}
                    fill={fill}
                    fillOpacity={0.7}
                    onClick={() => onClickIssue(row.issue)}
                    style={{ cursor: "pointer" }}
                  >
                    <title>
                      {row.issue.key} · {dateLabel}
                    </title>
                  </rect>
                ) : (
                  <g
                    onMouseDown={handleMouseDown(
                      row.issue.id,
                      "move",
                      row.start,
                      row.end,
                    )}
                    style={{ cursor: isDragging ? "grabbing" : "grab" }}
                  >
                    <rect
                      x={x1}
                      y={yTop + 8}
                      width={barWidth}
                      height={ROW_HEIGHT - 16}
                      rx={4}
                      fill={fill}
                      fillOpacity={0.35}
                    />
                    {progressPct > 0 && (
                      <rect
                        x={x1}
                        y={yTop + 8}
                        width={barWidth * progressPct}
                        height={ROW_HEIGHT - 16}
                        rx={4}
                        fill={fill}
                        fillOpacity={0.95}
                      />
                    )}
                    {barWidth > 80 && (
                      <text
                        x={x1 + 8}
                        y={yTop + ROW_HEIGHT / 2 + 3}
                        fontSize={10}
                        fontWeight={600}
                        fill="#fff"
                        style={{ pointerEvents: "none" }}
                      >
                        {row.issue.key}
                      </text>
                    )}
                    <title>
                      {row.issue.key} · {dateLabel}
                      {progress && progress.total > 0
                        ? ` · ${Math.round(progressPct * 100)}%`
                        : ""}
                    </title>
                    <rect
                      x={x1 - 3}
                      y={yTop + 8}
                      width={6}
                      height={ROW_HEIGHT - 16}
                      fill="transparent"
                      style={{ cursor: "ew-resize" }}
                      onMouseDown={handleMouseDown(
                        row.issue.id,
                        "resize-start",
                        row.start,
                        row.end,
                      )}
                    />
                    <rect
                      x={x2 - 3}
                      y={yTop + 8}
                      width={6}
                      height={ROW_HEIGHT - 16}
                      fill="transparent"
                      style={{ cursor: "ew-resize" }}
                      onMouseDown={handleMouseDown(
                        row.issue.id,
                        "resize-end",
                        row.start,
                        row.end,
                      )}
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* Dependency arrows */}
          {blockArrows.map((arrow, idx) => {
            const from = barRects.get(arrow.fromId);
            const to = barRects.get(arrow.toId);
            if (!from || !to) return null;
            const sx = from.x2;
            const sy = from.y;
            const tx = to.x1;
            const ty = to.y;
            const cx = (sx + tx) / 2;
            const path = `M ${sx} ${sy} C ${cx} ${sy}, ${cx} ${ty}, ${tx} ${ty}`;
            return (
              <g key={`arrow-${idx}`}>
                <path
                  d={path}
                  fill="none"
                  stroke="#64748b"
                  strokeOpacity={0.55}
                  strokeWidth={1.5}
                  strokeDasharray="3 2"
                  markerEnd="url(#dep-arrow)"
                />
              </g>
            );
          })}

          <defs>
            <marker
              id="dep-arrow"
              viewBox="0 0 10 10"
              refX={9}
              refY={5}
              markerWidth={6}
              markerHeight={6}
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" fillOpacity={0.7} />
            </marker>
          </defs>
        </svg>

        {dragState && previewDates && (
          <div className="pointer-events-none fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-md border bg-card px-3 py-1.5 text-xs shadow-md">
            <Link2 className="mr-1.5 inline h-3 w-3" />
            {new Date(previewDates.start).toLocaleDateString()} →{" "}
            {new Date(previewDates.end).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}

function roundToDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatShort(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
