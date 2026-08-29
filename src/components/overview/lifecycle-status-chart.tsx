"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { DeploymentStatusLegend } from "@/components/charts/year-color-legend";
import { useChartColors } from "@/lib/charts/chart-color-context";
import type { LifecycleStatusSlice } from "@/lib/data/chart-data";

interface LifecycleStatusChartProps {
  data: LifecycleStatusSlice[];
}

export function LifecycleStatusChart({ data }: LifecycleStatusChartProps) {
  const { getDeploymentStatusColor } = useChartColors();

  const colorForSlice = (name: LifecycleStatusSlice["name"]) =>
    getDeploymentStatusColor(name === "Active" ? "active" : "planned");

  return (
    <ChartCard
      title="Lifecycle Status"
      description="Active Spaces compared with planned work"
      colorScheme={{ type: "deploymentStatus" }}
      legend={<DeploymentStatusLegend />}
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
                  <Cell key={entry.name} fill={colorForSlice(entry.name)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [value, name]}
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
