"use client";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

function shortDate(raw: unknown): string {
  if (typeof raw !== "string") return String(raw ?? "");
  const d = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

export default function BarLevelChart({ data }: { data: { date: string; INFO: number; WARN: number; ERROR: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="date" fontSize={11} tickFormatter={shortDate} />
        <YAxis fontSize={11} allowDecimals={false} />
        <Tooltip labelFormatter={shortDate} />
        <Legend />
        <Bar dataKey="INFO" stackId="a" fill="var(--color-chart-1)" />
        <Bar dataKey="WARN" stackId="a" fill="var(--color-chart-4)" />
        <Bar dataKey="ERROR" stackId="a" fill="var(--color-destructive)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
