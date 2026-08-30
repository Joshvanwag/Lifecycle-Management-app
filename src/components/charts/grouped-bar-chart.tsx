"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { defaultChartSettings, type ChartDisplaySettings } from "@/lib/charts/chart-settings";
import { CHART_PALETTE } from "@/lib/charts/colors";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

interface GroupedBarChartProps {
  title: string;
  description?: string;
  data: Array<{ year: number; recommended: number; planned: number; gap?: number }>;
  series?: Array<{ key: "recommended" | "planned" | "gap"; label: string; color: string }>;
  onBarClick?: (year: number) => void;
  selectedYear?: number | null;
  drillLabel?: string;
  onReset?: () => void;
  settings?: ChartDisplaySettings;
  onSettingsChange?: (settings: ChartDisplaySettings) => void;
}

const DEFAULT_SERIES = [
  { key: "recommended" as const, label: "Recommended", color: CHART_PALETTE[0]! },
  { key: "planned" as const, label: "Planned", color: CHART_PALETTE[1]! },
];

export function GroupedBarChart({
  title,
  description,
  data,
  series = DEFAULT_SERIES,
  onBarClick,
  selectedYear,
  drillLabel,
  onReset,
  settings: controlledSettings,
  onSettingsChange,
}: GroupedBarChartProps) {
  const [internalSettings, setInternalSettings] = useState(defaultChartSettings);
  const settings = controlledSettings ?? internalSettings;
  const setSettings = onSettingsChange ?? setInternalSettings;
  const years = data.map((row) => row.year);

  return (
    <ChartCard
      title={title}
      description={description}
      colorScheme={{ type: "years", years }}
      drillLabel={drillLabel}
      onReset={onReset}
      settings={settings}
      onSettingsChange={setSettings}
    >
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
              {settings.showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
              {settings.goalLine != null && settings.goalLine > 0 && (
                <ReferenceLine
                  y={settings.goalLine}
                  stroke="var(--chart-5)"
                  strokeDasharray="4 4"
                />
              )}
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
                      formatter={(value: number) => (value > 0 ? formatCompactCurrency(value) : "")}
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
