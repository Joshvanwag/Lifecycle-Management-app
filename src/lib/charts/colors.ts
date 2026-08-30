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

/** Restrained blue/neutral palette. Color means status, not variety. */
export const CHART_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-due)",
  "var(--chart-deferred)",
  "var(--chart-overdue)",
  "var(--chart-completed)",
  "var(--chart-unplanned)",
] as const;

export const CHART_RECOMMENDED = "var(--chart-1)";
export const CHART_PLANNED = "var(--chart-2)";
export const CHART_GAP = "var(--chart-gap)";

export const DEFAULT_YEAR_COLOR_PALETTE = CHART_PALETTE;

export const DEFAULT_LIFECYCLE_STATUS_COLORS: Record<LifecycleStatus, string> = {
  upcoming: "var(--chart-2)",
  due: "var(--chart-due)",
  overdue: "var(--chart-overdue)",
};

export const DEFAULT_PLANNING_STATUS_COLORS: Record<PlanningStatus, string> = {
  unplanned: "var(--chart-unplanned)",
  scheduled: "var(--chart-2)",
  deferred: "var(--chart-deferred)",
  completed: "var(--chart-completed)",
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

export function getDefaultYearColor(): string {
  return CHART_RECOMMENDED;
}

export function getDefaultCategoryColor(): string {
  return CHART_RECOMMENDED;
}

export function getYearColor(
  year: number,
  preferences: ChartColorPreferences,
  anchorYear = new Date().getFullYear(),
): string {
  void anchorYear;
  return preferences.years[String(year)] ?? getDefaultYearColor();
}

export function getCategoryColor(
  key: string,
  preferences: ChartColorPreferences,
  fallbackIndex = 0,
): string {
  void fallbackIndex;
  return preferences.categories[key] ?? getDefaultCategoryColor();
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
