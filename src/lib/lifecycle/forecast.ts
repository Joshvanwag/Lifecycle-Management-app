interface InflationForecastInput {
  costBasis: number;
  costBasisDate: string;
  inflationRate: number;
  replacementYear: number;
}

/** Compound inflation from cost basis year to replacement year. */
export function computeInflatedForecastAmount({
  costBasis,
  costBasisDate,
  inflationRate,
  replacementYear,
}: InflationForecastInput): number {
  if (costBasis <= 0) {
    return 0;
  }

  const basisYear = new Date(costBasisDate).getFullYear();
  if (Number.isNaN(basisYear)) {
    return costBasis;
  }

  const years = replacementYear - basisYear;
  if (years <= 0) {
    return costBasis;
  }

  return costBasis * (1 + inflationRate) ** years;
}
