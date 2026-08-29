import type { DashboardMetrics, Space } from "@/lib/types";

export function computeDashboardMetrics(
  spaces: Space[],
  currentYear = new Date().getFullYear(),
): DashboardMetrics {
  const endYear = currentYear + 4;
  const slices = spaces.flatMap((space) => space.forecastByYear);

  const totalPortfolioValue = spaces.reduce((sum, space) => sum + space.originalCost, 0);
  const fiveYearForecast = slices
    .filter((slice) => slice.year >= currentYear && slice.year <= endYear)
    .reduce((sum, slice) => sum + slice.amount, 0);
  const dueThisYear = slices
    .filter((slice) => slice.year === currentYear)
    .reduce((sum, slice) => sum + slice.amount, 0);
  const overdue = slices
    .filter((slice) => slice.year < currentYear)
    .reduce((sum, slice) => sum + slice.amount, 0);
  const deferred = spaces
    .filter((space) => space.planningStatus === "deferred")
    .reduce((sum, space) => sum + space.forecastAmount, 0);

  const forecastByYear = Array.from({ length: 5 }, (_, index) => {
    const year = currentYear + index;
    const amount = slices
      .filter((slice) => slice.year === year)
      .reduce((sum, slice) => sum + slice.amount, 0);
    return { year, amount };
  });

  return {
    totalPortfolioValue,
    fiveYearForecast,
    dueThisYear,
    overdue,
    deferred,
    forecastByYear,
  };
}
