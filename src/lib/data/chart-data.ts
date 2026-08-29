import type { Asset, Space } from "@/lib/types";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export interface LifecycleStatusSlice {
  name: "Active" | "Planned";
  value: number;
}

export interface DeploymentMonthRow {
  month: string;
  [year: string]: string | number;
}

export interface CategorySlice {
  name: string;
  value: number;
}

export function computeLifecycleStatusSlices(spaces: Space[]): LifecycleStatusSlice[] {
  let active = 0;
  let planned = 0;

  for (const space of spaces) {
    if (space.planningStatus === "scheduled") {
      planned += 1;
    } else {
      active += 1;
    }
  }

  return [
    { name: "Active" as const, value: active },
    { name: "Planned" as const, value: planned },
  ].filter((slice) => slice.value > 0);
}

export function computeDeploymentByMonth(spaces: Space[]): {
  rows: DeploymentMonthRow[];
  years: number[];
} {
  const yearSet = new Set<number>();
  const totals = new Map<string, number>();

  for (const space of spaces) {
    const date = new Date(space.commissionedDate);
    if (Number.isNaN(date.getTime())) continue;

    const month = MONTH_LABELS[date.getMonth()];
    const year = date.getFullYear();
    yearSet.add(year);

    const key = `${month}|${year}`;
    totals.set(key, (totals.get(key) ?? 0) + space.originalCost);
  }

  const years = [...yearSet].sort((a, b) => a - b);
  const rows = MONTH_LABELS.map((month) => {
    const row: DeploymentMonthRow = { month };
    for (const year of years) {
      row[String(year)] = totals.get(`${month}|${year}`) ?? 0;
    }
    return row;
  });

  return { rows, years };
}

export function computeCategorySlices(
  items: { label: string }[],
  labelAccessor: (item: { label: string }) => string,
  limit = 10,
): CategorySlice[] {
  const counts = new Map<string, number>();

  for (const item of items) {
    const label = labelAccessor(item).trim() || "Unknown";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }));
}

export function computeManufacturerSlices(assets: Asset[]): CategorySlice[] {
  return computeCategorySlices(
    assets.map((asset) => ({ label: asset.manufacturer })),
    (item) => item.label,
  );
}

export function computeProductTypeSlices(assets: Asset[]): CategorySlice[] {
  return computeCategorySlices(
    assets.map((asset) => ({ label: asset.category })),
    (item) => item.label,
  );
}

export function uniqueYearsFromSpaces(spaces: Space[]): number[] {
  const years = new Set<number>();
  for (const space of spaces) {
    years.add(space.recommendedRefreshYear);
    years.add(space.commissionedYear);
  }
  return [...years].sort((a, b) => a - b);
}
