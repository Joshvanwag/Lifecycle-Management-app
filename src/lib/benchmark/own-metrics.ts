import type { Space } from "@/lib/types";

export interface OwnBenchmarkMetric {
  code: string;
  name: string;
  domain: "lifecycle_health" | "financial" | "planning_maturity";
  value: number | null;
  kind: "percentage" | "currency" | "years";
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
