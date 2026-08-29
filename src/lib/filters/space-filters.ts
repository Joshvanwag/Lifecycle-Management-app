import type { LifecycleStatus, PlanningStatus, Space } from "@/lib/types";

export interface SpaceFiltersState {
  campus: string[];
  building: string[];
  spaceType: string[];
  lifecycleStatus: LifecycleStatus[];
  planningStatus: PlanningStatus[];
  year: string[];
}

export const emptySpaceFilters: SpaceFiltersState = {
  campus: [],
  building: [],
  spaceType: [],
  lifecycleStatus: [],
  planningStatus: [],
  year: [],
};

export interface SpaceFilterOptions {
  campuses: string[];
  buildings: string[];
  spaceTypes: string[];
  years: string[];
}

export function buildSpaceFilterOptions(spaces: Space[]): SpaceFilterOptions {
  return {
    campuses: [...new Set(spaces.map((space) => space.campus))].sort(),
    buildings: [...new Set(spaces.map((space) => space.building))].sort(),
    spaceTypes: [...new Set(spaces.map((space) => space.spaceType))].sort(),
    years: [
      ...new Set(
        spaces.flatMap((space) => [
          String(space.recommendedRefreshYear),
          ...space.forecastByYear.map((slice) => String(slice.year)),
        ]),
      ),
    ].sort(),
  };
}

export function matchesSpaceSearch(space: Space, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return (
    space.name.toLowerCase().includes(normalized) ||
    space.locationLabel.toLowerCase().includes(normalized) ||
    space.spaceType.toLowerCase().includes(normalized)
  );
}

export function matchesSpaceFilters(space: Space, filters: SpaceFiltersState): boolean {
  if (filters.campus.length > 0 && !filters.campus.includes(space.campus)) {
    return false;
  }
  if (filters.building.length > 0 && !filters.building.includes(space.building)) {
    return false;
  }
  if (filters.spaceType.length > 0 && !filters.spaceType.includes(space.spaceType)) {
    return false;
  }
  if (
    filters.lifecycleStatus.length > 0 &&
    !filters.lifecycleStatus.includes(space.lifecycleStatus)
  ) {
    return false;
  }
  if (
    filters.planningStatus.length > 0 &&
    !filters.planningStatus.includes(space.planningStatus)
  ) {
    return false;
  }
  if (filters.year.length > 0) {
    const years = new Set([
      String(space.recommendedRefreshYear),
      ...space.forecastByYear.map((slice) => String(slice.year)),
    ]);
    if (!filters.year.some((year) => years.has(year))) {
      return false;
    }
  }

  return true;
}

export function filterSpaces(
  spaces: Space[],
  search: string,
  filters: SpaceFiltersState,
): Space[] {
  return spaces.filter(
    (space) => matchesSpaceSearch(space, search) && matchesSpaceFilters(space, filters),
  );
}

export function countActiveFilters(filters: SpaceFiltersState): number {
  return Object.values(filters).reduce((sum, values) => sum + values.length, 0);
}
