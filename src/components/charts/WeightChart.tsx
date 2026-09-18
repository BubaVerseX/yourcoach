"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { date: string; weight: number };
type MergedPoint = { date: string; weight?: number; projectedWeight?: number };

function mergeSeries(actual: Point[], projected: Point[]): MergedPoint[] {
  const byDate = new Map<string, MergedPoint>();
  for (const p of actual) {
    byDate.set(p.date, { ...(byDate.get(p.date) ?? { date: p.date }), weight: p.weight });
  }
  for (const p of projected) {
    byDate.set(p.date, { ...(byDate.get(p.date) ?? { date: p.date }), projectedWeight: p.weight });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function WeightChart({ data, projectedData }: { data: Point[]; projectedData?: Point[] }) {
  const hasProjection = !!projectedData?.length;
  const merged = mergeSeries(data, projectedData ?? []);

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={merged} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => v.slice(5)}
            tick={{ fontSize: 11, fill: "#8b95a1" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={["dataMin - 2", "dataMax + 2"]}
            tickFormatter={(v: number) => v.toFixed(1)}
            tick={{ fontSize: 11, fill: "#8b95a1" }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            contentStyle={{
              background: "#f4f6f8",
              border: "none",
              borderRadius: 12,
              boxShadow: "6px 6px 14px #d7dbdd, -6px -6px 14px #ffffff",
              fontSize: 13,
            }}
            labelStyle={{ color: "#141a21", fontWeight: 700 }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#e11d1d"
            strokeWidth={3}
            dot={{ r: 3, fill: "#e11d1d", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          {hasProjection && (
            <Line
              type="monotone"
              dataKey="projectedWeight"
              stroke="#2dd4bf"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
