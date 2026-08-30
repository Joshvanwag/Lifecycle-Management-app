"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

interface GroupedBarChartProps {
  title: string;
  description?: string;
  data: Array<{ year: number; recommended: number; planned: number; gap?: number }>;
  series?: Array<{ key: "recommended" | "planned" | "gap"; label: string; color: string }>;
  onBarClick?: (year: number) => void;
}

const DEFAULT_SERIES = [
  { key: "recommended" as const, label: "Recommended", color: "hsl(var(--chart-1))" },
  { key: "planned" as const, label: "Planned", color: "hsl(var(--chart-2))" },
];

export function GroupedBarChart({
  title,
  description,
  data,
  series = DEFAULT_SERIES,
  onBarClick,
}: GroupedBarChartProps) {
  const years = data.map((row) => row.year);

  return (
    <ChartCard title={title} description={description} colorScheme={{ type: "years", years }}>
      <div className="h-80 w-full">
        {data.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No forecast data available.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                tickFormatter={(value) => formatCompactCurrency(value)}
                tick={{ fontSize: 11 }}
                width={56}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  series.find((entry) => entry.key === name)?.label ?? name,
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {series.map((entry) => (
                <Bar
                  key={entry.key}
                  dataKey={entry.key}
                  name={entry.label}
                  fill={entry.color}
                  radius={[4, 4, 0, 0]}
                  className={onBarClick ? "cursor-pointer" : undefined}
                  onClick={(bar) => onBarClick?.(Number(bar.year))}
                >
                  <LabelList
                    dataKey={entry.key}
                    position="top"
                    formatter={(value: number) => (value > 0 ? formatCompactCurrency(value) : "")}
                    className="fill-foreground text-[10px] font-medium"
                  />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}
