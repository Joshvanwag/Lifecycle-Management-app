import type { LifecycleStatus, PlanningStatus } from "@/lib/types";

export interface ChartColorPreferences {
  years: Record<string, string>;
  lifecycleStatus: Record<LifecycleStatus, string>;
  planningStatus: Record<PlanningStatus, string>;
  deploymentStatus: {
    active: string;
    planned: string;
  };
  categories: Record<string, string>;
}

/** High-contrast palette for distinguishing series at a glance. */
export const CHART_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
  "var(--chart-9)",
  "var(--chart-10)",
  "var(--chart-11)",
  "var(--chart-12)",
] as const;

export const DEFAULT_YEAR_COLOR_PALETTE = CHART_PALETTE;

export const DEFAULT_LIFECYCLE_STATUS_COLORS: Record<LifecycleStatus, string> = {
  upcoming: "var(--chart-2)",
  due: "var(--chart-3)",
  overdue: "var(--chart-10)",
};

export const DEFAULT_PLANNING_STATUS_COLORS: Record<PlanningStatus, string> = {
  unplanned: "var(--chart-12)",
  scheduled: "var(--chart-1)",
  deferred: "var(--chart-5)",
  completed: "var(--chart-6)",
};

export const DEFAULT_DEPLOYMENT_STATUS_COLORS = {
  active: "var(--chart-active)",
  planned: "var(--chart-planned)",
};

export const DEFAULT_CATEGORY_COLOR_PALETTE = CHART_PALETTE;

export function createDefaultChartColors(): ChartColorPreferences {
  return {
    years: {},
    lifecycleStatus: { ...DEFAULT_LIFECYCLE_STATUS_COLORS },
    planningStatus: { ...DEFAULT_PLANNING_STATUS_COLORS },
    deploymentStatus: { ...DEFAULT_DEPLOYMENT_STATUS_COLORS },
    categories: {},
  };
}

export function getDefaultYearColor(year: number, anchorYear = new Date().getFullYear()): string {
  const index = Math.max(0, year - anchorYear);
  return DEFAULT_YEAR_COLOR_PALETTE[index % DEFAULT_YEAR_COLOR_PALETTE.length];
}

export function getDefaultCategoryColor(index: number): string {
  return DEFAULT_CATEGORY_COLOR_PALETTE[index % DEFAULT_CATEGORY_COLOR_PALETTE.length];
}

export function getYearColor(
  year: number,
  preferences: ChartColorPreferences,
  anchorYear = new Date().getFullYear(),
): string {
  return preferences.years[String(year)] ?? getDefaultYearColor(year, anchorYear);
}

export function getCategoryColor(
  key: string,
  preferences: ChartColorPreferences,
  fallbackIndex = 0,
): string {
  return preferences.categories[key] ?? getDefaultCategoryColor(fallbackIndex);
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

export function getDeploymentStatusColor(
  status: "active" | "planned",
  preferences: ChartColorPreferences,
): string {
  return preferences.deploymentStatus[status] ?? DEFAULT_DEPLOYMENT_STATUS_COLORS[status];
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
    deploymentStatus: {
      ...defaults.deploymentStatus,
      ...stored?.deploymentStatus,
    },
    categories: stored?.categories ?? defaults.categories,
  };
}

export type ChartColorScheme =
  | { type: "years"; years: number[] }
  | { type: "lifecycleStatus" }
  | { type: "planningStatus" }
  | { type: "deploymentStatus" }
  | { type: "categories"; categories: string[] };
