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
import { defaultChartSettings } from "@/lib/charts/chart-settings";
import { CHART_GAP, CHART_PLANNED, CHART_RECOMMENDED } from "@/lib/charts/colors";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

export interface GroupedBarRow {
  year: number;
  recommended: number;
  planned: number;
  gap?: number;
  label?: string;
}

interface GroupedBarChartProps {
  title: string;
  description?: string;
  data: GroupedBarRow[];
  series?: Array<{ key: "recommended" | "planned" | "gap"; label: string; color: string }>;
  valueKind?: "currency" | "percent" | "number";
  onBarClick?: (year: number) => void;
  selectedYear?: number | null;
  drillLabel?: string;
  onReset?: () => void;
}

const DEFAULT_SERIES = [
  { key: "recommended" as const, label: "Recommended Need", color: CHART_RECOMMENDED },
  { key: "planned" as const, label: "Planned", color: CHART_PLANNED },
];

export const GAP_SERIES = [{ key: "gap" as const, label: "Planning Gap", color: CHART_GAP }];

export const BENCHMARK_COMPARE_SERIES = [
  { key: "recommended" as const, label: "Your Organization", color: CHART_RECOMMENDED },
  { key: "planned" as const, label: "Industry Median", color: CHART_PLANNED },
];

function formatValue(value: number, kind: GroupedBarChartProps["valueKind"]) {
  if (kind === "percent") return `${value.toFixed(1)}%`;
  if (kind === "number") return String(Math.round(value));
  return formatCurrency(value);
}

function formatTick(value: number, kind: GroupedBarChartProps["valueKind"]) {
  if (kind === "percent") return `${Math.round(value)}%`;
  if (kind === "number") return String(Math.round(value));
  return formatCompactCurrency(value);
}

export function GroupedBarChart({
  title,
  description,
  data,
  series = DEFAULT_SERIES,
  valueKind = "currency",
  onBarClick,
  selectedYear,
  drillLabel,
  onReset,
}: GroupedBarChartProps) {
  const settings = defaultChartSettings;
  const usesLabels = data.some((row) => row.label);

  return (
    <ChartCard
      title={title}
      description={description}
      colorScheme={{ type: "years", years: data.map((row) => row.year) }}
      drillLabel={drillLabel}
      onReset={onReset}
    >
      <div className="h-64 w-full">
        {data.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No forecast data available.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: usesLabels ? 28 : 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey={usesLabels ? "label" : "year"}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={usesLabels ? -20 : 0}
                textAnchor={usesLabels ? "end" : "middle"}
                height={usesLabels ? 48 : 24}
              />
              <YAxis
                tickFormatter={(value) => formatTick(Number(value), valueKind)}
                tick={{ fontSize: 11 }}
                width={56}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatValue(Number(value), valueKind),
                  series.find((entry) => entry.key === name)?.label ?? name,
                ]}
                labelFormatter={(label) => String(label)}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                }}
              />
              {settings.showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
              {series.map((entry) => (
                <Bar
                  key={entry.key}
                  dataKey={entry.key}
                  name={entry.label}
                  fill={entry.color}
                  radius={[4, 4, 0, 0]}
                  className={onBarClick ? "cursor-pointer" : undefined}
                  onClick={(bar) => onBarClick?.(Number(bar.year))}
                  opacity={selectedYear != null ? 0.85 : 1}
                >
                  {settings.showNumbers && (
                    <LabelList
                      dataKey={entry.key}
                      position="top"
                      formatter={(value: number) =>
                        value > 0 ? formatTick(Number(value), valueKind) : ""
                      }
                      className="fill-foreground text-[10px] font-medium"
                    />
                  )}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}
