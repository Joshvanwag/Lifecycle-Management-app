"use client";

import { useState } from "react";
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { defaultChartSettings, type ChartDisplaySettings } from "@/lib/charts/chart-settings";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

interface LineSeriesChartProps {
  title: string;
  description?: string;
  data: Array<{ name: string; value: number }>;
  valueFormatter?: (value: number) => string;
  onPointClick?: (name: string) => void;
  selectedName?: string | null;
  drillLabel?: string;
  onReset?: () => void;
  settings?: ChartDisplaySettings;
  onSettingsChange?: (settings: ChartDisplaySettings) => void;
  className?: string;
}

export function LineSeriesChart({
  title,
  description,
  data,
  valueFormatter = formatCompactCurrency,
  onPointClick,
  selectedName,
  drillLabel,
  onReset,
  settings: controlledSettings,
  onSettingsChange,
  className,
}: LineSeriesChartProps) {
  const [internalSettings, setInternalSettings] = useState(defaultChartSettings);
  const settings = controlledSettings ?? internalSettings;
  const setSettings = onSettingsChange ?? setInternalSettings;

  return (
    <ChartCard
      title={title}
      description={description}
      colorScheme={{ type: "lifecycleStatus" }}
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
            <LineChart data={data} margin={{ top: 20, right: 16, left: 0, bottom: 0 }}>
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
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--chart-1)"
                strokeWidth={2}
                activeDot={{ r: 6 }}
                opacity={selectedName ? 0.85 : 1}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  return (
                    <circle
                      cx={cx ?? 0}
                      cy={cy ?? 0}
                      r={4}
                      fill="var(--card)"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      className={onPointClick ? "cursor-pointer" : undefined}
                      onClick={() => onPointClick?.(String(payload.name))}
                    />
                  );
                }}
              >
                {settings.showNumbers && (
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(value: number) => valueFormatter(value)}
                    className="fill-foreground text-[11px] font-medium"
                  />
                )}
              </Line>
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}
