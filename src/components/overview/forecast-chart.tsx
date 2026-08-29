"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { YearColorLegend } from "@/components/charts/year-color-legend";
import { useChartColors } from "@/lib/charts/chart-color-context";
import type { ForecastYear } from "@/lib/types";
import { formatCompactCurrency } from "@/lib/utils";

interface ForecastChartProps {
  data: ForecastYear[];
}

export function ForecastChart({ data }: ForecastChartProps) {
  const { getYearColor } = useChartColors();
  const years = data.map((entry) => entry.year);

  return (
    <ChartCard
      title="Total Planned Amount by Year"
      description="Planned replacement costs by replacement year"
      colorScheme={{ type: "years", years }}
      legend={<YearColorLegend years={years} />}
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
            <YAxis
              tickFormatter={(value) => formatCompactCurrency(value)}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              width={56}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              formatter={(value: number) => [formatCompactCurrency(value), "Planned"]}
              labelFormatter={(year) => String(year)}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--card)",
              }}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]} className="cursor-pointer">
              {data.map((entry) => (
                <Cell key={entry.year} fill={getYearColor(entry.year)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
