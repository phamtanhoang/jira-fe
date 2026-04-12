"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useSprintBurndown } from "../hooks";
import { Skeleton } from "@/components/ui/skeleton";

export function BurndownChart({ sprintId }: { sprintId: string | undefined }) {
  const { t } = useAppStore();
  const { data, isLoading } = useSprintBurndown(sprintId);

  if (!sprintId) return null;

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-lg" />;
  }

  if (!data || data.days.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-[12px] text-muted-foreground">
        {t("board.summaryNoSprint")}
      </div>
    );
  }

  const chartData = data.days.map((d) => ({
    date: d.date.slice(5), // "04-10" format
    ideal: d.ideal,
    actual: d.actual,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            className="text-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 10 }}
            className="text-muted-foreground"
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid var(--border)",
              backgroundColor: "var(--popover)",
              color: "var(--popover-foreground)",
            }}
            labelFormatter={(label) => `Day ${label}`}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="ideal"
            name="Ideal"
            stroke="var(--muted-foreground)"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--primary)" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
