"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useVelocity } from "../hooks";
import { Skeleton } from "@/components/ui/skeleton";

export function VelocityChart({ boardId }: { boardId: string | undefined }) {
  const { t } = useAppStore();
  const { data, isLoading } = useVelocity(boardId);

  if (!boardId) return null;
  if (isLoading) return <Skeleton className="h-64 w-full rounded-lg" />;

  if (!data || data.data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-[12px] text-muted-foreground">
        {t("board.velocityEmpty")}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("board.velocityTitle")}</h3>
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5" />
          {t("board.velocityPredicted")}: <strong>{data.predicted}</strong>
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="committed"
              name={t("board.velocityCommitted")}
              fill="oklch(0.65 0.15 240)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="completed"
              name={t("board.velocityCompleted")}
              fill="oklch(0.7 0.15 145)"
              radius={[4, 4, 0, 0]}
            />
            {data.predicted > 0 && (
              <ReferenceLine
                y={data.predicted}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                label={{
                  value: t("board.velocityPredicted"),
                  fontSize: 10,
                  fill: "var(--muted-foreground)",
                  position: "right",
                }}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
