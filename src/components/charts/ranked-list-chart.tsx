"use client";

import { useMemo, useState } from "react";
import { ChartCard } from "@/components/charts/chart-card";
import { defaultChartSettings, type ChartDisplaySettings } from "@/lib/charts/chart-settings";
import { CHART_RECOMMENDED } from "@/lib/charts/colors";
import { cn } from "@/lib/utils";

interface RankedListChartProps {
  title: string;
  description?: string;
  data: Array<{ name: string; value: number; fill?: string }>;
  valueFormatter?: (value: number) => string;
  colorScheme?: { type: "years"; years: number[] } | { type: "lifecycleStatus" };
  onItemClick?: (name: string) => void;
  selectedName?: string | null;
  drillLabel?: string;
  onReset?: () => void;
  settings?: ChartDisplaySettings;
  onSettingsChange?: (settings: ChartDisplaySettings) => void;
  className?: string;
}

export function RankedListChart({
  title,
  description,
  data,
  valueFormatter = (value) => String(value),
  onItemClick,
  selectedName,
  drillLabel,
  onReset,
  settings: controlledSettings,
  onSettingsChange,
  className,
}: RankedListChartProps) {
  const [internalSettings] = useState(defaultChartSettings);
  const settings = controlledSettings ?? internalSettings;
  void onSettingsChange;

  const maxValue = useMemo(
    () => Math.max(...data.map((row) => row.value), settings.goalLine ?? 0, 1),
    [data, settings.goalLine],
  );

  return (
    <ChartCard
      title={title}
      description={description}
      colorScheme={{ type: "lifecycleStatus" }}
      drillLabel={drillLabel}
      onReset={onReset}
      className={className}
    >
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No data available for the current filters.
        </p>
      ) : (
        <div className="space-y-3">
          {settings.goalLine != null && settings.goalLine > 0 && (
            <div className="flex items-center justify-between rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
              <span>Goal line</span>
              <span className="font-medium text-foreground">{valueFormatter(settings.goalLine)}</span>
            </div>
          )}
          <ul className="space-y-1.5">
            {data.map((row) => {
              const width = Math.max(4, (row.value / maxValue) * 100);
              const goalWidth =
                settings.goalLine != null && settings.goalLine > 0
                  ? Math.min(100, (settings.goalLine / maxValue) * 100)
                  : null;
              const isSelected = selectedName === row.name;
              return (
                <li key={row.name}>
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-md px-1 py-1.5 text-left transition-colors",
                      onItemClick && "cursor-pointer hover:bg-accent/40",
                      isSelected && "border-primary bg-primary/5",
                    )}
                    onClick={() => onItemClick?.(row.name)}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium">{row.name}</span>
                      {settings.showNumbers && (
                        <span className="shrink-0 font-semibold">{valueFormatter(row.value)}</span>
                      )}
                    </div>
                    <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
                      {goalWidth != null && (
                        <div
                          className="absolute inset-y-0 w-px bg-amber-500"
                          style={{ left: `${goalWidth}%` }}
                        />
                      )}
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${width}%`,
                          backgroundColor: row.fill ?? CHART_RECOMMENDED,
                        }}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          {settings.showLegend && (
            <p className="text-xs text-muted-foreground">
              {onItemClick ? "Click a row to drill down. Use Reset to clear the selection." : ""}
            </p>
          )}
        </div>
      )}
    </ChartCard>
  );
}
