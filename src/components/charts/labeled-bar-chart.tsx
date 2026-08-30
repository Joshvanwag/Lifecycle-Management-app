"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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

interface LabeledBarChartProps {
  title: string;
  description?: string;
  data: Array<{ name: string; value: number; fill?: string }>;
  valueFormatter?: (value: number) => string;
  labelFormatter?: (value: number) => string;
  colorScheme?: { type: "years"; years: number[] } | { type: "lifecycleStatus" };
  onBarClick?: (name: string) => void;
  selectedName?: string | null;
  drillLabel?: string;
  onReset?: () => void;
  settings?: ChartDisplaySettings;
  onSettingsChange?: (settings: ChartDisplaySettings) => void;
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
  selectedName,
  drillLabel,
  onReset,
  settings: controlledSettings,
  onSettingsChange,
  className,
}: LabeledBarChartProps) {
  const [internalSettings, setInternalSettings] = useState(defaultChartSettings);
  const settings = controlledSettings ?? internalSettings;
  const setSettings = onSettingsChange ?? setInternalSettings;

  return (
    <ChartCard
      title={title}
      description={description}
      colorScheme={colorScheme}
      drillLabel={drillLabel}
      onReset={onReset}
      settings={settings}
      onSettingsChange={setSettings}
      className={className}
    >
      <div className="h-72 w-full">
        {data.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No data available for the current filters.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                tickFormatter={valueFormatter}
                tick={{ fontSize: 11 }}
                width={56}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Amount"]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                }}
              />
              {settings.goalLine != null && settings.goalLine > 0 && (
                <ReferenceLine
                  y={settings.goalLine}
                  stroke="var(--chart-5)"
                  strokeDasharray="4 4"
                  label={{ value: "Goal", position: "insideTopRight", fontSize: 11 }}
                />
              )}
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                className={onBarClick ? "cursor-pointer" : undefined}
                onClick={(entry) => onBarClick?.(String(entry.name))}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={entry.fill ?? CHART_PALETTE[index % CHART_PALETTE.length]}
                    opacity={selectedName && selectedName !== entry.name ? 0.35 : 1}
                  />
                ))}
                {settings.showNumbers && (
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(value: number) => labelFormatter(value)}
                    className="fill-foreground text-[11px] font-medium"
                  />
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}
