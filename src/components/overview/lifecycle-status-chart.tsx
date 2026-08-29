"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { LifecycleStatusLegend } from "@/components/charts/year-color-legend";
import { useChartColors } from "@/lib/charts/chart-color-context";
import type { LifecycleStatusSlice } from "@/lib/data/chart-data";

interface LifecycleStatusChartProps {
  data: LifecycleStatusSlice[];
}

export function LifecycleStatusChart({ data }: LifecycleStatusChartProps) {
  const { getLifecycleStatusColor } = useChartColors();

  return (
    <ChartCard
      title="Lifecycle Status"
      description="Spaces grouped by upcoming, due, and overdue refresh timing"
      colorScheme={{ type: "lifecycleStatus" }}
      legend={<LifecycleStatusLegend statuses={data.map((slice) => slice.name)} />}
    >
      <div className="h-72 w-full">
        {data.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No Spaces match the current filters.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={92}
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={getLifecycleStatusColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  value,
                  name.charAt(0).toUpperCase() + name.slice(1),
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}
