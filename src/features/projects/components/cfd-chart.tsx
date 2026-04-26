"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useCfd } from "../hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CfdChart({
  boardId,
  days = 30,
}: {
  boardId: string | undefined;
  days?: number;
}) {
  const { t } = useAppStore();
  const { data, isLoading } = useCfd(boardId, days);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[13px]">{t("board.cfdTitle")}</CardTitle>
        <CardDescription className="text-[11px]">
          {t("board.cfdDescription", { days: String(days) })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : !data || data.data.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-[12px] text-muted-foreground">
            {t("board.cfdEmpty")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={data.data.map((d) => ({
                day: d.day.slice(5),
                TODO: d.TODO,
                IN_PROGRESS: d.IN_PROGRESS,
                DONE: d.DONE,
              }))}
              margin={{ top: 10, right: 16, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: 11 }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                iconType="square"
              />
              <Area
                type="monotone"
                dataKey="DONE"
                stackId="1"
                fill="#10b981"
                stroke="#059669"
                name={t("board.summaryDone")}
              />
              <Area
                type="monotone"
                dataKey="IN_PROGRESS"
                stackId="1"
                fill="#3b82f6"
                stroke="#2563eb"
                name={t("board.summaryInProgress")}
              />
              <Area
                type="monotone"
                dataKey="TODO"
                stackId="1"
                fill="#9ca3af"
                stroke="#6b7280"
                name={t("board.summaryTodo")}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
