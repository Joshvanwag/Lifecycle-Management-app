import type { ForecastYear, LifecycleStatus } from "@/lib/types";

export function calendarYearFromDate(value: string): number {
  const year = new Date(`${value}T00:00:00`).getFullYear();
  if (Number.isNaN(year)) {
    throw new Error(`Invalid date: ${value}`);
  }
  return year;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function recommendedReplacementYear(basisYear: number, refreshCycleYears: number): number {
  return basisYear + refreshCycleYears;
}

export function futureValue(costBasis: number, inflationRate: number, years: number): number {
  if (years <= 0) {
    return roundMoney(costBasis);
  }
  return roundMoney(costBasis * (1 + inflationRate) ** years);
}

export function normalizeToBasisYear(
  newCost: number,
  inflationRate: number,
  yearsBetween: number,
): number {
  if (yearsBetween <= 0) {
    return roundMoney(newCost);
  }
  return roundMoney(newCost / (1 + inflationRate) ** yearsBetween);
}

export function deriveLifecycleStatus(
  recommendedRefreshYear: number,
  currentYear = new Date().getFullYear(),
): LifecycleStatus {
  if (recommendedRefreshYear < currentYear) {
    return "overdue";
  }
  if (recommendedRefreshYear === currentYear) {
    return "due";
  }
  return "upcoming";
}

export function resolveInflationRate(
  componentRate: number | null | undefined,
  organizationRate: number,
): number {
  if (typeof componentRate === "number" && Number.isFinite(componentRate) && componentRate >= 0) {
    return componentRate;
  }
  return organizationRate;
}

export interface CostComponentDraft {
  assetId: string | null;
  costBasis: number;
  costBasisDate: string;
  refreshCycleYears: number;
  inflationRate: number;
}

export interface ComputedCostComponent extends CostComponentDraft {
  recommendedReplacementYear: number;
  forecastAmount: number;
}

export function computeCostComponent(draft: CostComponentDraft): ComputedCostComponent {
  const basisYear = calendarYearFromDate(draft.costBasisDate);
  const replacementYear = recommendedReplacementYear(basisYear, draft.refreshCycleYears);

  return {
    ...draft,
    costBasis: roundMoney(draft.costBasis),
    recommendedReplacementYear: replacementYear,
    forecastAmount: futureValue(draft.costBasis, draft.inflationRate, replacementYear - basisYear),
  };
}

export function recalculateForecastAmount(
  costBasis: number,
  inflationRate: number,
  costBasisDate: string,
  recommendedYear: number,
): number {
  const basisYear = calendarYearFromDate(costBasisDate);
  return futureValue(costBasis, inflationRate, recommendedYear - basisYear);
}

export function reduceLumpBasis(params: {
  lumpCostBasis: number;
  lumpBasisDate: string;
  newCost: number;
  newCostDate: string;
  inflationRate: number;
}): number {
  const yearsBetween =
    calendarYearFromDate(params.newCostDate) - calendarYearFromDate(params.lumpBasisDate);
  const normalized = normalizeToBasisYear(params.newCost, params.inflationRate, yearsBetween);
  return Math.max(0, roundMoney(params.lumpCostBasis - normalized));
}

export interface InventoryAsset {
  id: string;
  cost: number;
  installDate: string;
  refreshCycleYears: number;
}

export function buildInventoryComponents(params: {
  originalCost: number;
  commissionedDate: string;
  refreshCycleYears: number;
  inflationRate: number;
  activeAssets: InventoryAsset[];
}): ComputedCostComponent[] {
  const pricedAssets = params.activeAssets.filter((asset) => asset.cost > 0);
  const pricedTotal = roundMoney(pricedAssets.reduce((sum, asset) => sum + asset.cost, 0));
  const remainder = Math.max(0, roundMoney(params.originalCost - pricedTotal));

  const assetComponents = pricedAssets.map((asset) =>
    computeCostComponent({
      assetId: asset.id,
      costBasis: asset.cost,
      costBasisDate: asset.installDate,
      refreshCycleYears: asset.refreshCycleYears,
      inflationRate: params.inflationRate,
    }),
  );

  if (remainder > 0) {
    return [
      ...assetComponents,
      computeCostComponent({
        assetId: null,
        costBasis: remainder,
        costBasisDate: params.commissionedDate,
        refreshCycleYears: params.refreshCycleYears,
        inflationRate: params.inflationRate,
      }),
    ];
  }

  if (assetComponents.length > 0) {
    return assetComponents;
  }

  if (params.originalCost > 0) {
    return [
      computeCostComponent({
        assetId: null,
        costBasis: params.originalCost,
        costBasisDate: params.commissionedDate,
        refreshCycleYears: params.refreshCycleYears,
        inflationRate: params.inflationRate,
      }),
    ];
  }

  return [];
}

export function summarizeForecast(
  components: Array<{ forecastAmount: number; recommendedReplacementYear: number }>,
  fallbackYear: number,
): {
  forecastAmount: number;
  forecastByYear: ForecastYear[];
  recommendedRefreshYear: number;
} {
  const byYear = new Map<number, number>();
  let forecastAmount = 0;

  for (const component of components) {
    forecastAmount = roundMoney(forecastAmount + component.forecastAmount);
    byYear.set(
      component.recommendedReplacementYear,
      roundMoney((byYear.get(component.recommendedReplacementYear) ?? 0) + component.forecastAmount),
    );
  }

  const years = [...byYear.keys()];

  return {
    forecastAmount,
    forecastByYear: years
      .sort((left, right) => left - right)
      .map((year) => ({ year, amount: byYear.get(year) ?? 0 })),
    recommendedRefreshYear: years.length > 0 ? Math.min(...years) : fallbackYear,
  };
}
