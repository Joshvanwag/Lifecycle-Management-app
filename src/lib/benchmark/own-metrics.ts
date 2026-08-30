import type { Asset, Space } from "@/lib/types";

export interface OwnBenchmarkMetric {
  code: string;
  name: string;
  domain: "lifecycle_health" | "financial" | "planning_maturity";
  value: number | null;
  kind: "percentage" | "currency" | "years" | "count";
  spaceType?: string | null;
  assetCategory?: string | null;
}

const currentYear = () => new Date().getFullYear();

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

function pct(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return (part / whole) * 100;
}

export function computeOwnBenchmarkMetrics(spaces: Space[]): OwnBenchmarkMetric[] {
  const year = currentYear();
  const value = spaces.reduce((sum, space) => sum + space.originalCost, 0);
  const forecast = spaces.reduce((sum, space) => sum + space.forecastAmount, 0);
  const ages = spaces.map((space) => Math.max(0, year - space.commissionedYear));
  const cycles = spaces.map((space) => space.refreshCycleYears);
  const overdueValue = spaces
    .filter((space) => space.lifecycleStatus === "overdue")
    .reduce((sum, space) => sum + space.originalCost, 0);
  const dueValue = spaces
    .filter((space) => space.recommendedRefreshYear === year)
    .reduce((sum, space) => sum + space.originalCost, 0);
  const due13 = spaces
    .filter((space) => space.recommendedRefreshYear >= year + 1 && space.recommendedRefreshYear <= year + 3)
    .reduce((sum, space) => sum + space.originalCost, 0);
  const due47 = spaces
    .filter((space) => space.recommendedRefreshYear >= year + 4 && space.recommendedRefreshYear <= year + 7)
    .reduce((sum, space) => sum + space.originalCost, 0);
  const dueBeyond = spaces
    .filter((space) => space.recommendedRefreshYear > year + 7)
    .reduce((sum, space) => sum + space.originalCost, 0);
  const fiveYear = spaces
    .flatMap((space) => space.forecastByYear)
    .filter((slice) => slice.year >= year && slice.year <= year + 4)
    .reduce((sum, slice) => sum + slice.amount, 0);
  const planned = spaces.filter(
    (space) => space.planningStatus === "scheduled" || space.planningStatus === "deferred",
  ).length;
  const scheduled = spaces.filter((space) => space.planningStatus === "scheduled").length;
  const deferred = spaces.filter((space) => space.planningStatus === "deferred").length;
  const overdueScheduled = spaces.filter(
    (space) => space.lifecycleStatus === "overdue" && space.planningStatus === "scheduled",
  ).length;
  const upcomingPlanned = spaces.filter(
    (space) => space.lifecycleStatus === "upcoming" && space.planningStatus === "scheduled",
  ).length;
  const upcoming = spaces.filter((space) => space.lifecycleStatus === "upcoming").length;
  const overdueCount = spaces.filter((space) => space.lifecycleStatus === "overdue").length;
  const count = spaces.length;

  return [
    {
      code: "avg_space_age_years",
      name: "Average Space Age",
      domain: "lifecycle_health",
      kind: "years",
      value: ages.length ? ages.reduce((sum, item) => sum + item, 0) / ages.length : null,
    },
    {
      code: "portfolio_pct_overdue",
      name: "Portfolio Overdue Percentage",
      domain: "lifecycle_health",
      kind: "percentage",
      value: pct(overdueValue || overdueCount, value || count),
    },
    {
      code: "portfolio_pct_due_this_year",
      name: "Due This Year Percentage",
      domain: "lifecycle_health",
      kind: "percentage",
      value: pct(dueValue, value || count),
    },
    {
      code: "portfolio_pct_due_1_3_years",
      name: "Due in 1–3 Years Percentage",
      domain: "lifecycle_health",
      kind: "percentage",
      value: pct(due13, value || count),
    },
    {
      code: "portfolio_pct_due_4_7_years",
      name: "Due in 4–7 Years Percentage",
      domain: "lifecycle_health",
      kind: "percentage",
      value: pct(due47, value || count),
    },
    {
      code: "portfolio_pct_due_beyond_7_years",
      name: "Due Beyond 7 Years Percentage",
      domain: "lifecycle_health",
      kind: "percentage",
      value: pct(dueBeyond, value || count),
    },
    {
      code: "avg_refresh_cycle_years",
      name: "Average Refresh Cycle",
      domain: "lifecycle_health",
      kind: "years",
      value: cycles.length ? cycles.reduce((sum, item) => sum + item, 0) / cycles.length : null,
    },
    {
      code: "median_refresh_cycle_years",
      name: "Median Refresh Cycle",
      domain: "lifecycle_health",
      kind: "years",
      value: median(cycles),
    },
    {
      code: "avg_replacement_cost_per_space",
      name: "Average Replacement Cost per Space",
      domain: "financial",
      kind: "currency",
      value: count ? forecast / count : null,
    },
    {
      code: "median_replacement_cost_per_space",
      name: "Median Replacement Cost per Space",
      domain: "financial",
      kind: "currency",
      value: median(spaces.map((space) => space.forecastAmount)),
    },
    {
      code: "five_year_forecast_per_space",
      name: "Five-Year Forecast per Space",
      domain: "financial",
      kind: "currency",
      value: count ? fiveYear / count : null,
    },
    {
      code: "portfolio_pct_value_overdue",
      name: "Portfolio Value Overdue Percentage",
      domain: "financial",
      kind: "percentage",
      value: pct(overdueValue, value),
    },
    {
      code: "pct_lifecycle_need_planned",
      name: "Lifecycle Need with Plan",
      domain: "planning_maturity",
      kind: "percentage",
      value: pct(planned, count),
    },
    {
      code: "pct_scheduled",
      name: "Scheduled Percentage",
      domain: "planning_maturity",
      kind: "percentage",
      value: pct(scheduled, count),
    },
    {
      code: "pct_deferred",
      name: "Deferred Percentage",
      domain: "planning_maturity",
      kind: "percentage",
      value: pct(deferred, count),
    },
    {
      code: "pct_overdue_scheduled",
      name: "Overdue but Scheduled Percentage",
      domain: "planning_maturity",
      kind: "percentage",
      value: pct(overdueScheduled, overdueCount),
    },
    {
      code: "pct_upcoming_with_planned_replacement",
      name: "Upcoming with Planned Replacement",
      domain: "planning_maturity",
      kind: "percentage",
      value: pct(upcomingPlanned, upcoming),
    },
  ];
}

function computeSpaceTypeMetrics(spaces: Space[], spaceType: string): OwnBenchmarkMetric[] {
  const filtered = spaces.filter((space) => space.spaceType === spaceType);
  const year = currentYear();
  const ages = filtered.map((space) => Math.max(0, year - space.commissionedYear));
  const value = filtered.reduce((sum, space) => sum + space.originalCost, 0);
  const overdueValue = filtered
    .filter((space) => space.lifecycleStatus === "overdue")
    .reduce((sum, space) => sum + space.originalCost, 0);
  const dueValue = filtered
    .filter((space) => space.recommendedRefreshYear === year)
    .reduce((sum, space) => sum + space.originalCost, 0);
  const planned = filtered.filter(
    (space) => space.planningStatus === "scheduled" || space.planningStatus === "deferred",
  ).length;
  const count = filtered.length;

  return [
    {
      code: "space_type_avg_replacement_cost",
      name: "Average Replacement Cost by Space Type",
      domain: "financial",
      kind: "currency",
      spaceType,
      value: count ? value / count : null,
    },
    {
      code: "space_type_avg_lifecycle_years",
      name: "Average Lifecycle by Space Type",
      domain: "lifecycle_health",
      kind: "years",
      spaceType,
      value: ages.length ? ages.reduce((sum, item) => sum + item, 0) / ages.length : null,
    },
    {
      code: "space_type_median_lifecycle_years",
      name: "Median Lifecycle by Space Type",
      domain: "lifecycle_health",
      kind: "years",
      spaceType,
      value: median(ages),
    },
    {
      code: "space_type_overdue_pct",
      name: "Overdue Percentage by Space Type",
      domain: "lifecycle_health",
      kind: "percentage",
      spaceType,
      value: pct(overdueValue, value || count),
    },
    {
      code: "space_type_due_pct",
      name: "Due Percentage by Space Type",
      domain: "lifecycle_health",
      kind: "percentage",
      spaceType,
      value: pct(dueValue, value || count),
    },
    {
      code: "space_type_avg_asset_count",
      name: "Average Asset Count by Space Type",
      domain: "lifecycle_health",
      kind: "count",
      spaceType,
      value: count
        ? filtered.reduce((sum, space) => sum + space.assetCount, 0) / count
        : null,
    },
    {
      code: "space_type_planned_refresh_coverage_pct",
      name: "Planned Refresh Coverage by Space Type",
      domain: "planning_maturity",
      kind: "percentage",
      spaceType,
      value: pct(planned, count),
    },
  ];
}

function computeAssetCategoryMetrics(assets: Asset[], category: string): OwnBenchmarkMetric[] {
  const filtered = assets.filter((asset) => asset.category === category);
  const year = currentYear();
  const ages = filtered.map((asset) =>
    Math.max(0, year - new Date(asset.installDate).getFullYear()),
  );
  const costs = filtered.map((asset) => asset.cost).filter((cost) => cost > 0);
  const value = filtered.reduce((sum, asset) => sum + (asset.cost > 0 ? asset.cost : 0), 0);
  const overdueValue = filtered
    .filter((asset) => asset.lifecycleStatus === "overdue")
    .reduce((sum, asset) => sum + (asset.cost > 0 ? asset.cost : 0), 0);
  const count = filtered.length;

  return [
    {
      code: "category_avg_lifecycle_years",
      name: "Average Lifecycle by Asset Category",
      domain: "lifecycle_health",
      kind: "years",
      assetCategory: category,
      value: ages.length ? ages.reduce((sum, item) => sum + item, 0) / ages.length : null,
    },
    {
      code: "category_median_lifecycle_years",
      name: "Median Lifecycle by Asset Category",
      domain: "lifecycle_health",
      kind: "years",
      assetCategory: category,
      value: median(ages),
    },
    {
      code: "category_avg_replacement_cost",
      name: "Average Replacement Cost by Asset Category",
      domain: "financial",
      kind: "currency",
      assetCategory: category,
      value: costs.length ? costs.reduce((sum, cost) => sum + cost, 0) / costs.length : null,
    },
    {
      code: "category_median_replacement_cost",
      name: "Median Replacement Cost by Asset Category",
      domain: "financial",
      kind: "currency",
      assetCategory: category,
      value: median(costs),
    },
    {
      code: "category_overdue_pct",
      name: "Overdue Percentage by Asset Category",
      domain: "lifecycle_health",
      kind: "percentage",
      assetCategory: category,
      value: pct(overdueValue, value || count),
    },
    {
      code: "category_forecast_cost",
      name: "Forecast Cost by Asset Category",
      domain: "financial",
      kind: "currency",
      assetCategory: category,
      value: count ? value / count : null,
    },
  ];
}

export function computeOwnContextBenchmarkMetrics(
  spaces: Space[],
  assets: Asset[],
): OwnBenchmarkMetric[] {
  const spaceTypes = [...new Set(spaces.map((space) => space.spaceType))].sort();
  const categories = [...new Set(assets.map((asset) => asset.category))].sort();
  const priced = assets.filter((asset) => asset.cost > 0);

  return [
    {
      code: "avg_cost_per_asset",
      name: "Average Replacement Cost per Asset",
      domain: "financial",
      kind: "currency",
      value: priced.length
        ? priced.reduce((sum, asset) => sum + asset.cost, 0) / priced.length
        : null,
    },
    ...spaceTypes.flatMap((spaceType) => computeSpaceTypeMetrics(spaces, spaceType)),
    ...categories.flatMap((category) => computeAssetCategoryMetrics(assets, category)),
  ];
}
