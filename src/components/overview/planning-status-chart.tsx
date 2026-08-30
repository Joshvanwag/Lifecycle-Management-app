"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { useChartColors } from "@/lib/charts/chart-color-context";
import type { PlanningStatusSlice } from "@/lib/data/chart-data";

interface PlanningStatusChartProps {
  data: PlanningStatusSlice[];
}

function label(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function PlanningStatusChart({ data }: PlanningStatusChartProps) {
  const { getPlanningStatusColor } = useChartColors();

  return (
    <ChartCard
      title="Planning Status"
      description="Active inventory versus Spaces already scheduled or deferred"
      colorScheme={{ type: "planningStatus" }}
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
                  <Cell key={entry.name} fill={getPlanningStatusColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [value, label(String(name))]}
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
