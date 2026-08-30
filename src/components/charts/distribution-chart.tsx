"use client";

import { ChartCard } from "@/components/charts/chart-card";
import { useChartColors } from "@/lib/charts/chart-color-context";
import { formatStatusLabel } from "@/lib/data/analytics";
import type { LifecycleStatus, PlanningStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DistributionChartProps {
  title: string;
  description?: string;
  data: Array<{ name: string; value: number; percentage: number }>;
  colorType?: "lifecycleStatus" | "planningStatus";
  onSegmentClick?: (name: string) => void;
}

export function DistributionChart({
  title,
  description,
  data,
  colorType = "lifecycleStatus",
  onSegmentClick,
}: DistributionChartProps) {
  const { getLifecycleStatusColor, getPlanningStatusColor } = useChartColors();
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  const getColor = (name: string) =>
    colorType === "lifecycleStatus"
      ? getLifecycleStatusColor(name as LifecycleStatus)
      : getPlanningStatusColor(name as PlanningStatus);

  return (
    <ChartCard
      title={title}
      description={description}
      colorScheme={{ type: colorType === "lifecycleStatus" ? "lifecycleStatus" : "planningStatus" }}
    >
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No data available for the current filters.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            {data.map((slice) => (
              <button
                key={slice.name}
                type="button"
                style={{
                  width: `${(slice.value / total) * 100}%`,
                  backgroundColor: getColor(slice.name),
                }}
                className={cn(
                  "h-full min-w-[2px] transition-opacity hover:opacity-80",
                  onSegmentClick && "cursor-pointer",
                )}
                onClick={() => onSegmentClick?.(slice.name)}
                title={`${formatStatusLabel(slice.name)}: ${slice.value} (${slice.percentage}%)`}
              />
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {data.map((slice) => (
              <button
                key={slice.name}
                type="button"
                className={cn(
                  "flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm",
                  onSegmentClick && "cursor-pointer hover:bg-accent/40",
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
                <span className="text-right text-muted-foreground">
                  <span className="font-semibold text-foreground">{slice.value}</span>
                  <span className="ml-1.5">{slice.percentage}%</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  );
}
