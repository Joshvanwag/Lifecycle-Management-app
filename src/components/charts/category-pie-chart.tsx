"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { CategoryColorLegend } from "@/components/charts/year-color-legend";
import { useChartColors } from "@/lib/charts/chart-color-context";
import type { CategorySlice } from "@/lib/data/chart-data";

interface CategoryPieChartProps {
  title: string;
  description: string;
  data: CategorySlice[];
}

export function CategoryPieChart({ title, description, data }: CategoryPieChartProps) {
  const { getCategoryColor } = useChartColors();
  const categories = data.map((entry) => entry.name);

  return (
    <ChartCard
      title={title}
      description={description}
      colorScheme={{ type: "categories", categories }}
      legend={<CategoryColorLegend categories={categories} />}
    >
      <div className="h-80 w-full">
        {data.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No assets match the current filters.
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
                outerRadius={110}
                paddingAngle={1}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={getCategoryColor(entry.name, index)} />
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
