import type { LifecycleStatus, PlanningStatus } from "@/lib/types";

export interface ChartColorPreferences {
  years: Record<string, string>;
  lifecycleStatus: Record<LifecycleStatus, string>;
  planningStatus: Record<PlanningStatus, string>;
}

export const DEFAULT_YEAR_COLOR_PALETTE = [
  "#3b6bdb",
  "#2a9d6f",
  "#d4a017",
  "#c45c3e",
  "#7c5cbf",
  "#0891b2",
  "#be4d86",
  "#64748b",
] as const;

export const DEFAULT_LIFECYCLE_STATUS_COLORS: Record<LifecycleStatus, string> = {
  upcoming: "#64748b",
  due: "#d4a017",
  overdue: "#c45c3e",
};

export const DEFAULT_PLANNING_STATUS_COLORS: Record<PlanningStatus, string> = {
  unplanned: "#94a3b8",
  scheduled: "#3b6bdb",
  deferred: "#d4a017",
  completed: "#2a9d6f",
};

export function createDefaultChartColors(): ChartColorPreferences {
  return {
    years: {},
    lifecycleStatus: { ...DEFAULT_LIFECYCLE_STATUS_COLORS },
    planningStatus: { ...DEFAULT_PLANNING_STATUS_COLORS },
  };
}

export function getDefaultYearColor(year: number, anchorYear = new Date().getFullYear()): string {
  const index = Math.max(0, year - anchorYear);
  return DEFAULT_YEAR_COLOR_PALETTE[index % DEFAULT_YEAR_COLOR_PALETTE.length];
}

export function getYearColor(
  year: number,
  preferences: ChartColorPreferences,
  anchorYear = new Date().getFullYear(),
): string {
  return preferences.years[String(year)] ?? getDefaultYearColor(year, anchorYear);
}

export function getLifecycleStatusColor(
  status: LifecycleStatus,
  preferences: ChartColorPreferences,
): string {
  return preferences.lifecycleStatus[status] ?? DEFAULT_LIFECYCLE_STATUS_COLORS[status];
}

export function getPlanningStatusColor(
  status: PlanningStatus,
  preferences: ChartColorPreferences,
): string {
  return preferences.planningStatus[status] ?? DEFAULT_PLANNING_STATUS_COLORS[status];
}

export function mergeChartColorPreferences(
  stored: Partial<ChartColorPreferences> | null | undefined,
): ChartColorPreferences {
  const defaults = createDefaultChartColors();
  return {
    years: stored?.years ?? defaults.years,
    lifecycleStatus: {
      ...defaults.lifecycleStatus,
      ...stored?.lifecycleStatus,
    },
    planningStatus: {
      ...defaults.planningStatus,
      ...stored?.planningStatus,
    },
  };
}
