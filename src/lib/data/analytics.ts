import type { Asset, LifecycleStatus, PlanningStatus, Space } from "@/lib/types";

const currentYear = () => new Date().getFullYear();

export function amountInYear(space: Space, year: number): number {
  return space.forecastByYear
    .filter((slice) => slice.year === year)
    .reduce((sum, slice) => sum + slice.amount, 0);
}

export function plannedAmountInYear(spaces: Space[], year: number): number {
  return spaces
    .filter(
      (space) =>
        space.planningStatus === "scheduled" &&
        (space.plannedRefreshYear ?? space.recommendedRefreshYear) === year,
    )
    .reduce((sum, space) => sum + space.forecastAmount, 0);
}

export function recommendedInYear(spaces: Space[], year: number): number {
  return spaces.reduce((sum, space) => sum + amountInYear(space, year), 0);
}

export function sumForecastHorizon(
  spaces: Space[],
  startYear: number,
  endYear: number,
): number {
  return spaces
    .flatMap((space) => space.forecastByYear)
    .filter((slice) => slice.year >= startYear && slice.year <= endYear)
    .reduce((sum, slice) => sum + slice.amount, 0);
}

export function computeExtendedMetrics(spaces: Space[], year = currentYear()) {
  const counts = {
    spaceCount: spaces.length,
    assetCount: spaces.reduce((sum, space) => sum + space.assetCount, 0),
    overdueSpaces: spaces.filter((space) => space.lifecycleStatus === "overdue").length,
    dueSpaces: spaces.filter((space) => space.lifecycleStatus === "due").length,
    plannedSpaces: spaces.filter((space) => space.planningStatus === "scheduled").length,
    plannedAmount: spaces
      .filter((space) => space.planningStatus === "scheduled")
      .reduce((sum, space) => sum + space.forecastAmount, 0),
    totalPortfolioValue: spaces.reduce((sum, space) => sum + space.originalCost, 0),
    fiveYearNeed: sumForecastHorizon(spaces, year, year + 4),
    dueThisYear: sumForecastHorizon(spaces, year, year),
    overdueAmount: spaces
      .flatMap((space) => space.forecastByYear)
      .filter((slice) => slice.year < year)
      .reduce((sum, slice) => sum + slice.amount, 0),
    oneYearNeed: sumForecastHorizon(spaces, year, year),
    threeYearNeed: sumForecastHorizon(spaces, year, year + 2),
    tenYearNeed: sumForecastHorizon(spaces, year, year + 9),
    unplannedAmount: spaces
      .filter((space) => space.planningStatus === "unplanned")
      .reduce((sum, space) => sum + space.forecastAmount, 0),
  };

  return counts;
}

export interface YearComparisonRow {
  year: number;
  recommended: number;
  planned: number;
  gap: number;
}

export function computeYearComparison(
  spaces: Space[],
  horizonYears = 10,
  startYear = currentYear(),
): YearComparisonRow[] {
  return Array.from({ length: horizonYears }, (_, index) => {
    const year = startYear + index;
    const recommended = recommendedInYear(spaces, year);
    const planned = plannedAmountInYear(spaces, year);
    return { year, recommended, planned, gap: Math.max(0, recommended - planned) };
  });
}

export function computeReplacementByYear(
  spaces: Space[],
  horizonYears = 10,
  startYear = currentYear(),
): Array<{ year: number; amount: number }> {
  return Array.from({ length: horizonYears }, (_, index) => {
    const year = startYear + index;
    return { year, amount: recommendedInYear(spaces, year) };
  }).filter((row) => row.amount > 0 || row.year <= startYear + 4);
}

export function computeSpacesByType(spaces: Space[]): Array<{ name: string; value: number }> {
  const counts = new Map<string, number>();
  for (const space of spaces) {
    const type = space.spaceType.trim() || "Unknown";
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
}

export function computeLifecycleDistribution(spaces: Space[]): Array<{
  name: LifecycleStatus;
  value: number;
  percentage: number;
}> {
  const total = spaces.length || 1;
  const counts: Record<LifecycleStatus, number> = { upcoming: 0, due: 0, overdue: 0 };
  for (const space of spaces) {
    counts[space.lifecycleStatus] += 1;
  }
  return (["upcoming", "due", "overdue"] as const)
    .map((name) => ({
      name,
      value: counts[name],
      percentage: Math.round((counts[name] / total) * 100),
    }))
    .filter((slice) => slice.value > 0);
}

export function computePlanningDistribution(spaces: Space[]): Array<{
  name: PlanningStatus;
  value: number;
  percentage: number;
}> {
  const total = spaces.length || 1;
  const counts: Record<PlanningStatus, number> = {
    unplanned: 0,
    scheduled: 0,
    deferred: 0,
    completed: 0,
  };
  for (const space of spaces) {
    counts[space.planningStatus] += 1;
  }
  return (["unplanned", "scheduled", "deferred", "completed"] as const)
    .map((name) => ({
      name,
      value: counts[name],
      percentage: Math.round((counts[name] / total) * 100),
    }))
    .filter((slice) => slice.value > 0);
}

export function computeTopFutureCostCategories(
  assets: Asset[],
  spaces: Space[],
  horizonYears = 10,
  startYear = currentYear(),
): Array<{ name: string; amount: number }> {
  const endYear = startYear + horizonYears - 1;
  const totals = new Map<string, number>();

  for (const asset of assets) {
    if (asset.status !== "active") continue;
    if (asset.recommendedRefreshYear < startYear || asset.recommendedRefreshYear > endYear) {
      continue;
    }
    const category = asset.category.trim() || "Unknown";
    totals.set(category, (totals.get(category) ?? 0) + asset.cost);
  }

  for (const space of spaces) {
    for (const slice of space.forecastByYear) {
      if (slice.year < startYear || slice.year > endYear) continue;
      if (space.assetCount > 0 && slice.amount > 0) {
        const lumpKey = `${space.spaceType} (Space lump-sum)`;
        const existing = totals.get(lumpKey) ?? 0;
        if (existing === 0) {
          totals.set(lumpKey, (totals.get(lumpKey) ?? 0) + slice.amount);
        }
      }
    }
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, amount]) => ({ name, amount }));
}

export function computeAssetAgeBuckets(
  assets: Asset[],
  referenceYear = currentYear(),
): Array<{ name: string; value: number }> {
  const buckets = [
    { name: "0–3 years", min: 0, max: 3, value: 0 },
    { name: "4–6 years", min: 4, max: 6, value: 0 },
    { name: "7–9 years", min: 7, max: 9, value: 0 },
    { name: "10+ years", min: 10, max: Infinity, value: 0 },
  ];

  for (const asset of assets) {
    if (asset.status !== "active") continue;
    const installYear = new Date(asset.installDate).getFullYear();
    if (Number.isNaN(installYear)) continue;
    const age = referenceYear - installYear;
    const bucket = buckets.find((entry) => age >= entry.min && age <= entry.max);
    if (bucket) bucket.value += 1;
  }

  return buckets.filter((bucket) => bucket.value > 0).map(({ name, value }) => ({ name, value }));
}

export function computeReplacementNeedByCategory(
  assets: Asset[],
  horizonYears = 10,
  startYear = currentYear(),
): Array<{ name: string; amount: number }> {
  const endYear = startYear + horizonYears - 1;
  const totals = new Map<string, number>();

  for (const asset of assets) {
    if (asset.status !== "active") continue;
    if (asset.recommendedRefreshYear < startYear || asset.recommendedRefreshYear > endYear) {
      continue;
    }
    const category = asset.category.trim() || "Unknown";
    totals.set(category, (totals.get(category) ?? 0) + asset.cost);
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, amount]) => ({ name, amount }));
}

export function computeAssetKpis(assets: Asset[]) {
  const active = assets.filter((asset) => asset.status === "active");
  return {
    totalAssets: active.length,
    assetLevelCost: active.reduce((sum, asset) => sum + asset.cost, 0),
    due: active.filter((asset) => asset.lifecycleStatus === "due").length,
    overdue: active.filter((asset) => asset.lifecycleStatus === "overdue").length,
  };
}

export function computeLifecycleStatusByYear(
  spaces: Space[],
  horizonYears = 10,
  startYear = currentYear(),
): Array<{ year: number; upcoming: number; due: number; overdue: number }> {
  return Array.from({ length: horizonYears }, (_, index) => {
    const year = startYear + index;
    let upcoming = 0;
    let due = 0;
    let overdue = 0;

    for (const space of spaces) {
      const amount = amountInYear(space, year);
      if (amount <= 0) continue;
      if (space.lifecycleStatus === "upcoming") upcoming += amount;
      else if (space.lifecycleStatus === "due") due += amount;
      else overdue += amount;
    }

    return { year, upcoming, due, overdue };
  });
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
