import type { DashboardMetrics, Space } from "@/lib/types";

export function computeDashboardMetrics(spaces: Space[]): DashboardMetrics {
  const currentYear = new Date().getFullYear();
  const endYear = currentYear + 4;

  const totalPortfolioValue = spaces.reduce((sum, space) => sum + space.originalCost, 0);
  const fiveYearForecast = spaces
    .filter(
      (space) =>
        space.recommendedRefreshYear >= currentYear &&
        space.recommendedRefreshYear <= endYear,
    )
    .reduce((sum, space) => sum + space.forecastAmount, 0);
  const dueThisYear = spaces
    .filter((space) => space.lifecycleStatus === "due")
    .reduce((sum, space) => sum + space.forecastAmount, 0);
  const overdue = spaces
    .filter((space) => space.lifecycleStatus === "overdue")
    .reduce((sum, space) => sum + space.forecastAmount, 0);
  const deferred = spaces
    .filter((space) => space.planningStatus === "deferred")
    .reduce((sum, space) => sum + space.forecastAmount, 0);

  const forecastByYear = Array.from({ length: 5 }, (_, index) => {
    const year = currentYear + index;
    const amount = spaces
      .filter((space) => space.recommendedRefreshYear === year)
      .reduce((sum, space) => sum + space.forecastAmount, 0);
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
