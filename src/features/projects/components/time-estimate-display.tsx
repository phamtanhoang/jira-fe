"use client";

import { formatDuration } from "@/lib/utils";
import { useWorklogs } from "../hooks";

/**
 * Display "Xh Ym" string for a seconds value; null/0 → em-dash. Pulls
 * worklog totals from the same hook the worklog section uses so a
 * progress bar appears once any time is logged.
 *
 * Extracted from `issue-detail-sidebar.tsx` to keep the main sidebar file
 * readable. Owns its own data fetch (cheap thanks to React Query dedupe).
 */
export function TimeEstimateDisplay({
  issueId,
  estimate,
}: {
  issueId: string;
  estimate: number | null;
}) {
  const { data: worklogs } = useWorklogs(issueId);
  const spent = (worklogs ?? []).reduce((s, w) => s + (w.timeSpent ?? 0), 0);
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
