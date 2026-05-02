"use client";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function shortDate(raw: unknown): string {
  if (typeof raw !== "string") return String(raw ?? "");
  const d = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

export default function SimpleLineChart({ data, color }: { data: { date: string; count: number }[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="date" fontSize={11} tickFormatter={shortDate} />
        <YAxis fontSize={11} allowDecimals={false} />
        <Tooltip labelFormatter={shortDate} />
        <Line type="monotone" dataKey="count" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
