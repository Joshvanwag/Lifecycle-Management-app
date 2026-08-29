"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { YearColorLegend } from "@/components/charts/year-color-legend";
import { useChartColors } from "@/lib/charts/chart-color-context";
import type { DeploymentMonthRow } from "@/lib/data/chart-data";
import { formatCompactCurrency } from "@/lib/utils";

interface DeploymentMonthChartProps {
  rows: DeploymentMonthRow[];
  years: number[];
}

export function DeploymentMonthChart({ rows, years }: DeploymentMonthChartProps) {
  const { getYearColor } = useChartColors();

  return (
    <ChartCard
      title="Total Amount by Deployment Month"
      description="Initial capital cost grouped by install or commission month"
      colorScheme={{ type: "years", years }}
      legend={<YearColorLegend years={years} />}
    >
      <div className="h-80 w-full">
        {years.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No deployment timing data matches the current filters.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(value) => formatCompactCurrency(value)}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                width={56}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                formatter={(value: number, name: string) => [
                  formatCompactCurrency(value),
                  String(name),
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                }}
              />
              {years.map((year) => (
                <Bar
                  key={year}
                  dataKey={String(year)}
                  stackId="deployment"
                  fill={getYearColor(year)}
                  radius={year === years[years.length - 1] ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}
