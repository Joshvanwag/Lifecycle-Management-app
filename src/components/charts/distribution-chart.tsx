"use client";

import { PieDistributionChart } from "@/components/charts/pie-distribution-chart";
import type { LifecycleStatus, PlanningStatus } from "@/lib/types";

interface DistributionChartProps {
  title: string;
  description?: string;
  data: Array<{ name: string; value: number; percentage: number }>;
  colorType?: "lifecycleStatus" | "planningStatus";
  onSegmentClick?: (name: string) => void;
  selectedName?: string | null;
  drillLabel?: string;
  onReset?: () => void;
}

export function DistributionChart({
  title,
  description,
  data,
  colorType = "lifecycleStatus",
  onSegmentClick,
  selectedName,
  drillLabel,
  onReset,
}: DistributionChartProps) {
  return (
    <PieDistributionChart
      title={title}
      description={description}
      data={data}
      colorType={colorType}
      onSegmentClick={onSegmentClick}
      selectedName={selectedName}
      drillLabel={drillLabel}
      onReset={onReset}
    />
  );
}

export type { LifecycleStatus, PlanningStatus };
