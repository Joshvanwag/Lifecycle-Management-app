"use client";

import { useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartCard } from "@/components/charts/chart-card";
import { defaultChartSettings, type ChartDisplaySettings } from "@/lib/charts/chart-settings";
import { useChartColors } from "@/lib/charts/chart-color-context";
import { formatStatusLabel } from "@/lib/data/analytics";
import type { LifecycleStatus, PlanningStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PieDistributionChartProps {
  title: string;
  description?: string;
  data: Array<{ name: string; value: number; percentage: number }>;
  colorType?: "lifecycleStatus" | "planningStatus";
  onSegmentClick?: (name: string) => void;
  selectedName?: string | null;
  drillLabel?: string;
  onReset?: () => void;
  settings?: ChartDisplaySettings;
  onSettingsChange?: (settings: ChartDisplaySettings) => void;
}

export function PieDistributionChart({
  title,
  description,
  data,
  colorType = "lifecycleStatus",
  onSegmentClick,
  selectedName,
  drillLabel,
  onReset,
  settings: controlledSettings,
  onSettingsChange,
}: PieDistributionChartProps) {
  const { getLifecycleStatusColor, getPlanningStatusColor } = useChartColors();
  const [internalSettings, setInternalSettings] = useState(defaultChartSettings);
  const settings = controlledSettings ?? internalSettings;
  const setSettings = onSettingsChange ?? setInternalSettings;

  const getColor = (name: string) =>
    colorType === "lifecycleStatus"
      ? getLifecycleStatusColor(name as LifecycleStatus)
      : getPlanningStatusColor(name as PlanningStatus);

  const chartData = data.filter((slice) => slice.value > 0);

  return (
    <ChartCard
      title={title}
      description={description}
      colorScheme={{ type: colorType === "lifecycleStatus" ? "lifecycleStatus" : "planningStatus" }}
      drillLabel={drillLabel}
      onReset={onReset}
      settings={settings}
      onSettingsChange={setSettings}
    >
      {chartData.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No data available for the current filters.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={92}
                  paddingAngle={2}
                  label={
                    settings.showNumbers
                      ? ({ name, percentage }) => `${formatStatusLabel(String(name))} ${percentage}%`
                      : false
                  }
                  labelLine={settings.showNumbers}
                  onClick={(entry) => onSegmentClick?.(String(entry.name))}
                >
                  {chartData.map((slice) => (
                    <Cell
                      key={slice.name}
                      fill={getColor(slice.name)}
                      opacity={selectedName && selectedName !== slice.name ? 0.35 : 1}
                      className={onSegmentClick ? "cursor-pointer" : undefined}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, _name, item) => [
                    `${value} (${item.payload.percentage}%)`,
                    formatStatusLabel(String(item.payload.name)),
                  ]}
                />
                {settings.showLegend && <Legend formatter={(value) => formatStatusLabel(String(value))} />}
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.map((slice) => (
              <button
                key={slice.name}
                type="button"
                className={cn(
                  "flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm",
                  onSegmentClick && "cursor-pointer hover:bg-accent/40",
                  selectedName === slice.name && "border-primary bg-primary/5",
                )}
                onClick={() => onSegmentClick?.(slice.name)}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: getColor(slice.name) }}
                  />
                  <span className="font-medium">{formatStatusLabel(slice.name)}</span>
                </span>
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{slice.value}</span>
                  {settings.showNumbers && <span className="ml-1.5">{slice.percentage}%</span>}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  );
}
