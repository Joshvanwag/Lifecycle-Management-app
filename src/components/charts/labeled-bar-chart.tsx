"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

interface LabeledBarChartProps {
  title: string;
  description?: string;
  data: Array<{ name: string; value: number; fill?: string }>;
  valueFormatter?: (value: number) => string;
  labelFormatter?: (value: number) => string;
  colorScheme?: { type: "years"; years: number[] } | { type: "lifecycleStatus" };
  onBarClick?: (name: string) => void;
  layout?: "vertical" | "horizontal";
  className?: string;
}

export function LabeledBarChart({
  title,
  description,
  data,
  valueFormatter = formatCompactCurrency,
  labelFormatter = formatCompactCurrency,
  colorScheme = { type: "lifecycleStatus" },
  onBarClick,
  layout = "vertical",
  className,
}: LabeledBarChartProps) {
  const isHorizontal = layout === "horizontal";

  return (
    <ChartCard title={title} description={description} colorScheme={colorScheme} className={className}>
      <div className={isHorizontal ? "h-80 w-full" : "h-72 w-full"}>
        {data.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No data available for the current filters.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout={isHorizontal ? "vertical" : "horizontal"}
              margin={
                isHorizontal
                  ? { top: 4, right: 48, left: 8, bottom: 4 }
                  : { top: 20, right: 8, left: 0, bottom: 0 }
              }
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={!isHorizontal} horizontal={isHorizontal} />
              {isHorizontal ? (
                <>
                  <XAxis type="number" tickFormatter={valueFormatter} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                </>
              ) : (
                <>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={valueFormatter} tick={{ fontSize: 11 }} width={56} tickLine={false} axisLine={false} />
                </>
              )}
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Amount"]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                }}
              />
              <Bar
                dataKey="value"
                radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                className={onBarClick ? "cursor-pointer" : undefined}
                onClick={(entry) => onBarClick?.(String(entry.name))}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={entry.fill ?? `hsl(var(--chart-${(index % 5) + 1}))`} />
                ))}
                <LabelList
                  dataKey="value"
                  position={isHorizontal ? "right" : "top"}
                  formatter={(value: number) => labelFormatter(value)}
                  className="fill-foreground text-[11px] font-medium"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}
